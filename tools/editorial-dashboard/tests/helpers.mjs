import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalogService } from '../services/catalog-service.mjs';
import { createEditorialWorkflow } from '../services/editorial-workflow.mjs';
import { createWorkspaceStore } from '../services/workspace-store.mjs';

export const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const quietLogger = Object.freeze({ error() {}, log() {} });
export const allowedImpact = () => ({ allowed: true, blockers: [], changes: [] });
export const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + '\n');
}

export async function createFixture(t) {
  const temporaryRoot = process.platform === 'win32'
    ? resolve(PROJECT_ROOT, 'output/dashboard-tests')
    : resolve(tmpdir());
  await mkdir(temporaryRoot, { recursive: true });
  const root = await mkdtemp(join(temporaryRoot, 'observatorio-dashboard-test-'));
  const cleanups = [];
  const contentRoot = resolve(root, 'content/public');
  const schemaRoot = resolve(root, 'content/schemas');
  await mkdir(resolve(root, '.content-cache'), { recursive: true });
  await mkdir(schemaRoot, { recursive: true });
  const theory = await readJson(resolve(PROJECT_ROOT, 'content/public/theories/observacao-nao-linear.json'));
  await writeJson(resolve(contentRoot, 'theories', theory.id + '.json'), theory);
  for (const type of ['theory', 'reference', 'relation', 'party']) {
    await cp(resolve(PROJECT_ROOT, 'content/schemas', type + '.schema.json'), resolve(schemaRoot, type + '.schema.json'));
  }
  await cp(resolve(PROJECT_ROOT, 'content/public/taxonomies'), resolve(contentRoot, 'taxonomies'), { recursive: true });
  const store = createWorkspaceStore({ projectRoot: root });
  const catalog = createCatalogService({
    contentRoot,
    schemaRoot,
    lockPath: resolve(root, '.content-cache/catalog.lock'),
    compile: async () => ({
      fingerprint: 'fixture', metrics: { theories: 1 },
      report: { warnings: [], orphanReferenceIds: [], relationsAwaitingEvidence: [],
        relationsNeedingReview: [], legacyRelationReviewBaselines: [],
        experimentTheoryLinksAwaitingMigration: [], blockingEditorialDecisions: [] },
    }),
  });
  const fixture = {
    root, contentRoot, schemaRoot, theory, store, catalog,
    addCleanup(cleanup) { cleanups.push(cleanup); },
    async cleanup() {
      try {
        for (const cleanup of cleanups.reverse()) await cleanup();
      } finally {
        assert(basename(root).startsWith('observatorio-dashboard-test-'));
        assert.equal(dirname(root), temporaryRoot);
        await rm(root, { recursive: true, force: true, maxRetries: 3 });
      }
    },
  };
  t?.after(() => fixture.cleanup());
  return fixture;
}

export function completeDraft(workspace) {
  const record = structuredClone(workspace.primaryRecord);
  record.color = record.color === '#4abcde' ? '#5abcde' : '#4abcde';
  Object.assign(record.revisions.at(-1), {
    versionLabel: 'fixture-r2', reviewedAt: '2026-11-23', label: 'Revisão de fixture',
    changeSummary: 'Alteração de apresentação em cópia isolada de teste.',
    responsibles: [{ name: 'Pessoa de teste', role: 'fixture isolada' }],
  });
  return record;
}

export async function saveDraft(fixture, workspace, record = completeDraft(workspace)) {
  return fixture.store.withWorkspaceLock(workspace.id, () => (
    fixture.store.savePrimaryRecordUnlocked(workspace.id, {
      changeClass: 'presentation', record, version: workspace.version,
    })
  ));
}

export async function loadFixtureManifest(path) {
  const manifest = await readJson(path);
  return {
    operations: await Promise.all(manifest.operations.map(async (operation) => ({
      ...operation,
      record: await readJson(resolve(dirname(path), operation.source)),
    }))),
  };
}

export function fixtureWorkflow(fixture, overrides = {}) {
  return createEditorialWorkflow({
    catalog: fixture.catalog, workspaceStore: fixture.store,
    analyzeOperations: async () => ({ impact: allowedImpact() }),
    analyzeChangeSet: async () => allowedImpact(),
    loadManifest: loadFixtureManifest,
    applyChangeSet: async () => { throw new Error('Instalação não configurada para esta fixture'); },
    ...overrides,
  });
}

export async function httpResponse(url, { body, headers = {}, method = 'GET' } = {}) {
  return new Promise((resolveResponse, reject) => {
    const req = request(url, {
      method, agent: false,
      headers: { ...(body === undefined ? {} : { 'content-length': Buffer.byteLength(body) }), ...headers },
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch {}
        resolveResponse({ status: response.statusCode, headers: response.headers, text, json });
      });
    });
    req.setTimeout(10000, () => req.destroy(new Error('Timeout HTTP da fixture')));
    req.on('error', reject);
    req.end(body);
  });
}

export async function hashDirectory(root) {
  const hash = createHash('sha256');
  async function walk(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) {
        hash.update(relative(root, path).replaceAll('\\', '/'));
        hash.update(await readFile(path));
      } else throw new Error('Fixture não aceita links: ' + path);
    }
  }
  await walk(root);
  return hash.digest('hex');
}

export const previewFiles = ['.nvmrc', 'index.html', 'package-lock.json', 'package.json', 'robots.txt', 'teorias.html', 'vercel.json'];
export const previewDirectories = ['Arquivo', 'Constelacoes', 'Contribuicoes', 'GrandesNomes', 'Laboratorio', 'Mapa', 'Rotas', 'Teorias', 'assets', 'scripts'];

export async function preparePreviewProject(fixture, { real = false } = {}) {
  if (real) {
    for (const file of previewFiles) await cp(resolve(PROJECT_ROOT, file), resolve(fixture.root, file));
    for (const directory of [...previewDirectories, 'content', 'tools/editorial-dashboard']) {
      await cp(resolve(PROJECT_ROOT, directory), resolve(fixture.root, directory), {
        recursive: true,
        filter(source) {
          const path = relative(PROJECT_ROOT, source).replaceAll('\\', '/');
          return !path.endsWith('.txt') && !path.includes('/tests');
        },
      });
    }
    return;
  }
  for (const directory of previewDirectories) await mkdir(resolve(fixture.root, directory), { recursive: true });
  for (const file of previewFiles) await writeFile(resolve(fixture.root, file), '');
  await writeJson(resolve(fixture.root, 'package.json'), { type: 'module' });
  await writeJson(resolve(fixture.root, 'vercel.json'), { headers: [{ source: '/(.*)', headers: [
    { key: 'Content-Security-Policy', value: "default-src 'self'; frame-ancestors 'none'" },
    { key: 'X-Frame-Options', value: 'DENY' },
  ] }] });
  await mkdir(resolve(fixture.root, 'scripts/content'), { recursive: true });
  await writeFile(resolve(fixture.root, 'scripts/content/cli.mjs'), [
    'import { readFile, writeFile } from "node:fs/promises";',
    'import { dirname, resolve } from "node:path";',
    'if (process.argv[2] !== "apply" || process.argv[3] !== "--manifest") throw new Error("argumentos inesperados");',
    'const path = resolve(process.argv[4]);',
    'const manifest = JSON.parse(await readFile(path, "utf8"));',
    'for (const operation of manifest.operations) {',
    '  const source = resolve(dirname(path), operation.source);',
    '  const record = await readFile(source, "utf8");',
    '  await writeFile(resolve("content/public/theories", operation.id + ".json"), record);',
    '}',
  ].join('\n'));
  await writeFile(resolve(fixture.root, 'scripts/build.mjs'), [
    'import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";',
    'const name = (await readdir("content/public/theories"))[0];',
    'const theory = JSON.parse(await readFile("content/public/theories/" + name, "utf8"));',
    'await mkdir("dist", { recursive: true });',
    'await writeFile("dist/index.html", "<h1>" + theory.title + " | " + theory.revisionId + "</h1>");',
  ].join('\n'));
  await mkdir(resolve(fixture.root, 'scripts/tests'), { recursive: true });
  await writeFile(resolve(fixture.root, 'scripts/tests/private.mjs'), 'PRIVATE_TEST_CANARY');
  await writeFile(resolve(fixture.root, 'scripts/theory-sources.mjs'), 'PRIVATE_SOURCE_CANARY');
  await mkdir(resolve(fixture.root, 'docs'), { recursive: true });
  await writeFile(resolve(fixture.root, 'docs/private.md'), 'PRIVATE_DOC_CANARY');
}
