export { getPublicRelationJustification } from './public-content-text.js';

export function getRelationReviewPresentation(relation) {
  const referenceCount = Array.isArray(relation?.referenceIds) ? relation.referenceIds.length : 0;
  if (relation?.needsReview || relation?.reviewStatus === 'needs-review') {
    return Object.freeze({
      label: 'Relação precisa de nova revisão',
      disclosure: 'Esta conexão aguarda revisão após uma mudança no conteúdo.',
      pending: true,
      needsReview: true,
    });
  }
  if (relation?.reviewState === 'reviewed') {
    return Object.freeze({
      label: referenceCount === 1
        ? 'Relação revisada · 1 fonte ligada'
        : referenceCount > 1
          ? `Relação revisada · ${referenceCount} fontes ligadas`
          : 'Relação editorial revisada',
      disclosure: referenceCount
        ? 'As fontes vinculadas documentam o contexto desta conexão.'
        : 'Sem fontes específicas vinculadas.',
      pending: false,
      needsReview: false,
    });
  }
  return Object.freeze({
    label: 'Relação em revisão',
    disclosure: 'Conexão editorial provisória.',
    pending: true,
    needsReview: false,
  });
}
