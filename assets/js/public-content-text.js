export function getTheoryPublicSummary(theory) {
  return theory.independent === false ? theory.review.focus : theory.summary;
}

export function getTheoryPublicProposal(theory) {
  return theory.independent === false ? theory.review.focus : theory.proposal;
}

export function getPublicRelationJustification(relation) {
  const text = typeof relation === 'string'
    ? relation
    : relation?.justification ?? relation?.note ?? '';
  return /^A\s+T-\d+\s+(?:pode|deve|precisa|só avança|se torna)\b/iu.test(text) ? '' : text;
}
