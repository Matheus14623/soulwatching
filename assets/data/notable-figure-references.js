import { NOTABLE_FIGURE_REFERENCES } from './generated/runtime/references.js';

export { NOTABLE_FIGURE_REFERENCES };

export function getNotableFigureReferences(sourceIds = []) {
  return sourceIds
    .map((id) => ({ id, ...NOTABLE_FIGURE_REFERENCES[id] }))
    .filter((source) => source.title && source.url);
}
