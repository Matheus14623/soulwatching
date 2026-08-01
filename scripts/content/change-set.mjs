import {
  readFile,
  readdir,
  realpath,
} from 'node:fs/promises';
import {
  dirname,
  isAbsolute,
  relative,
  resolve,
} from 'node:path';
import {
  buildEditorialImpactSummary,
  containsScaffoldPlaceholder,
  validateContentOverlay,
} from './compiler.mjs';
import { updateEditorialRevisionLedger } from './editorial-revision-ledger.mjs';
import {
  buildRevisionIndex,
} from './editorial-impact.mjs';
import {
  assertUniqueEditorialOperations,
  CONTENT_DIRECTORY_BY_TYPE,
  referenceIdsFromRecord,
} from './content-contracts.mjs';
import { validateReplacement } from './revision-policy.mjs';
import {
  findPrivateData,
  validateWithSchema,
} from './schema-validator.mjs';
import {
  CONTENT_TRANSACTION_LOCK_PATH,
  EDITORIAL_REVISION_LEDGER_PATH,
  PROJECT_ROOT,
  PUBLIC_CONTENT_ROOT,
} from './paths.mjs';
import { mergePublicationRevisionLedger } from './publication-revision-ledger.mjs';
import { withFileLock } from './file-lock.mjs';

const CHANGE_SET_TYPES = Object.freeze([
  'experiment',
  'figure',
  'party',
  'publication',
  'reference',
  'relation',
  'theory',
]);
export const CHANGE_SET_DIRECTORY_BY_TYPE = Object.freeze(Object.fromEntries(
  CHANGE_SET_TYPES.map((type) => [type, CONTENT_DIRECTORY_BY_TYPE[type]]),
));

function isInside(parent, child) {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readOptionalJson(path) {
  return readJson(path).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
}

async function readDirectory(directory) {
  const root = resolve(PUBLIC_CONTENT_ROOT, directory);
  const filenames = (await readdir(root).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  }))
    .filter((filename) => filename.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right, 'en'));
  return Promise.all(filenames.map((filename) => readJson(resolve(root, filename))));
}

function replaceRecords(records, operations, type) {
  const byId = new Map(records.map((record) => [record.id, record]));
  operations
    .filter((operation) => operation.type === type)
    .forEach(({ next }) => byId.set(next.id, structuredClone(next)));
  return [...byId.values()].sort((left, right) => (
    left.id.localeCompare(right.id, 'en')
  ));
}

function orphanReferenceIds({
  constellations,
  figures,
  publications,
  references,
  relations,
  theories,
}) {
  const used = new Set([
    ...constellations,
    ...figures,
    ...publications,
    ...relations,
    ...theories,
  ].flatMap(referenceIdsFromRecord));
  return references
    .filter(({ id }) => !used.has(id))
    .map(({ id }) => id)
    .sort((left, right) => left.localeCompare(right, 'en'));
}

export async function loadChangeSetManifest(manifestSource) {
  const manifestPath = await realpath(resolve(PROJECT_ROOT, manifestSource));
  if (!isInside(PROJECT_ROOT, manifestPath)) {
    throw new Error('O manifesto editorial precisa permanecer dentro do projeto');
  }
  if (isInside(PUBLIC_CONTENT_ROOT, manifestPath)) {
    throw new Error('O manifesto editorial é privado e não pode ficar em content/public');
  }
  const manifest = await readJson(manifestPath);
  const schema = await readJson(
    resolve(PROJECT_ROOT, 'content', 'schemas', 'editorial-change-set.schema.json'),
  );
  const schemaErrors = validateWithSchema(manifest, schema, 'Manifesto editorial');
  if (schemaErrors.length) {
    throw new Error(`Manifesto editorial inválido:\n- ${schemaErrors.join('\n- ')}`);
  }

  const operations = [];
  for (const [index, operation] of manifest.operations.entries()) {
    operations.push(await loadPrivateDraftOperation({
      changeClass: operation.changeClass || null,
      force: operation.force === true,
      id: operation.id,
      label: `Manifesto operations[${index}]`,
      source: operation.source,
      sourceBase: dirname(manifestPath),
      type: operation.type,
    }));
  }
  assertUniqueEditorialOperations(operations);
  return {
    manifest,
    manifestPath,
    operations,
  };
}

export async function loadPrivateDraftOperation({
  allowedTypes = CHANGE_SET_TYPES,
  changeClass = null,
  force = false,
  id,
  label = 'Operação editorial',
  source,
  sourceBase = PROJECT_ROOT,
  type,
}) {
  const directory = CONTENT_DIRECTORY_BY_TYPE[type];
  if (!directory || !allowedTypes.includes(type)) {
    throw new Error(`${label}: tipo não permitido`);
  }
  if (
    typeof id !== 'string'
    || typeof source !== 'string'
    || !source.endsWith('.json')
  ) {
    throw new Error(`${label}: id e source JSON são obrigatórios`);
  }
  const sourcePath = await realpath(resolve(sourceBase, source));
  if (!isInside(PROJECT_ROOT, sourcePath) || isInside(PUBLIC_CONTENT_ROOT, sourcePath)) {
    throw new Error(
      `${label}: source precisa ser um rascunho dentro do projeto e fora de content/public`,
    );
  }
  const record = await readJson(sourcePath);
  const recordSchema = await readJson(resolve(
    PROJECT_ROOT,
    'content',
    'schemas',
    `${type}.schema.json`,
  ));
  const recordLabel = `Rascunho ${type}:${id}`;
  const recordErrors = [
    ...validateWithSchema(record, recordSchema, recordLabel),
    ...findPrivateData(record, recordLabel)
      .map((finding) => `${finding}: dado privado proibido`),
  ];
  if (containsScaffoldPlaceholder(record)) {
    recordErrors.push(
      `${recordLabel}: marcadores __PREENCHER__ precisam ser substituídos`,
    );
  }
  if (recordErrors.length) {
    throw new Error(`Rascunho editorial inválido:\n- ${recordErrors.join('\n- ')}`);
  }
  if (record.entityType !== type || record.id !== id) {
    throw new Error(`${label}: a fonte diverge de ${type}:${id}`);
  }
  const destinationRoot = resolve(PUBLIC_CONTENT_ROOT, directory);
  const destination = resolve(destinationRoot, `${id}.json`);
  if (!isInside(destinationRoot, destination)) {
    throw new Error(`${label}: destino canônico inválido`);
  }
  const previous = await readOptionalJson(destination);
  if (previous && !changeClass) {
    throw new Error(`${label}: replacement exige changeClass explícita`);
  }
  if (previous && force !== true) {
    throw new Error(`${label}: replacement exige force:true explícito`);
  }
  return {
    changeClass,
    destination,
    force: force === true,
    ledgerPath: type === 'publication'
      ? resolve(PUBLIC_CONTENT_ROOT, 'catalogs', 'publication-revision-ledger.json')
      : null,
    record,
    sourcePath,
    type,
  };
}

export function toEditorialChangeSet(operations, previousByDestination) {
  return {
    operations: operations.map((operation) => ({
      type: operation.type,
      previous: previousByDestination.get(operation.destination) || null,
      next: structuredClone(operation.record),
      changeClass: operation.changeClass || 'structural',
    })),
  };
}

export async function prepareEditorialChangeSet(operations) {
  const previousByDestination = new Map();
  for (const operation of operations) {
    const previous = await readOptionalJson(operation.destination);
    if (previous) validateReplacement(previous, operation.record);
    previousByDestination.set(operation.destination, previous);
  }
  return toEditorialChangeSet(operations, previousByDestination);
}

export async function analyzeManifestOperations(
  operations,
  {
    lockPath = CONTENT_TRANSACTION_LOCK_PATH,
  } = {},
) {
  return withFileLock(lockPath, async () => {
    const editorialChangeSet = await prepareEditorialChangeSet(operations);
    return {
      editorialChangeSet,
      impact: await analyzeEditorialChangeSet(editorialChangeSet),
    };
  }, {
    label: 'uma análise editorial consistente',
  });
}

export async function analyzeEditorialChangeSet(editorialChangeSet) {
  assertUniqueEditorialOperations(editorialChangeSet?.operations || []);
  const [
    ledger,
    relations,
    experiments,
    paths,
    theories,
    figures,
    publications,
    references,
    publicationRevisionLedger,
    constellations,
  ] = await Promise.all([
    readJson(EDITORIAL_REVISION_LEDGER_PATH),
    readDirectory('relations'),
    readDirectory('experiments'),
    readDirectory('paths'),
    readDirectory('theories'),
    readDirectory('figures'),
    readDirectory('publications'),
    readDirectory('references'),
    readJson(resolve(
      PUBLIC_CONTENT_ROOT,
      'catalogs',
      'publication-revision-ledger.json',
    )),
    readDirectory('constellations'),
  ]);
  const proposedLedger = updateEditorialRevisionLedger(
    ledger,
    editorialChangeSet.operations,
  );
  const revisionIndex = buildRevisionIndex(proposedLedger);
  const proposed = {
    experiments: replaceRecords(experiments, editorialChangeSet.operations, 'experiment'),
    figures: replaceRecords(figures, editorialChangeSet.operations, 'figure'),
    publications: replaceRecords(
      publications,
      editorialChangeSet.operations,
      'publication',
    ),
    references: replaceRecords(references, editorialChangeSet.operations, 'reference'),
    relations: replaceRecords(relations, editorialChangeSet.operations, 'relation'),
    theories: replaceRecords(theories, editorialChangeSet.operations, 'theory'),
  };
  const proposedPublicationLedger = mergePublicationRevisionLedger(
    publicationRevisionLedger,
    proposed.publications,
  );
  const overlayValidation = await validateContentOverlay({
    editorialChangeSet,
    editorialRevisionLedger: proposedLedger,
    publicationRevisionLedger: proposedPublicationLedger,
  });
  if (overlayValidation.errors.length) {
    throw new Error(
      `Overlay editorial inválido:\n- ${[...new Set(overlayValidation.errors)]
        .sort()
        .join('\n- ')}`,
    );
  }
  const impact = buildEditorialImpactSummary({
    canonicalExperiments: proposed.experiments,
    canonicalPaths: paths,
    editorialChangeSet,
    relations: proposed.relations,
    revisionIndex,
  });
  impact.orphanReferenceIds = orphanReferenceIds({
    constellations,
    figures: proposed.figures,
    publications: proposed.publications,
    references: proposed.references,
    relations: proposed.relations,
    theories: proposed.theories,
  });
  impact.warnings = [
    ...impact.changes.flatMap(({ entity, pendingRelations }) => (
      pendingRelations.map((relationId) => ({
        code: 'pending-relation',
        entity,
        relationId,
      }))
    )),
    ...impact.orphanReferenceIds.map((referenceId) => ({
      code: 'orphan-reference',
      referenceId,
    })),
    ...overlayValidation.warnings.map((message) => ({
      code: 'cross-integrity-warning',
      message,
    })),
  ];
  impact.requiredCommands = [
    'npm run content:check',
    'npm run verify',
    'npm run build',
  ];
  return impact;
}

export function assertEditorialImpactAllowed(impact) {
  if (impact?.allowed) return true;
  const details = (impact?.blockers || []).map((blocker) => (
    (
      `${blocker.entity?.type || 'entity'}:${blocker.entity?.id || 'unknown'} `
      + `${blocker.relationId || ''} (${blocker.code})`
    ).trim()
  ));
  throw new Error(
    `Change set bloqueado por decisão editorial pendente:\n- ${details.join('\n- ')}`,
  );
}
