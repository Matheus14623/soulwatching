import assert from 'node:assert/strict';
import { readFile, symlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { createWorkspaceStore } from '../services/workspace-store.mjs';
import { completeDraft, createFixture, readJson, saveDraft, writeJson } from './helpers.mjs';

test('workspace cria r2 privada e manifesto sem alterar a fonte canônica', async (t) => {
  const fixture = await createFixture(t);
  const canonicalPath = resolve(fixture.contentRoot, 'theories', fixture.theory.id + '.json');
  const before = await readFile(canonicalPath, 'utf8');
  const workspace = await fixture.store.createTheoryWorkspace(fixture.theory);
  assert.equal(workspace.version, 1);
  assert.equal(workspace.baseRevisionId, fixture.theory.revisionId);
  assert.equal(workspace.primaryRecord.revisionId, fixture.theory.id + '-r2');
  assert.equal(workspace.primaryRecord.revisions.length, fixture.theory.revisions.length + 1);
  assert.deepEqual(workspace.primaryRecord.revisions[0], fixture.theory.revisions[0]);
  const manifest = await readJson(fixture.store.manifestPath(workspace.id));
  assert.deepEqual(manifest.operations, [{
    type: 'theory', id: fixture.theory.id,
    source: 'records/theory--' + fixture.theory.id + '.json', force: true,
  }]);
  assert.equal(await readFile(canonicalPath, 'utf8'), before);
  assert(!JSON.stringify(workspace).includes(fixture.root));
});

test('salvamentos concorrentes rejeitam a leitura antiga em vez de sobrescrever', async (t) => {
  const fixture = await createFixture(t);
  const workspace = await fixture.store.createTheoryWorkspace(fixture.theory);
  const results = await Promise.allSettled([
    saveDraft(fixture, workspace),
    saveDraft(fixture, workspace),
  ]);
  assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1);
  assert.equal(results.find(({ status }) => status === 'rejected').reason.code, 'stale-workspace');
  assert.equal((await fixture.store.readWorkspaceUnlocked(workspace.id)).version, 2);
});

test('edição invalida impacto, preview e marca de aplicação anteriores', async (t) => {
  const fixture = await createFixture(t);
  const workspace = await fixture.store.createTheoryWorkspace(fixture.theory);
  await fixture.store.recordImpactUnlocked(workspace.id, { allowed: true, digest: 'digest-anterior' });
  await fixture.store.recordPreviewUnlocked(workspace.id, { id: 'preview-anterior', status: 'ready' });
  await fixture.store.recordAppliedUnlocked(workspace.id, [{ id: fixture.theory.id }]);
  const saved = await saveDraft(fixture, workspace);
  assert.equal(saved.lastImpact, null);
  assert.equal(saved.lastPreview, null);
  assert.equal(saved.applied, null);
  assert.equal(saved.operations[0].changeClass, 'presentation');
});

test('adulteração do registro vira recuperação sem conteúdo e pode ser excluída', async (t) => {
  const fixture = await createFixture(t);
  const workspace = await fixture.store.createTheoryWorkspace(fixture.theory);
  const path = resolve(fixture.store.workspaceDirectory(workspace.id), 'records/theory--' + fixture.theory.id + '.json');
  const tampered = completeDraft(workspace);
  tampered.summary = 'Conteúdo adulterado que não deve aparecer na listagem de recuperação.';
  await writeJson(path, tampered);
  await assert.rejects(fixture.store.readWorkspaceUnlocked(workspace.id), { code: 'workspace-record-tampered' });
  const listed = await fixture.store.listWorkspaces();
  assert.equal(listed.length, 1);
  assert.equal(listed[0].corrupted, true);
  assert.deepEqual(listed[0].operations, []);
  assert(!JSON.stringify(listed).includes(tampered.summary));
  await fixture.store.withWorkspaceLock(workspace.id, () => fixture.store.deleteWorkspaceUnlocked(workspace.id));
  assert.deepEqual(await fixture.store.listWorkspaces(), []);
});

test('dados privados, troca de identidade e operações repetidas não são persistidos', async (t) => {
  const fixture = await createFixture(t);
  const workspace = await fixture.store.createTheoryWorkspace(fixture.theory);
  await assert.rejects(saveDraft(fixture, workspace, { ...completeDraft(workspace), email: 'fixture@example.invalid' }), { code: 'private-data-rejected' });
  await assert.rejects(saveDraft(fixture, workspace, { ...completeDraft(workspace), id: 'outra-identidade' }), { code: 'workspace-identity-mismatch' });
  const operation = {
    type: 'reference', changeClass: 'structural', force: false,
    record: { entityType: 'reference', id: 'fonte-fixture' },
  };
  await assert.rejects(fixture.store.upsertOperationsUnlocked(workspace.id, {
    version: workspace.version, operations: [operation, operation],
  }), { code: 'duplicate-operation' });
  assert.equal((await fixture.store.readWorkspaceUnlocked(workspace.id)).version, 1);
  await assert.rejects(fixture.store.removeOperationsUnlocked(workspace.id, {
    version: 1, operations: [{ type: 'theory', id: fixture.theory.id }],
  }), { code: 'primary-operation-required' });
});

test('estado com path arbitrário é recuperável e raiz pública é recusada', async (t) => {
  const fixture = await createFixture(t);
  assert.throws(() => createWorkspaceStore({
    projectRoot: fixture.root, workspaceRoot: fixture.contentRoot,
  }), /raiz de workspaces/);
  assert.throws(() => fixture.store.workspaceDirectory('../fora'), { code: 'invalid-workspace-id' });
  const workspace = await fixture.store.createTheoryWorkspace(fixture.theory);
  const statePath = resolve(fixture.store.workspaceDirectory(workspace.id), 'state.json');
  const state = await readJson(statePath);
  state.operations[0].source = '../../content/public/theories/escape.json';
  await writeJson(statePath, state);
  await assert.rejects(fixture.store.readWorkspaceUnlocked(workspace.id), { code: 'workspace-state-invalid' });
  assert.equal((await fixture.store.listWorkspaces())[0].corrupted, true);
});

test('link simbólico não transforma a fonte pública em raiz privada', async (t) => {
  const fixture = await createFixture(t);
  await fixture.store.listWorkspaces();
  const link = resolve(fixture.store.workspaceRoot, 'linked-root');
  try {
    await symlink(fixture.contentRoot, link, 'junction');
  } catch (error) {
    if (error.code !== 'EPERM' && error.code !== 'ENOSYS') throw error;
    t.skip('O filesystem não permite criar links simbólicos para esta fixture.');
    return;
  }
  const unsafe = createWorkspaceStore({ projectRoot: fixture.root, workspaceRoot: link });
  await assert.rejects(unsafe.createTheoryWorkspace(fixture.theory), { code: 'workspace-symlink-rejected' });
});
