import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createWorkspaceContextGuard } from '../app/workspace-context.js';
import { corruptedWorkspacePresentation, isCorruptedWorkspace } from '../app/workspace-recovery.js';

test('respostas tardias não pertencem a outro workspace nem à nova época do mesmo ID', async () => {
  const guard = createWorkspaceContextGuard();
  guard.beginTransition();
  const oldContext = guard.capture('workspace-a');
  let release;
  const delayed = new Promise((resolveResult) => { release = resolveResult; });
  const result = delayed.then(() => guard.isCurrent(oldContext, 'workspace-a'));
  const currentEpoch = guard.beginTransition();
  assert.equal(guard.isCurrent(oldContext, 'workspace-b'), false);
  assert.equal(guard.isCurrent(oldContext, 'workspace-a'), false);
  const currentContext = guard.capture('workspace-a');
  assert.equal(guard.isCurrent(currentContext, 'workspace-a'), true);
  assert.equal(guard.isEpochCurrent(currentEpoch), true);
  assert.equal(guard.isCurrent(guard.capture(null), null), false);
  release();
  assert.equal(await result, false);
});

test('recuperação oferece exclusão e não exibe registro ou diagnóstico privado', () => {
  assert.equal(corruptedWorkspacePresentation({ id: 'regular' }), null);
  const workspace = { id: '12345678-private-identifier', corrupted: true, primaryRecord: { email: 'private@example.invalid' }, corruption: { message: '/private/secret.json' } };
  assert.equal(isCorruptedWorkspace(workspace), true);
  const presentation = corruptedWorkspacePresentation(workspace);
  assert.equal(presentation.canResume, false);
  assert.equal(presentation.deleteLabel, 'Excluir workspace corrompido');
  assert.match(presentation.eyebrow, /12345678$/);
  assert(!JSON.stringify(presentation).includes('private@example.invalid'));
  assert(!JSON.stringify(presentation).includes('secret.json'));
});

async function isolatedApi() {
  return import('../app/api.js?fixture=' + Math.random());
}

test('cliente não escreve sem sessão e envia CSRF/credentials sem cache após inicialização', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify({ ok: true, data: { accepted: true } }), { headers: { 'content-type': 'application/json' } });
  };
  const { editorialApi, setEditorialCsrfToken } = await isolatedApi();
  await assert.rejects(editorialApi.createWorkspace('theory', 'fixture'), { code: 'missing-csrf-token' });
  assert.equal(calls.length, 0);
  setEditorialCsrfToken('fixture-token');
  assert.deepEqual(await editorialApi.saveWorkspaceRecord('a/b', { record: { id: 'test' }, version: 2, changeClass: 'presentation' }), { accepted: true });
  assert.equal(calls[0].url, '/api/v1/workspaces/a%2Fb/record');
  assert.equal(calls[0].options.method, 'PUT');
  assert.equal(calls[0].options.credentials, 'same-origin');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.headers.get('X-Editorial-CSRF'), 'fixture-token');
  assert.equal(JSON.parse(calls[0].options.body).version, 2);
});

test('cliente preserva erros de conflito e abortos e distingue falha de rede', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const { editorialApi } = await isolatedApi();
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: false, error: { code: 'stale-workspace', message: 'Atualize a leitura.', details: { currentVersion: 3 } },
  }), { status: 409, headers: { 'content-type': 'application/json' } });
  await assert.rejects(editorialApi.workspace('fixture'), (error) => (
    error.code === 'stale-workspace' && error.status === 409 && error.details.currentVersion === 3
  ));
  const abort = new DOMException('Cancelado', 'AbortError');
  globalThis.fetch = async () => { throw abort; };
  await assert.rejects(editorialApi.session(), (error) => error === abort);
  globalThis.fetch = async () => { throw new Error('Processo desconectado'); };
  await assert.rejects(editorialApi.session(), { code: 'network-error' });
});
