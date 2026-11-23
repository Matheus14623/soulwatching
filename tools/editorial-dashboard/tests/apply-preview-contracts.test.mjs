import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { createPreviewService, previewCookieName, previewHeaders } from '../services/preview-service.mjs';
import { DashboardError } from '../services/errors.mjs';
import { allowedImpact, createFixture, fixtureWorkflow, httpResponse, preparePreviewProject, quietLogger, saveDraft } from './helpers.mjs';

async function approvedWorkspace(fixture, workflow) {
  let workspace = await workflow.createTheoryWorkspace(fixture.theory.id);
  workspace = await saveDraft(fixture, workspace);
  const analysis = await workflow.analyzeWorkspace(workspace.id);
  return { workspace, digest: analysis.digest };
}

function previewState(digest, changes = {}) {
  return {
    id: 'fixture-preview', impactDigest: digest, status: 'ready',
    createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString(),
    ...changes,
  };
}

test('aplicação exige confirmação, impacto vigente e preview correspondente antes do instalador', async (t) => {
  const fixture = await createFixture(t);
  let installed = 0;
  const workflow = fixtureWorkflow(fixture, {
    applyChangeSet: async ({ validateImpact }) => {
      await validateImpact(allowedImpact());
      installed += 1;
      return { installed: [{ type: 'theory', id: fixture.theory.id }] };
    },
  });
  const { workspace, digest } = await approvedWorkspace(fixture, workflow);
  await assert.rejects(workflow.applyWorkspace(workspace.id, { confirmation: 'não', impactDigest: digest }), { code: 'apply-confirmation-required' });
  await assert.rejects(workflow.applyWorkspace(workspace.id, { confirmation: 'APLICAR', impactDigest: 'old' }), { code: 'stale-impact' });
  await assert.rejects(workflow.applyWorkspace(workspace.id, { confirmation: 'APLICAR', impactDigest: digest }), { code: 'preview-required' });
  await fixture.store.recordPreviewUnlocked(workspace.id, previewState(digest, { expiresAt: '2000-01-01T00:00:00Z' }));
  await assert.rejects(workflow.applyWorkspace(workspace.id, { confirmation: 'APLICAR', impactDigest: digest }), { code: 'stale-preview' });
  assert.equal(installed, 0);
  await fixture.store.recordPreviewUnlocked(workspace.id, previewState(digest));
  const result = await workflow.applyWorkspace(workspace.id, { confirmation: 'APLICAR', impactDigest: digest });
  assert.equal(result.stateRecorded, true);
  assert.equal(installed, 1);
  await assert.rejects(workflow.applyWorkspace(workspace.id, { confirmation: 'APLICAR', impactDigest: digest }), { code: 'workspace-already-applied' });
  assert.equal(installed, 1);
});

test('reanálise dentro da aplicação detecta mudança de impacto antes de instalar', async (t) => {
  const fixture = await createFixture(t);
  let installed = false;
  const workflow = fixtureWorkflow(fixture, {
    applyChangeSet: async ({ validateImpact }) => {
      await validateImpact({ ...allowedImpact(), canonicalFingerprint: 'changed-after-preview' });
      installed = true;
      return { installed: [] };
    },
  });
  const { workspace, digest } = await approvedWorkspace(fixture, workflow);
  await fixture.store.recordPreviewUnlocked(workspace.id, previewState(digest));
  await assert.rejects(workflow.applyWorkspace(workspace.id, { confirmation: 'APLICAR', impactDigest: digest }), { code: 'stale-impact' });
  assert.equal(installed, false);
  assert.equal((await fixture.store.readWorkspaceUnlocked(workspace.id)).applied, null);
});

test('blocker do gate e preview sem servidor ativo impedem instalação', async (t) => {
  const fixture = await createFixture(t);
  let installed = 0;
  const blocked = fixtureWorkflow(fixture, {
    applyChangeSet: async ({ validateImpact }) => {
      await validateImpact({ allowed: false, blockers: [{ code: 'stale-reviewed-relation', relationId: 'fixture-relation' }], changes: [] });
      installed += 1;
      return { installed: [] };
    },
  });
  const { workspace, digest } = await approvedWorkspace(fixture, blocked);
  await fixture.store.recordPreviewUnlocked(workspace.id, previewState(digest));
  await assert.rejects(blocked.applyWorkspace(workspace.id, { confirmation: 'APLICAR', impactDigest: digest }), { code: 'editorial-apply-failed' });
  assert.equal(installed, 0);
  const lostPreview = fixtureWorkflow(fixture, {
    previewVerifier: async () => {
      throw new DashboardError('Servidor de preview encerrado.', { code: 'stale-preview', status: 409 });
    },
    applyChangeSet: async () => { installed += 1; return { installed: [] }; },
  });
  await assert.rejects(lostPreview.applyWorkspace(workspace.id, { confirmation: 'APLICAR', impactDigest: digest }), { code: 'stale-preview' });
  assert.equal(installed, 0);
  assert.equal((await fixture.store.readWorkspaceUnlocked(workspace.id)).applied, null);
});

test('falha de registro privado após instalação preserva sucesso e aviso de recuperação', async (t) => {
  const fixture = await createFixture(t);
  const workflow = fixtureWorkflow(fixture, {
    workspaceStore: { ...fixture.store, recordAppliedUnlocked: async () => { throw new Error('disco indisponível'); } },
    applyChangeSet: async ({ validateImpact }) => {
      await validateImpact(allowedImpact());
      return { installed: [{ type: 'theory', id: fixture.theory.id }] };
    },
  });
  const { workspace, digest } = await approvedWorkspace(fixture, workflow);
  await fixture.store.recordPreviewUnlocked(workspace.id, previewState(digest));
  const result = await workflow.applyWorkspace(workspace.id, { confirmation: 'APLICAR', impactDigest: digest });
  assert.equal(result.stateRecorded, false);
  assert.equal(result.installed[0].id, fixture.theory.id);
  assert.equal(result.operationalWarning.code, 'applied-state-recovery-required');
});

test('preview usa subprocessos e workspace-sombra, protege cookie e limpa artefatos', async (t) => {
  const fixture = await createFixture(t);
  await preparePreviewProject(fixture);
  const service = createPreviewService({
    projectRoot: fixture.root, workspaceStore: fixture.store, logger: quietLogger,
    contentLockPath: resolve(fixture.root, '.content-cache/preview-source.lock'),
    previewRoot: resolve(fixture.root, '.content-cache/editorial-dashboard/previews/test'),
  });
  fixture.addCleanup(() => service.close());
  const workflow = fixtureWorkflow(fixture);
  const { workspace, digest } = await approvedWorkspace(fixture, workflow);
  await assert.rejects(service.createPreview(workspace.id, 'old-digest'), { code: 'stale-impact' });
  const canonicalPath = resolve(fixture.contentRoot, 'theories', fixture.theory.id + '.json');
  const before = await readFile(canonicalPath, 'utf8');
  const preview = await service.createPreview(workspace.id, digest);
  assert.equal(preview.status, 'ready');
  assert.equal(service.assertReady(workspace.id, (await fixture.store.readWorkspaceUnlocked(workspace.id)).lastPreview).id, preview.id);
  const shadow = resolve(fixture.root, '.content-cache/editorial-dashboard/previews/test', preview.id, 'workspace');
  for (const privatePath of ['scripts/theory-sources.mjs', 'scripts/tests/private.mjs', 'docs/private.md']) {
    await assert.rejects(stat(resolve(shadow, privatePath)), { code: 'ENOENT' });
  }
  assert.equal(await readFile(canonicalPath, 'utf8'), before);
  const url = new URL(preview.openUrl);
  assert.equal((await httpResponse(url.origin + '/')).status, 403);
  const opened = await httpResponse(preview.openUrl);
  assert.equal(opened.status, 303);
  const cookie = opened.headers['set-cookie'][0].split(';')[0];
  assert.match(opened.headers['set-cookie'][0], /HttpOnly; SameSite=Strict/);
  const page = await httpResponse(url.origin + '/', { headers: { cookie } });
  assert.equal(page.status, 200);
  assert.match(page.text, /observacao-nao-linear-r2/);
  assert.match(page.headers['x-robots-tag'], /noindex/);
  assert.equal(page.headers['x-frame-options'], undefined);
  assert.match(page.headers['content-security-policy'], /frame-ancestors http:\/\/localhost/);
  assert.equal((await httpResponse(url.origin + '/package.json', { headers: { cookie } })).status, 404);
  assert.equal((await httpResponse(url.origin + '/', { method: 'POST', headers: { cookie } })).status, 405);
  assert.equal((await httpResponse(url.origin + '/', { headers: { cookie, host: 'external.invalid' } })).status, 403);
  assert.equal(await service.stopWorkspacePreview(workspace.id), true);
  assert.equal((await fixture.store.readWorkspaceUnlocked(workspace.id)).lastPreview, null);
  await assert.rejects(stat(resolve(shadow, '..')), { code: 'ENOENT' });
  assert.throws(() => service.getPreview(preview.id, workspace.id), { code: 'preview-not-found' });
});

test('cookies são exclusivos por preview e cabeçalhos preservam CSP sem bloquear iframe local', () => {
  assert.equal(previewCookieName('first'), previewCookieName('first'));
  assert.notEqual(previewCookieName('first'), previewCookieName('second'));
  const headers = previewHeaders({ 'content-security-policy': "default-src 'self'; frame-ancestors 'none'", 'x-frame-options': 'DENY' });
  assert.equal(headers['x-frame-options'], undefined);
  assert.match(headers['content-security-policy'], /default-src 'self'/);
  assert.equal((headers['content-security-policy'].match(/frame-ancestors/g) || []).length, 1);
  assert.match(headers['cache-control'], /no-store/);
});
