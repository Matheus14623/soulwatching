import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  completeDraft,
  createFixture,
  hashDirectory,
  httpResponse,
  preparePreviewProject,
  PROJECT_ROOT,
} from './helpers.mjs';

const canonicalRoot = resolve(PROJECT_ROOT, 'content/public');
const canonicalHash = await hashDirectory(canonicalRoot);
const fixture = await createFixture();
let previewService;

try {
  console.log('Preparando cópia privada do projeto para o preview real.');
  await preparePreviewProject(fixture, { real: true });
  const fixtureHash = await hashDirectory(fixture.contentRoot);
  assert.equal(fixtureHash, canonicalHash, 'A cópia deve partir do conteúdo canônico completo');

  // Os módulos de domínio resolvem seus caminhos a partir do próprio arquivo.
  // Importá-los da cópia mantém análise, locks e ledgers dentro da fixture.
  const importService = (name) => import(pathToFileURL(resolve(
    fixture.root, 'tools/editorial-dashboard/services', name + '.mjs',
  )).href);
  const [catalogModule, workflowModule, storeModule, previewModule] = await Promise.all([
    importService('catalog-service'),
    importService('editorial-workflow'),
    importService('workspace-store'),
    importService('preview-service'),
  ]);
  const store = storeModule.createWorkspaceStore({ projectRoot: fixture.root });
  const catalog = catalogModule.createCatalogService();
  const workflow = workflowModule.createEditorialWorkflow({ catalog, workspaceStore: store });
  let workspace = await workflow.createTheoryWorkspace(fixture.theory.id);
  const draft = completeDraft(workspace);
  assert.notEqual(draft.color, fixture.theory.color);
  assert.notEqual(draft.revisionId, fixture.theory.revisionId);
  workspace = await store.withWorkspaceLock(workspace.id, () => (
    store.savePrimaryRecordUnlocked(workspace.id, {
      changeClass: 'presentation', record: draft, version: workspace.version,
    })
  ));

  const analysis = await workflow.analyzeWorkspace(workspace.id);
  assert.equal(analysis.impact.allowed, true, JSON.stringify(analysis.impact.blockers));
  assert.equal(analysis.workspaceVersion, workspace.version);
  assert.match(analysis.digest, /^sha256:[a-f0-9]{64}$/);
  const previewRoot = resolve(fixture.root, '.content-cache/editorial-dashboard/p');
  previewService = previewModule.createPreviewService({
    projectRoot: fixture.root,
    workspaceStore: store,
    previewRoot,
    contentLockPath: resolve(fixture.root, '.content-cache/content-transaction.lock'),
  });
  await assert.rejects(previewService.createPreview(workspace.id, 'stale'), { code: 'stale-impact' });

  console.log('Executando aplicação, gate editorial, compilador e build no workspace de preview.');
  const preview = await previewService.createPreview(workspace.id, analysis.digest);
  assert.equal(preview.status, 'ready');
  const state = await store.readWorkspaceUnlocked(workspace.id);
  assert.equal(previewService.assertReady(workspace.id, state.lastPreview).id, preview.id);
  assert.equal(state.applied, null, 'Preview não aplica o rascunho à fonte de trabalho');

  const shadowRoot = resolve(previewRoot, preview.id, 'workspace');
  const shadowRecord = JSON.parse(await readFile(resolve(
    shadowRoot, 'content/public/theories', fixture.theory.id + '.json',
  ), 'utf8'));
  assert.equal(shadowRecord.revisionId, draft.revisionId);
  assert.equal(shadowRecord.color, draft.color);
  const ledger = JSON.parse(await readFile(resolve(
    shadowRoot, 'content/public/catalogs/editorial-revision-ledger.json',
  ), 'utf8'));
  const revision = ledger.entries.find(({ entityType, entityId }) => (
    entityType === 'theory' && entityId === draft.id
  )).revisions.at(-1);
  assert.equal(revision.revisionId, draft.revisionId);
  assert.equal(revision.changeClass, 'presentation');

  const origin = new URL(preview.openUrl).origin;
  assert.equal((await httpResponse(origin + '/')).status, 403);
  const opened = await httpResponse(preview.openUrl);
  assert.equal(opened.status, 303);
  assert.equal(opened.headers.location, '/');
  const cookie = opened.headers['set-cookie']?.[0]?.split(';')[0];
  assert.ok(cookie, 'A abertura protegida deve criar o cookie do preview');
  assert.match(opened.headers['set-cookie'][0], /HttpOnly; SameSite=Strict/);
  const headers = { cookie };
  const page = await httpResponse(origin + '/Teorias/teorias.html', { headers });
  assert.equal(page.status, 200);
  assert.match(page.text, /data-theory-archive-grid/);
  assert.match(page.headers['x-robots-tag'], /noindex/);
  assert.match(page.headers['content-security-policy'], /frame-ancestors http:\/\/localhost/);

  const runtimePath = '/assets/data/generated/runtime/theories.js';
  const runtimeResponse = await httpResponse(origin + runtimePath, { headers });
  assert.equal(runtimeResponse.status, 200);
  const runtime = await import(pathToFileURL(resolve(shadowRoot, 'dist' + runtimePath)).href);
  const publicTheory = runtime.THEORIES.find(({ id }) => id === draft.id);
  assert.equal(publicTheory.revision.version, draft.revisions.at(-1).versionLabel);
  assert.equal(publicTheory.revision.reviewedAt, draft.revisions.at(-1).reviewedAt);
  assert.deepEqual(publicTheory.revisionHistory.at(-1), publicTheory.revision);
  assert.equal(publicTheory.color, draft.color);
  assert.ok(runtimeResponse.text.includes(draft.revisions.at(-1).versionLabel));
  for (const path of ['/content/public/theories/' + draft.id + '.json', '/scripts/build.mjs', '/package.json']) {
    assert.equal((await httpResponse(origin + path, { headers })).status, 404, path);
  }
  assert.equal(await hashDirectory(fixture.contentRoot), fixtureHash, 'Preview preserva a fonte da cópia privada');
  assert.equal(await hashDirectory(canonicalRoot), canonicalHash, 'Preview preserva a fonte canônica real');

  await previewService.stopWorkspacePreview(workspace.id);
  assert.equal((await store.readWorkspaceUnlocked(workspace.id)).lastPreview, null);
  await assert.rejects(stat(resolve(previewRoot, preview.id)), { code: 'ENOENT' });
  assert.throws(() => previewService.getPreview(preview.id, workspace.id), { code: 'preview-not-found' });
  console.log('Preview real aprovado: rascunho servido com autenticação, build isolado e fontes preservadas.');
} finally {
  try {
    await previewService?.close();
  } finally {
    try {
      await fixture.cleanup();
    } finally {
      assert.equal(await hashDirectory(canonicalRoot), canonicalHash, 'O smoke não pode alterar content/public/');
    }
  }
}
