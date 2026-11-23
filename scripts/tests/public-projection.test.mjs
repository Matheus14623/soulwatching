import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { compileContent } from '../content/compiler.mjs';
import { PROJECT_ROOT, PUBLIC_CONTENT_ROOT } from '../content/paths.mjs';
import {
  PUBLIC_BUILD_DIRECTORIES,
  PUBLIC_BUILD_FILES,
  PUBLIC_GENERATED_FILES,
} from '../public-manifest.mjs';
import {
  getPublicRelationJustification,
  getTheoryPublicProposal,
  getTheoryPublicSummary,
} from '../../assets/js/public-content-text.js';

async function readCatalog(directory) {
  const path = resolve(PUBLIC_CONTENT_ROOT, directory);
  const names = (await readdir(path)).filter((name) => name.endsWith('.json')).sort();
  return Promise.all(names.map(async (name) => {
    const file = resolve(path, name);
    const source = await readFile(file, 'utf8');
    return { file, source, record: JSON.parse(source) };
  }));
}

function graphIdentity(relation) {
  return {
    id: relation.id,
    source: relation.source,
    target: relation.target,
    type: relation.type,
    referenceIds: relation.referenceIds,
    reviewState: relation.reviewState,
    reviewedAgainst: relation.reviewedAgainst,
  };
}

test('o artefato público preserva o grafo sem publicar notas de trabalho das fontes', async () => {
  const [theoryFiles, relationFiles, trackFiles, experimentFiles] = await Promise.all([
    readCatalog('theories'),
    readCatalog('relations'),
    readCatalog('research-tracks'),
    readCatalog('experiments'),
  ]);
  const canonicalFiles = [...theoryFiles, ...relationFiles, ...trackFiles, ...experimentFiles];
  const canonicalTheories = theoryFiles.map(({ record }) => record);
  const canonicalRelations = relationFiles.map(({ record }) => record);
  const { outputs } = await compileContent();
  const output = (path) => {
    const source = outputs.get(resolve(PROJECT_ROOT, path));
    assert.equal(typeof source, 'string', `Saída compilada ausente: ${path}`);
    return source;
  };
  const loadModule = (name) => import(`data:text/javascript;base64,${Buffer.from(
    output(`assets/data/generated/runtime/${name}.js`),
  ).toString('base64')}`);
  const [theoryModule, figureModule, relationModule, trackModule, experimentModule, canonicalModule] = await Promise.all([
    loadModule('theories'),
    loadModule('notable-figures'),
    loadModule('relations'),
    loadModule('research-tracks'),
    loadModule('experiments'),
    loadModule('content-entities'),
  ]);

  const privateRuntimePath = 'assets/data/generated/runtime/content-entities.js';
  assert.ok(!PUBLIC_GENERATED_FILES.includes(privateRuntimePath));
  assert.ok(!PUBLIC_BUILD_FILES.includes(privateRuntimePath));
  assert.ok(!PUBLIC_BUILD_DIRECTORIES.some((directory) => privateRuntimePath.startsWith(`${directory}/`)));
  const publicPayload = PUBLIC_GENERATED_FILES.map(output).join('\n');
  const publicTheories = new Map(theoryModule.THEORIES.map((theory) => [theory.id, theory]));
  assert.equal(publicTheories.size, canonicalTheories.length);

  for (const source of canonicalTheories) {
    const theory = publicTheories.get(source.id);
    assert.ok(theory, `Linha pública ausente: ${source.id}`);
    assert.ok(source.review.assessment && source.nextSteps.length && source.revisions[0].label);
    assert.ok(!Object.hasOwn(theory, 'nextSteps'));
    assert.ok(!Object.hasOwn(theory.review, 'assessment'));
    assert.equal(theory.summary, getTheoryPublicSummary(source));
    assert.equal(theory.proposal, getTheoryPublicProposal(source));
    assert.equal(theory.centralIdea, theory.summary);
    assert.deepEqual(theory.questions, source.questions);
    assert.deepEqual(theory.referenceIds, source.referenceIds);
    assert.equal(theory.revision.version, source.revisions.at(-1).versionLabel);
    assert.equal(theory.revision.reviewedAt, source.revisions.at(-1).reviewedAt);
    for (const revision of [...theory.revisionHistory, theory.revision]) {
      assert.ok(!Object.hasOwn(revision, 'label'));
      assert.ok(!Object.hasOwn(revision, 'changeSummary'));
    }
    for (const objection of source.objections) {
      const projected = theory.objections.find(({ id }) => id === objection.id);
      assert.ok(projected);
      assert.equal(projected.title, objection.title);
      assert.equal(projected.status, objection.status);
      if (objection.status === 'aberta') assert.ok(!Object.hasOwn(projected, 'response'));
      else assert.equal(projected.response, objection.response);
    }
    for (const claim of theory.claims) {
      assert.notEqual(claim.field, 'review.assessment');
      if (source.independent === false) assert.ok(!['summary', 'proposal'].includes(claim.field));
    }
    const privateCopy = canonicalModule.CONTENT_THEORIES.find(({ id }) => id === source.id);
    assert.deepEqual(privateCopy.review, source.review);
    assert.deepEqual(privateCopy.nextSteps, source.nextSteps);
    assert.deepEqual(privateCopy.revisions, source.revisions);
    const omittedText = [
      source.review.assessment,
      ...source.revisions.flatMap(({ label, changeSummary }) => [label, changeSummary]),
      ...(source.independent === false ? [source.summary, source.proposal] : []),
    ];
    for (const text of omittedText) {
      assert.ok(!publicPayload.includes(JSON.stringify(text)), `Nota de trabalho publicada em ${source.id}: ${text}`);
    }
  }

  const publicRelations = new Map(relationModule.CONTENT_RELATIONS.map((relation) => [relation.id, relation]));
  assert.equal(publicRelations.size, canonicalRelations.length);
  let omittedRelations = 0;
  for (const source of canonicalRelations) {
    const relation = publicRelations.get(source.id);
    assert.deepEqual(graphIdentity(relation), graphIdentity(source));
    if (getPublicRelationJustification(source)) assert.equal(relation.justification, source.justification);
    else {
      omittedRelations += 1;
      assert.ok(!Object.hasOwn(relation, 'justification'));
      assert.ok(!publicPayload.includes(JSON.stringify(source.justification)));
    }
  }
  assert.ok(omittedRelations > 0, 'As fontes precisam exercitar a omissão de conselhos editoriais.');
  const figureLinks = figureModule.NOTABLE_FIGURES.flatMap(({ theoryLinks }) => theoryLinks);
  const canonicalFigureRelations = canonicalRelations.filter(({ source, target }) => (
    source.type === 'figure' && target.type === 'theory'
  ));
  assert.deepEqual(figureLinks.map(({ relationId }) => relationId).sort(), canonicalFigureRelations.map(({ id }) => id).sort());
  for (const link of figureLinks) {
    const source = canonicalFigureRelations.find(({ id }) => id === link.relationId);
    if (getPublicRelationJustification(source)) assert.equal(link.note, source.justification);
    else assert.ok(!Object.hasOwn(link, 'note'));
  }
  assert.deepEqual(
    theoryModule.THEORY_RELATIONS.map(({ id }) => id).sort(),
    canonicalRelations.filter(({ source, target }) => source.type === 'theory' && target.type === 'theory').map(({ id }) => id).sort(),
  );
  assert.equal(trackModule.RESEARCH_TRACKS.length, trackFiles.length);
  trackModule.RESEARCH_TRACKS.forEach((track) => assert.ok(!Object.hasOwn(track, 'nextStep')));
  assert.equal(experimentModule.EXPERIMENTS.length, experimentFiles.length);
  experimentModule.EXPERIMENTS.forEach((experiment) => assert.ok(!Object.hasOwn(experiment, 'technology')));

  for (const { file, source } of canonicalFiles) {
    assert.equal(await readFile(file, 'utf8'), source, `Fonte canônica alterada durante a compilação: ${file}`);
  }
});
