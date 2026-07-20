import { THEORIES } from '../data/theories.js';

export function findTheory(id, fallback = null) {
  return THEORIES.find((theory) => theory.id === id || theory.slug === id) || fallback;
}

export function theoryMatchesCategory(theory, category) {
  return category === 'todas'
    || theory.category === category
    || theory.filters.includes(category);
}

export function getRelatedTheoryIds(theoryOrId) {
  const theory = typeof theoryOrId === 'string' ? findTheory(theoryOrId) : theoryOrId;
  if (!theory) return [];

  const ids = new Set(theory.connections);
  THEORIES.forEach((candidate) => {
    if (candidate.connections.includes(theory.id)) ids.add(candidate.id);
  });
  return [...ids];
}

export function getRelatedTheories(theoryOrId) {
  return getRelatedTheoryIds(theoryOrId)
    .map((id) => findTheory(id))
    .filter(Boolean);
}

export function getUniqueTheoryRelations() {
  const relations = new Map();

  THEORIES.forEach((theory) => {
    theory.connections.forEach((targetId) => {
      const target = findTheory(targetId);
      if (!target) return;
      const key = [theory.id, target.id].sort().join('::');
      if (!relations.has(key)) relations.set(key, Object.freeze([theory, target]));
    });
  });

  return [...relations.values()];
}
