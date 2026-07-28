import { ContentRepository } from './content-repository.js';
import { StaticContentSource } from './content-source.js';

let repositoryPromise = null;

export async function loadContentRepository({ source = new StaticContentSource() } = {}) {
  const snapshot = await source.load();
  return new ContentRepository(snapshot);
}

export function getContentRepository() {
  if (!repositoryPromise) repositoryPromise = loadContentRepository();
  return repositoryPromise;
}

export function resetContentRepositoryForTesting() {
  repositoryPromise = null;
}
