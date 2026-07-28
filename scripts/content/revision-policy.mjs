function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
}

function withoutRevisionMetadata(record) {
  const copy = structuredClone(record);
  delete copy.revisionId;
  delete copy.revisions;
  return copy;
}

export function validateReplacement(previous, next) {
  const previousAliases = previous.aliases || [];
  const nextAliases = next.aliases || [];
  const removedAliases = previousAliases.filter((alias) => !nextAliases.includes(alias));
  if (removedAliases.length) {
    throw new Error(`Aliases publicados não podem ser removidos: ${removedAliases.join(', ')}`);
  }
  if (
    previous.slug
    && previous.slug !== next.slug
    && !nextAliases.includes(previous.slug)
  ) {
    throw new Error(`Ao alterar o slug, preserve "${previous.slug}" em aliases`);
  }

  const hasRevisionHistory = Array.isArray(previous.revisions) || Array.isArray(next.revisions);
  const previousRevisions = previous.revisions || [];
  const nextRevisions = next.revisions || [];
  previousRevisions.forEach((revision, index) => {
    if (stableJson(revision) !== stableJson(nextRevisions[index])) {
      throw new Error(`A revisão publicada ${revision.revisionId || index + 1} é imutável`);
    }
  });
  if (nextRevisions.length < previousRevisions.length) {
    throw new Error('O histórico publicado não pode perder revisões');
  }

  const contentChanged = stableJson(withoutRevisionMetadata(previous))
    !== stableJson(withoutRevisionMetadata(next));
  if (contentChanged && hasRevisionHistory && nextRevisions.length === previousRevisions.length) {
    throw new Error('Alterações editoriais exigem uma nova revisão; --force não reescreve histórico');
  }
  if (contentChanged && !hasRevisionHistory && previous.revisionId === next.revisionId) {
    throw new Error('Alterações editoriais exigem um novo revisionId; --force não reescreve a versão atual');
  }
  return true;
}
