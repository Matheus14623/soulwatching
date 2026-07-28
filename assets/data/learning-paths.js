import { LEARNING_PATHS } from './generated/runtime/learning-paths.js';

export { LEARNING_PATHS };

export function findLearningPath(id, fallback = null) {
  return LEARNING_PATHS.find((path) => (
    path.id === id
    || path.slug === id
    || path.aliases?.includes(id)
  )) || fallback;
}
