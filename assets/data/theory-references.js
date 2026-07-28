import { THEORY_REFERENCES } from './generated/runtime/references.js';

export { THEORY_REFERENCES };

export function getTheoryReferences(ids = []) {
  return ids
    .map((id) => ({ id, ...THEORY_REFERENCES[id] }))
    .filter((reference) => reference.title);
}
