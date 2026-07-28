import { readFile, readdir } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { PROJECT_ROOT } from './paths.mjs';

export const LEGACY_DATA_IMPORT_ALLOWLIST = Object.freeze([]);

export const LEGACY_DATA_IMPORT_BUDGET = 0;

const PRODUCT_ROOTS = Object.freeze([
  'assets/js',
  'Arquivo',
  'Constelacoes',
  'Contribuicoes',
  'GrandesNomes',
  'Laboratorio',
  'Mapa',
  'Rotas',
  'Teorias',
]);

async function listJavaScript(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return listJavaScript(path);
    return extname(entry.name) === '.js' ? [path] : [];
  }));
  return nested.flat();
}

export async function inspectDirectDataImports() {
  const files = (await Promise.all(
    PRODUCT_ROOTS.map((directory) => listJavaScript(resolve(PROJECT_ROOT, directory))),
  )).flat();
  const imports = [];
  const pattern = /\b(?:from\s*|import\s*\(\s*)['"]([^'"]*\/data\/[^'"]+)['"]/g;

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(pattern)) {
      if (match[1].includes('/data/generated/')) continue;
      const fileLabel = relative(PROJECT_ROOT, file).replaceAll('\\', '/');
      imports.push(`${fileLabel} -> ${match[1]}`);
    }
  }
  return [...new Set(imports)].sort();
}

export async function validateDirectDataImportPolicy() {
  const actual = await inspectDirectDataImports();
  const allowed = new Set(LEGACY_DATA_IMPORT_ALLOWLIST);
  const unexpected = actual.filter((entry) => !allowed.has(entry));
  const removed = LEGACY_DATA_IMPORT_ALLOWLIST.filter((entry) => !actual.includes(entry));
  const errors = [];

  if (LEGACY_DATA_IMPORT_ALLOWLIST.length > LEGACY_DATA_IMPORT_BUDGET) {
    errors.push(
      `A allowlist de imports legados cresceu para ${LEGACY_DATA_IMPORT_ALLOWLIST.length}; `
      + `o budget é ${LEGACY_DATA_IMPORT_BUDGET}`,
    );
  }
  if (unexpected.length) {
    errors.push(`Novos imports diretos de assets/data: ${unexpected.join(', ')}`);
  }
  if (removed.length) {
    errors.push(
      `Imports legados já removidos ainda estão na allowlist; reduza-a: ${removed.join(', ')}`,
    );
  }
  return { actual, errors };
}
