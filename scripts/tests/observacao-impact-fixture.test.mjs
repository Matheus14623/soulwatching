import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { buildEditorialImpactSummary } from '../content/compiler.mjs';
import {
  buildRevisionIndex,
  calculateDirectImpact,
  classifyContentChange,
  diffContentRecords,
  validatePublicationGate,
} from '../content/editorial-impact.mjs';

const fixture = JSON.parse(await readFile(new URL('../content/fixtures/impact/observacao-nao-linear.json', import.meta.url), 'utf8'));

function revisionIndexFor(changeClass, changedPaths) {
  const entries = structuredClone(fixture.endpoints);
  entries.find(({ entityType, entityId }) => entityType === 'theory' && entityId === fixture.theory.r1.id)
    .revisions.push({ revisionId: fixture.theory.r2.revisionId, changeClass, changedPaths });
  return buildRevisionIndex({ entries });
}

function summaryFor(next, relations = fixture.relations, relationOperations = []) {
  const classification = classifyContentChange(diffContentRecords(fixture.theory.r1, next));
  return buildEditorialImpactSummary({
    canonicalExperiments: fixture.experiments,
    canonicalPaths: fixture.paths,
    editorialChangeSet: { operations: [
      { type: 'theory', previous: fixture.theory.r1, next, changeClass: classification.effectiveClass },
      ...relationOperations,
    ] },
    relations,
    revisionIndex: revisionIndexFor(classification.effectiveClass, classification.changedPaths),
  });
}

test('fixture de Observação mantém 13 relações diretas sem bloqueio no baseline', () => {
  const impact = calculateDirectImpact({
    entityType: 'theory', entityId: fixture.theory.r1.id,
    changeClass: 'editorial', revisionIndex: buildRevisionIndex({ entries: fixture.endpoints }),
    relations: fixture.relations,
  });
  assert.equal(impact.relations.length, fixture.expected.directRelations);
  assert.equal(impact.relations.filter(({ relation }) => relation.reviewState === 'reviewed').length, fixture.expected.reviewedRelations);
  assert.equal(impact.pendingRelations.length, fixture.expected.pendingRelations);
  assert.equal(validatePublicationGate(impact).allowed, true);
});

test('revisão estrutural da fixture bloqueia exatamente as cinco relações revisadas', () => {
  const before = JSON.stringify(fixture);
  const diff = diffContentRecords(fixture.theory.r1, fixture.theory.r2, { ignoredPointers: ['/revisionId'] });
  assert.deepEqual(diff.map(({ path }) => path), fixture.changeScenarios.semantic.changedPaths);
  const classification = classifyContentChange(diff, { declaredClass: 'semantic' });
  assert.equal(classification.effectiveClass, 'structural');
  assert.equal(classification.upgraded, true);
  const impact = calculateDirectImpact({
    entityType: 'theory', entityId: fixture.theory.r2.id,
    changeClass: classification.effectiveClass, changedPaths: classification.changedPaths,
    revisionIndex: revisionIndexFor(classification.effectiveClass, classification.changedPaths),
    relations: fixture.relations,
  });
  assert.equal(impact.blockers.length, fixture.expected.semanticBlockers);
  assert.deepEqual(impact.blockers.map(({ relationId }) => relationId), fixture.expected.semanticBlockerIds);
  assert.equal(validatePublicationGate(impact).allowed, false);
  assert.equal(JSON.stringify(fixture), before);
});

test('apresentação e histórico editorial isolados não invalidam conexões da fixture', () => {
  for (const [changeClass, changedPaths] of [
    ['presentation', ['/color']],
    ['editorial', ['/revisions/1/changeSummary']],
  ]) {
    const impact = calculateDirectImpact({
      entity: { type: 'theory', id: fixture.theory.r1.id }, changeClass, changedPaths,
      revisionIndex: revisionIndexFor(changeClass, changedPaths), relations: fixture.relations,
    });
    assert.equal(impact.blockers.length, 0, changeClass);
    assert.equal(validatePublicationGate(impact).allowed, true, changeClass);
    assert.equal(impact.pendingRelations.length, fixture.expected.pendingRelations, changeClass);
  }
});

test('impacto da fixture identifica fontes, afirmações, experiências, percursos e superfícies', () => {
  const next = structuredClone(fixture.theory.r2);
  next.review.known += ' Alteração sintética exclusiva deste teste.';
  const result = summaryFor(next);
  const change = result.changes[0];
  assert.deepEqual(change.referencesAdded, ['fixture-model-comparison']);
  assert.deepEqual(change.referencesRemoved, []);
  assert.deepEqual(change.claimsAffected, ['contexto-observacao']);
  assert.deepEqual(change.experimentsAffected, ['cone-de-luz', 'ressonancia']);
  assert.deepEqual(change.pathsAffected, ['tempo-gravidade-causalidade']);
  assert.ok(change.publicSurfaces.includes('/Rotas/rotas.html'));
  assert.ok(change.publicSurfaces.includes('/Laboratorio/experimento.html'));
  assert.ok(change.generatedFiles.includes('assets/data/generated/runtime/theories.js'));
  assert.deepEqual(change.globalConsumers, ['global-search']);
  assert.equal(result.allowed, false);
});

test('adiar relações revisadas não contorna gate; revisão explícita ou descontinuação resolvem', () => {
  for (const decision of ['pending', 'reviewed', 'deprecated']) {
    const relationOperations = [];
    const relations = fixture.relations.map((previous) => {
      if (previous.reviewState !== 'reviewed') return structuredClone(previous);
      const next = { ...structuredClone(previous), revisionId: `${previous.id}-r2`, reviewState: decision };
      if (decision === 'reviewed') {
        next.reviewedAgainst = {
          ...next.reviewedAgainst,
          mode: 'editorial-review',
          [next.source.type === 'theory' && next.source.id === fixture.theory.r2.id
            ? 'sourceRevisionId' : 'targetRevisionId']: fixture.theory.r2.revisionId,
          reviewedAt: '2026-08-01', reviewedBy: 'fixture-editor',
        };
      } else delete next.reviewedAgainst;
      relationOperations.push({ type: 'relation', previous, next, changeClass: 'structural' });
      return next;
    });
    const result = summaryFor(fixture.theory.r2, relations, relationOperations);
    assert.equal(result.allowed, decision !== 'pending', decision);
    if (decision === 'pending') {
      assert.equal(result.blockers.length, fixture.expected.reviewedRelations);
      assert.ok(result.blockers.every(({ code }) => code === 'reviewed-relation-deferred'));
    } else assert.deepEqual(result.blockers, []);
  }
});
