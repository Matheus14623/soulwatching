import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolve } from 'node:path';
import { createFixture, fixtureWorkflow, saveDraft, writeJson } from './helpers.mjs';

async function relatedFixture(t) {
  const fixture = await createFixture(t);
  const other = structuredClone(fixture.theory);
  other.id = 'outra-teoria';
  other.slug = other.id;
  other.revisionId = other.id + '-r1';
  await writeJson(resolve(fixture.contentRoot, 'theories', other.id + '.json'), other);
  const relation = {
    schemaVersion: 1, entityType: 'relation', id: 'theory--fixture--afinidade--outra',
    revisionId: 'theory--fixture--afinidade--outra-r1', order: 0,
    source: { type: 'theory', id: fixture.theory.id },
    target: { type: 'theory', id: other.id },
    type: 'afinidade-conceitual', label: 'Afinidade de fixture',
    justification: 'Relação sintética usada exclusivamente no workspace de teste.',
    referenceIds: [], reviewState: 'pending',
  };
  await writeJson(resolve(fixture.contentRoot, 'relations', relation.id + '.json'), relation);
  return { ...fixture, relation, other };
}

test('análise produz digest estável e mudança de rascunho exige digest novo', async (t) => {
  const fixture = await createFixture(t);
  let invalidations = 0;
  const workflow = fixtureWorkflow(fixture, { previewInvalidator: async () => { invalidations += 1; } });
  let workspace = await workflow.createTheoryWorkspace(fixture.theory.id);
  workspace = await saveDraft(fixture, workspace);
  const first = await workflow.analyzeWorkspace(workspace.id);
  const second = await workflow.analyzeWorkspace(workspace.id);
  assert.match(first.digest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(first.digest, second.digest);
  assert.equal(invalidations, 2);
  const current = await fixture.store.readWorkspaceUnlocked(workspace.id);
  const modified = structuredClone(current.primaryRecord);
  modified.color = '#bbaacc';
  await saveDraft(fixture, current, modified);
  const third = await workflow.analyzeWorkspace(workspace.id);
  assert.notEqual(third.digest, first.digest);
  assert.equal((await fixture.store.readWorkspaceUnlocked(workspace.id)).lastImpact.digest, third.digest);
});

test('validação devolve diagnóstico acionável sanitizado sem instalar registro', async (t) => {
  const fixture = await createFixture(t);
  const workflow = fixtureWorkflow(fixture, {
    analyzeOperations: async () => { throw new Error('schema inválido em /tmp/private/draft.json'); },
  });
  const workspace = await workflow.createTheoryWorkspace(fixture.theory.id);
  const result = await workflow.validateWorkspace(workspace.id);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /schema inválido/);
  assert(!result.errors.join(' ').includes('/tmp/private/'));
  assert.equal((await fixture.store.readWorkspaceUnlocked(workspace.id)).applied, null);
});

test('confirmação de relação exige data e consentimento e fixa revisões finais dos extremos', async (t) => {
  const fixture = await relatedFixture(t);
  const workflow = fixtureWorkflow(fixture);
  const workspace = await workflow.createTheoryWorkspace(fixture.theory.id);
  await assert.rejects(workflow.stageRelationDecision(workspace.id, fixture.relation.id, {
    version: 1, decision: 'confirm', reviewedAt: '2026-02-30',
  }), { code: 'invalid-review-date' });
  await assert.rejects(workflow.stageRelationDecision(workspace.id, fixture.relation.id, {
    version: 1, decision: 'confirm', reviewedAt: '2026-11-23',
  }), { code: 'reviewer-public-identity-required' });
  const staged = await workflow.stageRelationDecision(workspace.id, fixture.relation.id, {
    version: 1, decision: 'confirm', reviewedAt: '2026-11-23', publicIdentityAuthorized: true,
    reviewer: { partyId: 'pessoa-fixture', displayName: 'Pessoa de teste', partyType: 'person', publicLinks: [] },
  });
  assert.equal(staged.version, 2);
  const relation = staged.records.find(({ type }) => type === 'relation').record;
  assert.equal(relation.revisionId, fixture.relation.id + '-r2');
  assert.equal(relation.reviewState, 'reviewed');
  assert.deepEqual(relation.reviewedAgainst, {
    mode: 'editorial-review', sourceRevisionId: fixture.theory.id + '-r2',
    targetRevisionId: fixture.other.revisionId, reviewedAt: '2026-11-23', reviewedBy: 'pessoa-fixture',
  });
  assert.equal(staged.records.find(({ type }) => type === 'party').record.publicProfileLinkAuthorized, true);
});

test('adiamento não inventa aprovação e descontinuação remove revisor provisório sem uso', async (t) => {
  const fixture = await relatedFixture(t);
  const workflow = fixtureWorkflow(fixture);
  const workspace = await workflow.createTheoryWorkspace(fixture.theory.id);
  let staged = await workflow.stageRelationDecision(workspace.id, fixture.relation.id, { version: 1, decision: 'defer' });
  let relation = staged.records.find(({ type }) => type === 'relation').record;
  assert.equal(relation.reviewState, 'pending');
  assert.equal(relation.reviewedAgainst, undefined);
  staged = await workflow.stageRelationDecision(workspace.id, fixture.relation.id, {
    version: staged.version, decision: 'confirm', reviewedAt: '2026-11-23', publicIdentityAuthorized: true,
    reviewer: { partyId: 'pessoa-fixture', displayName: 'Pessoa de teste', partyType: 'person', publicLinks: [] },
  });
  staged = await workflow.stageRelationDecision(workspace.id, fixture.relation.id, { version: staged.version, decision: 'deprecate' });
  relation = staged.records.find(({ type }) => type === 'relation').record;
  assert.equal(relation.reviewState, 'deprecated');
  assert.equal(relation.reviewedAgainst, undefined);
  assert.equal(staged.records.some(({ type }) => type === 'party'), false);
});

test('relação alheia e ID de operação divergente são rejeitados antes da gravação', async (t) => {
  const fixture = await relatedFixture(t);
  const unrelated = { ...fixture.relation, source: { type: 'theory', id: fixture.other.id }, target: { type: 'theory', id: fixture.other.id } };
  await writeJson(resolve(fixture.contentRoot, 'relations', unrelated.id + '.json'), unrelated);
  const workflow = fixtureWorkflow(fixture);
  const workspace = await workflow.createTheoryWorkspace(fixture.theory.id);
  await assert.rejects(workflow.stageRelationDecision(workspace.id, unrelated.id, { version: 1, decision: 'defer' }), { code: 'unrelated-relation' });
  await assert.rejects(workflow.stageOperation(workspace.id, 'reference', 'fonte-a', {
    version: 1, record: { id: 'fonte-b' },
  }), { code: 'operation-id-mismatch' });
  assert.equal((await fixture.store.readWorkspaceUnlocked(workspace.id)).version, 1);
});
