import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildRevisionIndex,
  calculateDirectImpact,
  classifyContentChange,
  deriveRelationReviewStatus,
  diffContentRecords,
  validatePublicationGate,
} from '../content/editorial-impact.mjs';
import {
  hashEditorialEntity,
  updateEditorialRevisionLedger,
} from '../content/editorial-revision-ledger.mjs';

function revisionEntry(entityType, entityId, classes = ['structural']) {
  return {
    entityType,
    entityId,
    revisions: classes.map((changeClass, index) => ({
      revisionId: `${entityId}-r${index + 1}`,
      changeClass,
      changedPaths: index ? ['/summary'] : [],
    })),
  };
}

function ledger(theoryClasses = ['structural']) {
  return {
    entries: [
      revisionEntry('figure', 'fixture-figure'),
      revisionEntry('theory', 'fixture-theory', theoryClasses),
    ],
  };
}

function relation(overrides = {}) {
  return {
    id: 'fixture-reviewed',
    source: { type: 'figure', id: 'fixture-figure' },
    target: { type: 'theory', id: 'fixture-theory' },
    reviewState: 'reviewed',
    reviewedAgainst: {
      sourceRevisionId: 'fixture-figure-r1',
      targetRevisionId: 'fixture-theory-r1',
    },
    ...overrides,
  };
}

test('diff preserva entradas, ordena caminhos e escapa JSON Pointer', () => {
  const before = { remove: 'old', list: ['a'], 'a/b': { '~key': 1 } };
  const after = { 'a/b': { '~key': 2 }, list: ['a', 'b'], add: 'new' };
  const snapshot = structuredClone({ before, after });
  const diff = diffContentRecords(before, after);
  assert.deepEqual(diff, [
    { operation: 'add', path: '/add', after: 'new' },
    { operation: 'replace', path: '/a~1b/~0key', before: 1, after: 2 },
    { operation: 'add', path: '/list/1', after: 'b' },
    { operation: 'remove', path: '/remove', before: 'old' },
  ]);
  assert.deepEqual({ before, after }, snapshot);
  assert.ok(Object.isFrozen(diff));
  assert.ok(Object.isFrozen(diff[0]));
  assert.deepEqual(diffContentRecords(after, { add: 'new', list: ['a', 'b'], 'a/b': { '~key': 2 } }), []);
  assert.deepEqual(
    diffContentRecords({ summary: 'a', revisions: [{ label: 'old' }] }, { summary: 'b', revisions: [{ label: 'new' }] }, { ignoredPointers: ['/revisions'] })
      .map(({ path }) => path),
    ['/summary'],
  );
  assert.throws(() => diffContentRecords({}, {}, { ignoredPointers: [null] }), TypeError);
});

test('classificação conserva risco e distingue apresentação, metadados e conteúdo', () => {
  for (const [field, expected, invalidates] of [
    ['color', 'presentation', false],
    ['keywords', 'metadata', false],
    ['proposal', 'semantic', true],
    ['referenceIds', 'structural', true],
    ['unknownField', 'structural', true],
  ]) {
    const classified = classifyContentChange(diffContentRecords({ [field]: 'before' }, { [field]: 'after' }));
    assert.equal(classified.effectiveClass, expected, field);
    assert.equal(classified.invalidatesRelations, invalidates, field);
  }
  const changes = diffContentRecords({ summary: 'before' }, { summary: 'after' });
  const weak = classifyContentChange(changes, { declaredClass: 'editorial' });
  assert.equal(weak.effectiveClass, 'semantic');
  assert.equal(weak.upgraded, true);
  assert.equal(classifyContentChange(changes, { declaredClass: 'structural' }).effectiveClass, 'structural');
  assert.equal(classifyContentChange(diffContentRecords({ revisionId: 'a-r1' }, { revisionId: 'a-r2' })).effectiveClass, 'editorial');
  assert.throws(() => classifyContentChange(changes, { declaredClass: 'automatic' }), TypeError);
});

test('índice de revisões rejeita lacunas, duplicatas e revisões de outra entidade', () => {
  const source = ledger(['structural', 'semantic']);
  const original = structuredClone(source);
  const index = buildRevisionIndex(source);
  assert.equal(index.get('theory:fixture-theory').revisions.at(-1).revisionId, 'fixture-theory-r2');
  assert.deepEqual(source, original);
  const gap = ledger();
  gap.entries[1].revisions.push({ revisionId: 'fixture-theory-r3', changeClass: 'semantic', changedPaths: ['/summary'] });
  assert.throws(() => buildRevisionIndex(gap), /complete and start at r1/);
  const duplicate = ledger();
  duplicate.entries[1].revisions.push(structuredClone(duplicate.entries[1].revisions[0]));
  assert.throws(() => buildRevisionIndex(duplicate), /Duplicate revisionId/);
  const duplicateEntity = ledger();
  duplicateEntity.entries.push(structuredClone(duplicateEntity.entries[0]));
  assert.throws(() => buildRevisionIndex(duplicateEntity), /Duplicate revision ledger entry/);
  const foreign = ledger();
  foreign.entries[1].revisions[0].revisionId = 'other-theory-r1';
  assert.throws(() => buildRevisionIndex(foreign), /does not belong/);
});

test('mudança visual posterior não apaga invalidação semântica anterior', () => {
  const index = buildRevisionIndex(ledger(['structural', 'semantic', 'presentation']));
  const stale = deriveRelationReviewStatus(relation(), index);
  assert.equal(stale.needsReview, true);
  assert.equal(stale.blocksPublication, true);
  assert.deepEqual(stale.reasons.map(({ revisionId }) => revisionId), ['fixture-theory-r2']);
  assert.equal(stale.currentRevisions.targetRevisionId, 'fixture-theory-r3');
  const reviewed = relation();
  reviewed.reviewedAgainst.targetRevisionId = 'fixture-theory-r3';
  assert.equal(deriveRelationReviewStatus(reviewed, index).needsReview, false);
  const presentationOnly = buildRevisionIndex(ledger(['structural', 'presentation', 'metadata']));
  assert.equal(deriveRelationReviewStatus(relation(), presentationOnly).needsReview, false);
});

test('relação revisada exige baseline rastreável; pending e deprecated não são promovidos', () => {
  const index = buildRevisionIndex(ledger(['structural', 'semantic']));
  const noBaseline = relation({ reviewedAgainst: undefined });
  assert.equal(deriveRelationReviewStatus(noBaseline, index).reasons[0].code, 'missing-reviewed-against');
  const missingRevision = relation();
  missingRevision.reviewedAgainst.targetRevisionId = 'fixture-theory-r9';
  assert.equal(deriveRelationReviewStatus(missingRevision, index).reasons[0].code, 'reviewed-revision-not-found');
  const incompleteIndex = buildRevisionIndex({ entries: [revisionEntry('figure', 'fixture-figure')] });
  assert.equal(deriveRelationReviewStatus(relation(), incompleteIndex).reasons[0].code, 'missing-revision-ledger-entry');
  for (const reviewState of ['pending', 'deprecated']) {
    const status = deriveRelationReviewStatus(relation({ reviewState }), index);
    assert.equal(status.needsReview, false);
    assert.equal(status.blocksPublication, false);
  }
  assert.throws(() => deriveRelationReviewStatus(relation({ reviewState: 'approved' }), index), /Unknown relation reviewState/);
});

test('impacto direto separa bloqueios, avisos e relações fora do primeiro salto', () => {
  const impact = calculateDirectImpact({
    entityType: 'theory',
    entityId: 'fixture-theory',
    changeClass: 'semantic',
    revisionIndex: buildRevisionIndex(ledger(['structural', 'semantic'])),
    relations: [
      relation(),
      relation({ id: 'fixture-pending', reviewState: 'pending' }),
      relation({ id: 'fixture-deprecated', reviewState: 'deprecated' }),
      relation({ id: 'fixture-unrelated', target: { type: 'theory', id: 'other-theory' } }),
    ],
  });
  assert.equal(impact.relations.length, 3);
  assert.deepEqual(impact.blockers.map(({ relationId }) => relationId), ['fixture-reviewed']);
  assert.equal(impact.pendingRelations.length, 1);
  assert.equal(impact.deprecatedRelations.length, 1);
  const gate = validatePublicationGate(impact);
  assert.equal(gate.allowed, false);
  assert.deepEqual(gate.warnings, [{ code: 'pending-relation', relationId: 'fixture-pending' }]);
  const current = calculateDirectImpact({ entity: impact.entity, changeClass: 'presentation', revisionIndex: buildRevisionIndex(ledger()), relations: [relation()] });
  assert.equal(validatePublicationGate(current).allowed, true);
});

test('ledger registra classe efetiva e hash sem reescrever revisões anteriores', () => {
  const record = { entityType: 'theory', id: 'fixture-theory', revisionId: 'fixture-theory-r1', summary: 'Before' };
  const empty = { schemaVersion: 1, entityType: 'editorial-revision-ledger', entries: [] };
  const first = updateEditorialRevisionLedger(empty, [{ type: 'theory', previous: null, next: record, changeClass: 'structural' }]);
  assert.deepEqual(empty.entries, []);
  const firstSnapshot = structuredClone(first);
  const next = { ...record, revisionId: 'fixture-theory-r2', summary: 'After' };
  const second = updateEditorialRevisionLedger(first, [{ type: 'theory', previous: record, next, changeClass: 'editorial' }]);
  assert.deepEqual(first, firstSnapshot);
  assert.deepEqual(second.entries[0].revisions[0], first.entries[0].revisions[0]);
  assert.equal(second.entries[0].revisions[1].changeClass, 'semantic');
  assert.equal(second.entries[0].revisions[1].contentHash, hashEditorialEntity(next));
  assert.notEqual(hashEditorialEntity(record), hashEditorialEntity(next));
  assert.equal(hashEditorialEntity(record), hashEditorialEntity({ summary: record.summary, revisionId: record.revisionId, id: record.id, entityType: record.entityType }));
  const operation = { type: 'theory', previous: record, next, changeClass: 'semantic' };
  assert.throws(() => updateEditorialRevisionLedger(first, [{ ...operation, next: { ...next, revisionId: record.revisionId } }]), /conteúdo mudou sem nova revisão/);
  assert.throws(() => updateEditorialRevisionLedger(first, [{ ...operation, next: { ...next, revisionId: 'fixture-theory-r3' } }]), /próxima revisão precisa terminar em r2/);
  assert.throws(() => updateEditorialRevisionLedger(first, [{ ...operation, previous: { ...record, summary: 'Tampered' } }]), /diverge do hash registrado/);
});
