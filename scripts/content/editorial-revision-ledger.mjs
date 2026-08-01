import {
  classifyContentChange,
  diffContentRecords,
} from './editorial-impact.mjs';
import { EDITORIAL_REVISION_ENTITY_TYPES } from './content-contracts.mjs';
import { prefixedCanonicalHash } from './canonical-hash.mjs';

export { EDITORIAL_REVISION_ENTITY_TYPES };

export function hashEditorialEntity(entity) {
  return prefixedCanonicalHash(entity);
}

const EDITORIAL_REVISION_ENTITY_TYPE_SET = new Set(
  EDITORIAL_REVISION_ENTITY_TYPES,
);

function entryKey(entry) {
  return `${entry.entityType}:${entry.entityId}`;
}

function revisionOrdinal(revisionId) {
  const value = revisionId?.match(/-r([1-9][0-9]*)$/)?.[1];
  return value ? Number(value) : null;
}

export function updateEditorialRevisionLedger(ledger, operations) {
  if (ledger?.entityType !== 'editorial-revision-ledger' || !Array.isArray(ledger.entries)) {
    throw new Error('Ledger editorial ausente ou inválido');
  }
  if (!Array.isArray(operations)) {
    throw new Error('Operações do ledger editorial precisam ser uma lista');
  }

  const nextLedger = structuredClone(ledger);
  const entries = new Map(nextLedger.entries.map((entry) => [entryKey(entry), entry]));

  for (const operation of operations) {
    const {
      changeClass,
      next,
      previous,
      type,
    } = operation;
    if (!EDITORIAL_REVISION_ENTITY_TYPE_SET.has(type)) continue;
    if (
      !next
      || next.entityType !== type
      || typeof next.id !== 'string'
      || typeof next.revisionId !== 'string'
    ) {
      throw new Error(`Operação ${type}:${next?.id || 'sem-id'} não possui identidade editorial válida`);
    }
    if (previous && (previous.entityType !== type || previous.id !== next.id)) {
      throw new Error(`A identidade de ${type}:${next.id} não pode mudar entre revisões`);
    }

    const key = `${type}:${next.id}`;
    let entry = entries.get(key);
    if (!entry) {
      if (previous) {
        throw new Error(`Ledger editorial sem histórico anterior para ${key}`);
      }
      if (revisionOrdinal(next.revisionId) !== 1) {
        throw new Error(`A primeira revisão de ${key} precisa terminar em r1`);
      }
      entry = {
        entityType: type,
        entityId: next.id,
        revisions: [],
      };
      nextLedger.entries.push(entry);
      entries.set(key, entry);
    } else if (!previous) {
      throw new Error(`Ledger editorial já possui a entidade ${key}`);
    }

    const currentRevision = entry.revisions[entry.revisions.length - 1] || null;
    if (previous && currentRevision?.revisionId !== previous.revisionId) {
      throw new Error(
        `Ledger editorial ${key}: esperado ${previous.revisionId}, encontrado ${currentRevision?.revisionId || 'nenhum'}`,
      );
    }
    if (previous && currentRevision?.contentHash !== hashEditorialEntity(previous)) {
      throw new Error(
        `Ledger editorial ${key}: o conteúdo canônico de ${previous.revisionId} diverge do hash registrado`,
      );
    }
    if (currentRevision?.revisionId === next.revisionId) {
      if (diffContentRecords(previous, next).length) {
        throw new Error(`Ledger editorial ${key}: conteúdo mudou sem nova revisão`);
      }
      continue;
    }

    const expectedOrdinal = (currentRevision ? revisionOrdinal(currentRevision.revisionId) : 0) + 1;
    if (revisionOrdinal(next.revisionId) !== expectedOrdinal) {
      throw new Error(`Ledger editorial ${key}: a próxima revisão precisa terminar em r${expectedOrdinal}`);
    }
    const changes = previous ? diffContentRecords(previous, next) : [];
    const classification = previous
      ? classifyContentChange(changes, { declaredClass: changeClass })
      : {
        effectiveClass: changeClass || 'structural',
        changedPaths: [],
      };
    entry.revisions.push({
      revisionId: next.revisionId,
      changeClass: classification.effectiveClass,
      changedPaths: [...classification.changedPaths],
      contentHash: hashEditorialEntity(next),
    });
  }

  nextLedger.entries.sort((left, right) => (
    entryKey(left).localeCompare(entryKey(right), 'en')
  ));
  return nextLedger;
}
