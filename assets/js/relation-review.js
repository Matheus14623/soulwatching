export function getRelationReviewPresentation(relation) {
  const referenceCount = Array.isArray(relation?.referenceIds) ? relation.referenceIds.length : 0;
  if (relation?.needsReview || relation?.reviewStatus === 'needs-review') {
    return Object.freeze({
      label: 'Relação precisa de nova revisão',
      disclosure: 'Uma mudança relevante ocorreu depois da última revisão desta conexão. Ela permanece visível para rastreabilidade, mas não deve ser tratada como vigente.',
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
        ? 'As fontes dão contexto à relação; não representam endosso da proposta autoral.'
        : 'A justificativa foi revisada editorialmente, mas não substitui evidência científica.',
      pending: false,
      needsReview: false,
    });
  }
  return Object.freeze({
    label: 'Relação em revisão',
    disclosure: 'Conexão editorial provisória; não use esta relação como evidência.',
    pending: true,
    needsReview: false,
  });
}
