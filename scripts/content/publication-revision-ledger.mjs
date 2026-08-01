export function mergePublicationRevisionLedger(ledger, publications) {
  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) {
    throw new Error('O ledger de revisões de publicação precisa existir');
  }
  const nextLedger = structuredClone(ledger);
  nextLedger.revisions ||= {};
  for (const publication of publications) {
    for (const revision of publication.revisions || []) {
      const current = nextLedger.revisions[revision.revisionId];
      const proposed = {
        publicationId: publication.id,
        contentHash: revision.contentHash,
        publishedAt: revision.publishedAt,
      };
      if (current && JSON.stringify(current) !== JSON.stringify(proposed)) {
        throw new Error(
          `A revisão publicada ${revision.revisionId} diverge do ledger imutável`,
        );
      }
      nextLedger.revisions[revision.revisionId] = proposed;
    }
  }
  return nextLedger;
}
