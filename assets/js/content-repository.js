function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function entityKey(type, id) {
  return `${type}:${id}`;
}

function normalizeEntityRef(entityOrRef, fallbackType = null) {
  if (typeof entityOrRef === 'string') {
    if (!fallbackType) throw new TypeError('Uma referência textual exige o tipo da entidade.');
    return Object.freeze({ type: fallbackType, id: entityOrRef });
  }
  if (!entityOrRef || typeof entityOrRef !== 'object') {
    throw new TypeError('Referência de entidade inválida.');
  }
  const type = entityOrRef.type || entityOrRef.entityType || fallbackType;
  const id = entityOrRef.id;
  if (!type || !id) throw new TypeError('Referência de entidade exige type e id.');
  return Object.freeze({ type, id });
}

export class ContentRepository {
  #snapshot;

  #byId = new Map();

  #bySlug = new Map();

  #referenceById = new Map();

  #relationById = new Map();

  #relationOrder = new Map();

  #relationTypeByKey = new Map();

  constructor(snapshot) {
    if (!snapshot || snapshot.schemaVersion !== 1 || !snapshot.entities) {
      throw new TypeError('ContentRepository exige um ContentSnapshot versão 1.');
    }
    this.#snapshot = snapshot;

    for (const [type, entities] of Object.entries(snapshot.entities)) {
      const idIndex = new Map();
      const slugIndex = new Map();
      for (const entity of entities) {
        idIndex.set(entity.id, entity);
        for (const slug of [entity.slug, ...(entity.aliases || [])].filter(Boolean)) {
          slugIndex.set(slug, entity);
        }
      }
      this.#byId.set(type, idIndex);
      this.#bySlug.set(type, slugIndex);
    }

    for (const relationType of snapshot.relationTypes || []) {
      this.#relationTypeByKey.set(
        `${relationType.sourceType}:${relationType.targetType}:${relationType.id}`,
        relationType,
      );
    }
    for (const reference of snapshot.references || []) {
      this.#referenceById.set(reference.id, reference);
      for (const alias of reference.aliases || []) this.#referenceById.set(alias, reference);
    }
    (snapshot.relations || []).forEach((relation, index) => {
      this.#relationById.set(relation.id, relation);
      this.#relationOrder.set(relation.id, index);
    });
  }

  get snapshot() {
    return this.#snapshot;
  }

  getTaxonomy(name) {
    return this.#snapshot.taxonomies?.[name] || null;
  }

  getCollection(name) {
    return this.#snapshot.collections?.[name] || null;
  }

  list(type, query = {}) {
    const collection = [...(this.#snapshot.entities[type] || [])];
    const {
      where = null,
      sortBy = null,
      direction = 'asc',
      limit = null,
    } = query;

    let result = collection;
    if (where && typeof where === 'object') {
      result = result.filter((entity) => (
        Object.entries(where).every(([key, expected]) => {
          const actual = entity[key];
          return Array.isArray(actual) ? actual.includes(expected) : actual === expected;
        })
      ));
    }
    if (typeof sortBy === 'string') {
      const factor = direction === 'desc' ? -1 : 1;
      result.sort((left, right) => (
        String(left[sortBy] ?? '').localeCompare(String(right[sortBy] ?? ''), 'pt-BR') * factor
      ));
    }
    if (Number.isInteger(limit) && limit >= 0) result = result.slice(0, limit);
    return Object.freeze(result);
  }

  getById(type, id) {
    return this.#byId.get(type)?.get(id) || null;
  }

  getBySlug(type, slugOrAlias) {
    return this.#bySlug.get(type)?.get(slugOrAlias) || null;
  }

  getRelations(entityOrRef, filters = {}) {
    const ref = normalizeEntityRef(entityOrRef, filters.entityType);
    const {
      direction = 'both',
      relationType = null,
      counterpartType = null,
      reviewState = null,
    } = filters;
    const results = [];
    const entityId = entityKey(ref.type, ref.id);
    const relationIndex = this.#snapshot.relationIndex;
    const indexedIds = relationIndex
      ? [
        ...(direction !== 'inbound' ? relationIndex.bySource?.[entityId] || [] : []),
        ...(direction !== 'outbound' ? relationIndex.byTarget?.[entityId] || [] : []),
      ]
      : null;
    const candidates = indexedIds
      ? [...new Set(indexedIds)]
        .map((id) => this.#relationById.get(id))
        .filter(Boolean)
        .sort((left, right) => (
          this.#relationOrder.get(left.id) - this.#relationOrder.get(right.id)
        ))
      : this.#snapshot.relations || [];

    for (const relation of candidates) {
      const outbound = relation.source.type === ref.type && relation.source.id === ref.id;
      const inbound = relation.target.type === ref.type && relation.target.id === ref.id;
      if (!outbound && !inbound) continue;
      if (direction === 'outbound' && !outbound) continue;
      if (direction === 'inbound' && !inbound) continue;
      if (relationType && relation.type !== relationType) continue;
      if (reviewState && relation.reviewState !== reviewState) continue;

      const counterpartRef = outbound ? relation.target : relation.source;
      if (counterpartType && counterpartRef.type !== counterpartType) continue;
      const typeContract = this.#relationTypeByKey.get(
        `${relation.source.type}:${relation.target.type}:${relation.type}`,
      );
      const displayDirection = outbound ? 'outbound' : 'inbound';
      results.push(Object.freeze({
        ...relation,
        direction: displayDirection,
        displayLabel: outbound
          ? typeContract?.label || relation.label
          : typeContract?.inverseLabel || relation.label,
        counterpartRef,
        counterpart: this.getById(counterpartRef.type, counterpartRef.id),
        relationType: typeContract || null,
      }));
    }

    return Object.freeze(results);
  }

  getReferences(entityOrRef, fallbackType = null) {
    const ref = normalizeEntityRef(entityOrRef, fallbackType);
    const ids = this.#snapshot.referenceIndex?.byEntity?.[entityKey(ref.type, ref.id)] || [];
    return Object.freeze(ids
      .map((id) => this.#referenceById.get(id))
      .filter(Boolean));
  }

  getReference(referenceId) {
    return this.#referenceById.get(referenceId) || null;
  }

  getReferenceUsage(referenceId) {
    const reference = this.#referenceById.get(referenceId);
    if (!reference) return Object.freeze([]);
    return Object.freeze([
      ...(this.#snapshot.referenceIndex?.byReference?.[reference.id] || []),
    ]);
  }

  search(query, filters = {}) {
    const term = normalizeText(query);
    if (!term) return Object.freeze([]);
    const allowedTypes = filters.entityTypes
      ? new Set(filters.entityTypes)
      : null;
    const limit = Number.isInteger(filters.limit) && filters.limit >= 0
      ? filters.limit
      : 20;

    return Object.freeze((this.#snapshot.searchIndex || [])
      .filter((entry) => !allowedTypes || allowedTypes.has(entry.type))
      .map((entry) => {
        const normalizedTitle = normalizeText(entry.title);
        const score = normalizedTitle === term
          ? 3
          : normalizedTitle.startsWith(term)
            ? 2
            : entry.terms.includes(term)
              ? 1
              : 0;
        return score ? { entry, score } : null;
      })
      .filter(Boolean)
      .sort((left, right) => (
        right.score - left.score
        || left.entry.title.localeCompare(right.entry.title, 'pt-BR')
      ))
      .slice(0, limit)
      .map(({ entry }) => entry));
  }

  has(type, id) {
    return this.#byId.get(type)?.has(id) || false;
  }

  resolve(ref) {
    const normalized = normalizeEntityRef(ref);
    return this.#byId.get(normalized.type)?.get(normalized.id) || null;
  }

  relationKey(relation) {
    return entityKey(relation.source.type, relation.source.id)
      + `->${entityKey(relation.target.type, relation.target.id)}:${relation.type}`;
  }
}

export function createContentRepository(snapshot) {
  return new ContentRepository(snapshot);
}
