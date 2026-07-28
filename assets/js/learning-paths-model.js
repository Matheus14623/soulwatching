import { EXPERIMENTS } from '../data/generated/runtime/experiments.js';
import { LEARNING_PATHS } from '../data/generated/runtime/learning-paths.js';
import { NOTABLE_FIGURES } from '../data/generated/runtime/notable-figures.js';
import { PUBLICATIONS } from '../data/generated/runtime/publications.js';
import { THEORIES } from '../data/generated/runtime/theories.js';

const entityCollections = Object.freeze({
  theory: THEORIES,
  figure: NOTABLE_FIGURES,
  experiment: EXPERIMENTS,
  publication: PUBLICATIONS,
});

const typeLabels = Object.freeze({
  theory: 'Teoria ou linha de investigação',
  figure: 'Grande nome',
  experiment: 'Experimento',
  publication: 'Publicação',
});

export { LEARNING_PATHS };

export function findLearningPath(id, fallback = null) {
  return LEARNING_PATHS.find((path) => (
    path.id === id
    || path.slug === id
    || path.aliases?.includes(id)
  )) || fallback;
}

function entityHref(type, entity) {
  if (type === 'theory') return `/Teorias/teorias.html?teoria=${encodeURIComponent(entity.slug)}`;
  if (type === 'figure') return `/GrandesNomes/grandes-nomes.html?perfil=${encodeURIComponent(entity.slug)}#galeria`;
  if (type === 'publication') return `/Arquivo/publicacoes/${encodeURIComponent(entity.slug)}.html`;
  return entity.href;
}

function entityTitle(entity) {
  return entity.title || entity.name;
}

function entitySummary(entity) {
  return entity.summary || entity.question || '';
}

export function resolveLearningPathStep(step) {
  const collection = entityCollections[step.type] || [];
  const entity = collection.find((item) => (
    item.id === step.id
    || item.slug === step.id
    || item.aliases?.includes(step.id)
  ));
  if (!entity) return null;
  return Object.freeze({
    ...step,
    entity,
    typeLabel: typeLabels[step.type],
    title: entityTitle(entity),
    summary: entitySummary(entity),
    href: entityHref(step.type, entity),
  });
}

export function resolveLearningPath(path) {
  const resolvedSteps = path.steps.map(resolveLearningPathStep);
  const missingIndex = resolvedSteps.findIndex((step) => !step);
  if (missingIndex >= 0) {
    const missing = path.steps[missingIndex];
    throw new Error(`Etapa inválida na rota ${path.id}: ${missing.type}:${missing.id}`);
  }
  return Object.freeze({
    ...path,
    steps: Object.freeze(resolvedSteps),
  });
}

export function getResolvedLearningPaths() {
  return LEARNING_PATHS.map(resolveLearningPath);
}
