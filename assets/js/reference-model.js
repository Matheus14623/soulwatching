import {
  NOTABLE_FIGURE_REFERENCES,
  THEORY_REFERENCES,
} from '../data/generated/runtime/references.js';

function resolveReferences(referenceIndex, ids, isValid) {
  return ids
    .map((id) => ({ id, ...referenceIndex[id] }))
    .filter(isValid);
}

export function getTheoryReferences(ids = []) {
  return resolveReferences(THEORY_REFERENCES, ids, (reference) => Boolean(reference.title));
}

export function getNotableFigureReferences(ids = []) {
  return resolveReferences(
    NOTABLE_FIGURE_REFERENCES,
    ids,
    (reference) => Boolean(reference.title && reference.url),
  );
}
