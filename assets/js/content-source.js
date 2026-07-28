export class ContentSource {
  async load() {
    throw new Error('ContentSource.load() precisa ser implementado.');
  }
}

export class StaticContentSource extends ContentSource {
  #loader;

  #snapshotPromise = null;

  constructor(loader = () => import('../data/generated/runtime/content-snapshot.js')) {
    super();
    if (typeof loader !== 'function') throw new TypeError('StaticContentSource exige uma função de carregamento.');
    this.#loader = loader;
  }

  async load() {
    if (!this.#snapshotPromise) {
      this.#snapshotPromise = Promise.resolve()
        .then(() => this.#loader())
        .then((module) => module.CONTENT_SNAPSHOT || module.default || module)
        .then(validateSnapshot)
        .catch((error) => {
          this.#snapshotPromise = null;
          throw error;
        });
    }
    return this.#snapshotPromise;
  }
}

export function createStaticContentSource(options = {}) {
  return new StaticContentSource(options.loader);
}

function validateSnapshot(snapshot) {
  if (
    !snapshot
    || snapshot.schemaVersion !== 1
    || !snapshot.entities
    || !snapshot.taxonomies
    || !snapshot.collections
  ) {
    throw new TypeError('Snapshot público de conteúdo inválido.');
  }
  return snapshot;
}

function validateHttpEndpoint(endpoint) {
  const value = String(endpoint || '').trim();
  if (!value) throw new TypeError('HttpContentSource exige um endpoint.');
  const url = new URL(value, 'https://observatorio.invalid');
  if (url.username || url.password || !['https:', 'http:'].includes(url.protocol)) {
    throw new TypeError('Endpoint de conteúdo inválido.');
  }
  if (url.origin !== 'https://observatorio.invalid' && url.protocol !== 'https:') {
    throw new TypeError('Endpoint remoto de conteúdo precisa usar HTTPS.');
  }
  return value;
}

export class HttpContentSource extends ContentSource {
  #endpoint;

  #fetch;

  #snapshotPromise = null;

  #timeoutMs;

  constructor({
    endpoint = '/api/content-snapshot',
    fetchImpl = globalThis.fetch,
    timeoutMs = 8000,
  } = {}) {
    super();
    this.#endpoint = validateHttpEndpoint(endpoint);
    if (typeof fetchImpl !== 'function') throw new TypeError('HttpContentSource exige fetch.');
    if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000) {
      throw new TypeError('timeoutMs precisa estar entre 100 e 30000.');
    }
    this.#fetch = fetchImpl;
    this.#timeoutMs = timeoutMs;
  }

  async load() {
    if (!this.#snapshotPromise) {
      this.#snapshotPromise = this.#loadOnce().catch((error) => {
        this.#snapshotPromise = null;
        throw error;
      });
    }
    return this.#snapshotPromise;
  }

  async #loadOnce() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);
    try {
      const response = await this.#fetch(this.#endpoint, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        signal: controller.signal,
      });
      if (!response?.ok) {
        throw new Error(`Fonte de conteúdo respondeu com status ${response?.status || 'desconhecido'}.`);
      }
      return validateSnapshot(await response.json());
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createHttpContentSource(options = {}) {
  return new HttpContentSource(options);
}
