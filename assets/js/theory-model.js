import {
  THEORIES,
  THEORY_RELATIONS,
  THEORY_RELATION_TYPES,
} from '../data/generated/runtime/theories.js';
import { getRelationReviewPresentation } from './relation-review.js';

const relationTypeById = new Map(THEORY_RELATION_TYPES.map((item) => [item.id, item]));

export function findTheory(id, fallback = null) {
  return THEORIES.find((theory) => (
    theory.id === id
    || theory.slug === id
    || theory.aliases?.includes(id)
  )) || fallback;
}

export function theoryMatchesCategory(theory, category) {
  return category === 'todas'
    || theory.category === category
    || theory.filters.includes(category);
}

export function getTheoryRelationType(typeId) {
  return relationTypeById.get(typeId) || null;
}

export function getTheoryRelations(theoryOrId) {
  const theory = typeof theoryOrId === 'string' ? findTheory(theoryOrId) : theoryOrId;
  if (!theory) return [];

  return THEORY_RELATIONS
    .filter((relation) => relation.sourceId === theory.id || relation.targetId === theory.id)
    .map((relation) => {
      const outbound = relation.sourceId === theory.id;
      const relatedTheory = findTheory(outbound ? relation.targetId : relation.sourceId);
      const relationType = getTheoryRelationType(relation.type);
      if (!relatedTheory || !relationType) return null;
      const review = getRelationReviewPresentation(relation);

      return Object.freeze({
        ...relation,
        id: relation.id || `${relation.sourceId}->${relation.targetId}:${relation.type}`,
        direction: outbound ? 'outbound' : 'inbound',
        relationLabel: outbound || relationType.symmetric
          ? relationType.label
          : relationType.inverseLabel || relationType.label,
        relationDescription: relationType.description,
        relationType,
        reviewLabel: review.label,
        reviewDisclosure: review.disclosure,
        reviewPending: review.pending,
        theory: relatedTheory,
      });
    })
    .filter(Boolean);
}

export function getTheoryRelationBetween(firstTheoryOrId, secondTheoryOrId) {
  const first = typeof firstTheoryOrId === 'string' ? findTheory(firstTheoryOrId) : firstTheoryOrId;
  const second = typeof secondTheoryOrId === 'string' ? findTheory(secondTheoryOrId) : secondTheoryOrId;
  if (!first || !second) return null;
  return getTheoryRelations(first).find((relation) => relation.theory.id === second.id) || null;
}

export function getRelatedTheoryIds(theoryOrId) {
  return getTheoryRelations(theoryOrId).map((relation) => relation.theory.id);
}

export function getRelatedTheories(theoryOrId) {
  return getTheoryRelations(theoryOrId).map((relation) => relation.theory);
}

export function getUniqueTheoryRelations() {
  return THEORY_RELATIONS
    .map((relation) => {
      const source = findTheory(relation.sourceId);
      const target = findTheory(relation.targetId);
      return source && target ? Object.freeze([source, target]) : null;
    })
    .filter(Boolean);
}
