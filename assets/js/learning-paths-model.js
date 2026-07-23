import { EXPERIMENTS } from '../data/experiments.js';
import { LEARNING_PATHS } from '../data/learning-paths.js';
import { NOTABLE_FIGURES } from '../data/notable-figures.js';
import { THEORIES } from '../data/theories.js';

const entityCollections = Object.freeze({
  theory: THEORIES,
  figure: NOTABLE_FIGURES,
  experiment: EXPERIMENTS,
});

const typeLabels = Object.freeze({
  theory: 'Teoria ou linha de investigação',
  figure: 'Grande nome',
  experiment: 'Experimento',
});

function entityHref(type, entity) {
  if (type === 'theory') return `/Teorias/teorias.html?teoria=${encodeURIComponent(entity.slug)}`;
  if (type === 'figure') return `/GrandesNomes/grandes-nomes.html?perfil=${encodeURIComponent(entity.slug)}#galeria`;
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
  const entity = collection.find((item) => item.id === step.id || item.slug === step.id);
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
