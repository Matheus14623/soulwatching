import { PUBLIC_ROUTES } from '../public-manifest.mjs';

const TYPE_DEPENDENCIES = Object.freeze({
  experiment: Object.freeze({
    files: [
      'assets/data/generated/runtime/content-entities.js',
      'assets/data/generated/runtime/experiments.js',
      'assets/data/generated/runtime/relations.js',
      'assets/data/generated/search-index.js',
    ],
    routeIds: ['inicio', 'laboratorio', 'experimento'],
    globalSearch: true,
  }),
  figure: Object.freeze({
    files: [
      'assets/data/generated/runtime/content-entities.js',
      'assets/data/generated/runtime/notable-figures.js',
      'assets/data/generated/runtime/references.js',
      'assets/data/generated/runtime/relations.js',
      'assets/data/generated/search-index.js',
    ],
    routeIds: ['inicio', 'grandes-nomes', 'teorias'],
    globalSearch: true,
  }),
  party: Object.freeze({
    files: [
      'assets/data/generated/runtime/content-entities.js',
      'assets/data/generated/runtime/parties.js',
      'assets/data/generated/runtime/publications.js',
    ],
    routeIds: ['arquivo', 'publicacao', 'contribuicoes'],
    globalSearch: false,
  }),
  publication: Object.freeze({
    files: [
      'assets/data/generated/runtime/publications.js',
      'assets/data/generated/runtime/references.js',
      'assets/data/generated/runtime/relations.js',
      'assets/data/generated/search-index.js',
    ],
    routeIds: ['arquivo', 'publicacao', 'contribuicoes'],
    globalSearch: true,
  }),
  reference: Object.freeze({
    files: [
      'assets/data/generated/runtime/content-entities.js',
      'assets/data/generated/runtime/constellations.js',
      'assets/data/generated/runtime/references.js',
      'assets/data/generated/search-index.js',
    ],
    routeIds: ['teorias', 'grandes-nomes', 'constelacoes', 'publicacao'],
    globalSearch: true,
  }),
  theory: Object.freeze({
    files: [
      'assets/data/generated/runtime/content-entities.js',
      'assets/data/generated/runtime/notable-figures.js',
      'assets/data/generated/runtime/references.js',
      'assets/data/generated/runtime/relations.js',
      'assets/data/generated/runtime/theories.js',
      'assets/data/generated/search-index.js',
    ],
    routeIds: ['inicio', 'teorias', 'mapa', 'grandes-nomes'],
    globalSearch: true,
  }),
});

const COMMON_FILES = Object.freeze([
  'assets/data/generated/content-metrics.js',
  'assets/data/generated/runtime-integrity.js',
  'assets/data/generated/runtime/content-snapshot.js',
]);
const RELATION_FILES = Object.freeze([
  'assets/data/generated/runtime/references.js',
  'assets/data/generated/runtime/relations.js',
]);
const RELATION_PROJECTIONS = Object.freeze([
  Object.freeze({
    sourceType: 'theory',
    targetType: 'theory',
    files: ['assets/data/generated/runtime/theories.js'],
    routeIds: ['inicio', 'teorias', 'mapa'],
  }),
  Object.freeze({
    sourceType: 'figure',
    targetType: 'theory',
    files: ['assets/data/generated/runtime/notable-figures.js'],
    routeIds: ['teorias', 'grandes-nomes'],
  }),
  Object.freeze({
    sourceType: 'publication',
    targetType: 'theory',
    files: [],
    routeIds: ['publicacao'],
  }),
  Object.freeze({
    sourceType: 'publication',
    targetType: 'figure',
    files: [],
    routeIds: ['publicacao'],
  }),
  Object.freeze({
    sourceType: 'publication',
    targetType: 'publication',
    files: [],
    routeIds: ['publicacao'],
  }),
  Object.freeze({
    sourceType: 'experiment',
    targetType: 'theory',
    files: [],
    routeIds: [],
  }),
]);
const routeById = new Map(PUBLIC_ROUTES.map((route) => [route.id, route.url]));

function includeDependency(dependency, files, routeIds) {
  dependency?.files.forEach((file) => files.add(file));
  dependency?.routeIds.forEach((routeId) => routeIds.add(routeId));
  return Boolean(dependency?.globalSearch);
}

function relationProjection(record) {
  if (!record?.source?.type || !record?.target?.type) return null;
  return RELATION_PROJECTIONS.find((projection) => (
    projection.sourceType === record.source.type
    && projection.targetType === record.target.type
  )) || null;
}

export function generatedImpactForChange({
  experimentsAffected = [],
  pathsAffected = [],
  previousRecord = null,
  record,
  type,
}) {
  const files = new Set(COMMON_FILES);
  const routeIds = new Set();
  let globalSearch = false;

  if (type === 'relation') {
    RELATION_FILES.forEach((file) => files.add(file));
    for (const relationRecord of [previousRecord, record]) {
      const dependencyUsesSearch = includeDependency(
        relationProjection(relationRecord),
        files,
        routeIds,
      );
      globalSearch = globalSearch || dependencyUsesSearch;
    }
  } else {
    const dependencyUsesSearch = includeDependency(TYPE_DEPENDENCIES[type], files, routeIds);
    globalSearch = globalSearch || dependencyUsesSearch;
  }

  if (pathsAffected.length) routeIds.add('rotas');
  if (type === 'theory' && experimentsAffected.length) routeIds.add('experimento');

  return {
    generatedFiles: [...files].sort(),
    publicSurfaces: [...routeIds]
      .map((routeId) => routeById.get(routeId))
      .filter(Boolean)
      .sort(),
    globalConsumers: globalSearch ? ['global-search'] : [],
  };
}
