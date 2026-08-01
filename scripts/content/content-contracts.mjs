export const CHANGE_CLASSES = Object.freeze([
  'editorial',
  'presentation',
  'metadata',
  'semantic',
  'structural',
]);

export const EDITORIAL_REVISION_ENTITY_TYPES = Object.freeze([
  'experiment',
  'figure',
  'publication',
  'theory',
]);

export const CONTENT_NEW_TYPES = Object.freeze([
  'theory',
  'figure',
  'party',
  'publication',
  'constellation',
  'experiment',
  'path',
  'research-track',
  'site-page',
  'reference',
  'relation',
]);

export const CHANGE_CLASS_REQUIRED_TYPES = Object.freeze([
  ...EDITORIAL_REVISION_ENTITY_TYPES,
  'relation',
]);

export const CONTENT_DIRECTORY_BY_TYPE = Object.freeze({
  constellation: 'constellations',
  experiment: 'experiments',
  figure: 'figures',
  'figure-trail': 'figure-trails',
  party: 'parties',
  path: 'paths',
  publication: 'publications',
  reference: 'references',
  relation: 'relations',
  'research-track': 'research-tracks',
  'site-page': 'site-pages',
  theory: 'theories',
  'timeline-event': 'timeline-events',
});

export function assertUniqueEditorialOperations(operations) {
  const entities = new Set();
  for (const [index, operation] of operations.entries()) {
    const record = operation?.record || operation?.next;
    const key = `${operation?.type || ''}:${record?.id || ''}`;
    if (!operation?.type || !record?.id) {
      throw new Error(`Operação editorial ${index + 1} sem identidade válida`);
    }
    if (entities.has(key)) {
      throw new Error(`Operação editorial duplicada para ${key}`);
    }
    entities.add(key);
  }
  return true;
}

export function referenceIdsFromRecord(record) {
  if (!record || typeof record !== 'object') return [];
  return [...new Set([
    ...(record.referenceIds || []),
    ...(record.sourceIds || []),
    ...(record.claimLinks || []).flatMap((claim) => [
      ...(claim.referenceIds || []),
      ...(claim.sources || []).map(({ referenceId }) => referenceId),
    ]),
  ].filter(Boolean))].sort((left, right) => left.localeCompare(right, 'en'));
}
