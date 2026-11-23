import { createHash } from 'node:crypto';
import {
  getPublicRelationJustification,
  getTheoryPublicProposal,
  getTheoryPublicSummary,
} from '../../assets/js/public-content-text.js';
import { statSync } from 'node:fs';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
} from 'node:path';
import {
  PUBLIC_BUILD_DIRECTORIES,
  PUBLIC_BUILD_FILES,
  PUBLIC_ROUTES,
} from '../public-manifest.mjs';
import {
  GENERATED_ROOT,
  GENERATED_RUNTIME_ROOT,
  GENERATED_FILES,
  INTEGRITY_REPORT_PATH,
  CONTENT_CACHE_ROOT,
  CONTENT_TRANSACTION_LOCK_PATH,
  RUNTIME_LOCK_PATH,
  LAST_VALID_RUNTIME_PATH,
  PROJECT_ROOT,
  PUBLIC_CONTENT_ROOT,
  REPORT_ROOT,
  RUNTIME_INTEGRITY_FILE,
  SCHEMA_ROOT,
  RUNTIME_SWAP_JOURNAL_PATH,
} from './paths.mjs';
import { acquireFileLock } from './file-lock.mjs';
import {
  findPrivateData,
  PRIVATE_CANARY,
  projectBySchema,
  validateWithSchema,
} from './schema-validator.mjs';
import { validateDirectDataImportPolicy } from './direct-import-policy.mjs';
import { migrateContentRecord } from './migrations.mjs';
import {
  assertUniqueEditorialOperations,
  CONTENT_DIRECTORY_BY_TYPE,
  EDITORIAL_REVISION_ENTITY_TYPES,
  referenceIdsFromRecord,
} from './content-contracts.mjs';
import {
  buildRevisionIndex,
  calculateDirectImpact,
  classifyContentChange,
  deriveRelationReviewStatus,
  diffContentRecords,
  validatePublicationGate,
} from './editorial-impact.mjs';
import { validateLegacyRelationBaselines } from './legacy-relation-baselines.mjs';
import { generatedImpactForChange } from './content-dependencies.mjs';
import {
  hashCanonicalJson,
  prefixedCanonicalHash,
  stableCanonicalStringify,
} from './canonical-hash.mjs';
import { hashEditorialEntity } from './editorial-revision-ledger.mjs';

const SCHEMA_FILES = Object.freeze({
  theory: 'theory.schema.json',
  figure: 'figure.schema.json',
  relation: 'relation.schema.json',
  reference: 'reference.schema.json',
  'figure-trail': 'figure-trail.schema.json',
  'timeline-event': 'timeline-event.schema.json',
  'theory-taxonomy': 'theory-taxonomy.schema.json',
  'figure-taxonomy': 'figure-taxonomy.schema.json',
  'relation-type-taxonomy': 'relation-type-taxonomy.schema.json',
  'publication-catalog': 'publication-catalog.schema.json',
  'publication-revision-ledger': 'publication-revision-ledger.schema.json',
  'editorial-revision-ledger': 'editorial-revision-ledger.schema.json',
  'publication-taxonomy': 'publication-taxonomy.schema.json',
  'experiment-taxonomy': 'experiment-taxonomy.schema.json',
  party: 'party.schema.json',
  publication: 'publication.schema.json',
  constellation: 'constellation.schema.json',
  experiment: 'experiment.schema.json',
  path: 'path.schema.json',
  'research-track': 'research-track.schema.json',
  'site-page': 'site-page.schema.json',
});

export const CONTENT_DEBT_BUDGETS = Object.freeze({
  experimentTheoryLinksAwaitingMigration: 12,
  relationsAwaitingEvidence: 31,
  legacyRelationReviewBaselines: 32,
});
async function acquireRuntimeLock() {
  return acquireFileLock(RUNTIME_LOCK_PATH, {
    label: 'a geração do runtime de conteúdo',
  });
}

async function acquireContentTransactionLock() {
  return acquireFileLock(CONTENT_TRANSACTION_LOCK_PATH, {
    label: 'a leitura transacional da fonte pública',
  });
}

const SOURCE_DIRECTORIES = CONTENT_DIRECTORY_BY_TYPE;

const FIXED_SOURCES = Object.freeze([
  ['taxonomies/theories.json', 'theory-taxonomy'],
  ['taxonomies/notable-figures.json', 'figure-taxonomy'],
  ['taxonomies/relation-types.json', 'relation-type-taxonomy'],
  ['catalogs/publications.json', 'publication-catalog'],
  ['catalogs/publication-revision-ledger.json', 'publication-revision-ledger'],
  ['catalogs/editorial-revision-ledger.json', 'editorial-revision-ledger'],
  ['taxonomies/publications.json', 'publication-taxonomy'],
  ['taxonomies/experiments.json', 'experiment-taxonomy'],
]);

export function stableStringify(value, spacing = 0) {
  return stableCanonicalStringify(value, spacing);
}

function editorialEntityKey(type, id) {
  return `${type}:${id}`;
}

function revisionOrdinal(revisionId) {
  const ordinal = revisionId?.match(/-r([1-9][0-9]*)$/)?.[1];
  return ordinal ? Number(ordinal) : null;
}

export function createEditorialRevisionIndex(ledger) {
  return new Map((ledger?.entries || []).map((entry) => [
    editorialEntityKey(entry.entityType, entry.entityId),
    entry,
  ]));
}

export function validateEditorialRevisionLedger(entities, ledger) {
  const errors = [];
  const entityByKey = new Map(
    entities.map((entity) => [editorialEntityKey(entity.entityType, entity.id), entity]),
  );
  const entryByKey = new Map();
  const actualOrder = [];

  for (const entry of ledger?.entries || []) {
    const key = editorialEntityKey(entry.entityType, entry.entityId);
    actualOrder.push(key);
    if (entryByKey.has(key)) {
      errors.push(`Ledger editorial: entrada duplicada "${key}"`);
      continue;
    }
    entryByKey.set(key, entry);
    const entity = entityByKey.get(key);
    if (!entity) {
      errors.push(`Ledger editorial: entidade órfã "${key}"`);
    }

    const seenRevisions = new Set();
    entry.revisions.forEach((revision, index) => {
      if (seenRevisions.has(revision.revisionId)) {
        errors.push(`Ledger editorial ${key}: revisão duplicada "${revision.revisionId}"`);
      }
      seenRevisions.add(revision.revisionId);
      const expectedOrdinal = index + 1;
      if (
        revisionOrdinal(revision.revisionId) !== expectedOrdinal
        || !revision.revisionId.startsWith(`${entry.entityId}-r`)
      ) {
        errors.push(
          `Ledger editorial ${key}: a revisão ${revision.revisionId} deve ser a sequência r${expectedOrdinal} da entidade`,
        );
      }
      revision.changedPaths.forEach((path) => {
        if (!path.startsWith('/')) {
          errors.push(
            `Ledger editorial ${key}.${revision.revisionId}: changedPaths deve usar JSON Pointer`,
          );
        }
      });
    });

    const currentLedgerRevision = entry.revisions[entry.revisions.length - 1];
    if (entity && currentLedgerRevision?.revisionId !== entity.revisionId) {
      errors.push(
        `Ledger editorial ${key}: revisão atual ${currentLedgerRevision?.revisionId || 'ausente'} diverge de ${entity.revisionId}`,
      );
    }
    if (entity && currentLedgerRevision?.contentHash !== hashEditorialEntity(entity)) {
      errors.push(
        `Ledger editorial ${key}: conteúdo atual diverge do hash de ${entity.revisionId}`,
      );
    }
  }

  for (const [key] of entityByKey) {
    if (!entryByKey.has(key)) errors.push(`Ledger editorial: baseline ausente para "${key}"`);
  }
  const expectedOrder = [...actualOrder].sort((left, right) => left.localeCompare(right, 'en'));
  if (stableStringify(actualOrder) !== stableStringify(expectedOrder)) {
    errors.push('Ledger editorial: entries precisa permanecer em ordem determinística por tipo e ID');
  }
  return errors;
}

export function validateRelationReviewTraceability(relations, ledger) {
  const errors = [];
  const revisionIndex = createEditorialRevisionIndex(ledger);

  for (const relation of relations) {
    const label = `Relação ${relation.id}`;
    const baseline = relation.reviewedAgainst;
    if (relation.reviewState === 'reviewed' && !baseline) {
      errors.push(`${label}: reviewState reviewed exige reviewedAgainst`);
      continue;
    }
    if (!baseline) continue;

    const sourceEntry = revisionIndex.get(
      editorialEntityKey(relation.source.type, relation.source.id),
    );
    const targetEntry = revisionIndex.get(
      editorialEntityKey(relation.target.type, relation.target.id),
    );
    if (!sourceEntry?.revisions.some(({ revisionId }) => (
      revisionId === baseline.sourceRevisionId
    ))) {
      errors.push(
        `${label}.reviewedAgainst.sourceRevisionId: revisão não pertence à entidade de origem`,
      );
    }
    if (!targetEntry?.revisions.some(({ revisionId }) => (
      revisionId === baseline.targetRevisionId
    ))) {
      errors.push(
        `${label}.reviewedAgainst.targetRevisionId: revisão não pertence à entidade de destino`,
      );
    }

    if (baseline.mode === 'editorial-review') {
      if (!baseline.reviewedAt || !baseline.reviewedBy) {
        errors.push(
          `${label}.reviewedAgainst: revisão editorial exige reviewedAt e reviewedBy públicos`,
        );
      }
    } else if (baseline.mode === 'legacy-baseline') {
      if (baseline.reviewedAt || baseline.reviewedBy) {
        errors.push(
          `${label}.reviewedAgainst: baseline técnico legado não pode inventar data ou responsável`,
        );
      }
    }
  }
  return errors;
}

export function relationSemanticKey(relation, relationType) {
  const endpoints = relationType?.symmetric
    ? [
      `${relation.source.type}:${relation.source.id}`,
      `${relation.target.type}:${relation.target.id}`,
    ].sort().join('|')
    : `${relation.source.type}:${relation.source.id}|${relation.target.type}:${relation.target.id}`;
  return `${endpoints}|${relation.type}`;
}

export function validateRelationSemantics(
  relation,
  {
    entityIds = new Map(),
    experimentsById = new Map(),
    partiesById = new Map(),
    relationTypes = new Map(),
    path = `relation:${relation?.id || 'unknown'}`,
  } = {},
) {
  const errors = [];
  const sourceIds = entityIds.get(relation.source.type);
  const targetIds = entityIds.get(relation.target.type);
  if (!sourceIds?.has(relation.source.id)) {
    errors.push(
      `${path}.source: entidade inexistente ${relation.source.type}:${relation.source.id}`,
    );
  }
  if (!targetIds?.has(relation.target.id)) {
    errors.push(
      `${path}.target: entidade inexistente ${relation.target.type}:${relation.target.id}`,
    );
  }
  if (
    relation.source.type === relation.target.type
    && relation.source.id === relation.target.id
  ) {
    errors.push(`${path}: autorrelação não permitida`);
  }
  const relationType = relationTypes.get(
    `${relation.source.type}:${relation.target.type}:${relation.type}`,
  );
  if (!relationType) {
    errors.push(`${path}.type: combinação/tipo não permitido "${relation.type}"`);
  }
  if (
    relation.source.type === 'experiment'
    && relation.target.type === 'theory'
    && relation.reviewState !== 'deprecated'
  ) {
    const experiment = experimentsById.get(relation.source.id);
    if (experiment && !experiment.theoryIds.includes(relation.target.id)) {
      errors.push(
        `${path}: relação experimento→teoria precisa constar em theoryIds até concluir a migração legada`,
      );
    }
  }
  if (relationType?.requiresJustification && relation.justification.length < 30) {
    errors.push(`${path}.justification: justificativa obrigatória`);
  }
  if (
    relationType?.requiresReference
    && relation.reviewState === 'reviewed'
    && !relation.referenceIds.length
  ) {
    errors.push(
      `${path}.referenceIds: o tipo "${relation.type}" exige evidência antes de receber reviewState reviewed`,
    );
  }
  if (relation.reviewedAgainst?.mode === 'editorial-review') {
    const reviewer = partiesById.get(relation.reviewedAgainst.reviewedBy);
    if (!reviewer?.publicProfileLinkAuthorized) {
      errors.push(
        `${path}.reviewedAgainst.reviewedBy: use o ID de uma parte com identidade pública autorizada`,
      );
    }
  }
  return errors;
}

export function containsScaffoldPlaceholder(value) {
  return stableStringify(value).includes('__PREENCHER__');
}

function contentHash(value) {
  return hashCanonicalJson(value);
}

export function hashPublicSnapshot(snapshot) {
  return prefixedCanonicalHash(snapshot);
}

export function hashPublicationRevision(revision) {
  return prefixedCanonicalHash({
    publicSnapshot: revision.publicSnapshot,
    creditSnapshot: revision.creditSnapshot,
  });
}

export function validatePublicAssetPath(publicPath) {
  const errors = [];
  if (typeof publicPath !== 'string' || !publicPath.startsWith('/')) {
    return ['o caminho público precisa começar com /'];
  }
  if (publicPath.includes('\\') || /[?#]/.test(publicPath)) {
    return ['o caminho público não aceita barra invertida, query ou fragmento'];
  }

  let decoded;
  try {
    decoded = decodeURIComponent(publicPath);
  } catch {
    return ['o caminho público contém codificação inválida'];
  }
  const absolutePath = resolve(PROJECT_ROOT, decoded.replace(/^\/+/, ''));
  const projectRelative = relative(PROJECT_ROOT, absolutePath);
  if (
    !projectRelative
    || projectRelative.startsWith('..')
    || isAbsolute(projectRelative)
  ) {
    return ['o caminho público precisa permanecer dentro do projeto'];
  }

  const normalized = projectRelative.replaceAll('\\', '/');
  const covered = PUBLIC_BUILD_FILES.some((file) => file === normalized)
    || PUBLIC_BUILD_DIRECTORIES.some((directory) => (
      normalized.startsWith(`${directory}/`)
    ));
  if (!covered) errors.push('o asset não está coberto pelo manifesto público');

  let metadata = null;
  try {
    metadata = statSync(absolutePath);
  } catch {
    errors.push('o arquivo público não existe');
  }
  if (metadata && !metadata.isFile()) errors.push('o caminho público não aponta para um arquivo');
  if (/\.(?:bak|cjs|docx|json|md|pdf|py|txt)$/i.test(normalized)) {
    errors.push('o formato do asset não é permitido no artefato público');
  }
  return errors;
}

export function validatePublicationSemantics(
  publication,
  {
    referenceIds = new Set(),
    publicationIds = new Set(),
    path = `publication:${publication?.id || 'unknown'}`,
  } = {},
) {
  const errors = [];
  if (!publication || typeof publication !== 'object') return [`${path}: publicação inválida`];

  const authorCredits = (publication.credits || []).filter(({ roles }) => (
    roles?.includes('author') || roles?.includes('coauthor')
  ));
  if (!authorCredits.length) {
    errors.push(`${path}.credits: ao menos uma autoria ou coautoria pública é obrigatória`);
  }

  const unavailableStates = new Set(['superseded', 'withdrawn', 'retracted', 'archived']);
  if (unavailableStates.has(publication.availabilityState) && !publication.publicNotice) {
    errors.push(`${path}.publicNotice: obrigatório para o estado ${publication.availabilityState}`);
  }
  if (
    publication.publicNotice
    && publication.publicNotice.type !== publication.availabilityState
  ) {
    errors.push(`${path}.publicNotice.type: deve corresponder ao estado de disponibilidade`);
  }
  if (publication.publicNotice) {
    const contestPath = publication.publicNotice.contest?.channelPath || '';
    if (
      !contestPath.startsWith('/')
      || contestPath.startsWith('//')
      || contestPath.includes('\\')
    ) {
      errors.push(`${path}.publicNotice.contest.channelPath: caminho local público inválido`);
    }
  }
  if (publication.availabilityState === 'superseded') {
    const replacementId = publication.publicNotice?.replacementPublicationId;
    if (!replacementId) {
      errors.push(`${path}.publicNotice.replacementPublicationId: obrigatório em superseded`);
    } else if (replacementId === publication.id) {
      errors.push(`${path}.publicNotice.replacementPublicationId: não pode apontar para a própria publicação`);
    } else if (!publicationIds.has(replacementId)) {
      errors.push(`${path}.publicNotice.replacementPublicationId: publicação sucessora inexistente`);
    }
  }

  const conflict = publication.publicDeclarations?.conflictOfInterest;
  if (conflict?.state === 'declared' && !conflict.statement) {
    errors.push(`${path}.publicDeclarations.conflictOfInterest.statement: declaração pública obrigatória`);
  }

  const blockIds = publication.body?.map(({ id }) => id) || [];
  if (new Set(blockIds).size !== blockIds.length) errors.push(`${path}.body: IDs de bloco duplicados`);
  const blockIdSet = new Set(blockIds);
  const claimIds = publication.claimLinks?.map(({ claimId }) => claimId) || [];
  if (new Set(claimIds).size !== claimIds.length) errors.push(`${path}.claimLinks: claimIds duplicados`);
  for (const claim of publication.claimLinks || []) {
    if (!blockIdSet.has(claim.contentBlockId)) {
      errors.push(`${path}.claimLinks.${claim.claimId}: bloco inexistente "${claim.contentBlockId}"`);
    }
    for (const source of claim.sources) {
      if (!referenceIds.has(source.referenceId)) {
        errors.push(`${path}.claimLinks.${claim.claimId}: referência inexistente "${source.referenceId}"`);
      }
    }
  }

  const assetIds = publication.assetRights?.map(({ assetId }) => assetId) || [];
  if (new Set(assetIds).size !== assetIds.length) errors.push(`${path}.assetRights: assetIds duplicados`);

  const revisions = publication.revisions || [];
  const revisionIds = new Set(revisions.map(({ revisionId }) => revisionId));
  if (
    publication.publicNotice?.affectedRevisionId
    && !revisionIds.has(publication.publicNotice.affectedRevisionId)
  ) {
    errors.push(`${path}.publicNotice.affectedRevisionId: revisão não pertence à publicação`);
  }
  if (revisions[0]?.revisionEventType !== 'initial-publication') {
    errors.push(`${path}.revisions[0].revisionEventType: a primeira revisão deve ser initial-publication`);
  }
  revisions.forEach((revision, index) => {
    if (revision.ordinal !== index + 1) {
      errors.push(`${path}.revisions[${index}].ordinal: sequência deve começar em 1`);
    }
    if (revision.contentHash !== hashPublicationRevision(revision)) {
      errors.push(
        `${path}.revisions[${index}].contentHash: hash não corresponde aos snapshots público e de créditos`,
      );
    }
  });
  const currentRevision = revisions[revisions.length - 1];
  if (currentRevision?.revisionId !== publication.revisionId) {
    errors.push(`${path}.revisionId: deve apontar para a última revisão`);
  }
  if (currentRevision) {
    const expectedSnapshot = {
      title: publication.title,
      summary: publication.summary,
      body: publication.body,
      referenceIds: publication.referenceIds,
      claimIds,
      textLicenseIdentifier: publication.textLicense.identifier,
      assetIds,
    };
    if (stableStringify(currentRevision.publicSnapshot) !== stableStringify(expectedSnapshot)) {
      errors.push(`${path}.revisions: o snapshot atual diverge da publicação`);
    }
    if (stableStringify(currentRevision.creditSnapshot) !== stableStringify(publication.credits)) {
      errors.push(`${path}.revisions: o snapshot de crédito atual diverge dos créditos`);
    }
  }

  return errors;
}

export function validatePublicationCredits(
  publication,
  {
    creditRoleIds = null,
    partiesById = new Map(),
    path = `publication:${publication?.id || 'unknown'}`,
  } = {},
) {
  const errors = [];
  for (const [creditPath, credit] of [
    ...(publication?.credits || []).map((item) => ['credits', item]),
    ...(publication?.revisions || []).flatMap((revision) => (
      (revision.creditSnapshot || []).map((item) => (
        [`revisions.${revision.revisionId}.creditSnapshot`, item]
      ))
    )),
  ]) {
    if (creditRoleIds) {
      credit.roles.forEach((role) => {
        if (!creditRoleIds.has(role)) {
          errors.push(`${path}.${creditPath}: papel inexistente "${role}"`);
        }
      });
    }
    const partyFields = [
      credit.partyId,
      credit.partyType,
      credit.publicProfileLinkAuthorized,
    ].filter((value) => value !== undefined);
    if (partyFields.length && partyFields.length !== 3) {
      errors.push(
        `${path}.${creditPath}: partyId, partyType e publicProfileLinkAuthorized devem ser declarados juntos`,
      );
    }
    if (credit.partyId && credit.publicProfileLinkAuthorized !== true) {
      errors.push(
        `${path}.${creditPath}: vínculo com perfil público exige autorização explícita`,
      );
    }
    if (!credit.partyId) continue;
    const party = partiesById.get(credit.partyId);
    if (!party) {
      errors.push(`${path}.${creditPath}: partyId inexistente "${credit.partyId}"`);
      continue;
    }
    if (party.partyType !== credit.partyType) {
      errors.push(`${path}.${creditPath}: partyType diverge de ${credit.partyId}`);
    }
    const unauthorizedLinks = credit.authorizedLinks.filter((url) => (
      !party.publicLinks.includes(url)
    ));
    if (unauthorizedLinks.length) {
      errors.push(
        `${path}.${creditPath}: link não autorizado pelo perfil ${credit.partyId}`,
      );
    }
  }
  return errors;
}

export function validatePublicationRevisionLedger(
  publications,
  ledger,
  path = 'content/public/catalogs/publication-revision-ledger.json',
) {
  const errors = [];
  const ledgerRevisions = ledger?.revisions || {};
  const declaredRevisions = new Map();
  for (const publication of publications || []) {
    for (const revision of publication.revisions || []) {
      const existing = declaredRevisions.get(revision.revisionId);
      if (existing) {
        errors.push(
          `${path}: revisionId duplicado ${revision.revisionId} em ${existing} e ${publication.id}`,
        );
        continue;
      }
      declaredRevisions.set(revision.revisionId, publication.id);
      const ledgerEntry = ledgerRevisions[revision.revisionId];
      if (!ledgerEntry) {
        errors.push(`${path}: revisão ausente ${revision.revisionId}`);
      } else if (
        ledgerEntry.publicationId !== publication.id
        || ledgerEntry.contentHash !== revision.contentHash
        || ledgerEntry.publishedAt !== revision.publishedAt
      ) {
        errors.push(`${path}: snapshot divergente ${revision.revisionId}`);
      }
    }
  }
  for (const revisionId of Object.keys(ledgerRevisions)) {
    if (!declaredRevisions.has(revisionId)) {
      errors.push(`${path}: revisão órfã ${revisionId}`);
    }
  }
  return errors;
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function referenceCreatorLabel(reference) {
  return reference.authors
    || reference.creators?.map(({ name }) => name).join(', ')
    || reference.institution
    || reference.publisher
    || '';
}

function publicLabel(path) {
  return relative(PROJECT_ROOT, path).replaceAll('\\', '/');
}

async function readJson(path) {
  let source;
  try {
    source = await readFile(path, 'utf8');
  } catch (error) {
    throw new Error(`${publicLabel(path)}: não foi possível ler (${error.message})`);
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`${publicLabel(path)}: JSON inválido (${error.message})`);
  }
}

async function readSchema(entityType) {
  const filename = SCHEMA_FILES[entityType];
  if (!filename) throw new Error(`Schema não registrado para ${entityType}`);
  return readJson(resolve(SCHEMA_ROOT, filename));
}

async function readDirectoryRecords(directoryName, expectedType) {
  const directory = resolve(PUBLIC_CONTENT_ROOT, directoryName);
  const info = await stat(directory).catch(() => null);
  if (!info) return [];
  if (!info.isDirectory()) throw new Error(`${publicLabel(directory)} deve ser um diretório`);

  const filenames = (await readdir(directory))
    .filter((filename) => filename.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right, 'en'));
  const records = [];

  for (const filename of filenames) {
    const path = resolve(directory, filename);
    const value = migrateContentRecord(await readJson(path), expectedType, {
      label: publicLabel(path),
    });
    records.push({ expectedType, filename, path, value });
  }
  return records;
}

async function loadRawSources() {
  const nested = await Promise.all(
    Object.entries(SOURCE_DIRECTORIES).map(([type, directory]) => (
      readDirectoryRecords(directory, type)
    )),
  );
  const fixed = [];
  for (const [relativePath, expectedType] of FIXED_SOURCES) {
    const path = resolve(PUBLIC_CONTENT_ROOT, relativePath);
    fixed.push({
      expectedType,
      filename: basename(path),
      path,
      value: migrateContentRecord(await readJson(path), expectedType, {
        label: publicLabel(path),
      }),
    });
  }
  return [...nested.flat(), ...fixed];
}

async function validateAndProject(rawSources) {
  const schemas = new Map();
  const records = [];
  const errors = [];

  for (const source of rawSources) {
    if (!schemas.has(source.expectedType)) {
      schemas.set(source.expectedType, await readSchema(source.expectedType));
    }
    const schema = schemas.get(source.expectedType);
    const label = publicLabel(source.path);
    const privateFindings = findPrivateData(source.value, label);
    errors.push(...privateFindings.map((finding) => `${finding}: dado privado proibido`));
    errors.push(...validateWithSchema(source.value, schema, label));
    if (containsScaffoldPlaceholder(source.value)) {
      errors.push(`${label}: marcadores __PREENCHER__ precisam ser substituídos antes da publicação`);
    }

    if (source.value.entityType !== source.expectedType) {
      errors.push(`${label}.entityType: esperado ${source.expectedType}`);
    }

    const projected = projectBySchema(source.value, schema);
    records.push({ ...source, value: projected });
  }

  return { errors, records, schemas };
}

function groupByType(records) {
  const grouped = new Map();
  for (const record of records) {
    const list = grouped.get(record.expectedType) || [];
    list.push(record);
    grouped.set(record.expectedType, list);
  }
  return grouped;
}

export async function validateContentOverlay({
  editorialChangeSet,
  editorialRevisionLedger,
  publicationRevisionLedger,
}) {
  const operations = editorialChangeSet?.operations || [];
  assertUniqueEditorialOperations(operations);
  const operationByKey = new Map(
    operations.map((operation) => [
      `${operation.type}:${operation.next.id}`,
      operation,
    ]),
  );
  const consumed = new Set();
  const rawSources = await loadRawSources();
  const overlaidSources = rawSources.map((source) => {
    if (
      source.expectedType === 'editorial-revision-ledger'
      && editorialRevisionLedger
    ) {
      return { ...source, value: structuredClone(editorialRevisionLedger) };
    }
    if (
      source.expectedType === 'publication-revision-ledger'
      && publicationRevisionLedger
    ) {
      return { ...source, value: structuredClone(publicationRevisionLedger) };
    }
    const key = `${source.expectedType}:${source.value.id || ''}`;
    const operation = operationByKey.get(key);
    if (!operation) return source;
    consumed.add(key);
    return {
      ...source,
      value: migrateContentRecord(
        structuredClone(operation.next),
        operation.type,
        { label: publicLabel(source.path) },
      ),
    };
  });
  for (const operation of operations) {
    const key = `${operation.type}:${operation.next.id}`;
    if (consumed.has(key)) continue;
    const directory = SOURCE_DIRECTORIES[operation.type];
    if (!directory) {
      throw new Error(`Overlay editorial não aceita o tipo ${operation.type}`);
    }
    const path = resolve(
      PUBLIC_CONTENT_ROOT,
      directory,
      `${operation.next.id}.json`,
    );
    overlaidSources.push({
      expectedType: operation.type,
      filename: basename(path),
      path,
      value: migrateContentRecord(
        structuredClone(operation.next),
        operation.type,
        { label: publicLabel(path) },
      ),
    });
  }
  const validated = await validateAndProject(overlaidSources);
  const cross = validateCrossIntegrity(groupByType(validated.records));
  return {
    errors: [...validated.errors, ...cross.errors],
    warnings: [...cross.warnings],
  };
}

function addDuplicateErrors(records, field, errors, label) {
  const seen = new Map();
  for (const record of records) {
    const value = record.value[field];
    if (value === undefined) continue;
    if (seen.has(value)) {
      errors.push(`${label} duplicado "${value}": ${publicLabel(seen.get(value).path)} e ${publicLabel(record.path)}`);
    } else {
      seen.set(value, record);
    }
  }
}

export function validateEntityAliases(entity, label = 'Entidade') {
  const errors = [];
  const aliases = entity?.aliases || [];
  const canonicalNames = new Set([entity?.id, entity?.slug].filter(Boolean));
  const seen = new Set();
  for (const alias of aliases) {
    if (canonicalNames.has(alias)) {
      errors.push(`${label}: alias "${alias}" repete o próprio id ou slug`);
    }
    if (seen.has(alias)) {
      errors.push(`${label}: alias duplicado "${alias}"`);
    }
    seen.add(alias);
  }
  return errors;
}

function buildAliasIndex(records, errors, label) {
  const aliases = new Map();
  for (const record of records) {
    errors.push(...validateEntityAliases(record.value, `${label} ${record.value.id}`));
    const names = [record.value.id, record.value.slug, ...(record.value.aliases || [])].filter(Boolean);
    for (const name of names) {
      const existing = aliases.get(name);
      if (existing && existing.value.id !== record.value.id) {
        errors.push(
          `${label} ambíguo "${name}": ${existing.value.id} e ${record.value.id}`,
        );
      } else {
        aliases.set(name, record);
      }
    }
  }
  return aliases;
}

function buildReferenceIndex(referenceRecords, errors) {
  const index = new Map();
  for (const record of referenceRecords) {
    errors.push(...validateEntityAliases(record.value, `Alias de referência ${record.value.id}`));
    for (const id of [record.value.id, ...record.value.aliases]) {
      const existing = index.get(id);
      if (existing && existing.value.id !== record.value.id) {
        errors.push(`Alias de referência ambíguo "${id}"`);
      } else {
        index.set(id, record);
      }
    }
  }
  return index;
}

function resolveReferenceIds(ids, referenceIndex, path, errors, usage) {
  for (const id of ids || []) {
    const reference = referenceIndex.get(id);
    if (!reference) {
      errors.push(`${path}: referência inexistente "${id}"`);
      continue;
    }
    const usedBy = usage.get(reference.value.id) || new Set();
    usedBy.add(path);
    usage.set(reference.value.id, usedBy);
  }
}

function validateCrossIntegrity(grouped) {
  const errors = [];
  const warnings = [];
  const theories = grouped.get('theory') || [];
  const figures = grouped.get('figure') || [];
  const relations = grouped.get('relation') || [];
  const references = grouped.get('reference') || [];
  const trails = grouped.get('figure-trail') || [];
  const events = grouped.get('timeline-event') || [];
  const parties = grouped.get('party') || [];
  const publications = grouped.get('publication') || [];
  const constellations = grouped.get('constellation') || [];
  const experiments = grouped.get('experiment') || [];
  const paths = grouped.get('path') || [];
  const researchTracks = grouped.get('research-track') || [];
  const sitePages = grouped.get('site-page') || [];
  const theoryTaxonomy = grouped.get('theory-taxonomy')?.[0]?.value;
  const figureTaxonomy = grouped.get('figure-taxonomy')?.[0]?.value;
  const relationTaxonomy = grouped.get('relation-type-taxonomy')?.[0]?.value;
  const publicationTaxonomy = grouped.get('publication-taxonomy')?.[0]?.value;
  const experimentTaxonomy = grouped.get('experiment-taxonomy')?.[0]?.value;
  const publicationCatalog = grouped.get('publication-catalog')?.[0]?.value;
  const publicationRevisionLedger = grouped.get('publication-revision-ledger')?.[0]?.value;
  const editorialRevisionLedger = grouped.get('editorial-revision-ledger')?.[0]?.value;

  for (const [records, label] of [
    [theories, 'Teoria'],
    [figures, 'Perfil'],
    [relations, 'Relação'],
    [references, 'Referência'],
    [trails, 'Trilha'],
    [events, 'Evento'],
    [parties, 'Pessoa ou organização'],
    [publications, 'Publicação'],
    [constellations, 'Constelação'],
    [experiments, 'Experimento'],
    [paths, 'Rota'],
    [researchTracks, 'Linha do radar'],
    [sitePages, 'Página institucional'],
  ]) {
    addDuplicateErrors(records, 'id', errors, `${label}: ID`);
  }
  addDuplicateErrors(theories, 'code', errors, 'Teoria: código');
  addDuplicateErrors(researchTracks, 'code', errors, 'Linha do radar: código');
  for (const [records, label] of [
    [constellations, 'Constelação'],
    [experiments, 'Experimento'],
    [paths, 'Rota'],
    [researchTracks, 'Linha do radar'],
    [sitePages, 'Página institucional'],
  ]) {
    addDuplicateErrors(records, 'order', errors, `${label}: ordem`);
  }

  for (const record of [
    ...theories,
    ...figures,
    ...relations,
    ...references,
    ...trails,
    ...events,
    ...parties,
    ...publications,
    ...constellations,
    ...experiments,
    ...paths,
    ...researchTracks,
    ...sitePages,
  ]) {
    if (`${record.value.id}.json` !== record.filename) {
      errors.push(`${publicLabel(record.path)}: o nome do arquivo deve ser ${record.value.id}.json`);
    }
  }

  const theoryAliases = buildAliasIndex(theories, errors, 'Slug/alias de teoria');
  const figureAliases = buildAliasIndex(figures, errors, 'Slug/alias de perfil');
  buildAliasIndex(parties, errors, 'Slug/alias de pessoa ou organização');
  buildAliasIndex(publications, errors, 'Slug/alias de publicação');
  buildAliasIndex(constellations, errors, 'Slug/alias de constelação');
  buildAliasIndex(experiments, errors, 'Slug/alias de experimento');
  buildAliasIndex(paths, errors, 'Slug/alias de rota');
  buildAliasIndex(researchTracks, errors, 'Slug/alias de linha do radar');
  const referenceIndex = buildReferenceIndex(references, errors);
  const referenceUsage = new Map();
  const theoryIds = new Set(theories.map(({ value }) => value.id));
  const figureIds = new Set(figures.map(({ value }) => value.id));
  const partiesById = new Map(parties.map(({ value }) => [value.id, value]));
  const publicationIds = new Set(publications.map(({ value }) => value.id));
  const constellationIds = new Set(constellations.map(({ value }) => value.id));
  const experimentIds = new Set(experiments.map(({ value }) => value.id));
  const experimentsById = new Map(experiments.map(({ value }) => [value.id, value]));
  const entityIds = new Map([
    ['theory', theoryIds],
    ['figure', figureIds],
    ['publication', publicationIds],
    ['experiment', experimentIds],
  ]);
  const editorialRevisionEntities = [
    ...experiments,
    ...figures,
    ...publications,
    ...theories,
  ].map(({ value }) => value);
  errors.push(
    ...validateEditorialRevisionLedger(
      editorialRevisionEntities,
      editorialRevisionLedger,
    ),
    ...validateRelationReviewTraceability(
      relations.map(({ value }) => value),
      editorialRevisionLedger,
    ),
    ...validateLegacyRelationBaselines(
      relations.map(({ value }) => value),
    ),
  );

  const filterIds = new Set(theoryTaxonomy?.filters.map(({ id }) => id) || []);
  const theoryTypeIds = new Set(theoryTaxonomy?.types.map(({ id }) => id) || []);
  const reviewStateIds = new Set(theoryTaxonomy?.reviewStates.map(({ id }) => id) || []);
  const objectionStateIds = new Set(theoryTaxonomy?.objectionStates.map(({ id }) => id) || []);
  const areaIds = new Set(figureTaxonomy?.areas.map(({ id }) => id) || []);
  const timelineCategoryIds = new Set(figureTaxonomy?.timelineCategories.map(({ id }) => id) || []);
  const relationTypes = new Map(
    (relationTaxonomy?.types || []).map((type) => [`${type.sourceType}:${type.targetType}:${type.id}`, type]),
  );
  const publicationTypeIds = new Set(publicationTaxonomy?.types.map(({ id }) => id) || []);
  const creditRoleIds = new Set(publicationTaxonomy?.creditRoles.map(({ id }) => id) || []);
  const experimentKindIds = new Set(experimentTaxonomy?.kinds.map(({ id }) => id) || []);
  const experimentStatusIds = new Set(experimentTaxonomy?.statuses.map(({ id }) => id) || []);
  const experimentVisualIds = new Set(experimentTaxonomy?.visuals || []);
  const publicRoutePaths = new Set([
    '/',
    '/index.html',
    '/teorias.html',
    ...PUBLIC_ROUTES.flatMap((route) => [route.url, route.cleanUrl]),
  ]);
  const sitePageMatchPaths = new Map();
  for (const { value: sitePage, path } of sitePages) {
    const label = publicLabel(path);
    const sectionIds = new Set();
    for (const section of sitePage.sections) {
      if (sectionIds.has(section.id)) {
        errors.push(`${label}.sections: seção duplicada "${section.id}"`);
      }
      sectionIds.add(section.id);
    }
    for (const matchPath of sitePage.matchPaths) {
      if (!publicRoutePaths.has(matchPath)) {
        errors.push(`${label}.matchPaths: rota pública inexistente "${matchPath}"`);
      }
      const existing = sitePageMatchPaths.get(matchPath);
      if (existing && existing !== sitePage.id) {
        errors.push(
          `${label}.matchPaths: rota "${matchPath}" também pertence a "${existing}"`,
        );
      }
      sitePageMatchPaths.set(matchPath, sitePage.id);
    }
  }
  for (const route of PUBLIC_ROUTES) {
    for (const path of [route.url, route.cleanUrl]) {
      if (!sitePageMatchPaths.has(path)) {
        errors.push(`Metadados institucionais ausentes para a rota pública "${path}"`);
      }
    }
  }
  for (const [definitions, label] of [
    [experimentTaxonomy?.kinds || [], 'tipos de experimento'],
    [experimentTaxonomy?.statuses || [], 'estados de experimento'],
  ]) {
    const ids = definitions.map(({ id }) => id);
    const labels = definitions.map(({ label: itemLabel }) => normalizeText(itemLabel));
    if (new Set(ids).size !== ids.length) {
      errors.push(`Taxonomia de experimentos: IDs duplicados em ${label}`);
    }
    if (new Set(labels).size !== labels.length) {
      errors.push(`Taxonomia de experimentos: rótulos duplicados em ${label}`);
    }
  }
  if (new Set(experimentTaxonomy?.visuals || []).size !== (experimentTaxonomy?.visuals || []).length) {
    errors.push('Taxonomia de experimentos: visuais duplicados');
  }

  for (const { value: theory, path } of theories) {
    const label = publicLabel(path);
    if (!theoryTypeIds.has(theory.kind)) errors.push(`${label}.kind: tipo inexistente "${theory.kind}"`);
    if (!reviewStateIds.has(theory.reviewState)) errors.push(`${label}.reviewState: estado inexistente "${theory.reviewState}"`);
    if (!filterIds.has(theory.category)) errors.push(`${label}.category: filtro inexistente "${theory.category}"`);
    theory.filters.forEach((filter) => {
      if (!filterIds.has(filter)) errors.push(`${label}.filters: filtro inexistente "${filter}"`);
    });
    theory.objections.forEach((objection) => {
      if (!objectionStateIds.has(objection.status)) {
        errors.push(`${label}.objections.${objection.id}: estado inexistente "${objection.status}"`);
      }
    });
    const currentRevision = theory.revisions[theory.revisions.length - 1];
    if (currentRevision?.revisionId !== theory.revisionId) {
      errors.push(`${label}.revisionId: deve apontar para a última revisão`);
    }
    theory.revisions.forEach((revision, index) => {
      if (revision.ordinal !== index + 1) {
        errors.push(`${label}.revisions[${index}].ordinal: sequência deve começar em 1`);
      }
    });
    resolveReferenceIds(theory.referenceIds, referenceIndex, `${label}.referenceIds`, errors, referenceUsage);
    theory.claimLinks.forEach((claim) => {
      resolveReferenceIds(
        claim.referenceIds,
        referenceIndex,
        `${label}.claimLinks.${claim.id}`,
        errors,
        referenceUsage,
      );
    });
  }

  const featuredFigureRanks = new Set();
  for (const { value: figure, path } of figures) {
    const label = publicLabel(path);
    if (!areaIds.has(figure.area)) errors.push(`${label}.area: área inexistente "${figure.area}"`);
    resolveReferenceIds(figure.referenceIds, referenceIndex, `${label}.referenceIds`, errors, referenceUsage);
    const portraitSource = figure.portrait?.src || '';
    const portraitPath = portraitSource.split('?', 1)[0];
    if (
      portraitSource.includes('\\')
      || portraitSource.includes('#')
      || !/^assets\/images\/grandes-nomes\/[a-z0-9][a-z0-9._-]*\.webp(?:\?v=[a-z0-9._-]+)?$/i
        .test(portraitSource)
    ) {
      errors.push(`${label}.portrait.src: retrato precisa ser um WebP local em assets/images/grandes-nomes`);
    } else {
      const portrait = statSync(resolve(PROJECT_ROOT, portraitPath), {
        throwIfNoEntry: false,
      });
      if (!portrait?.isFile()) errors.push(`${label}.portrait.src: arquivo de retrato inexistente`);
    }
    try {
      const sourceUrl = new URL(figure.portrait?.sourceUrl);
      if (!['https:', 'http:'].includes(sourceUrl.protocol)) throw new Error();
    } catch {
      errors.push(`${label}.portrait.sourceUrl: URL HTTP(S) inválida`);
    }
    if (/^CC/i.test(figure.portrait?.license || '')) {
      try {
        const licenseUrl = new URL(figure.portrait?.licenseUrl);
        if (licenseUrl.protocol !== 'https:') throw new Error();
      } catch {
        errors.push(`${label}.portrait.licenseUrl: licença Creative Commons exige URL HTTPS`);
      }
    }
    if (figure.featuredRank !== null) {
      if (featuredFigureRanks.has(figure.featuredRank)) {
        errors.push(`${label}.featuredRank: posição de destaque duplicada`);
      }
      featuredFigureRanks.add(figure.featuredRank);
    }
  }
  if ([...featuredFigureRanks].sort((left, right) => left - right).join(',') !== '1,2,3') {
    errors.push('Catálogo de perfis: destaques devem ocupar exatamente as posições 1, 2 e 3');
  }

  const featuredConstellationRanks = new Set();
  const constellationAbbreviations = new Set();
  for (const { value: constellation, path } of constellations) {
    const label = publicLabel(path);
    if (constellationAbbreviations.has(constellation.abbreviation)) {
      errors.push(`${label}.abbreviation: abreviação duplicada`);
    }
    constellationAbbreviations.add(constellation.abbreviation);
    resolveReferenceIds(
      constellation.sourceIds,
      referenceIndex,
      `${label}.sourceIds`,
      errors,
      referenceUsage,
    );
    if (constellation.featuredRank !== null) {
      if (featuredConstellationRanks.has(constellation.featuredRank)) {
        errors.push(`${label}.featuredRank: posição de destaque duplicada`);
      }
      featuredConstellationRanks.add(constellation.featuredRank);
    }
    constellation.relatedConstellationIds.forEach((id) => {
      if (id === constellation.id) {
        errors.push(`${label}.relatedConstellationIds: autorreferência não permitida`);
      } else if (!constellationIds.has(id)) {
        errors.push(`${label}.relatedConstellationIds: constelação inexistente "${id}"`);
      }
    });
    const starIds = new Set();
    constellation.stars.forEach((star) => {
      if (starIds.has(star.id)) errors.push(`${label}.stars: estrela duplicada "${star.id}"`);
      starIds.add(star.id);
    });
    const lineKeys = new Set();
    const connectedStarIds = new Set();
    constellation.lines.forEach(([sourceId, targetId]) => {
      if (!starIds.has(sourceId) || !starIds.has(targetId)) {
        errors.push(`${label}.lines: estrela inexistente em "${sourceId}:${targetId}"`);
      }
      if (sourceId === targetId) errors.push(`${label}.lines: ligação circular em "${sourceId}"`);
      const key = [sourceId, targetId].sort().join(':');
      if (lineKeys.has(key)) errors.push(`${label}.lines: ligação duplicada "${key}"`);
      lineKeys.add(key);
      connectedStarIds.add(sourceId);
      connectedStarIds.add(targetId);
    });
    constellation.stars.forEach((star) => {
      if (!connectedStarIds.has(star.id) && !['landmark', 'context'].includes(star.role)) {
        errors.push(
          `${label}.stars.${star.id}: estrela isolada precisa ser landmark ou context`,
        );
      }
    });
  }
  const constellationById = new Map(
    constellations.map(({ value }) => [value.id, value]),
  );
  for (const { value: constellation, path } of constellations) {
    for (const relatedId of constellation.relatedConstellationIds) {
      const counterpart = constellationById.get(relatedId);
      if (counterpart && !counterpart.relatedConstellationIds.includes(constellation.id)) {
        errors.push(
          `${publicLabel(path)}.relatedConstellationIds: relação com "${relatedId}" precisa ser recíproca`,
        );
      }
    }
  }
  if (constellations.length < 12) {
    errors.push('Catálogo de constelações: são necessários ao menos 12 campos de reconhecimento');
  }
  if ([...featuredConstellationRanks].sort((left, right) => left - right).join(',') !== '1,2,3') {
    errors.push('Catálogo de constelações: destaques devem ocupar exatamente as posições 1, 2 e 3');
  }

  for (const { value: experiment, path } of experiments) {
    const label = publicLabel(path);
    if (!experimentKindIds.has(experiment.kind)) {
      errors.push(`${label}.kind: tipo inexistente "${experiment.kind}"`);
    }
    if (!experimentStatusIds.has(experiment.status)) {
      errors.push(`${label}.status: estado inexistente "${experiment.status}"`);
    }
    if (!experimentVisualIds.has(experiment.visual)) {
      errors.push(`${label}.visual: visual inexistente "${experiment.visual}"`);
    }
    let experimentUrl = null;
    try {
      experimentUrl = new URL(experiment.href, 'https://observatorio.local');
    } catch {
      errors.push(`${label}.href: caminho local inválido`);
    }
    if (
      !experimentUrl
      || experimentUrl.origin !== 'https://observatorio.local'
      || experiment.href.startsWith('//')
      || experiment.href.includes('\\')
      || !publicRoutePaths.has(experimentUrl.pathname)
    ) {
      errors.push(`${label}.href: destino fora das rotas públicas permitidas`);
    }
    if (experimentUrl && !/^(?:|#[a-z0-9-]+)$/i.test(experimentUrl.hash)) {
      errors.push(`${label}.href: fragmento inválido`);
    }
    if (experimentUrl) {
      const allowedQueryKeys = experimentUrl.pathname === '/Laboratorio/experimento.html'
        ? new Set(['experimento'])
        : experimentUrl.pathname === '/Constelacoes/constelacoes.html'
          ? new Set(['constelacao', 'modo'])
          : new Set();
      const unknownQueryKeys = [...experimentUrl.searchParams.keys()]
        .filter((key) => !allowedQueryKeys.has(key));
      if (unknownQueryKeys.length) {
        errors.push(`${label}.href: parâmetros não permitidos (${unknownQueryKeys.join(', ')})`);
      }
    }
    experiment.theoryIds.forEach((id) => {
      if (!theoryIds.has(id)) errors.push(`${label}.theoryIds: teoria inexistente "${id}"`);
    });
    const isSimulator = experiment.kind === 'simulador';
    if (isSimulator && !experiment.moduleKey) {
      errors.push(`${label}.moduleKey: simulador exige módulo permitido`);
    }
    if (!isSimulator && experiment.moduleKey !== null) {
      errors.push(`${label}.moduleKey: somente simuladores podem carregar módulo`);
    }
    if (isSimulator) {
      if (
        experimentUrl?.pathname !== '/Laboratorio/experimento.html'
        || experimentUrl.searchParams.get('experimento') !== experiment.slug
      ) {
        errors.push(`${label}.href: simulador precisa apontar para seu slug no executor compartilhado`);
      }
    }
  }

  const pathTargets = new Map([
    ['theory', theoryIds],
    ['figure', figureIds],
    ['experiment', experimentIds],
    ['publication', publicationIds],
  ]);
  for (const { value: learningPath, path } of paths) {
    learningPath.steps.forEach((step, index) => {
      if (!pathTargets.get(step.type)?.has(step.id)) {
        errors.push(
          `${publicLabel(path)}.steps[${index}]: entidade inexistente ${step.type}:${step.id}`,
        );
      }
    });
  }

  const relationKeys = new Set();
  for (const { value: relation, path } of relations) {
    const label = publicLabel(path);
    const relationType = relationTypes.get(
      `${relation.source.type}:${relation.target.type}:${relation.type}`,
    );
    errors.push(...validateRelationSemantics(relation, {
      entityIds,
      experimentsById,
      partiesById,
      relationTypes,
      path: label,
    }));
    const relationKey = relationSemanticKey(relation, relationType);
    if (relationKeys.has(relationKey)) errors.push(`${label}: relação duplicada`);
    relationKeys.add(relationKey);
    resolveReferenceIds(
      relation.referenceIds,
      referenceIndex,
      `${label}.referenceIds`,
      errors,
      referenceUsage,
    );
  }

  for (const { value: theory, path } of theories) {
    const derivations = relations.filter(({ value: relation }) => (
      relation.type === 'derivacao'
      && relation.target.type === 'theory'
      && relation.target.id === theory.id
    ));
    if (!theory.independent && derivations.length !== 1) {
      errors.push(`${publicLabel(path)}: linha derivada exige exatamente uma relação de derivação recebida`);
    }
  }

  for (const { value: trail, path } of trails) {
    trail.steps.forEach((step) => {
      if (!figureAliases.has(step.figureId)) {
        errors.push(`${publicLabel(path)}.steps: perfil inexistente "${step.figureId}"`);
      }
    });
  }

  for (const { value: event, path } of events) {
    if (!timelineCategoryIds.has(event.category)) {
      errors.push(`${publicLabel(path)}.category: categoria inexistente "${event.category}"`);
    }
    event.figureIds.forEach((id) => {
      if (!figureIds.has(id)) errors.push(`${publicLabel(path)}.figureIds: perfil inexistente "${id}"`);
    });
  }

  for (const { value: publication, path } of publications) {
    const label = publicLabel(path);
    if (!publicationTypeIds.has(publication.publicationType)) {
      errors.push(`${label}.publicationType: formato inexistente "${publication.publicationType}"`);
    }
    errors.push(...validatePublicationCredits(publication, {
      creditRoleIds,
      partiesById,
      path: label,
    }));
    publication.assetRights.forEach((asset, index) => {
      errors.push(...validatePublicAssetPath(asset.publicPath).map((error) => (
        `${label}.assetRights[${index}].publicPath: ${error}`
      )));
    });
    errors.push(...validatePublicationSemantics(publication, {
      referenceIds: new Set(referenceIndex.keys()),
      publicationIds,
      path: publicLabel(path),
    }));
    resolveReferenceIds(
      publication.referenceIds,
      referenceIndex,
      `${publicLabel(path)}.referenceIds`,
      errors,
      referenceUsage,
    );
  }

  if (!publicationCatalog || publicationCatalog.items.length !== 0) {
    errors.push('content/public/catalogs/publications.json: o catálogo-âncora deve permanecer vazio; registros reais usam um arquivo por publicação');
  }

  errors.push(...validatePublicationRevisionLedger(
    publications.map(({ value }) => value),
    publicationRevisionLedger,
  ));

  for (const { value: reference, path } of references) {
    if (!referenceUsage.has(reference.id)) {
      warnings.push(`${publicLabel(path)}: referência órfã`);
    }
  }

  const urls = new Map();
  const dois = new Map();
  const bibliographicKeys = new Map();
  for (const { value: reference, path } of references) {
    const normalized = reference.url.replace(/\/+$/, '').toLowerCase();
    const previous = urls.get(normalized);
    if (previous) {
      errors.push(
        `${publicLabel(path)}: provável duplicata de referência por URL (${publicLabel(previous.path)})`,
      );
    } else {
      urls.set(normalized, { value: reference, path });
    }

    if (reference.doi) {
      const normalizedDoi = reference.doi.toLowerCase();
      const previousDoi = dois.get(normalizedDoi);
      if (previousDoi) {
        errors.push(
          `${publicLabel(path)}: DOI duplicado (${publicLabel(previousDoi.path)})`,
        );
      } else {
        dois.set(normalizedDoi, { value: reference, path });
      }
      if (/^https:\/\/doi\.org\//i.test(reference.url)) {
        try {
          const urlDoi = decodeURIComponent(new URL(reference.url).pathname.slice(1)).toLowerCase();
          if (urlDoi !== normalizedDoi) {
            errors.push(`${publicLabel(path)}.doi: diverge da URL DOI declarada`);
          }
        } catch {
          errors.push(`${publicLabel(path)}.url: DOI percent-encoded inválido`);
        }
      }
    }

    const creatorLabel = reference.creators?.map(({ name }) => name).join(' ')
      || reference.authors
      || reference.institution
      || '';
    const bibliographicKey = normalizeText([
      reference.title,
      creatorLabel,
      reference.publishedAt || reference.year,
    ].filter(Boolean).join(' '));
    if (creatorLabel && (reference.publishedAt || reference.year)) {
      const previousBibliographic = bibliographicKeys.get(bibliographicKey);
      if (previousBibliographic) {
        warnings.push(
          `${publicLabel(path)}: provável duplicata bibliográfica (${publicLabel(previousBibliographic.path)})`,
        );
      } else {
        bibliographicKeys.set(bibliographicKey, { value: reference, path });
      }
    }
  }

  for (const [aliases, label] of [
    [theoryAliases, 'teoria'],
    [figureAliases, 'perfil'],
  ]) {
    for (const [alias, record] of aliases) {
      if (alias !== record.value.id && alias === record.value.slug) continue;
      if (alias !== record.value.id && alias !== record.value.slug && alias.length < 2) {
        errors.push(`Alias de ${label} muito curto: "${alias}"`);
      }
    }
  }

  return {
    errors,
    warnings: [...new Set(warnings)].sort(),
    referenceUsage,
  };
}

function withoutKeys(value, keys) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.has(key)));
}

function theoryClaimText(theory, field) {
  if (field === 'summary') return theory.summary;
  if (field === 'proposal') return theory.proposal;
  if (field.startsWith('review.')) return theory.review[field.slice('review.'.length)] || '';
  return '';
}

function compileTheories(theorySources, theoryTaxonomy, relationSources) {
  const typeById = new Map(theoryTaxonomy.types.map((item) => [item.id, item]));
  const reviewById = new Map(theoryTaxonomy.reviewStates.map((item) => [item.id, item]));
  const objectionById = new Map(theoryTaxonomy.objectionStates.map((item) => [item.id, item]));
  const theoryRelations = relationSources
    .filter(({ source, target }) => source.type === 'theory' && target.type === 'theory')
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, 'en'));

  const theories = [...theorySources]
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, 'en'))
    .map((source) => {
      const authored = withoutKeys(
        source,
        new Set(['schemaVersion', 'entityType', 'revisionId', 'order', 'claimLinks', 'revisions']),
      );
      const type = typeById.get(source.kind);
      const reviewState = reviewById.get(source.reviewState);
      const revisionHistory = source.revisions.map((revision) => ({
        version: revision.versionLabel,
        reviewedAt: revision.reviewedAt,
        label: revision.label,
        changeSummary: revision.changeSummary,
      }));
      const currentRevision = revisionHistory[revisionHistory.length - 1];
      const connections = theoryRelations
        .filter((relation) => relation.source.id === source.id || relation.target.id === source.id)
        .map((relation) => (
          relation.source.id === source.id ? relation.target.id : relation.source.id
        ));
      const derivation = theoryRelations.find((relation) => (
        relation.type === 'derivacao' && relation.target.id === source.id
      ));

      return {
        ...authored,
        ...(derivation ? { parentId: derivation.source.id } : {}),
        typeLabel: type?.label || source.kind,
        typeShortLabel: type?.shortLabel || type?.label || source.kind,
        reviewStateLabel: reviewState?.label || source.reviewState,
        connections,
        claims: source.claimLinks.map((claim) => ({
          ...claim,
          text: theoryClaimText(source, claim.field),
        })),
        objections: source.objections.map((objection) => ({
          ...objection,
          statusLabel: objectionById.get(objection.status)?.label || objection.status,
        })),
        rubric: theoryTaxonomy.rubrics[source.kind] || [],
        revisionHistory,
        revision: currentRevision,
        centralIdea: source.summary,
        centralQuestion: source.questions[0] || '',
        theoreticalTension: source.review.limit,
      };
    });

  return {
    theories,
    legacyRelations: theoryRelations.map((relation) => ({
      id: relation.id,
      sourceId: relation.legacyDirection === 'reversed' ? relation.target.id : relation.source.id,
      targetId: relation.legacyDirection === 'reversed' ? relation.source.id : relation.target.id,
      type: relation.type,
      justification: relation.justification,
      referenceIds: [...relation.referenceIds],
      reviewState: relation.reviewState,
      ...(relation.needsReview ? {
        reviewStatus: relation.reviewStatus,
        needsReview: true,
        reviewReasons: [...relation.reviewReasons],
      } : {}),
    })),
  };
}

function compileFigures(figureSources, relationSources, trails, events) {
  const figureRelations = relationSources
    .filter(({ source, target }) => source.type === 'figure' && target.type === 'theory')
    .sort((left, right) => (
      left.source.id.localeCompare(right.source.id, 'en')
      || left.order - right.order
      || left.id.localeCompare(right.id, 'en')
    ));

  const figures = [...figureSources]
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, 'en'))
    .map((source) => {
      const authored = withoutKeys(
        source,
        new Set(['schemaVersion', 'entityType', 'revisionId', 'order', 'referenceIds']),
      );
      return {
        ...authored,
        portrait: {
          modifications: 'Redimensionamento e conversão para WebP pelo Observatório.',
          ...source.portrait,
        },
        sourceIds: [...source.referenceIds],
        theoryLinks: figureRelations
          .filter((relation) => relation.source.id === source.id)
          .map((relation) => ({
            relationId: relation.id,
            theoryId: relation.target.id,
            relationType: relation.type,
            label: relation.label,
            note: relation.justification,
            referenceIds: [...relation.referenceIds],
            reviewState: relation.reviewState,
            ...(relation.needsReview ? {
              reviewStatus: relation.reviewStatus,
              needsReview: true,
              reviewReasons: [...relation.reviewReasons],
            } : {}),
          })),
      };
    });

  return {
    figures,
    trails: [...trails]
      .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, 'en'))
      .map((trail) => withoutKeys(
        trail,
        new Set(['schemaVersion', 'entityType', 'revisionId', 'order']),
      )),
    events: [...events]
      .sort((left, right) => left.sortYear - right.sortYear || left.order - right.order)
      .map((event) => withoutKeys(
        event,
        new Set(['schemaVersion', 'entityType', 'revisionId', 'order']),
      )),
  };
}

function compileReferences(
  referenceSources,
  theorySources,
  figureSources,
  constellationSources,
) {
  const index = new Map();
  for (const reference of referenceSources) {
    index.set(reference.id, reference);
    reference.aliases.forEach((alias) => index.set(alias, reference));
  }

  const theoryIds = new Set(theorySources.flatMap((theory) => [
    ...theory.referenceIds,
    ...theory.claimLinks.flatMap((claim) => claim.referenceIds),
  ]));
  const figureIds = new Set(figureSources.flatMap((figure) => figure.referenceIds));
  const constellationIds = new Set(
    constellationSources.flatMap((constellation) => constellation.sourceIds),
  );
  const theoryReferences = {};
  const figureReferences = {};
  const constellationReferences = {};

  for (const id of theoryIds) {
    const reference = index.get(id);
    if (!reference) continue;
    theoryReferences[id] = {
      title: reference.title,
      authors: referenceCreatorLabel(reference),
      year: reference.year,
      url: reference.url,
      kind: reference.kind,
    };
  }

  for (const id of figureIds) {
    const reference = index.get(id);
    if (!reference) continue;
    figureReferences[id] = {
      title: reference.title,
      institution: reference.institution,
      kind: reference.kind,
      url: reference.url,
    };
  }

  for (const id of constellationIds) {
    const reference = index.get(id);
    if (!reference) continue;
    constellationReferences[id] = {
      title: reference.title,
      institution: reference.institution,
      url: reference.url,
    };
  }

  return { theoryReferences, figureReferences, constellationReferences };
}

export function compilePublicationProjection(publications, publicationTaxonomy) {
  const ordered = [...publications]
    .sort((left, right) => left.id.localeCompare(right.id, 'en'));
  return Object.freeze({
    publicationTypes: publicationTaxonomy.types,
    creditRoles: publicationTaxonomy.creditRoles,
    publications: Object.freeze(ordered),
    externalContributions: Object.freeze(
      ordered.filter(({ authorshipOrigin }) => authorshipOrigin === 'external'),
    ),
    internalPublications: Object.freeze(
      ordered.filter(({ authorshipOrigin }) => authorshipOrigin === 'internal'),
    ),
  });
}

function appendIndexValue(index, key, value) {
  const entries = index[key] || [];
  entries.push(value);
  index[key] = entries;
}

function createRelationIndex(relations) {
  const bySource = {};
  const byTarget = {};
  relations.forEach((relation) => {
    appendIndexValue(bySource, `${relation.source.type}:${relation.source.id}`, relation.id);
    appendIndexValue(byTarget, `${relation.target.type}:${relation.target.id}`, relation.id);
  });
  return { bySource, byTarget };
}

function createReferenceIndex({
  theories,
  figures,
  constellations,
  relations,
  publications,
  references,
}) {
  const canonicalIdByAlias = new Map();
  references.forEach((reference) => {
    canonicalIdByAlias.set(reference.id, reference.id);
    reference.aliases.forEach((alias) => canonicalIdByAlias.set(alias, reference.id));
  });
  const byEntity = {};
  const byReference = {};
  const seenByEntity = new Map();

  function register(referenceId, entityType, entityId, context) {
    const canonicalId = canonicalIdByAlias.get(referenceId);
    if (!canonicalId) return;
    const entityKey = `${entityType}:${entityId}`;
    const seen = seenByEntity.get(entityKey) || new Set();
    if (!seen.has(canonicalId)) {
      appendIndexValue(byEntity, entityKey, canonicalId);
      seen.add(canonicalId);
      seenByEntity.set(entityKey, seen);
    }
    appendIndexValue(byReference, canonicalId, {
      entityType,
      entityId,
      ...context,
    });
  }

  theories.forEach((theory) => {
    theory.referenceIds.forEach((referenceId) => register(
      referenceId,
      'theory',
      theory.id,
      { context: 'bibliography' },
    ));
    theory.claimLinks.forEach((claim) => {
      claim.referenceIds.forEach((referenceId) => register(
        referenceId,
        'theory',
        theory.id,
        {
          context: 'claim',
          claimId: claim.id,
          contentField: claim.field,
        },
      ));
    });
  });
  figures.forEach((figure) => {
    figure.referenceIds.forEach((referenceId) => register(
      referenceId,
      'figure',
      figure.id,
      { context: 'bibliography' },
    ));
  });
  constellations.forEach((constellation) => {
    constellation.sourceIds.forEach((referenceId) => register(
      referenceId,
      'constellation',
      constellation.id,
      { context: 'bibliography' },
    ));
  });
  relations.forEach((relation) => {
    relation.referenceIds.forEach((referenceId) => register(
      referenceId,
      'relation',
      relation.id,
      { context: 'evidence' },
    ));
  });
  publications.forEach((publication) => {
    publication.referenceIds.forEach((referenceId) => register(
      referenceId,
      'publication',
      publication.id,
      { context: 'bibliography' },
    ));
    publication.claimLinks.forEach((claim) => {
      claim.sources.forEach(({ referenceId, role, locator }) => register(
        referenceId,
        'publication',
        publication.id,
        {
          context: 'claim',
          claimId: claim.claimId,
          contentBlockId: claim.contentBlockId,
          role,
          ...(locator ? { locator } : {}),
        },
      ));
    });
  });

  return { byEntity, byReference };
}

function createSearchIndex({
  theories,
  figures,
  publications,
  constellations,
  experiments,
  paths,
  researchTracks,
  sitePages,
  references,
}) {
  return [
    ...theories.map((theory) => ({
      type: 'theory',
      id: theory.id,
      slug: theory.slug,
      aliases: [...theory.aliases],
      title: theory.title,
      summary: getTheoryPublicSummary(theory),
      category: 'Teorias',
      url: `/Teorias/teorias.html?teoria=${encodeURIComponent(theory.slug)}`,
      terms: normalizeText([
        theory.title,
        theory.shortTitle,
        theory.subtitle,
        getTheoryPublicSummary(theory),
        getTheoryPublicProposal(theory),
        ...theory.concepts,
        ...theory.aliases,
      ].join(' ')),
    })),
    ...figures.map((figure) => ({
      type: 'figure',
      id: figure.id,
      slug: figure.slug,
      aliases: [...figure.aliases],
      title: figure.name,
      summary: figure.summary,
      category: 'Grandes nomes',
      url: `/GrandesNomes/grandes-nomes.html?perfil=${encodeURIComponent(figure.slug)}#galeria`,
      terms: normalizeText([
        figure.name,
        figure.role,
        figure.summary,
        figure.impact,
        ...figure.milestones,
        ...figure.aliases,
      ].join(' ')),
    })),
    ...publications.map((publication) => ({
      type: 'publication',
      id: publication.id,
      slug: publication.slug,
      aliases: [...publication.aliases],
      title: publication.title,
      summary: publication.summary,
      category: publication.authorshipOrigin === 'external' ? 'Contribuições' : 'Arquivo editorial',
      url: `/Arquivo/publicacoes/${encodeURIComponent(publication.slug)}.html`,
      terms: normalizeText([
        publication.title,
        publication.summary,
        ...publication.aliases,
      ].join(' ')),
    })),
    ...constellations.map((constellation) => ({
      type: 'constellation',
      id: constellation.id,
      slug: constellation.slug,
      aliases: [...constellation.aliases],
      title: constellation.name,
      summary: constellation.signature,
      category: 'Atlas celeste',
      url: `/Constelacoes/constelacoes.html?constelacao=${encodeURIComponent(constellation.slug)}#atlas`,
      terms: normalizeText([
        constellation.name,
        constellation.latinName,
        constellation.abbreviation,
        constellation.signature,
        constellation.recognition,
        ...constellation.aliases,
        ...constellation.stars.flatMap((star) => [star.name, star.designation]),
      ].join(' ')),
    })),
    ...experiments.filter(({ status }) => status === 'active').map((experiment) => ({
      type: 'experiment',
      id: experiment.id,
      slug: experiment.slug,
      aliases: [...experiment.aliases],
      title: experiment.title,
      summary: experiment.summary,
      category: 'Laboratório',
      url: experiment.href,
      terms: normalizeText([
        experiment.title,
        experiment.shortTitle,
        experiment.summary,
        experiment.question,
        ...experiment.aliases,
      ].join(' ')),
    })),
    ...paths.map((path) => ({
      type: 'route',
      id: path.id,
      slug: path.slug,
      aliases: [...path.aliases],
      title: path.title,
      summary: path.summary,
      category: 'Rotas guiadas',
      url: `/Rotas/rotas.html?rota=${encodeURIComponent(path.slug)}#percurso`,
      terms: normalizeText([
        path.title,
        path.summary,
        path.audience,
        ...path.aliases,
        ...path.steps.map((step) => step.reason),
      ].join(' ')),
    })),
    ...researchTracks.map((track) => ({
      type: 'research-track',
      id: track.id,
      slug: track.slug,
      aliases: [...track.aliases],
      title: track.title,
      summary: track.summary,
      category: 'Radar de desenvolvimento',
      url: `/Teorias/teorias.html#radar`,
      terms: normalizeText([
        track.code,
        track.title,
        track.kind,
        track.summary,
        track.boundary,
        ...track.aliases,
      ].join(' ')),
    })),
    ...sitePages.flatMap((page) => {
      const pageUrl = page.matchPaths[0];
      const pageEntry = {
        type: 'page',
        id: page.id,
        slug: page.id,
        aliases: [],
        title: page.functionalLabel,
        summary: page.description,
        category: 'Navegação',
        url: pageUrl,
        terms: normalizeText([
          page.label,
          page.functionalLabel,
          page.title,
          page.description,
          ...page.keywords,
        ].join(' ')),
      };
      const sectionEntries = page.sections
        .filter((section) => (
          normalizeText(section.label) !== normalizeText(page.functionalLabel)
        ))
        .map((section) => ({
          type: 'section',
          id: `${page.id}:${section.id}`,
          slug: section.id,
          aliases: [],
          title: section.title,
          summary: section.description,
          category: page.label,
          url: `${pageUrl.split('#')[0]}#${section.id}`,
          terms: normalizeText([
            page.label,
            page.functionalLabel,
            section.label,
            section.title,
            section.description,
            ...section.keywords,
          ].join(' ')),
        }));
      return [pageEntry, ...sectionEntries];
    }),
    ...references.map((reference) => ({
      type: 'reference',
      id: reference.id,
      slug: reference.id,
      aliases: [...reference.aliases],
      title: reference.title,
      summary: [
        referenceCreatorLabel(reference),
        reference.institution,
        reference.publisher,
        reference.year,
        reference.publishedAt,
        reference.kind,
      ].filter(Boolean).join(' · '),
      category: 'Fontes',
      url: reference.url,
      terms: normalizeText([
        reference.title,
        referenceCreatorLabel(reference),
        reference.institution,
        reference.publisher,
        reference.year,
        reference.publishedAt,
        reference.doi,
        reference.kind,
        ...reference.aliases,
      ].filter(Boolean).join(' ')),
    })),
  ].sort((left, right) => (
    left.type.localeCompare(right.type, 'en') || left.id.localeCompare(right.id, 'en')
  ));
}

function jsLiteral(value) {
  return JSON.stringify(value, null, 2)
    .replaceAll('</script', '<\\/script')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function compactJsLiteral(value) {
  return stableStringify(value)
    .replaceAll('</script', '<\\/script')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function runtimeIntegrityModule(manifest) {
  return `export const RUNTIME_INTEGRITY = Object.freeze(${compactJsLiteral(manifest)});\n`;
}

function moduleWithFrozenExports(exports) {
  const lines = [
    'function deepFreeze(value) {',
    "  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;",
    '  Object.values(value).forEach(deepFreeze);',
    '  return Object.freeze(value);',
    '}',
    '',
  ];
  for (const [name, value] of Object.entries(exports)) {
    lines.push(`export const ${name} = deepFreeze(${jsLiteral(value)});`, '');
  }
  return `${lines.join('\n').trim()}\n`;
}

function compileOrderedCatalog(records) {
  return [...records]
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, 'en'))
    .map((record) => withoutKeys(
      record,
      new Set(['schemaVersion', 'entityType', 'revisionId', 'order']),
    ));
}

function publicTheoryProjection(theory) {
  const revisionFields = new Set(['label', 'changeSummary']);
  return {
    ...withoutKeys(theory, new Set(['nextSteps'])),
    summary: getTheoryPublicSummary(theory),
    proposal: getTheoryPublicProposal(theory),
    centralIdea: getTheoryPublicSummary(theory),
    review: withoutKeys(theory.review, new Set(['assessment'])),
    revision: withoutKeys(theory.revision, revisionFields),
    revisionHistory: theory.revisionHistory.map((revision) => withoutKeys(revision, revisionFields)),
    objections: theory.objections.map((objection) => (
      objection.status === 'aberta'
        ? withoutKeys(objection, new Set(['response']))
        : objection
    )),
    claims: theory.claims.filter((claim) => (
      claim.field !== 'review.assessment'
      && !(theory.independent === false && ['summary', 'proposal'].includes(claim.field))
    )),
  };
}

function publicRelationProjection(relation, textField = 'justification') {
  return getPublicRelationJustification(relation)
    ? relation
    : withoutKeys(relation, new Set([textField]));
}

function buildOutputs(compiled) {
  const {
    theories,
    legacyTheoryRelations,
    figures,
    trails,
    events,
    theoryTaxonomy,
    figureTaxonomy,
    relationTaxonomy,
    publicationTaxonomy,
    theoryReferences,
    figureReferences,
    references,
    referenceIndex,
    relations,
    relationIndex,
    parties,
    publications,
    constellations,
    constellationReferences,
    experiments,
    experimentTaxonomy,
    paths,
    researchTracks,
    sitePages,
    searchIndex,
    metrics,
  } = compiled;
  const publicTheories = theories.map(publicTheoryProjection);
  const publicTheoryRelations = legacyTheoryRelations.map((relation) => publicRelationProjection(relation));
  const publicFigures = figures.map((figure) => ({
    ...figure,
    theoryLinks: figure.theoryLinks.map((link) => publicRelationProjection(link, 'note')),
  }));
  const publicRelations = relations.map((relation) => publicRelationProjection(relation));
  const publicResearchTracks = researchTracks.map((track) => withoutKeys(track, new Set(['nextStep'])));
  const publicExperiments = experiments.map((experiment) => withoutKeys(experiment, new Set(['technology'])));

  const theoryRelationTypes = relationTaxonomy.types
    .filter((type) => type.sourceType === 'theory' && type.targetType === 'theory')
    .map(({
      id,
      label,
      description,
      symmetric,
      inverseLabel,
      requiresJustification,
      requiresReference,
    }) => ({
      id,
      label,
      description,
      symmetric,
      inverseLabel,
      requiresJustification,
      requiresReference,
    }));
  const figureRelationTypes = relationTaxonomy.types
    .filter((type) => type.sourceType === 'figure' && type.targetType === 'theory')
    .map(({
      id,
      label,
      inverseLabel,
      requiresJustification,
      requiresReference,
    }) => ({
      id,
      label,
      inverseLabel,
      requiresJustification,
      requiresReference,
    }));
  const publicationProjection = compilePublicationProjection(publications, publicationTaxonomy);

  const outputs = new Map([
    [resolve(GENERATED_RUNTIME_ROOT, 'theories.js'), moduleWithFrozenExports({
      THEORY_FILTERS: theoryTaxonomy.filters,
      THEORY_TYPES: theoryTaxonomy.types,
      THEORY_REVIEW_STATES: theoryTaxonomy.reviewStates,
      THEORY_OBJECTION_STATES: theoryTaxonomy.objectionStates,
      THEORY_RELATION_TYPES: theoryRelationTypes,
      THEORY_RUBRICS: theoryTaxonomy.rubrics,
      THEORY_RELATIONS: publicTheoryRelations,
      THEORIES: publicTheories,
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'notable-figures.js'), moduleWithFrozenExports({
      NOTABLE_FIGURE_AREAS: figureTaxonomy.areas,
      NOTABLE_FIGURE_RELATION_TYPES: figureRelationTypes,
      NOTABLE_METHOD_TIMELINE_CATEGORIES: figureTaxonomy.timelineCategories,
      NOTABLE_FIGURES: publicFigures,
      NOTABLE_METHOD_TIMELINE: events,
      NOTABLE_FIGURE_TRAILS: trails,
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'references.js'), moduleWithFrozenExports({
      THEORY_REFERENCES: theoryReferences,
      NOTABLE_FIGURE_REFERENCES: figureReferences,
      CONTENT_REFERENCES: references,
      CONTENT_REFERENCE_INDEX: referenceIndex,
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'content-entities.js'), moduleWithFrozenExports({
      CONTENT_THEORIES: compiled.canonicalTheories,
      CONTENT_FIGURES: compiled.canonicalFigures,
      CONTENT_PARTIES: parties,
      CONTENT_CONSTELLATIONS: constellations,
      CONTENT_EXPERIMENTS: experiments,
      CONTENT_PATHS: paths,
      CONTENT_RESEARCH_TRACKS: researchTracks,
      CONTENT_SITE_PAGES: sitePages,
      CONTENT_REFERENCES: references,
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'relations.js'), moduleWithFrozenExports({
      CONTENT_RELATION_TYPES: relationTaxonomy.types,
      CONTENT_RELATIONS: publicRelations,
      CONTENT_RELATION_INDEX: relationIndex,
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'publications.js'), moduleWithFrozenExports({
      PUBLICATION_TYPES: publicationProjection.publicationTypes,
      PUBLICATION_CREDIT_ROLES: publicationProjection.creditRoles,
      PUBLICATIONS: publicationProjection.publications,
      EXTERNAL_CONTRIBUTIONS: publicationProjection.externalContributions,
      INTERNAL_PUBLICATIONS: publicationProjection.internalPublications,
      PUBLICATION_PARTIES: parties,
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'parties.js'), moduleWithFrozenExports({
      PUBLICATION_PARTIES: parties,
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'constellations.js'), moduleWithFrozenExports({
      CONSTELLATION_REFERENCES: constellationReferences,
      CONSTELLATIONS: compileOrderedCatalog(constellations),
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'experiments.js'), moduleWithFrozenExports({
      EXPERIMENT_KINDS: experimentTaxonomy.kinds,
      EXPERIMENT_STATUSES: experimentTaxonomy.statuses,
      EXPERIMENT_VISUALS: experimentTaxonomy.visuals,
      EXPERIMENTS: compileOrderedCatalog(publicExperiments),
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'learning-paths.js'), moduleWithFrozenExports({
      LEARNING_PATHS: compileOrderedCatalog(paths),
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'research-tracks.js'), moduleWithFrozenExports({
      RESEARCH_TRACKS: compileOrderedCatalog(publicResearchTracks),
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'site-pages.js'), moduleWithFrozenExports({
      SITE_PAGES: compileOrderedCatalog(sitePages),
    })],
    [resolve(GENERATED_ROOT, 'search-index.js'), moduleWithFrozenExports({
      CONTENT_SEARCH_INDEX: searchIndex,
    })],
    [resolve(GENERATED_ROOT, 'content-metrics.js'), moduleWithFrozenExports({
      CONTENT_METRICS: metrics,
    })],
    [resolve(GENERATED_RUNTIME_ROOT, 'content-snapshot.js'), [
      'function deepFreeze(value) {',
      "  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;",
      '  Object.values(value).forEach(deepFreeze);',
      '  return Object.freeze(value);',
      '}',
      '',
      "import { CONTENT_METRICS } from '../content-metrics.js';",
      "import { CONTENT_SEARCH_INDEX } from '../search-index.js';",
      "import { CONSTELLATIONS } from './constellations.js';",
      "import { EXPERIMENTS, EXPERIMENT_KINDS, EXPERIMENT_STATUSES, EXPERIMENT_VISUALS } from './experiments.js';",
      "import { LEARNING_PATHS } from './learning-paths.js';",
      "import { NOTABLE_FIGURES, NOTABLE_FIGURE_AREAS, NOTABLE_FIGURE_TRAILS, NOTABLE_METHOD_TIMELINE, NOTABLE_METHOD_TIMELINE_CATEGORIES } from './notable-figures.js';",
      "import { PUBLICATIONS, PUBLICATION_CREDIT_ROLES, PUBLICATION_PARTIES, PUBLICATION_TYPES } from './publications.js';",
      "import { CONTENT_REFERENCES, CONTENT_REFERENCE_INDEX } from './references.js';",
      "import { CONTENT_RELATIONS, CONTENT_RELATION_INDEX, CONTENT_RELATION_TYPES } from './relations.js';",
      "import { RESEARCH_TRACKS } from './research-tracks.js';",
      "import { SITE_PAGES } from './site-pages.js';",
      "import { THEORIES, THEORY_FILTERS, THEORY_OBJECTION_STATES, THEORY_REVIEW_STATES, THEORY_RUBRICS, THEORY_TYPES } from './theories.js';",
      '',
      'const CONTENT_ENTITIES = deepFreeze({',
      '  theory: THEORIES,',
      '  figure: NOTABLE_FIGURES,',
      '  party: PUBLICATION_PARTIES,',
      '  publication: PUBLICATIONS,',
      '  constellation: CONSTELLATIONS,',
      '  experiment: EXPERIMENTS,',
      '  path: LEARNING_PATHS,',
      "  'research-track': RESEARCH_TRACKS,",
      "  'site-page': SITE_PAGES,",
      '});',
      'const CONTENT_TAXONOMIES = deepFreeze({',
      '  theories: {',
      '    filters: THEORY_FILTERS,',
      '    types: THEORY_TYPES,',
      '    reviewStates: THEORY_REVIEW_STATES,',
      '    objectionStates: THEORY_OBJECTION_STATES,',
      '    rubrics: THEORY_RUBRICS,',
      '  },',
      '  figures: {',
      '    areas: NOTABLE_FIGURE_AREAS,',
      '    timelineCategories: NOTABLE_METHOD_TIMELINE_CATEGORIES,',
      '  },',
      '  relations: { types: CONTENT_RELATION_TYPES },',
      '  publications: {',
      '    types: PUBLICATION_TYPES,',
      '    creditRoles: PUBLICATION_CREDIT_ROLES,',
      '  },',
      '  experiments: {',
      '    kinds: EXPERIMENT_KINDS,',
      '    statuses: EXPERIMENT_STATUSES,',
      '    visuals: EXPERIMENT_VISUALS,',
      '  },',
      '});',
      'const CONTENT_COLLECTIONS = deepFreeze({',
      '  figureTrails: NOTABLE_FIGURE_TRAILS,',
      '  timelineEvents: NOTABLE_METHOD_TIMELINE,',
      '});',
      '',
      'export const CONTENT_SNAPSHOT = Object.freeze({',
      '  schemaVersion: 1,',
      `  fingerprint: '${compiled.fingerprint}',`,
      '  entities: Object.freeze({',
      '    ...CONTENT_ENTITIES,',
      '  }),',
      '  references: CONTENT_REFERENCES,',
      '  referenceIndex: CONTENT_REFERENCE_INDEX,',
      '  relations: CONTENT_RELATIONS,',
      '  relationIndex: CONTENT_RELATION_INDEX,',
      '  relationTypes: CONTENT_RELATION_TYPES,',
      '  taxonomies: CONTENT_TAXONOMIES,',
      '  collections: CONTENT_COLLECTIONS,',
      '  searchIndex: CONTENT_SEARCH_INDEX,',
      '  metrics: CONTENT_METRICS,',
      '});',
      '',
    ].join('\n')],
  ]);
  const fileHashes = Object.fromEntries(
    [...outputs.entries()].map(([path, source]) => [
      relative(GENERATED_ROOT, path).replaceAll('\\', '/'),
      createHash('sha256').update(source).digest('hex'),
    ]),
  );
  outputs.set(
    RUNTIME_INTEGRITY_FILE,
    runtimeIntegrityModule({
      schemaVersion: 1,
      fingerprint: compiled.fingerprint,
      files: fileHashes,
    }),
  );
  return outputs;
}

async function writeOutputs(outputs) {
  if (
    dirname(GENERATED_ROOT) !== resolve(PROJECT_ROOT, 'assets', 'data')
    || basename(GENERATED_ROOT) !== 'generated'
    || dirname(LAST_VALID_RUNTIME_PATH) !== CONTENT_CACHE_ROOT
    || dirname(CONTENT_CACHE_ROOT) !== PROJECT_ROOT
  ) {
    throw new Error('Diretórios de runtime atômico inválidos');
  }

  await recoverInterruptedRuntimeSwap();
  const runId = `${process.pid}-${Date.now()}`;
  const staging = resolve(CONTENT_CACHE_ROOT, `runtime-next-${runId}`);
  await mkdir(staging, { recursive: true });
  try {
    for (const [path, source] of outputs) {
      const outputPath = relative(GENERATED_ROOT, path);
      if (!outputPath || outputPath.startsWith('..') || isAbsolute(outputPath)) {
        throw new Error(`Saída gerada fora do runtime: ${publicLabel(path)}`);
      }
      const stagedPath = resolve(staging, outputPath);
      await mkdir(dirname(stagedPath), { recursive: true });
      await writeFile(stagedPath, source, 'utf8');
    }

    if (!await runtimeDirectoryIsComplete(staging)) {
      throw new Error('O staging do runtime ficou incompleto; o runtime atual foi preservado');
    }
    const current = await stat(GENERATED_ROOT).catch(() => null);
    if (
      current
      && !await runtimeDirectoryIsComplete(GENERATED_ROOT, { upgradeLegacy: true })
    ) {
      throw new Error(
        'O runtime atual está incompleto e não pode virar snapshot de rollback; '
        + 'restaure o último runtime válido antes de gerar novamente',
      );
    }
    await writeRuntimeSwapJournal({
      kind: 'generation',
      phase: 'staged',
      staging,
      startedAt: new Date().toISOString(),
    });
    await rm(LAST_VALID_RUNTIME_PATH, { recursive: true, force: true });
    if (current) {
      await rename(GENERATED_ROOT, LAST_VALID_RUNTIME_PATH);
      await writeRuntimeSwapJournal({
        kind: 'generation',
        phase: 'backup-active',
        staging,
        startedAt: new Date().toISOString(),
      });
    }
    try {
      await rename(staging, GENERATED_ROOT);
      await rm(RUNTIME_SWAP_JOURNAL_PATH, { force: true });
    } catch (error) {
      const backup = await stat(LAST_VALID_RUNTIME_PATH).catch(() => null);
      const generated = await stat(GENERATED_ROOT).catch(() => null);
      if (backup && !generated) await rename(LAST_VALID_RUNTIME_PATH, GENERATED_ROOT);
      await rm(RUNTIME_SWAP_JOURNAL_PATH, { force: true });
      throw error;
    }
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

const runtimeIntegrityRelativePath = relative(GENERATED_ROOT, RUNTIME_INTEGRITY_FILE)
  .replaceAll('\\', '/');
const runtimePayloadFiles = GENERATED_FILES
  .map((file) => file.replace(/^assets\/data\/generated\//, ''))
  .filter((file) => file !== runtimeIntegrityRelativePath);

function runtimeFingerprintFromSnapshot(source) {
  return source.match(/\bfingerprint:\s*['"]([a-f0-9]{64})['"]/i)?.[1] || '';
}

async function createRuntimeIntegrityManifest(directory) {
  const files = {};
  for (const relativeFile of runtimePayloadFiles) {
    const source = await readFile(resolve(directory, relativeFile)).catch(() => null);
    if (!source) return null;
    files[relativeFile] = createHash('sha256').update(source).digest('hex');
  }
  const snapshot = await readFile(
    resolve(directory, 'runtime', 'content-snapshot.js'),
    'utf8',
  ).catch(() => '');
  const fingerprint = runtimeFingerprintFromSnapshot(snapshot);
  if (!fingerprint) return null;
  return { schemaVersion: 1, fingerprint, files };
}

async function readRuntimeIntegrityManifest(directory) {
  const source = await readFile(
    resolve(directory, runtimeIntegrityRelativePath),
    'utf8',
  ).catch(() => '');
  const serialized = source.match(
    /export const RUNTIME_INTEGRITY = Object\.freeze\((\{[\s\S]*\})\);\s*$/,
  )?.[1];
  if (!serialized) return null;
  try {
    return JSON.parse(serialized);
  } catch {
    return null;
  }
}

async function runtimeDirectoryIsComplete(directory, { upgradeLegacy = false } = {}) {
  let manifest = await readRuntimeIntegrityManifest(directory);
  if (!manifest && upgradeLegacy) {
    manifest = await createRuntimeIntegrityManifest(directory);
    if (manifest) {
      await writeFile(
        resolve(directory, runtimeIntegrityRelativePath),
        runtimeIntegrityModule(manifest),
        'utf8',
      );
    }
  }
  if (
    manifest?.schemaVersion !== 1
    || !/^[a-f0-9]{64}$/i.test(manifest.fingerprint || '')
  ) {
    return false;
  }
  const declaredFiles = Object.keys(manifest.files || {}).sort();
  const expectedFiles = [...runtimePayloadFiles].sort();
  if (!upgradeLegacy && stableStringify(declaredFiles) !== stableStringify(expectedFiles)) {
    return false;
  }
  if (upgradeLegacy) {
    const requiredLegacyCore = [
      'content-metrics.js',
      'search-index.js',
      'runtime/content-snapshot.js',
    ];
    if (!requiredLegacyCore.every((file) => declaredFiles.includes(file))) return false;
    if (declaredFiles.some((relativeFile) => (
      relativeFile.includes('\\')
      || relativeFile.startsWith('/')
      || isAbsolute(relativeFile)
      || relativeFile.split('/').some((segment) => !segment || segment === '.' || segment === '..')
      || relativeFile === runtimeIntegrityRelativePath
    ))) {
      return false;
    }
  }
  const filesToVerify = upgradeLegacy ? declaredFiles : expectedFiles;
  for (const relativeFile of filesToVerify) {
    const source = await readFile(resolve(directory, relativeFile)).catch(() => null);
    if (!source) return false;
    const hash = createHash('sha256').update(source).digest('hex');
    if (manifest.files[relativeFile] !== hash) return false;
  }
  const snapshot = await readFile(
    resolve(directory, 'runtime', 'content-snapshot.js'),
    'utf8',
  ).catch(() => '');
  return runtimeFingerprintFromSnapshot(snapshot) === manifest.fingerprint;
}

function runtimeStagingPathIsSafe(path) {
  if (!path) return false;
  const fromCache = relative(CONTENT_CACHE_ROOT, path);
  return (
    fromCache
    && !fromCache.startsWith('..')
    && !isAbsolute(fromCache)
    && basename(path).startsWith('runtime-next-')
  );
}

async function writeRuntimeSwapJournal(value) {
  await mkdir(CONTENT_CACHE_ROOT, { recursive: true });
  await writeFile(RUNTIME_SWAP_JOURNAL_PATH, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function recoverInterruptedRuntimeSwap() {
  const source = await readFile(RUNTIME_SWAP_JOURNAL_PATH, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  if (!source) return false;

  let journal;
  try {
    journal = JSON.parse(source);
  } catch {
    throw new Error('Journal de troca do runtime corrompido; restaure o último runtime válido');
  }
  const staging = runtimeStagingPathIsSafe(journal.staging) ? journal.staging : null;
  if (!staging) throw new Error('Journal de troca do runtime contém staging inválido');

  if (await runtimeDirectoryIsComplete(GENERATED_ROOT, { upgradeLegacy: true })) {
    await rm(staging, { recursive: true, force: true });
    await rm(RUNTIME_SWAP_JOURNAL_PATH, { force: true });
    return true;
  }
  if (await runtimeDirectoryIsComplete(LAST_VALID_RUNTIME_PATH, { upgradeLegacy: true })) {
    await rm(GENERATED_ROOT, { recursive: true, force: true });
    await rename(LAST_VALID_RUNTIME_PATH, GENERATED_ROOT);
    await rm(staging, { recursive: true, force: true });
    await rm(RUNTIME_SWAP_JOURNAL_PATH, { force: true });
    return true;
  }
  if (await runtimeDirectoryIsComplete(staging)) {
    await rm(GENERATED_ROOT, { recursive: true, force: true });
    await rename(staging, GENERATED_ROOT);
    await rm(RUNTIME_SWAP_JOURNAL_PATH, { force: true });
    return true;
  }
  throw new Error('Nenhuma cópia íntegra do runtime foi encontrada para recuperar a troca interrompida');
}

async function rollbackGeneratedRuntimeUnlocked() {
  if (
    dirname(GENERATED_ROOT) !== resolve(PROJECT_ROOT, 'assets', 'data')
    || dirname(LAST_VALID_RUNTIME_PATH) !== CONTENT_CACHE_ROOT
  ) {
    throw new Error('Diretórios de rollback inválidos');
  }
  await recoverInterruptedRuntimeSwap();
  const backup = await stat(LAST_VALID_RUNTIME_PATH).catch(() => null);
  if (
    !backup?.isDirectory()
    || !await runtimeDirectoryIsComplete(
      LAST_VALID_RUNTIME_PATH,
      { upgradeLegacy: true },
    )
  ) {
    throw new Error('Não existe snapshot anterior do runtime para restaurar');
  }
  const runId = `${process.pid}-${Date.now()}`;
  const currentStaging = resolve(CONTENT_CACHE_ROOT, `runtime-rollback-${runId}`);
  const current = await stat(GENERATED_ROOT).catch(() => null);
  try {
    if (current) await rename(GENERATED_ROOT, currentStaging);
    await rename(LAST_VALID_RUNTIME_PATH, GENERATED_ROOT);
    if (current) await rename(currentStaging, LAST_VALID_RUNTIME_PATH);
  } catch (error) {
    const generated = await stat(GENERATED_ROOT).catch(() => null);
    const staged = await stat(currentStaging).catch(() => null);
    const backupAfterFailure = await stat(LAST_VALID_RUNTIME_PATH).catch(() => null);
    if (!generated && staged) {
      await rename(currentStaging, GENERATED_ROOT);
    } else if (generated && staged && !backupAfterFailure) {
      try {
        await rename(currentStaging, LAST_VALID_RUNTIME_PATH);
        return true;
      } catch {
        // O erro original continua sendo o diagnóstico mais útil.
      }
    }
    throw error;
  }
  return true;
}

export async function rollbackGeneratedRuntime() {
  const releaseLock = await acquireRuntimeLock();
  try {
    return await rollbackGeneratedRuntimeUnlocked();
  } finally {
    await releaseLock();
  }
}

async function checkOutputs(outputs) {
  const stale = [];
  for (const [path, expected] of outputs) {
    const current = await readFile(path, 'utf8').catch(() => null);
    if (current !== expected) stale.push(publicLabel(path));
  }
  if (stale.length) {
    throw new Error(`Runtime de conteúdo ausente ou desatualizado: ${stale.join(', ')}`);
  }
}

async function writeReport(report) {
  await mkdir(REPORT_ROOT, { recursive: true });
  await writeFile(INTEGRITY_REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

function values(grouped, type) {
  return (grouped.get(type) || []).map(({ value }) => value);
}

function decorateRelationReviewState(relations, revisionIndex) {
  return relations.map((relation) => {
    const review = deriveRelationReviewStatus(relation, revisionIndex);
    return {
      ...relation,
      reviewStatus: review.needsReview
        ? 'needs-review'
        : relation.reviewState === 'reviewed'
          ? 'current'
          : relation.reviewState,
      needsReview: review.needsReview,
      reviewReasons: review.reasons.map((reason) => structuredClone(reason)),
      currentRevisions: { ...review.currentRevisions },
    };
  });
}

function changedClaimIds(previous, next, changedPaths) {
  const claims = new Map([
    ...(previous?.claimLinks || []).map((claim) => [claim.id || claim.claimId, claim]),
    ...(next?.claimLinks || []).map((claim) => [claim.id || claim.claimId, claim]),
  ]);
  if (!claims.size) return [];
  const claimCollectionChanged = changedPaths.some((path) => (
    path.startsWith('/claimLinks')
  ));
  const allBodyBlocksChanged = changedPaths.includes('/body');
  const affectedBodyBlockIds = new Set();
  for (const path of changedPaths) {
    const index = path.match(/^\/body\/([0-9]+)(?:\/|$)/)?.[1];
    if (index === undefined) continue;
    const ordinal = Number(index);
    const previousId = previous?.body?.[ordinal]?.id;
    const nextId = next?.body?.[ordinal]?.id;
    if (previousId) affectedBodyBlockIds.add(previousId);
    if (nextId) affectedBodyBlockIds.add(nextId);
  }
  return [...claims.values()]
    .filter((claim) => {
      if (claimCollectionChanged) return true;
      if (
        claim.contentBlockId
        && (
          allBodyBlocksChanged
          || affectedBodyBlockIds.has(claim.contentBlockId)
        )
      ) return true;
      if (!claim.field) return false;
      const claimPointer = `/${claim.field.replaceAll('.', '/')}`;
      return changedPaths.some((path) => (
        path === claimPointer
        || path.startsWith(`${claimPointer}/`)
        || claimPointer.startsWith(`${path}/`)
      ));
    })
    .map((claim) => claim.id || claim.claimId)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'en'));
}

function relationTouchesEntity(relation, entity) {
  return (
    relation?.source?.type === entity.type
    && relation.source.id === entity.id
  ) || (
    relation?.target?.type === entity.type
    && relation.target.id === entity.id
  );
}

export function buildEditorialImpactSummary({
  canonicalExperiments,
  canonicalPaths,
  editorialChangeSet,
  relations,
  revisionIndex,
}) {
  if (!editorialChangeSet) return null;
  if (!Array.isArray(editorialChangeSet.operations)) {
    throw new Error('Change set editorial inválido: operations precisa ser uma lista');
  }
  const relationOperations = editorialChangeSet.operations
    .filter(({ type }) => type === 'relation');
  const changes = [];

  for (const operation of editorialChangeSet.operations) {
    const { changeClass, next, previous, type } = operation;
    if (!next || typeof next !== 'object') {
      throw new Error(`Change set editorial: operação ${type || 'desconhecida'} sem next`);
    }
    const diff = diffContentRecords(previous || {}, next);
    const classification = classifyContentChange(diff, { declaredClass: changeClass });
    const base = {
      entity: { type, id: next.id },
      previousRevisionId: previous?.revisionId || null,
      nextRevisionId: next.revisionId || null,
      classification,
    };

    if (!EDITORIAL_REVISION_ENTITY_TYPES.includes(type)) {
      const blockers = [];
      if (classification.upgraded && classification.invalidatesRelations) {
        blockers.push({
          code: 'declared-change-class-too-weak',
          declaredClass: classification.declaredClass,
          requiredClass: classification.effectiveClass,
        });
      }
      if (
        type === 'relation'
        && next.reviewState === 'reviewed'
        && next.reviewedAgainst?.mode !== 'editorial-review'
      ) {
        blockers.push({
          code: 'explicit-relation-review-required',
          relationId: next.id,
        });
      }
      const previousReferences = referenceIdsFromRecord(previous);
      const nextReferences = referenceIdsFromRecord(next);
      changes.push({
        ...base,
        relations: [],
        blockers,
        pendingRelations: [],
        referencesAdded: nextReferences.filter((id) => !previousReferences.includes(id)),
        referencesRemoved: previousReferences.filter((id) => !nextReferences.includes(id)),
        claimsAffected: changedClaimIds(previous, next, classification.changedPaths),
        identityChanges: classification.changedPaths.filter((path) => (
          /^\/(?:aliases|id|reviewState|slug)(?:\/|$)/.test(path)
        )),
        experimentsAffected: [],
        pathsAffected: [],
        ...generatedImpactForChange({
          type,
          record: next,
          previousRecord: previous,
          pathsAffected: [],
        }),
      });
      continue;
    }

    const directImpact = calculateDirectImpact({
      entityType: type,
      entityId: next.id,
      relations,
      revisionIndex,
      changeClass: classification.effectiveClass,
      changedPaths: classification.changedPaths,
    });
    const gate = validatePublicationGate(directImpact);
    const blockers = [...gate.blockers];
    if (classification.upgraded && classification.invalidatesRelations) {
      blockers.push({
        code: 'declared-change-class-too-weak',
        declaredClass: classification.declaredClass,
        requiredClass: classification.effectiveClass,
      });
    }
    const transitionedRelations = [];
    if (classification.invalidatesRelations) {
      for (const relationOperation of relationOperations) {
        if (
          relationOperation.previous?.reviewState !== 'reviewed'
          || !relationTouchesEntity(relationOperation.previous, base.entity)
        ) continue;
        const nextRelation = relationOperation.next;
        const review = deriveRelationReviewStatus(nextRelation, revisionIndex);
        transitionedRelations.push({ relation: nextRelation, review });
        if (nextRelation.reviewState === 'pending') {
          blockers.push({
            code: 'reviewed-relation-deferred',
            relationId: nextRelation.id,
            reasons: review.reasons,
          });
        }
      }
    }

    const previousReferences = referenceIdsFromRecord(previous);
    const nextReferences = referenceIdsFromRecord(next);
    const experimentsAffected = type === 'theory'
      ? canonicalExperiments
        .filter(({ theoryIds }) => theoryIds.includes(next.id))
        .map(({ id }) => id)
      : [];
    const pathsAffected = canonicalPaths
      .filter(({ steps }) => steps.some((step) => (
        step.type === type && step.id === next.id
      )))
      .map(({ id }) => id);
    const generatedImpact = generatedImpactForChange({
      type,
      record: next,
      previousRecord: previous,
      experimentsAffected,
      pathsAffected,
    });
    const relationEntries = new Map(
      [...directImpact.relations, ...transitionedRelations]
        .map(({ relation, review }) => [relation.id, {
          id: relation.id,
          source: relation.source,
          target: relation.target,
          reviewState: relation.reviewState,
          reviewStatus: review.needsReview ? 'needs-review' : relation.reviewStatus,
          needsReview: review.needsReview,
        }]),
    );
    changes.push({
      ...base,
      relations: [...relationEntries.values()]
        .sort((left, right) => left.id.localeCompare(right.id, 'en')),
      blockers,
      pendingRelations: [...new Set([
        ...directImpact.pendingRelations.map(({ relation }) => relation.id),
        ...transitionedRelations
          .filter(({ relation }) => relation.reviewState === 'pending')
          .map(({ relation }) => relation.id),
      ])].sort((left, right) => left.localeCompare(right, 'en')),
      referencesAdded: nextReferences.filter((id) => !previousReferences.includes(id)),
      referencesRemoved: previousReferences.filter((id) => !nextReferences.includes(id)),
      claimsAffected: changedClaimIds(previous, next, classification.changedPaths),
      identityChanges: classification.changedPaths.filter((path) => (
        /^\/(?:aliases|id|reviewState|slug)(?:\/|$)/.test(path)
      )),
      experimentsAffected,
      pathsAffected,
      ...generatedImpact,
    });
  }

  const blockers = changes
    .flatMap((change) => change.blockers.map((blocker) => ({
      entity: change.entity,
      ...blocker,
    })))
    .sort((left, right) => (
      `${left.entity.type}:${left.entity.id}:${left.relationId || ''}:${left.code}`
        .localeCompare(
          `${right.entity.type}:${right.entity.id}:${right.relationId || ''}:${right.code}`,
          'en',
        )
    ));
  return {
    schemaVersion: 1,
    changes,
    blockers,
    allowed: blockers.length === 0,
  };
}

async function compileContentUnlocked({
  writeRuntime = false,
  checkRuntime = false,
  writeIntegrityReport = false,
  editorialChangeSet = null,
} = {}) {
  const rawSources = await loadRawSources();
  const validated = await validateAndProject(rawSources);
  const grouped = groupByType(validated.records);
  const cross = validateCrossIntegrity(grouped);
  const importPolicy = await validateDirectDataImportPolicy();
  const errors = [...validated.errors, ...cross.errors, ...importPolicy.errors];

  if (errors.length) {
    throw new Error(`Conteúdo público inválido:\n- ${errors.sort().join('\n- ')}`);
  }

  const canonicalTheories = values(grouped, 'theory');
  const canonicalFigures = values(grouped, 'figure');
  const references = values(grouped, 'reference')
    .sort((left, right) => left.id.localeCompare(right.id, 'en'));
  const editorialRevisionLedger = values(grouped, 'editorial-revision-ledger')[0];
  const editorialRevisionIndex = buildRevisionIndex(editorialRevisionLedger);
  const canonicalRelationSources = values(grouped, 'relation')
    .sort((left, right) => left.id.localeCompare(right.id, 'en'));
  const relationSources = decorateRelationReviewState(
    canonicalRelationSources,
    editorialRevisionIndex,
  );
  const relations = relationSources.map((relation) => withoutKeys(
    relation,
    new Set(['legacyDirection']),
  ));
  const trails = values(grouped, 'figure-trail');
  const events = values(grouped, 'timeline-event');
  const parties = values(grouped, 'party')
    .sort((left, right) => left.id.localeCompare(right.id, 'en'));
  const publications = values(grouped, 'publication')
    .sort((left, right) => left.id.localeCompare(right.id, 'en'));
  const canonicalConstellations = values(grouped, 'constellation')
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, 'en'));
  const canonicalExperiments = values(grouped, 'experiment')
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, 'en'));
  const canonicalPaths = values(grouped, 'path')
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, 'en'));
  const canonicalResearchTracks = values(grouped, 'research-track')
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, 'en'));
  const canonicalSitePages = values(grouped, 'site-page')
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, 'en'));
  const theoryTaxonomy = values(grouped, 'theory-taxonomy')[0];
  const figureTaxonomy = values(grouped, 'figure-taxonomy')[0];
  const relationTaxonomy = values(grouped, 'relation-type-taxonomy')[0];
  const publicationTaxonomy = values(grouped, 'publication-taxonomy')[0];
  const experimentTaxonomy = values(grouped, 'experiment-taxonomy')[0];
  const theoryCompilation = compileTheories(canonicalTheories, theoryTaxonomy, relationSources);
  const figureCompilation = compileFigures(canonicalFigures, relationSources, trails, events);
  const referenceCompilation = compileReferences(
    references,
    canonicalTheories,
    canonicalFigures,
    canonicalConstellations,
  );
  const relationIndex = createRelationIndex(relations);
  const referenceIndex = createReferenceIndex({
    theories: canonicalTheories,
    figures: canonicalFigures,
    constellations: canonicalConstellations,
    relations,
    publications,
    references,
  });
  const searchIndex = createSearchIndex({
    theories: canonicalTheories,
    figures: canonicalFigures,
    publications,
    constellations: canonicalConstellations,
    experiments: canonicalExperiments,
    paths: canonicalPaths,
    researchTracks: canonicalResearchTracks,
    sitePages: canonicalSitePages,
    references,
  });
  const fingerprint = contentHash({
    canonicalTheories,
    canonicalFigures,
    references,
    relations: relationSources,
    editorialRevisionLedger,
    trails,
    events,
    parties,
    publications,
    theoryTaxonomy,
    figureTaxonomy,
    relationTaxonomy,
    publicationTaxonomy,
    canonicalConstellations,
    canonicalExperiments,
    canonicalPaths,
    canonicalResearchTracks,
    canonicalSitePages,
    experimentTaxonomy,
  });
  const metrics = {
    theories: canonicalTheories.length,
    figures: canonicalFigures.length,
    parties: parties.length,
    publications: publications.length,
    constellations: canonicalConstellations.length,
    experiments: canonicalExperiments.length,
    paths: canonicalPaths.length,
    researchTracks: canonicalResearchTracks.length,
    sitePages: canonicalSitePages.length,
    activeExperiments: canonicalExperiments.filter(({ status }) => status === 'active').length,
    externalContributions: publications.filter(({ authorshipOrigin }) => authorshipOrigin === 'external').length,
    relations: relations.length,
    theoryRelations: theoryCompilation.legacyRelations.length,
    figureTheoryRelations: relations.filter(({ source, target }) => (
      source.type === 'figure' && target.type === 'theory'
    )).length,
    references: references.length,
    searchEntries: searchIndex.length,
  };
  const experimentTheoryRelationReviewQueue = canonicalExperiments
    .flatMap((experiment) => experiment.theoryIds
      .filter((theoryId) => !relations.some((relation) => (
        relation.source.type === 'experiment'
        && relation.source.id === experiment.id
        && relation.target.type === 'theory'
        && relation.target.id === theoryId
        && relation.reviewState !== 'deprecated'
      )))
      .map((theoryId) => ({
        source: { type: 'experiment', id: experiment.id },
        target: { type: 'theory', id: theoryId },
        legacyDeclaration: `${experiment.id}.theoryIds`,
        requiredEditorialDecisions: [
          'manter, reclassificar ou remover o vínculo',
          'definir tipo e rótulo',
          'redigir justificativa específica',
          'selecionar evidência bibliográfica atribuível à relação',
          'definir estado de revisão',
        ],
      })))
    .sort((left, right) => (
      `${left.source.id}:${left.target.id}`.localeCompare(
        `${right.source.id}:${right.target.id}`,
        'pt-BR',
      )
    ));
  const impactSummary = buildEditorialImpactSummary({
    canonicalExperiments,
    canonicalPaths,
    editorialChangeSet,
    relations,
    revisionIndex: editorialRevisionIndex,
  });
  const report = {
    schemaVersion: 1,
    fingerprint,
    counts: metrics,
    warnings: cross.warnings,
    orphanReferenceIds: references
      .filter((reference) => !cross.referenceUsage.has(reference.id))
      .map(({ id }) => id)
      .sort(),
    relationsAwaitingEvidence: relations
      .filter((relation) => {
        const type = relationTaxonomy.types.find((candidate) => (
          candidate.id === relation.type
          && candidate.sourceType === relation.source.type
          && candidate.targetType === relation.target.type
        ));
        return type?.requiresReference && !relation.referenceIds.length;
      })
      .map(({ id }) => id)
      .sort(),
    relationsNeedingReview: relations
      .filter(({ needsReview }) => needsReview)
      .map(({ id, reviewReasons, reviewedAgainst, source, target }) => ({
        id,
        source,
        target,
        reviewedAgainst,
        reasons: [...(reviewReasons || [])],
      }))
      .sort((left, right) => left.id.localeCompare(right.id, 'en')),
    legacyRelationReviewBaselines: relations
      .filter(({ reviewedAgainst }) => reviewedAgainst?.mode === 'legacy-baseline')
      .map(({ id }) => id)
      .sort(),
    revisionResponsibilityGaps: canonicalTheories
      .flatMap((theory) => theory.revisions
        .filter((revision) => !revision.responsibles.length)
        .map((revision) => `${theory.id}:${revision.revisionId}`))
      .sort(),
    experimentTheoryLinksAwaitingMigration: experimentTheoryRelationReviewQueue
      .map(({ source, target }) => `${source.id}:${target.id}`),
    experimentTheoryRelationReviewQueue,
    legacyDirectDataImports: importPolicy.actual,
    debtBudgets: CONTENT_DEBT_BUDGETS,
    impactSummary,
  };
  const blockingEditorialDecisions = [
    ...report.relationsNeedingReview.map(({ id, reasons, source, target }) => ({
      code: 'stale-reviewed-relation',
      relationId: id,
      source,
      target,
      reasons,
    })),
    ...(impactSummary?.blockers || []),
  ];
  report.blockingEditorialDecisions = [...new Map(
    blockingEditorialDecisions.map((blocker) => [
      blocker.relationId
        ? `${blocker.code}:relation:${blocker.relationId}`
        : `${blocker.code}:${blocker.entity?.type || ''}:${blocker.entity?.id || ''}`,
      blocker,
    ]),
  ).values()];
  const debtBudgetErrors = Object.entries(CONTENT_DEBT_BUDGETS)
    .filter(([key, maximum]) => report[key].length > maximum)
    .map(([key, maximum]) => (
      `${key} cresceu para ${report[key].length}; o budget editorial é ${maximum}`
    ));
  if (debtBudgetErrors.length) {
    throw new Error(`Dívida editorial acima do limite:\n- ${debtBudgetErrors.join('\n- ')}`);
  }
  if (report.relationsAwaitingEvidence.length) {
    report.warnings.push(
      `${report.relationsAwaitingEvidence.length} relação(ões) tipadas ainda aguardam evidência bibliográfica específica`,
    );
    report.warnings.sort();
  }
  if (report.experimentTheoryLinksAwaitingMigration.length) {
    report.warnings.push(
      `${report.experimentTheoryLinksAwaitingMigration.length} vínculo(s) legado(s) experimento→teoria ainda aguardam relação editorial tipada`,
    );
    report.warnings.sort();
  }
  if (report.legacyRelationReviewBaselines.length) {
    report.warnings.push(
      `${report.legacyRelationReviewBaselines.length} relação(ões) revisada(s) preservam baseline técnico legado e aguardam a primeira revisão editorial explícita`,
    );
    report.warnings.sort();
  }
  if (report.blockingEditorialDecisions.length) {
    throw new Error(
      'Publicação bloqueada por decisões editoriais pendentes:\n- '
      + report.blockingEditorialDecisions
        .map(({ code, entity, relationId }) => (
          `${entity ? `${entity.type}:${entity.id} ` : ''}${relationId || ''} (${code})`.trim()
        ))
        .join('\n- '),
    );
  }
  const outputs = buildOutputs({
    theories: theoryCompilation.theories,
    legacyTheoryRelations: theoryCompilation.legacyRelations,
    figures: figureCompilation.figures,
    trails: figureCompilation.trails,
    events: figureCompilation.events,
    theoryTaxonomy,
    figureTaxonomy,
    relationTaxonomy,
    publicationTaxonomy,
    theoryReferences: referenceCompilation.theoryReferences,
    figureReferences: referenceCompilation.figureReferences,
    constellationReferences: referenceCompilation.constellationReferences,
    references,
    referenceIndex,
    relations,
    relationIndex,
    parties,
    publications,
    constellations: canonicalConstellations,
    experiments: canonicalExperiments,
    experimentTaxonomy,
    paths: canonicalPaths,
    researchTracks: canonicalResearchTracks,
    sitePages: canonicalSitePages,
    canonicalTheories,
    canonicalFigures,
    searchIndex,
    metrics,
    fingerprint,
  });

  const serializedOutput = [...outputs.values()].join('\n');
  if (serializedOutput.includes(PRIVATE_CANARY)) {
    throw new Error('Canary privado alcançou o runtime público');
  }

  if (writeIntegrityReport) await writeReport(report);
  if (writeRuntime) await writeOutputs(outputs);
  if (checkRuntime) await checkOutputs(outputs);

  return Object.freeze({
    fingerprint,
    metrics: Object.freeze({ ...metrics }),
    report: Object.freeze(report),
    outputs,
  });
}

export async function compileContent(options = {}) {
  const {
    contentTransactionLockHeld = false,
    ...compileOptions
  } = options;
  const compile = async () => {
    if (!compileOptions.writeRuntime) return compileContentUnlocked(compileOptions);
    const releaseRuntimeLock = await acquireRuntimeLock();
    try {
      return await compileContentUnlocked(compileOptions);
    } finally {
      await releaseRuntimeLock();
    }
  };
  if (contentTransactionLockHeld) return compile();

  const releaseContentLock = await acquireContentTransactionLock();
  try {
    return await compile();
  } finally {
    await releaseContentLock();
  }
}
