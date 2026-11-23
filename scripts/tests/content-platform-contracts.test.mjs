import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, relative, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  compileContent,
  compilePublicationProjection,
  CONTENT_DEBT_BUDGETS,
  containsScaffoldPlaceholder,
  validateEntityAliases,
  validatePublicAssetPath,
  validatePublicationRevisionLedger,
  validatePublicationSemantics,
} from '../content/compiler.mjs';
import {
  CONTENT_CACHE_ROOT,
  GENERATED_FILES,
  PROJECT_ROOT,
} from '../content/paths.mjs';
import {
  findPrivateData,
  PRIVATE_CANARY,
  projectBySchema,
  validateWithSchema,
} from '../content/schema-validator.mjs';
import {
  LEGACY_DATA_IMPORT_BUDGET,
  validateDirectDataImportPolicy,
} from '../content/direct-import-policy.mjs';
import { acquireFileLock } from '../content/file-lock.mjs';
import {
  PUBLIC_BUILD_DIRECTORIES,
  PUBLIC_BUILD_PATHS,
  PUBLIC_GENERATED_FILES,
  validatePublicManifestPath,
} from '../public-manifest.mjs';
import { CONTENT_SNAPSHOT } from '../../assets/data/generated/runtime/content-snapshot.js';
import { RUNTIME_INTEGRITY } from '../../assets/data/generated/runtime-integrity.js';
import {
  CONSTELLATIONS as GENERATED_CONSTELLATIONS,
  CONSTELLATION_REFERENCES as GENERATED_CONSTELLATION_REFERENCES,
} from '../../assets/data/generated/runtime/constellations.js';
import {
  EXPERIMENTS as GENERATED_EXPERIMENTS,
  EXPERIMENT_KINDS,
  EXPERIMENT_STATUSES,
} from '../../assets/data/generated/runtime/experiments.js';
import {
  LEARNING_PATHS as GENERATED_LEARNING_PATHS,
} from '../../assets/data/generated/runtime/learning-paths.js';
import { NOTABLE_FIGURES } from '../../assets/data/generated/runtime/notable-figures.js';
import {
  EXTERNAL_CONTRIBUTIONS,
  INTERNAL_PUBLICATIONS,
  PUBLICATIONS,
  PUBLICATION_CREDIT_ROLES,
  PUBLICATION_TYPES,
} from '../../assets/data/generated/runtime/publications.js';
import {
  CONTENT_RELATIONS,
  CONTENT_RELATION_TYPES,
} from '../../assets/data/generated/runtime/relations.js';
import {
  RESEARCH_TRACKS as GENERATED_RESEARCH_TRACKS,
} from '../../assets/data/generated/runtime/research-tracks.js';
import {
  NOTABLE_FIGURE_REFERENCES,
  THEORY_REFERENCES,
} from '../../assets/data/generated/runtime/references.js';
import { THEORY_RELATIONS } from '../../assets/data/generated/runtime/theories.js';
import {
  CONSTELLATIONS as LEGACY_CONSTELLATIONS,
  CONSTELLATION_REFERENCES as LEGACY_CONSTELLATION_REFERENCES,
} from '../../assets/data/constellations.js';
import {
  EXPERIMENTS as LEGACY_EXPERIMENTS,
  EXPERIMENT_KINDS as LEGACY_EXPERIMENT_KINDS,
  EXPERIMENT_STATUSES as LEGACY_EXPERIMENT_STATUSES,
} from '../../assets/data/experiments.js';
import {
  LEARNING_PATHS as LEGACY_LEARNING_PATHS,
} from '../../assets/data/learning-paths.js';
import {
  RESEARCH_TRACKS as LEGACY_RESEARCH_TRACKS,
} from '../../assets/data/research-tracks.js';
import { findConstellation } from '../../assets/js/constellation-model.js';
import { ContentRepository } from '../../assets/js/content-repository.js';
import {
  HttpContentSource,
  StaticContentSource,
} from '../../assets/js/content-source.js';
import {
  findExperiment,
  getActiveExperiments,
  getExperimentKind,
} from '../../assets/js/experiment-model.js';
import { findLearningPath } from '../../assets/js/learning-paths-model.js';
import {
  getNotableFigureReferences,
  getTheoryReferences,
} from '../../assets/js/reference-model.js';
import { validateReplacement } from '../content/revision-policy.mjs';
import { installContentRecord } from '../content/install-record.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test('compilação canônica é determinística, íntegra e sincronizada com o runtime', async () => {
  const first = await compileContent({ checkRuntime: true });
  const second = await compileContent();

  assert.equal(first.fingerprint, second.fingerprint);
  assert.equal(first.fingerprint, CONTENT_SNAPSHOT.fingerprint);
  assert.equal(first.metrics.theories, CONTENT_SNAPSHOT.entities.theory.length);
  assert.equal(first.metrics.figures, CONTENT_SNAPSHOT.entities.figure.length);
  assert.equal(first.metrics.publications, CONTENT_SNAPSHOT.entities.publication.length);
  assert.equal(first.metrics.constellations, CONTENT_SNAPSHOT.entities.constellation.length);
  assert.equal(first.metrics.experiments, CONTENT_SNAPSHOT.entities.experiment.length);
  assert.equal(first.metrics.paths, CONTENT_SNAPSHOT.entities.path.length);
  assert.equal(first.metrics.researchTracks, CONTENT_SNAPSHOT.entities['research-track'].length);
  assert.equal(first.metrics.sitePages, CONTENT_SNAPSHOT.entities['site-page'].length);
  assert.equal(
    first.metrics.activeExperiments,
    CONTENT_SNAPSHOT.entities.experiment.filter(({ status }) => status === 'active').length,
  );
  assert.equal(
    first.metrics.externalContributions,
    CONTENT_SNAPSHOT.entities.publication
      .filter(({ authorshipOrigin }) => authorshipOrigin === 'external').length,
  );
  assert.equal(first.metrics.relations, CONTENT_SNAPSHOT.relations.length);
  assert.equal(first.metrics.references, CONTENT_SNAPSHOT.references.length);
  assert.equal(first.metrics.searchEntries, CONTENT_SNAPSHOT.searchIndex.length);
  assert.equal(
    first.metrics.theoryRelations,
    CONTENT_SNAPSHOT.relations.filter(({ source, target }) => (
      source.type === 'theory' && target.type === 'theory'
    )).length,
  );
  assert.equal(
    first.metrics.figureTheoryRelations,
    CONTENT_SNAPSHOT.relations.filter(({ source, target }) => (
      source.type === 'figure' && target.type === 'theory'
    )).length,
  );
  assert.deepEqual(first.report.revisionResponsibilityGaps, []);
  assert.ok(Array.isArray(first.report.relationsAwaitingEvidence));
  const expectedExperimentTheoryGaps = CONTENT_SNAPSHOT.entities.experiment
    .flatMap((experiment) => experiment.theoryIds
      .filter((theoryId) => !CONTENT_SNAPSHOT.relations.some((relation) => (
        relation.source.type === 'experiment'
        && relation.source.id === experiment.id
        && relation.target.type === 'theory'
        && relation.target.id === theoryId
        && relation.reviewState !== 'deprecated'
      )))
      .map((theoryId) => `${experiment.id}:${theoryId}`))
    .sort();
  assert.deepEqual(
    first.report.experimentTheoryLinksAwaitingMigration,
    expectedExperimentTheoryGaps,
  );
  assert.deepEqual(
    first.report.experimentTheoryRelationReviewQueue
      .map(({ source, target }) => `${source.id}:${target.id}`),
    expectedExperimentTheoryGaps,
  );
  first.report.experimentTheoryRelationReviewQueue.forEach((item) => {
    assert.equal(item.source.type, 'experiment');
    assert.equal(item.target.type, 'theory');
    assert.match(item.legacyDeclaration, /\.theoryIds$/);
    assert.ok(item.requiredEditorialDecisions.length >= 5);
  });
  assert.ok(
    first.report.experimentTheoryLinksAwaitingMigration.length
      <= CONTENT_DEBT_BUDGETS.experimentTheoryLinksAwaitingMigration,
  );
  assert.ok(
    first.report.relationsAwaitingEvidence.length
      <= CONTENT_DEBT_BUDGETS.relationsAwaitingEvidence,
  );
  assert.deepEqual(first.report.debtBudgets, CONTENT_DEBT_BUDGETS);
  assert.ok(first.report.legacyDirectDataImports.length <= LEGACY_DATA_IMPORT_BUDGET);

  const generated = [...first.outputs.keys()]
    .map((path) => relative(PROJECT_ROOT, path).replaceAll('\\', '/'))
    .sort();
  assert.deepEqual(generated, [...GENERATED_FILES].sort());
  assert.equal(RUNTIME_INTEGRITY.fingerprint, CONTENT_SNAPSHOT.fingerprint);
  const integrityFiles = Object.keys(RUNTIME_INTEGRITY.files).sort();
  assert.deepEqual(
    integrityFiles,
    GENERATED_FILES
      .filter((file) => !file.endsWith('/runtime-integrity.js'))
      .map((file) => file.replace(/^assets\/data\/generated\//, ''))
      .sort(),
  );
  for (const file of integrityFiles) {
    const source = await readFile(resolve(PROJECT_ROOT, 'assets', 'data', 'generated', file));
    assert.equal(
      createHash('sha256').update(source).digest('hex'),
      RUNTIME_INTEGRITY.files[file],
      file,
    );
  }
});

test('gerações concorrentes são serializadas e liberam o lock operacional', async () => {
  const [first, second] = await Promise.all([
    compileContent({ writeRuntime: true }),
    compileContent({ writeRuntime: true }),
  ]);
  assert.equal(first.fingerprint, second.fingerprint);
  await assert.rejects(
    stat(resolve(CONTENT_CACHE_ROOT, 'runtime-write.lock')),
    /ENOENT/,
  );
  await assert.rejects(
    stat(resolve(CONTENT_CACHE_ROOT, 'content-transaction.lock')),
    /ENOENT/,
  );
});

test('lock recupera dono encerrado sem remover uma operação viva', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'observatorio-file-lock-'));
  const lockPath = resolve(directory, 'operation.lock');
  try {
    await writeFile(lockPath, `${JSON.stringify({ pid: 2147483647 })}\n`, 'utf8');
    const releaseRecovered = await acquireFileLock(lockPath, {
      pollMs: 5,
      staleMs: 60 * 60 * 1000,
      waitMs: 100,
    });
    await releaseRecovered();

    const releaseLive = await acquireFileLock(lockPath);
    await assert.rejects(
      acquireFileLock(lockPath, {
        pollMs: 5,
        staleMs: 0,
        waitMs: 30,
      }),
      /Outra execução/,
    );
    await releaseLive();
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test('ContentRepository resolve IDs, aliases, relações direcionais e busca sem conhecer a fonte', async () => {
  const source = new StaticContentSource(() => Promise.resolve({ CONTENT_SNAPSHOT }));
  const loaded = await source.load();
  const repository = new ContentRepository(loaded);
  const canonicalTheory = loaded.entities.theory[0];
  const aliasRepository = new ContentRepository({
    ...loaded,
    entities: {
      ...loaded.entities,
      theory: [
        { ...canonicalTheory, aliases: ['alias-de-compatibilidade'] },
        ...loaded.entities.theory.slice(1),
      ],
    },
  });
  assert.strictEqual(
    aliasRepository.getBySlug('theory', 'alias-de-compatibilidade'),
    aliasRepository.getById('theory', canonicalTheory.id),
  );
  assert.equal(repository.list('theory').length, CONTENT_SNAPSHOT.entities.theory.length);
  assert.equal(repository.list('figure', { where: { area: 'fisica-cosmos' } }).length > 0, true);
  assert.strictEqual(repository.getTaxonomy('theories'), CONTENT_SNAPSHOT.taxonomies.theories);
  assert.strictEqual(
    repository.getCollection('figureTrails'),
    CONTENT_SNAPSHOT.collections.figureTrails,
  );
  assert.equal(repository.search('Einstein', { entityTypes: ['figure'] })[0]?.id, 'albert-einstein');
  assert.strictEqual(
    repository.getReference('maldacena-susskind-er-epr'),
    repository.getReference('maldacena-susskind'),
  );

  const inbound = repository.getRelations(
    { type: 'theory', id: 'instabilidade-vazio' },
    { direction: 'inbound', relationType: 'dependencia-metodologica' },
  );
  assert.equal(inbound.length, 1);
  assert.equal(inbound[0].counterpartRef.id, 'ciclagem-eterna');
  assert.equal(inbound[0].displayLabel, 'É requisito metodológico para');

  CONTENT_SNAPSHOT.relations.forEach((relation) => {
    assert.ok(
      CONTENT_SNAPSHOT.relationIndex.bySource[
        `${relation.source.type}:${relation.source.id}`
      ]?.includes(relation.id),
      relation.id,
    );
    assert.ok(
      CONTENT_SNAPSHOT.relationIndex.byTarget[
        `${relation.target.type}:${relation.target.id}`
      ]?.includes(relation.id),
      relation.id,
    );
  });

  const [referenceEntityKey, referenceIds] = Object.entries(
    CONTENT_SNAPSHOT.referenceIndex.byEntity,
  )[0];
  const [entityType, ...entityIdParts] = referenceEntityKey.split(':');
  const resolvedReferences = repository.getReferences({
    type: entityType,
    id: entityIdParts.join(':'),
  });
  assert.deepEqual(resolvedReferences.map(({ id }) => id), referenceIds);
  assert.ok(repository.getReferenceUsage(referenceIds[0]).length > 0);
});

test('catálogos migrados preservam exports legados, ordem, finders e aliases', async () => {
  assert.strictEqual(LEGACY_CONSTELLATIONS, GENERATED_CONSTELLATIONS);
  assert.strictEqual(LEGACY_CONSTELLATION_REFERENCES, GENERATED_CONSTELLATION_REFERENCES);
  assert.strictEqual(LEGACY_EXPERIMENTS, GENERATED_EXPERIMENTS);
  assert.strictEqual(LEGACY_EXPERIMENT_KINDS, EXPERIMENT_KINDS);
  assert.strictEqual(LEGACY_EXPERIMENT_STATUSES, EXPERIMENT_STATUSES);
  assert.strictEqual(LEGACY_LEARNING_PATHS, GENERATED_LEARNING_PATHS);
  assert.strictEqual(LEGACY_RESEARCH_TRACKS, GENERATED_RESEARCH_TRACKS);

  for (const collection of [
    GENERATED_CONSTELLATIONS,
    GENERATED_EXPERIMENTS,
    GENERATED_LEARNING_PATHS,
    GENERATED_RESEARCH_TRACKS,
  ]) {
    assert.ok(collection.length > 0);
    assert.ok(Object.isFrozen(collection));
    assert.equal(new Set(collection.map(({ id }) => id)).size, collection.length);
    assert.equal(new Set(collection.map(({ slug }) => slug)).size, collection.length);
  }
  for (const [entityType, collection] of Object.entries(CONTENT_SNAPSHOT.entities)) {
    assert.ok(Object.isFrozen(collection), entityType);
    assert.equal(new Set(collection.map(({ id }) => id)).size, collection.length, entityType);
    collection.forEach((entity) => {
      assert.ok(entity.id, entityType);
    });
  }

  const experiment = GENERATED_EXPERIMENTS[0];
  const constellation = GENERATED_CONSTELLATIONS[0];
  assert.strictEqual(findConstellation(constellation.id), constellation);
  assert.strictEqual(findConstellation(constellation.slug), constellation);
  assert.strictEqual(findConstellation(constellation.abbreviation), constellation);
  assert.strictEqual(findExperiment(experiment.id), experiment);
  assert.strictEqual(findExperiment(experiment.slug), experiment);
  assert.strictEqual(getExperimentKind(experiment.kind)?.id, experiment.kind);
  assert.deepEqual(
    getActiveExperiments(),
    GENERATED_EXPERIMENTS.filter(({ status }) => status === 'active'),
  );

  const path = GENERATED_LEARNING_PATHS[0];
  assert.strictEqual(findLearningPath(path.id), path);
  assert.strictEqual(findLearningPath(path.slug), path);
  const fallback = Object.freeze({ fallback: true });
  assert.strictEqual(findExperiment('id-inexistente', fallback), fallback);
  assert.strictEqual(findLearningPath('id-inexistente', fallback), fallback);
  const theoryReferenceId = Object.keys(THEORY_REFERENCES)[0];
  const figureReferenceId = Object.keys(NOTABLE_FIGURE_REFERENCES)[0];
  assert.equal(getTheoryReferences([theoryReferenceId])[0]?.id, theoryReferenceId);
  assert.equal(getNotableFigureReferences([figureReferenceId])[0]?.id, figureReferenceId);
  assert.deepEqual(getTheoryReferences(['id-inexistente']), []);
  assert.deepEqual(getNotableFigureReferences(['id-inexistente']), []);

  for (const file of [
    'assets/js/experiment-model.js',
    'assets/js/learning-paths-model.js',
  ]) {
    const source = await readFile(resolve(root, file), 'utf8');
    assert.match(source, /aliases\?\.includes\(/, file);
  }
  const constellationModel = await readFile(
    resolve(root, 'assets', 'js', 'constellation-model.js'),
    'utf8',
  );
  assert.match(constellationModel, /\(constellation\.aliases \|\| \[\]\)\.map/);
});

test('busca gerada cobre todos os catálogos e fontes sem duplicação editorial', () => {
  const searchTypeByEntity = Object.freeze({
    theory: 'theory',
    figure: 'figure',
    publication: 'publication',
    constellation: 'constellation',
    experiment: 'experiment',
    path: 'route',
    'research-track': 'research-track',
    'site-page': 'page',
  });
  const expectedKeys = [];
  Object.entries(CONTENT_SNAPSHOT.entities).forEach(([entityType, entities]) => {
    entities.forEach((entity) => {
      expectedKeys.push(`${searchTypeByEntity[entityType]}:${entity.id}`);
      if (entityType === 'site-page') {
        entity.sections
          .filter(({ label }) => (
            label.toLocaleLowerCase('pt-BR')
            !== entity.functionalLabel.toLocaleLowerCase('pt-BR')
          ))
          .forEach(({ id }) => expectedKeys.push(`section:${entity.id}:${id}`));
      }
    });
  });
  CONTENT_SNAPSHOT.references.forEach(({ id }) => expectedKeys.push(`reference:${id}`));
  const actualKeys = CONTENT_SNAPSHOT.searchIndex.map(({ type, id }) => `${type}:${id}`);

  assert.equal(new Set(actualKeys).size, actualKeys.length);
  assert.deepEqual([...actualKeys].sort(), [...expectedKeys].sort());
  CONTENT_SNAPSHOT.searchIndex
    .filter(({ type }) => type === 'publication')
    .forEach(({ slug, url }) => {
      assert.equal(url, `/Arquivo/publicacoes/${encodeURIComponent(slug)}.html`);
    });
  CONTENT_SNAPSHOT.searchIndex
    .filter(({ type }) => type === 'reference')
    .forEach(({ id, url }) => {
      const reference = CONTENT_SNAPSHOT.references.find((candidate) => candidate.id === id);
      assert.equal(url, reference.url);
    });
});

test('vocabulário reserva experimento→teoria sem fabricar relações editoriais', () => {
  const contract = CONTENT_RELATION_TYPES.find((type) => (
    type.id === 'illustrates-theory'
    && type.sourceType === 'experiment'
    && type.targetType === 'theory'
  ));
  assert.ok(contract);
  assert.equal(contract.symmetric, false);
  assert.equal(contract.requiresJustification, true);
  assert.equal(contract.requiresReference, true);
  assert.ok(contract.inverseLabel);

  CONTENT_RELATIONS
    .filter(({ source, target }) => (
      source.type === 'experiment' && target.type === 'theory'
    ))
    .forEach((relation) => {
      const experiment = GENERATED_EXPERIMENTS.find(({ id }) => id === relation.source.id);
      assert.ok(experiment?.theoryIds.includes(relation.target.id), relation.id);
    });
});

test('fonte HTTP futura respeita o mesmo snapshot, cache e contrato de transporte', async () => {
  const requests = [];
  const source = new HttpContentSource({
    endpoint: 'https://content.example.test/snapshot',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        status: 200,
        json: async () => CONTENT_SNAPSHOT,
      };
    },
  });
  const first = await source.load();
  const second = await source.load();
  assert.strictEqual(first, CONTENT_SNAPSHOT);
  assert.strictEqual(second, first);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.credentials, 'same-origin');
  assert.equal(requests[0].options.headers.Accept, 'application/json');
  assert.throws(
    () => new HttpContentSource({ endpoint: 'http://content.example.test/snapshot', fetchImpl: () => {} }),
    /HTTPS/,
  );
});

test('schemas fechados rejeitam campos privados, campos desconhecidos, datas inválidas e URLs inseguras', async () => {
  const schema = await readJson(resolve(root, 'content', 'schemas', 'publication.schema.json'));
  const fixture = await readJson(resolve(root, 'scripts', 'content', 'fixtures', 'publication.valid.json'));
  assert.deepEqual(validateWithSchema(fixture, schema, 'fixture'), []);

  const invalid = structuredClone(fixture);
  invalid.email = 'privado@example.test';
  invalid.unknownPublicField = 'não contratado';
  invalid.revisions[0].publishedAt = '2026-02-31';
  invalid.textLicense.url = 'http://example.test/licenca';
  invalid.summary = `${invalid.summary} ${PRIVATE_CANARY}`;
  const errors = validateWithSchema(invalid, schema, 'fixture');

  assert.ok(errors.some((error) => error.includes('campo privado proibido')));
  assert.ok(errors.some((error) => error.includes('campo desconhecido')));
  assert.ok(errors.some((error) => error.includes('data inválida')));
  assert.ok(errors.some((error) => error.includes('textLicense.url') && error.includes('URL HTTPS inválida')));
  assert.ok(errors.some((error) => error.includes('canary privado')));
  assert.ok(findPrivateData(invalid).length >= 2);
  assert.equal('unknownPublicField' in projectBySchema(invalid, schema), false);
  assert.equal('email' in projectBySchema(invalid, schema), false);
  assert.equal(containsScaffoldPlaceholder({ title: '__PREENCHER__' }), true);
  assert.equal(containsScaffoldPlaceholder({ title: 'Conteúdo revisado' }), false);
});

test('contrato de publicação preserva crédito, proveniência, revisão e projeções por autoria', async () => {
  const fixture = await readJson(resolve(root, 'scripts', 'content', 'fixtures', 'publication.valid.json'));
  const taxonomy = await readJson(resolve(root, 'content', 'public', 'taxonomies', 'publications.json'));
  const semanticErrors = validatePublicationSemantics(fixture, {
    referenceIds: new Set(['hogg-distance']),
    publicationIds: new Set([fixture.id]),
    path: 'fixture',
  });
  assert.deepEqual(semanticErrors, []);

  const internal = structuredClone(fixture);
  internal.id = 'fixture-internal';
  internal.slug = 'fixture-internal';
  internal.aliases = [];
  internal.authorshipOrigin = 'internal';
  const projection = compilePublicationProjection([internal, fixture], taxonomy);
  assert.deepEqual(projection.publications.map(({ id }) => id), ['fixture-internal', 'fixture-publication']);
  assert.deepEqual(projection.externalContributions.map(({ id }) => id), ['fixture-publication']);
  assert.deepEqual(projection.internalPublications.map(({ id }) => id), ['fixture-internal']);

  const withdrawn = structuredClone(fixture);
  withdrawn.availabilityState = 'withdrawn';
  assert.ok(validatePublicationSemantics(withdrawn, {
    referenceIds: new Set(['hogg-distance']),
    publicationIds: new Set([fixture.id]),
  }).some((error) => error.includes('publicNotice')));

  const emptyProjection = compilePublicationProjection([], taxonomy);
  assert.deepEqual(emptyProjection.publications, []);
  assert.deepEqual(emptyProjection.externalContributions, []);
  assert.deepEqual(emptyProjection.internalPublications, []);
  assert.equal(
    EXTERNAL_CONTRIBUTIONS.length + INTERNAL_PUBLICATIONS.length,
    PUBLICATIONS.length,
  );
  assert.ok(EXTERNAL_CONTRIBUTIONS.every(({ authorshipOrigin }) => authorshipOrigin === 'external'));
  assert.ok(INTERNAL_PUBLICATIONS.every(({ authorshipOrigin }) => authorshipOrigin === 'internal'));
  assert.equal(PUBLICATION_TYPES.length, taxonomy.types.length);
  assert.equal(PUBLICATION_CREDIT_ROLES.length, taxonomy.creditRoles.length);
  assert.ok(PUBLICATION_CREDIT_ROLES.some(({ id }) => id === 'author'));

  const withoutAuthor = structuredClone(fixture);
  withoutAuthor.credits[0].roles = ['reviewer'];
  withoutAuthor.revisions[0].creditSnapshot = structuredClone(withoutAuthor.credits);
  assert.ok(validatePublicationSemantics(withoutAuthor, {
    referenceIds: new Set(['hogg-distance']),
    publicationIds: new Set([fixture.id]),
  }).some((error) => error.includes('autoria ou coautoria')));

  const superseded = structuredClone(fixture);
  superseded.availabilityState = 'superseded';
  superseded.publicNotice = {
    type: 'superseded',
    effectiveAt: '2026-07-20',
    affectedRevisionId: 'revisao-inexistente',
    reason: 'A publicação foi substituída por uma revisão editorial posterior.',
    decisionAuthority: 'editorial-decision',
    replacementPublicationId: fixture.id,
    contest: {
      channelPath: '/Contribuicoes/contribuicoes.html',
      responseWindowDays: 30,
      instructions: 'Identifique a publicação e a revisão ao enviar uma contestação.',
    },
  };
  const supersededErrors = validatePublicationSemantics(superseded, {
    referenceIds: new Set(['hogg-distance']),
    publicationIds: new Set([fixture.id]),
    path: 'fixture',
  });
  assert.ok(supersededErrors.some((error) => error.includes('não pertence à publicação')));
  assert.ok(supersededErrors.some((error) => error.includes('própria publicação')));
});

test('aliases não podem repetir id, slug ou o mesmo valor na própria entidade', () => {
  assert.deepEqual(validateEntityAliases({
    id: 'registro',
    slug: 'registro-publico',
    aliases: ['registro-antigo'],
  }), []);
  const errors = validateEntityAliases({
    id: 'registro',
    slug: 'registro-publico',
    aliases: ['registro', 'registro-publico', 'repetido', 'repetido'],
  });
  assert.equal(errors.length, 3);
  assert.ok(errors.some((error) => error.includes('próprio id ou slug')));
  assert.ok(errors.some((error) => error.includes('alias duplicado')));
});

test('ledger de publicações rejeita revisões ausentes, divergentes, duplicadas e órfãs', async () => {
  const fixture = await readJson(resolve(root, 'scripts', 'content', 'fixtures', 'publication.valid.json'));
  const revision = fixture.revisions[0];
  const validLedger = {
    revisions: {
      [revision.revisionId]: {
        publicationId: fixture.id,
        contentHash: revision.contentHash,
        publishedAt: revision.publishedAt,
      },
    },
  };
  assert.deepEqual(validatePublicationRevisionLedger([fixture], validLedger), []);
  assert.ok(validatePublicationRevisionLedger([fixture], { revisions: {} })
    .some((error) => error.includes('revisão ausente')));

  const divergent = structuredClone(validLedger);
  divergent.revisions[revision.revisionId].contentHash = `sha256:${'0'.repeat(64)}`;
  assert.ok(validatePublicationRevisionLedger([fixture], divergent)
    .some((error) => error.includes('snapshot divergente')));

  const orphan = structuredClone(validLedger);
  orphan.revisions['fixture-orphan-r1'] = {
    publicationId: 'fixture-orphan',
    contentHash: `sha256:${'1'.repeat(64)}`,
    publishedAt: '2026-07-27',
  };
  assert.ok(validatePublicationRevisionLedger([fixture], orphan)
    .some((error) => error.includes('revisão órfã')));

  const duplicate = structuredClone(fixture);
  duplicate.id = 'fixture-duplicate';
  assert.ok(validatePublicationRevisionLedger([fixture, duplicate], validLedger)
    .some((error) => error.includes('revisionId duplicado')));
});

test('schemas públicos de partes e ledger são fechados e exigem autorização explícita', async () => {
  const [partySchema, ledgerSchema] = await Promise.all([
    readJson(resolve(root, 'content', 'schemas', 'party.schema.json')),
    readJson(resolve(root, 'content', 'schemas', 'publication-revision-ledger.schema.json')),
  ]);
  const party = {
    schemaVersion: 1,
    entityType: 'party',
    revisionId: 'instituicao-teste-r1',
    id: 'instituicao-teste',
    slug: 'instituicao-teste',
    aliases: [],
    partyType: 'organization',
    displayName: 'Instituição de teste',
    publicProfileLinkAuthorized: true,
    publicLinks: ['https://example.com/instituicao'],
  };
  assert.deepEqual(validateWithSchema(party, partySchema, 'party'), []);
  party.publicProfileLinkAuthorized = false;
  assert.ok(validateWithSchema(party, partySchema, 'party')
    .some((error) => error.includes('deve ser true')));

  assert.deepEqual(validateWithSchema({
    schemaVersion: 1,
    entityType: 'publication-revision-ledger',
    revisions: {},
  }, ledgerSchema, 'ledger'), []);
});

test('substituição editorial preserva aliases e snapshots e exige nova revisão', async () => {
  const fixture = await readJson(resolve(root, 'scripts', 'content', 'fixtures', 'publication.valid.json'));
  const changed = structuredClone(fixture);
  changed.summary = `${changed.summary} Acréscimo editorial.`;
  assert.throws(() => validateReplacement(fixture, changed), /nova revisão/);

  const revised = structuredClone(changed);
  const nextRevision = structuredClone(revised.revisions[0]);
  nextRevision.revisionId = 'fixture-publication-r2';
  nextRevision.ordinal = 2;
  nextRevision.revisionEventType = 'update';
  nextRevision.publishedAt = '2026-07-16';
  nextRevision.changeSummary = 'Segunda versão pública com acréscimo editorial rastreável.';
  revised.revisions.push(nextRevision);
  assert.equal(validateReplacement(fixture, revised), true);

  const rewrittenHistory = structuredClone(revised);
  rewrittenHistory.revisions[0].changeSummary = 'Histórico reescrito.';
  assert.throws(() => validateReplacement(fixture, rewrittenHistory), /imutável/);

  const removedAlias = structuredClone(revised);
  removedAlias.aliases = [];
  assert.throws(() => validateReplacement(fixture, removedAlias), /Aliases publicados/);
});

test('CLI delega instalação ao contrato transacional', async () => {
  const [cliSource, transactionSource] = await Promise.all([
    readFile(resolve(root, 'scripts', 'content', 'cli.mjs'), 'utf8'),
    readFile(resolve(root, 'scripts', 'content', 'install-record.mjs'), 'utf8'),
  ]);
  assert.match(cliSource, /installContentChangeSet\(\{/);
  assert.match(cliSource, /operations:\s*\[operation\]/);
  assert.match(cliSource, /validateImpact:\s*assertEditorialImpactAllowed/);
  assert.match(cliSource, /force:\s*hasFlag\('force'\)/);
  assert.match(transactionSource, /withFileLock\(/);
  assert.match(transactionSource, /validateReplacement\(previousRecord, operation\.record\)/);
});

test('instalação restaura ledger e destino quando uma escrita ou compilação falha', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'observatorio-install-'));
  const destination = resolve(directory, 'publication.json');
  const ledgerPath = resolve(directory, 'ledger.json');
  const previousLedger = `${JSON.stringify({
    schemaVersion: 1,
    entityType: 'publication-revision-ledger',
    revisions: {},
  }, null, 2)}\n`;
  const record = {
    id: 'publicacao-teste',
    revisions: [{
      revisionId: 'publicacao-teste-r1',
      contentHash: `sha256:${'2'.repeat(64)}`,
      publishedAt: '2026-07-27',
    }],
  };
  await writeFile(ledgerPath, previousLedger, 'utf8');

  try {
    let destinationFailurePending = true;
    const flakyWrite = async (path, source, encoding) => {
      if (path === destination && destinationFailurePending) {
        destinationFailurePending = false;
        throw new Error('falha simulada ao gravar destino');
      }
      await writeFile(path, source, encoding);
    };
    await assert.rejects(
      installContentRecord({
        compile: async () => {
          throw new Error('não deveria compilar');
        },
        destination,
        ledgerPath,
        lockPath: resolve(directory, 'transaction.lock'),
        record,
        type: 'publication',
        writeText: flakyWrite,
      }),
      /falha simulada/,
    );
    assert.equal(await readFile(ledgerPath, 'utf8'), previousLedger);
    await assert.rejects(stat(destination), /ENOENT/);

    await assert.rejects(
      installContentRecord({
        compile: async () => {
          throw new Error('falha simulada na compilação');
        },
        destination,
        ledgerPath,
        lockPath: resolve(directory, 'transaction.lock'),
        record,
        type: 'publication',
      }),
      /falha simulada na compilação/,
    );
    assert.equal(await readFile(ledgerPath, 'utf8'), previousLedger);
    await assert.rejects(stat(destination), /ENOENT/);

    let compileOptions = null;
    await installContentRecord({
      compile: async (options) => {
        compileOptions = options;
      },
      destination,
      ledgerPath,
      lockPath: resolve(directory, 'transaction.lock'),
      record,
      type: 'publication',
    });
    assert.deepEqual(compileOptions, {
      writeIntegrityReport: true,
      writeRuntime: true,
      editorialChangeSet: {
        operations: [{
          type: 'publication',
          previous: null,
          next: record,
          changeClass: 'structural',
        }],
      },
    });
    assert.equal(JSON.parse(await readFile(destination, 'utf8')).id, record.id);
    assert.equal(
      JSON.parse(await readFile(ledgerPath, 'utf8')).revisions['publicacao-teste-r1'].publicationId,
      record.id,
    );
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test('instalações concorrentes serializam leitura, validação, escrita e compilação', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'observatorio-install-lock-'));
  const destination = resolve(directory, 'record.json');
  const lockPath = resolve(directory, 'transaction.lock');
  const compile = async () => new Promise((resolveCompile) => setTimeout(resolveCompile, 30));
  const install = (id) => installContentRecord({
    compile,
    destination,
    lockPath,
    record: { id, revisions: [] },
    type: 'theory',
  });

  try {
    const results = await Promise.allSettled([
      install('registro-a'),
      install('registro-b'),
    ]);
    assert.equal(results.filter(({ status }) => status === 'fulfilled').length, 1);
    assert.equal(results.filter(({ status }) => status === 'rejected').length, 1);
    assert.match(
      results.find(({ status }) => status === 'rejected').reason.message,
      /já existe/,
    );
    assert.ok(['registro-a', 'registro-b'].includes(
      JSON.parse(await readFile(destination, 'utf8')).id,
    ));
    await assert.rejects(stat(lockPath), /ENOENT/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test('relações pending e evidências chegam às projeções legadas sem parecer revisão concluída', () => {
  const pendingTheoryRelations = CONTENT_RELATIONS.filter(({ source, target, reviewState }) => (
    source.type === 'theory'
    && target.type === 'theory'
    && reviewState === 'pending'
  ));
  pendingTheoryRelations.forEach((relation) => {
    const legacy = THEORY_RELATIONS.find(({ id }) => id === relation.id);
    assert.ok(legacy, relation.id);
    assert.equal(legacy.reviewState, 'pending');
    assert.deepEqual(legacy.referenceIds, relation.referenceIds);
  });

  const pendingFigureRelations = CONTENT_RELATIONS.filter(({ source, target, reviewState }) => (
    source.type === 'figure'
    && target.type === 'theory'
    && reviewState === 'pending'
  ));
  pendingFigureRelations.forEach((relation) => {
    const figure = NOTABLE_FIGURES.find(({ id }) => id === relation.source.id);
    const legacy = figure?.theoryLinks.find(({ relationId }) => relationId === relation.id);
    assert.ok(legacy, relation.id);
    assert.equal(legacy.reviewState, 'pending');
    assert.deepEqual(legacy.referenceIds, relation.referenceIds);
  });
});

test('vocabulário aceita relações documentadas de publicação sem criar arestas fictícias', () => {
  const contracts = new Map(CONTENT_RELATION_TYPES.map((type) => [
    `${type.sourceType}->${type.targetType}:${type.id}`,
    type,
  ]));
  for (const key of [
    'publication->theory:examines-theory',
    'publication->figure:discusses-figure',
    'publication->publication:responds-to-publication',
  ]) {
    const contract = contracts.get(key);
    assert.ok(contract, key);
    assert.equal(contract.symmetric, false);
    assert.equal(contract.requiresJustification, true);
    assert.equal(contract.requiresReference, true);
    assert.ok(contract.inverseLabel);
  }
  CONTENT_RELATIONS
    .filter(({ source, target }) => (
      source.type === 'publication' || target.type === 'publication'
    ))
    .forEach((relation) => {
      assert.ok(
        contracts.has(`${relation.source.type}->${relation.target.type}:${relation.type}`),
        relation.id,
      );
    });
});

test('assets declarados por publicações precisam existir e pertencer ao manifesto público', () => {
  assert.deepEqual(validatePublicAssetPath('/assets/images/og-observatorio.jpg'), []);
  assert.ok(validatePublicAssetPath('/docs/material-privado.pdf').length > 0);
  assert.ok(validatePublicAssetPath('/assets/images/inexistente.webp').some((error) => (
    error.includes('não existe')
  )));
  assert.ok(validatePublicAssetPath('/../fora-do-projeto.webp').some((error) => (
    error.includes('dentro do projeto')
  )));
});

test('manifesto e módulos públicos não ampliam a superfície para fontes ou dados privados', async () => {
  const forbiddenRoots = [
    '.content-drafts',
    '.content-reports',
    'content/private',
    'submissions',
    'private-attachments',
  ];
  for (const entry of PUBLIC_BUILD_PATHS) {
    const normalized = entry.replaceAll('\\', '/');
    assert.equal(
      forbiddenRoots.some((rootName) => (
        normalized === rootName || normalized.startsWith(`${rootName}/`)
      )),
      false,
      entry,
    );
  }
  assert.equal(PUBLIC_BUILD_DIRECTORIES.includes('assets/data'), false);
  assert.equal(PUBLIC_BUILD_DIRECTORIES.includes('assets/data/generated'), false);
  assert.equal(
    PUBLIC_GENERATED_FILES.includes('assets/data/generated/runtime/content-entities.js'),
    false,
  );
  assert.equal(
    PUBLIC_GENERATED_FILES.includes('assets/data/generated/runtime-integrity.js'),
    false,
  );
  assert.ok(
    PUBLIC_GENERATED_FILES.includes('assets/data/generated/runtime/content-snapshot.js'),
  );

  for (const file of GENERATED_FILES) {
    const source = await readFile(resolve(root, file), 'utf8');
    assert.doesNotMatch(source, new RegExp(PRIVATE_CANARY));
  }
  for (const adapter of [
    'assets/data/theories.js',
    'assets/data/notable-figures.js',
    'assets/data/theory-references.js',
    'assets/data/notable-figure-references.js',
    'assets/data/constellations.js',
    'assets/data/experiments.js',
    'assets/data/learning-paths.js',
    'assets/data/research-tracks.js',
  ]) {
    const source = await readFile(resolve(root, adapter), 'utf8');
    assert.doesNotMatch(source, /\bCONTENT_(?:THEORIES|FIGURES|REFERENCES|RELATIONS)\b/);
  }
  for (const wrapper of [
    'assets/js/theory-model.js',
    'assets/js/notable-figures-model.js',
    'assets/js/learning-paths-model.js',
  ]) {
    const source = await readFile(resolve(root, wrapper), 'utf8');
    assert.match(source, /aliases\?\.includes\((?:id|step\.id)\)/);
  }
  const learningPathModel = await readFile(
    resolve(root, 'assets', 'js', 'learning-paths-model.js'),
    'utf8',
  );
  assert.match(
    learningPathModel,
    /type === 'publication'.*\/Arquivo\/publicacoes\/.*entity\.slug.*\.html/,
  );
  assert.match(
    learningPathModel,
    /import \{ PUBLICATIONS \} from '\.\.\/data\/generated\/runtime\/publications\.js'/,
  );
});

test('manifesto público rejeita traversal, caminhos absolutos e separadores ambíguos', () => {
  assert.equal(validatePublicManifestPath('assets/js/main.js'), 'assets/js/main.js');
  for (const path of [
    '../private.txt',
    'assets/../private.txt',
    '/etc/passwd',
    'C:/segredo.txt',
    '\\\\servidor\\compartilhamento',
    'assets\\js\\main.js',
    'assets//js/main.js',
    'assets/js/main.js?privado=1',
  ]) {
    assert.throws(() => validatePublicManifestPath(path), /Caminho inseguro/);
  }
});

test('índice mínimo e módulos legados permanecem dentro de budgets explícitos', async () => {
  const budgets = new Map([
    ['assets/data/generated/search-index.js', 96 * 1024],
    ['assets/data/generated/runtime/content-snapshot.js', 12 * 1024],
    ['assets/data/generated/runtime/content-entities.js', 192 * 1024],
    ['assets/data/generated/runtime/constellations.js', 48 * 1024],
    ['assets/data/generated/runtime/experiments.js', 12 * 1024],
    ['assets/data/generated/runtime/learning-paths.js', 8 * 1024],
    ['assets/data/generated/runtime/theories.js', 72 * 1024],
    ['assets/data/generated/runtime/notable-figures.js', 80 * 1024],
    ['assets/data/generated/runtime/references.js', 64 * 1024],
    ['assets/data/generated/runtime/publications.js', 32 * 1024],
    ['assets/data/generated/runtime/research-tracks.js', 4 * 1024],
    ['assets/data/generated/runtime/site-pages.js', 24 * 1024],
  ]);
  for (const [file, budget] of budgets) {
    const metadata = await stat(resolve(root, file));
    assert.ok(metadata.size <= budget, `${file}: ${metadata.size} > ${budget}`);
  }
});

test('novos imports diretos de catálogos legados são bloqueados por allowlist decrescente', async () => {
  const result = await validateDirectDataImportPolicy();
  assert.deepEqual(result.errors, []);
  assert.equal(result.actual.length, LEGACY_DATA_IMPORT_BUDGET);
});
