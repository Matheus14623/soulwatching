import {
  NOTABLE_FIGURES,
  NOTABLE_FIGURE_RELATION_TYPES,
} from '../data/generated/runtime/notable-figures.js';
import { findTheory } from './theory-model.js';
import { getRelationReviewPresentation } from './relation-review.js';

const relationTypeById = new Map(
  NOTABLE_FIGURE_RELATION_TYPES.map((item) => [item.id, item]),
);
const EMPTY_CONNECTIONS = Object.freeze([]);
const connectionsByTheoryId = new Map();

NOTABLE_FIGURES.forEach((figure) => {
  figure.theoryLinks.forEach((link) => {
    const relationType = relationTypeById.get(link.relationType);
    if (!relationType) return;
    const review = getRelationReviewPresentation(link);
    const connections = connectionsByTheoryId.get(link.theoryId) || [];
    connections.push(Object.freeze({
      ...link,
      relationLabel: relationType.label,
      reviewLabel: review.label,
      reviewDisclosure: review.disclosure,
      reviewPending: review.pending,
      figure,
    }));
    connectionsByTheoryId.set(link.theoryId, connections);
  });
});

connectionsByTheoryId.forEach((connections, theoryId) => {
  connectionsByTheoryId.set(
    theoryId,
    Object.freeze(connections.sort((first, second) => (
      first.figure.name.localeCompare(second.figure.name, 'pt-BR')
    ))),
  );
});

export function getNotableFigureConnections(theoryOrId) {
  const theory = typeof theoryOrId === 'string' ? findTheory(theoryOrId) : theoryOrId;
  if (!theory) return EMPTY_CONNECTIONS;
  return connectionsByTheoryId.get(theory.id) || EMPTY_CONNECTIONS;
}
