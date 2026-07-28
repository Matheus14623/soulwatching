import {
  EXPERIMENTS,
  EXPERIMENT_KINDS,
  EXPERIMENT_STATUSES,
} from './generated/runtime/experiments.js';

export {
  EXPERIMENTS,
  EXPERIMENT_KINDS,
  EXPERIMENT_STATUSES,
};

export function findExperiment(id, fallback = null) {
  return EXPERIMENTS.find((experiment) => (
    experiment.id === id
    || experiment.slug === id
    || experiment.aliases?.includes(id)
  )) || fallback;
}

export function getExperimentKind(id) {
  return EXPERIMENT_KINDS.find((kind) => kind.id === id) || null;
}

export function getActiveExperiments() {
  return EXPERIMENTS.filter((experiment) => experiment.status === 'active');
}
