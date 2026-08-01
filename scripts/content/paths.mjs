import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENT_ROOT = resolve(PROJECT_ROOT, 'content');
export const PUBLIC_CONTENT_ROOT = resolve(CONTENT_ROOT, 'public');
export const SCHEMA_ROOT = resolve(CONTENT_ROOT, 'schemas');
export const EDITORIAL_REVISION_LEDGER_PATH = resolve(
  PUBLIC_CONTENT_ROOT,
  'catalogs',
  'editorial-revision-ledger.json',
);
export const GENERATED_ROOT = resolve(PROJECT_ROOT, 'assets', 'data', 'generated');
export const GENERATED_RUNTIME_ROOT = resolve(GENERATED_ROOT, 'runtime');
export const REPORT_ROOT = resolve(PROJECT_ROOT, '.content-reports');
export const INTEGRITY_REPORT_PATH = resolve(REPORT_ROOT, 'integrity-report.json');
export const CONTENT_CACHE_ROOT = resolve(PROJECT_ROOT, '.content-cache');
export const LAST_VALID_RUNTIME_PATH = resolve(CONTENT_CACHE_ROOT, 'runtime-last-valid');
export const RUNTIME_LOCK_PATH = resolve(CONTENT_CACHE_ROOT, 'runtime-write.lock');
export const RUNTIME_INTEGRITY_FILE = resolve(GENERATED_ROOT, 'runtime-integrity.js');
export const RUNTIME_SWAP_JOURNAL_PATH = resolve(
  CONTENT_CACHE_ROOT,
  'runtime-swap-journal.json',
);
export const CONTENT_TRANSACTION_LOCK_PATH = resolve(
  CONTENT_CACHE_ROOT,
  'content-transaction.lock',
);
export const PUBLIC_BUILD_LOCK_PATH = resolve(
  CONTENT_CACHE_ROOT,
  'public-build.lock',
);

export const GENERATED_FILES = Object.freeze([
  'assets/data/generated/content-metrics.js',
  'assets/data/generated/runtime-integrity.js',
  'assets/data/generated/search-index.js',
  'assets/data/generated/runtime/content-snapshot.js',
  'assets/data/generated/runtime/content-entities.js',
  'assets/data/generated/runtime/constellations.js',
  'assets/data/generated/runtime/experiments.js',
  'assets/data/generated/runtime/learning-paths.js',
  'assets/data/generated/runtime/notable-figures.js',
  'assets/data/generated/runtime/parties.js',
  'assets/data/generated/runtime/publications.js',
  'assets/data/generated/runtime/references.js',
  'assets/data/generated/runtime/relations.js',
  'assets/data/generated/runtime/research-tracks.js',
  'assets/data/generated/runtime/site-pages.js',
  'assets/data/generated/runtime/theories.js',
]);
