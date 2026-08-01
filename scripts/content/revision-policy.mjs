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

function revisionOrdinal(revisionId) {
  const value = revisionId?.match(/-r([1-9][0-9]*)$/)?.[1];
  return value ? Number(value) : null;
}

function validateNextRevisionId(previous, next) {
  const previousOrdinal = revisionOrdinal(previous.revisionId);
  const nextOrdinal = revisionOrdinal(next.revisionId);
  if (
    previousOrdinal === null
    || nextOrdinal !== previousOrdinal + 1
    || !next.revisionId.startsWith(`${next.id}-r`)
  ) {
    throw new Error(
      `A próxima revisão de ${next.entityType}:${next.id} precisa ser ${next.id}-r${(previousOrdinal || 0) + 1}`,
    );
  }
}

export function validateReplacement(previous, next) {
  if (previous.id !== next.id || previous.entityType !== next.entityType) {
    throw new Error('id e entityType publicados são imutáveis durante uma substituição');
  }
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
  if (!contentChanged && previous.revisionId !== next.revisionId) {
    throw new Error(
      'revisionId não pode avançar sem uma alteração editorial correspondente',
    );
  }
  if (contentChanged && hasRevisionHistory) {
    if (nextRevisions.length !== previousRevisions.length + 1) {
      throw new Error(
        'Alterações editoriais exigem exatamente uma nova revisão; --force não reescreve histórico',
      );
    }
    const previousRevisionId = previousRevisions[previousRevisions.length - 1]?.revisionId
      || previous.revisionId;
    const nextRevisionId = nextRevisions[nextRevisions.length - 1]?.revisionId
      || next.revisionId;
    validateNextRevisionId(
      { ...previous, revisionId: previousRevisionId },
      { ...next, revisionId: nextRevisionId },
    );
  }
  if (contentChanged && !hasRevisionHistory && previous.revisionId === next.revisionId) {
    throw new Error('Alterações editoriais exigem um novo revisionId; --force não reescreve a versão atual');
  }
  if (contentChanged && !hasRevisionHistory) validateNextRevisionId(previous, next);
  return true;
}
