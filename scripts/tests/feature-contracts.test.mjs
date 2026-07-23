import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CONSTELLATIONS } from '../../assets/data/constellations.js';
import { CONTRIBUTION_POLICY, CONTRIBUTION_TYPES } from '../../assets/data/contributions.js';
import { EXPERIMENTS } from '../../assets/data/experiments.js';
import { LEARNING_PATHS } from '../../assets/data/learning-paths.js';
import {
  NOTABLE_FIGURES,
  NOTABLE_FIGURE_TRAILS,
  NOTABLE_METHOD_TIMELINE,
} from '../../assets/data/notable-figures.js';
import {
  THEORIES,
  THEORY_RELATIONS,
  THEORY_RELATION_TYPES,
  THEORY_RUBRICS,
} from '../../assets/data/theories.js';
import { calculateAstrobiologyScenario } from '../../Laboratorio/simulations/astrobiology.js';
import { simulateFiniteRecurrence } from '../../Laboratorio/simulations/finite-recurrence.js';
import { calculateLorentzEvent } from '../../Laboratorio/simulations/light-cone.js';
import { calculateEpsilonScore } from '../../Laboratorio/simulations/zero-epsilon.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function unique(values) {
  return new Set(values).size === values.length;
}

test('catálogos centrais têm IDs únicos e referências resolvíveis', async () => {
  for (const collection of [THEORIES, NOTABLE_FIGURES, CONSTELLATIONS, EXPERIMENTS, LEARNING_PATHS]) {
    assert.ok(collection.length > 0);
    assert.ok(unique(collection.map((item) => item.id)));
    assert.ok(unique(collection.map((item) => item.slug)));
  }
  assert.equal(NOTABLE_FIGURES.length, 22);
  assert.ok(NOTABLE_FIGURES.some((figure) => figure.id === 'henri-poincare'));
  assert.ok(NOTABLE_FIGURES.some((figure) => figure.id === 'john-stewart-bell'));
  assert.equal(EXPERIMENTS.length, 9);
  assert.equal(LEARNING_PATHS.length, 4);

  const collections = {
    theory: new Set(THEORIES.map((item) => item.id)),
    figure: new Set(NOTABLE_FIGURES.map((item) => item.id)),
    experiment: new Set(EXPERIMENTS.map((item) => item.id)),
  };
  for (const path of LEARNING_PATHS) {
    assert.ok(path.steps.length >= 3, path.id);
    for (const step of path.steps) assert.ok(collections[step.type]?.has(step.id), `${path.id}:${step.type}:${step.id}`);
  }

  const moduleFiles = {
    'light-cone': 'light-cone.js',
    'zero-epsilon': 'zero-epsilon.js',
    'finite-recurrence': 'finite-recurrence.js',
    astrobiology: 'astrobiology.js',
  };
  for (const experiment of EXPERIMENTS) {
    experiment.theoryIds.forEach((id) => assert.ok(collections.theory.has(id), `${experiment.id}:${id}`));
    if (experiment.moduleKey) await access(resolve(root, 'Laboratorio', 'simulations', moduleFiles[experiment.moduleKey]));
  }
});

test('relações, rubricas e histórico crítico das teorias preservam integridade', () => {
  const theoryIds = new Set(THEORIES.map((theory) => theory.id));
  const relationTypes = new Set(THEORY_RELATION_TYPES.map((type) => type.id));
  const relationPairs = [];
  for (const relation of THEORY_RELATIONS) {
    assert.ok(theoryIds.has(relation.sourceId));
    assert.ok(theoryIds.has(relation.targetId));
    assert.notEqual(relation.sourceId, relation.targetId);
    assert.ok(relationTypes.has(relation.type));
    assert.ok(relation.justification.length >= 30);
    relationPairs.push([relation.sourceId, relation.targetId].sort().join('::'));
  }
  assert.ok(unique(relationPairs));
  for (const theory of THEORIES) {
    assert.ok(THEORY_RUBRICS[theory.kind]?.length >= 3, theory.id);
    assert.ok(theory.rubric.length >= 3, theory.id);
    assert.ok(theory.revisionHistory.length >= 1, theory.id);
    assert.ok(theory.objections.length >= 1, theory.id);
    assert.ok(theory.decisionBoundary.revise.length >= 20, theory.id);
    assert.ok(theory.decisionBoundary.abandon.length >= 20, theory.id);
  }
});

test('trilhas e cronologia de Grandes Nomes apontam para perfis existentes', () => {
  const figureIds = new Set(NOTABLE_FIGURES.map((figure) => figure.id));
  assert.equal(NOTABLE_FIGURE_TRAILS.length, 4);
  assert.ok(NOTABLE_METHOD_TIMELINE.length >= 15);
  for (const trail of NOTABLE_FIGURE_TRAILS) {
    trail.steps.forEach((step) => assert.ok(figureIds.has(step.figureId), `${trail.id}:${step.figureId}`));
  }
  for (const event of NOTABLE_METHOD_TIMELINE) {
    event.figureIds.forEach((id) => assert.ok(figureIds.has(id), `${event.id}:${id}`));
  }
});

test('simuladores mantêm seus invariantes matemáticos declarados', () => {
  const lorentz = calculateLorentzEvent({ velocity: 0.6, x: 3, t: 5 });
  assert.ok(Math.abs(lorentz.interval - lorentz.primeInterval) < 1e-10);
  assert.throws(() => calculateLorentzEvent({ velocity: 1, x: 0, t: 1 }), RangeError);

  const recurrence = simulateFiniteRecurrence(12, 5, 1, 0);
  assert.ok(recurrence.sequence.length <= 12);
  assert.ok(recurrence.cycle.length >= 1);
  assert.equal(recurrence.sequence[recurrence.cycleStart], recurrence.repeatedState);

  const astrobiology = calculateAstrobiologyScenario(1e6, [1e-3, 1e-2]);
  assert.ok(Math.abs(astrobiology.combinedProbability - 1e-5) < 1e-15);
  assert.ok(Math.abs(astrobiology.expectedCount - 10) < 1e-12);
  assert.ok(astrobiology.atLeastOneProbability > 0.999);

  const lowReversibility = calculateEpsilonScore({ chance: 0.4, benefit: 50, cost: 10, downside: 30, learning: 10, reversibility: 0 });
  const highReversibility = calculateEpsilonScore({ chance: 0.4, benefit: 50, cost: 10, downside: 30, learning: 10, reversibility: 1 });
  assert.ok(highReversibility.score > lowReversibility.score);
  assert.equal(highReversibility.residualDownside, 0);

  const stoppedByCost = calculateEpsilonScore({
    chance: 0.9,
    benefit: 100,
    cost: 25,
    downside: 10,
    learning: 20,
    reversibility: 1,
    costLimit: 20,
    residualDownsideLimit: 5,
  });
  assert.equal(stoppedByCost.stopTriggered, true);
  assert.deepEqual(stoppedByCost.stopReasons, ['cost']);

  const withinStopLimits = calculateEpsilonScore({
    chance: 0.4,
    benefit: 50,
    cost: 10,
    downside: 30,
    learning: 10,
    reversibility: 0.5,
    costLimit: 10,
    residualDownsideLimit: 15,
  });
  assert.equal(withinStopLimits.stopTriggered, false);
});

test('contribuições exigem crédito e a interface pública não promete conteúdo fictício', async () => {
  assert.ok(CONTRIBUTION_TYPES.length >= 5);
  assert.match(CONTRIBUTION_POLICY.credit, /crédito|nome/i);
  assert.match(CONTRIBUTION_POLICY.independence, /endosso|autoria/i);
  const [home, map, contributions, atlas] = await Promise.all([
    readFile(resolve(root, 'index.html'), 'utf8'),
    readFile(resolve(root, 'Mapa', 'mapa.html'), 'utf8'),
    readFile(resolve(root, 'Contribuicoes', 'contribuicoes.html'), 'utf8'),
    readFile(resolve(root, 'Constelacoes', 'constelacoes.html'), 'utf8'),
  ]);
  assert.doesNotMatch(home, /Em Breve/i);
  assert.doesNotMatch(map, /constelação conceitual|explorar constelação/i);
  assert.match(contributions, /name="credit"[^>]+required/i);
  assert.match(contributions, /name="rights"[^>]+required/i);
  assert.match(atlas, /data-atlas-training-toggle/);
  assert.match(atlas, /data-atlas-training-answers/);
});
