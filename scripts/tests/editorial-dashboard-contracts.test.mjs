import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { createDashboardApplication, createDashboardServer } from '../../tools/editorial-dashboard/server.mjs';
import { completeDraft, createFixture, fixtureWorkflow, httpResponse, PROJECT_ROOT, quietLogger } from '../../tools/editorial-dashboard/tests/helpers.mjs';

async function startDashboard(t, options = {}) {
  const fixture = await createFixture(t);
  const preview = {
    close: async () => {}, stopWorkspacePreview: async () => false,
    stopWorkspacePreviewUnlocked: async () => false,
    invalidateWorkspacePreviewUnlocked: async () => false,
  };
  const application = createDashboardApplication({
    appRoot: resolve(PROJECT_ROOT, 'tools/editorial-dashboard/app'),
    catalog: fixture.catalog, workspaceStore: fixture.store,
    workflow: fixtureWorkflow(fixture), previewService: preview,
    logger: quietLogger, ...options,
  });
  const dashboard = createDashboardServer({ application, projectRoot: fixture.root, port: 0 });
  fixture.addCleanup(() => dashboard.close());
  const { origin } = await dashboard.start();
  const session = await httpResponse(origin + '/api/v1/session');
  const headers = {
    origin, 'content-type': 'application/json',
    'x-editorial-csrf': session.json.data.csrfToken,
  };
  const api = (path, { body, method = 'GET', headers: extra = {} } = {}) => httpResponse(
    origin + '/api/v1' + path,
    { method, headers: { ...headers, ...extra }, body: body === undefined ? undefined : JSON.stringify(body) },
  );
  return { ...fixture, origin, session, api, headers };
}

test('API local cria, retoma, salva e exclui workspace sem alterar conteúdo canônico', async (t) => {
  const fixture = await startDashboard(t);
  const canonical = resolve(fixture.contentRoot, 'theories', fixture.theory.id + '.json');
  const before = await readFile(canonical, 'utf8');
  assert.equal(fixture.session.status, 200);
  assert.equal(fixture.session.json.data.capabilities.git, false);
  assert.match(fixture.session.headers['x-robots-tag'], /noindex/);
  const catalog = await fixture.api('/catalog?type=theory');
  assert.equal(catalog.status, 200);
  assert.equal(catalog.json.data.items[0].id, fixture.theory.id);
  const created = await fixture.api('/workspaces', { method: 'POST', body: { type: 'theory', id: fixture.theory.id } });
  assert.equal(created.status, 201);
  const workspace = created.json.data;
  assert.equal(workspace.version, 1);
  assert.equal((await fixture.api('/workspaces')).json.data.items.length, 1);
  assert.equal((await fixture.api('/workspaces/' + workspace.id)).json.data.primaryRecord.revisionId, fixture.theory.id + '-r2');
  const payload = { version: 1, changeClass: 'presentation', record: completeDraft(workspace) };
  const saved = await fixture.api('/workspaces/' + workspace.id + '/record', { method: 'PUT', body: payload });
  assert.equal(saved.status, 200);
  assert.equal(saved.json.data.version, 2);
  const stale = await fixture.api('/workspaces/' + workspace.id + '/record', { method: 'PUT', body: payload });
  assert.equal(stale.status, 409);
  assert.equal(stale.json.error.code, 'stale-workspace');
  const impact = await fixture.api('/workspaces/' + workspace.id + '/impact', { method: 'POST', body: {} });
  assert.equal(impact.status, 200);
  assert.match(impact.json.data.digest, /^sha256:/);
  const rejected = await fixture.api('/workspaces/' + workspace.id + '/record', {
    method: 'PUT', body: { ...payload, version: 2, record: { ...payload.record, email: 'private@example.invalid' } },
  });
  assert.equal(rejected.status, 422);
  assert.equal(rejected.json.error.code, 'private-data-rejected');
  assert.equal((await fixture.api('/workspaces/' + workspace.id, { method: 'DELETE', body: {} })).status, 200);
  assert.equal((await fixture.api('/workspaces')).json.data.items.length, 0);
  assert.equal(await readFile(canonical, 'utf8'), before);
});

test('roteador HTTP aplica CSRF/body/allowlist e não entrega arquivos do projeto', async (t) => {
  const fixture = await startDashboard(t, { bodyLimit: 128 });
  const page = await httpResponse(fixture.origin + '/');
  assert.equal(page.status, 200);
  assert.match(page.text, /<html/);
  const head = await httpResponse(fixture.origin + '/main.js', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.text, '');
  for (const path of ['/package.json', '/content/public/theories/observacao-nao-linear.json', '/services/security.mjs']) {
    assert.equal((await httpResponse(fixture.origin + path)).status, 404);
  }
  assert.equal((await fixture.api('/catalog?type=filesystem')).status, 400);
  assert.equal((await fixture.api('/schemas/not-a-schema')).status, 400);
  assert.equal((await fixture.api('/workspaces', { method: 'POST', body: {}, headers: { 'x-editorial-csrf': '' } })).status, 403);
  assert.equal((await fixture.api('/workspaces', { method: 'POST', body: {}, headers: { origin: 'https://external.invalid' } })).status, 403);
  const invalid = await httpResponse(fixture.origin + '/api/v1/workspaces', {
    method: 'POST', headers: fixture.headers, body: '{invalid',
  });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.json.error.code, 'invalid-json');
  const huge = await fixture.api('/workspaces', { method: 'POST', body: { padding: 'x'.repeat(200) } });
  assert.equal(huge.status, 413);
  assert.equal((await httpResponse(fixture.origin + '/', { method: 'OPTIONS' })).status, 405);
  assert.equal((await httpResponse(fixture.origin + '/', { headers: { host: 'external.invalid' } })).status, 403);
});
