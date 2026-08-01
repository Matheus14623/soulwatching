import {
  readFile,
  readdir,
} from 'node:fs/promises';
import {
  dirname,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileContent } from '../../../scripts/content/compiler.mjs';
import {
  CONTENT_DIRECTORY_BY_TYPE,
  CONTENT_NEW_TYPES,
} from '../../../scripts/content/content-contracts.mjs';
import {
  CONTENT_TRANSACTION_LOCK_PATH,
  PUBLIC_CONTENT_ROOT,
  SCHEMA_ROOT,
} from '../../../scripts/content/paths.mjs';
import { withFileLock } from '../../../scripts/content/file-lock.mjs';
import { DashboardError } from './errors.mjs';

export const DASHBOARD_PROJECT_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
);

export const ENTITY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RELATION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)+$/;

const READABLE_TYPES = new Set([
  ...CONTENT_NEW_TYPES,
  'figure-trail',
  'timeline-event',
]);

function assertType(type) {
  if (!READABLE_TYPES.has(type) || !CONTENT_DIRECTORY_BY_TYPE[type]) {
    throw new DashboardError('Tipo de conteúdo não permitido.', {
      code: 'invalid-entity-type',
      status: 400,
    });
  }
}

export function assertEntityId(type, id) {
  const pattern = type === 'relation' ? RELATION_ID_PATTERN : ENTITY_ID_PATTERN;
  if (typeof id !== 'string' || !pattern.test(id)) {
    throw new DashboardError('Identificador editorial inválido.', {
      code: 'invalid-entity-id',
      status: 400,
    });
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function notFound(type, id) {
  return new DashboardError(`Registro ${type}:${id} não encontrado.`, {
    code: 'content-not-found',
    status: 404,
  });
}

export function createCatalogService({
  compile = compileContent,
  contentRoot = PUBLIC_CONTENT_ROOT,
  lockPath = CONTENT_TRANSACTION_LOCK_PATH,
  schemaRoot = SCHEMA_ROOT,
} = {}) {
  const directoryFor = (type) => {
    assertType(type);
    return resolve(contentRoot, CONTENT_DIRECTORY_BY_TYPE[type]);
  };

  async function readConsistent(operation) {
    return withFileLock(lockPath, operation, {
      label: 'uma leitura editorial consistente',
    });
  }

  async function getRecordUnlocked(type, id) {
    assertType(type);
    assertEntityId(type, id);
    const path = resolve(directoryFor(type), `${id}.json`);
    try {
      const record = await readJson(path);
      if (record.entityType !== type || record.id !== id) throw notFound(type, id);
      return record;
    } catch (error) {
      if (error.code === 'ENOENT') throw notFound(type, id);
      throw error;
    }
  }

  async function listRecordsUnlocked(type) {
    const directory = directoryFor(type);
    const filenames = (await readdir(directory).catch((error) => {
      if (error.code === 'ENOENT') return [];
      throw error;
    }))
      .filter((filename) => filename.endsWith('.json'))
      .sort((left, right) => left.localeCompare(right, 'en'));
    return Promise.all(filenames.map(async (filename) => {
      const id = filename.slice(0, -5);
      return getRecordUnlocked(type, id);
    }));
  }

  async function listTheories() {
    const theories = await readConsistent(() => listRecordsUnlocked('theory'));
    return theories
      .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id, 'en'))
      .map((theory) => ({
        id: theory.id,
        slug: theory.slug,
        code: theory.code,
        title: theory.title,
        shortTitle: theory.shortTitle,
        summary: theory.summary,
        reviewState: theory.reviewState,
        kind: theory.kind,
        category: theory.category,
        revisionId: theory.revisionId,
        versionLabel: theory.revisions?.at(-1)?.versionLabel || '',
      }));
  }

  async function listReferences() {
    const references = await readConsistent(() => listRecordsUnlocked('reference'));
    return references
      .sort((left, right) => (
        String(left.title || '').localeCompare(String(right.title || ''), 'pt-BR')
        || left.id.localeCompare(right.id, 'en')
      ))
      .map((reference) => ({
        id: reference.id,
        title: reference.title || '',
        authors: reference.authors || '',
        year: reference.year || '',
        kind: reference.kind || '',
        url: reference.url || '',
      }));
  }

  async function listParties() {
    const parties = await readConsistent(() => listRecordsUnlocked('party'));
    return parties
      .sort((left, right) => (
        String(left.displayName || '').localeCompare(
          String(right.displayName || ''),
          'pt-BR',
        )
        || left.id.localeCompare(right.id, 'en')
      ))
      .map((party) => ({
        id: party.id,
        displayName: party.displayName || '',
        partyType: party.partyType || '',
      }));
  }

  async function getSchema(type) {
    assertType(type);
    try {
      return await readJson(resolve(schemaRoot, `${type}.schema.json`));
    } catch (error) {
      if (error.code === 'ENOENT') throw notFound('schema', type);
      throw error;
    }
  }

  async function relationTypes() {
    return readConsistent(() => readJson(resolve(
      contentRoot,
      'taxonomies',
      'relation-types.json',
    )));
  }

  async function overview() {
    const result = await compile();
    return {
      fingerprint: result.fingerprint,
      metrics: result.metrics,
      report: {
        warnings: result.report.warnings,
        orphanReferenceIds: result.report.orphanReferenceIds,
        relationsAwaitingEvidence: result.report.relationsAwaitingEvidence,
        relationsNeedingReview: result.report.relationsNeedingReview,
        legacyRelationReviewBaselines: result.report.legacyRelationReviewBaselines,
        experimentTheoryLinksAwaitingMigration:
          result.report.experimentTheoryLinksAwaitingMigration,
        blockingEditorialDecisions: result.report.blockingEditorialDecisions,
      },
    };
  }

  return Object.freeze({
    getRecord(type, id) {
      return readConsistent(() => getRecordUnlocked(type, id));
    },
    getRecordUnlocked,
    getSchema,
    listRecords(type) {
      return readConsistent(() => listRecordsUnlocked(type));
    },
    listRecordsUnlocked,
    listParties,
    listReferences,
    listTheories,
    overview,
    relationTypes,
  });
}
