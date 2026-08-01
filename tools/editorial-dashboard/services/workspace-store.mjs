import { randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import {
  dirname,
  isAbsolute,
  relative,
  resolve,
} from 'node:path';
import { CHANGE_CLASSES } from '../../../scripts/content/content-contracts.mjs';
import { prefixedCanonicalHash } from '../../../scripts/content/canonical-hash.mjs';
import { findPrivateData } from '../../../scripts/content/schema-validator.mjs';
import {
  assertEntityId,
  DASHBOARD_PROJECT_ROOT,
} from './catalog-service.mjs';
import { DashboardError } from './errors.mjs';

const WORKSPACE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CHANGE_CLASS_SET = new Set(CHANGE_CLASSES);
const OPERATION_TYPES = new Set(['party', 'reference', 'relation', 'theory']);
const RECOVERABLE_WORKSPACE_ERROR_CODES = new Set([
  'workspace-record-tampered',
  'workspace-state-invalid',
  'workspace-state-missing',
]);
const RECOVERABLE_WORKSPACE_FS_CODES = new Set([
  'EISDIR',
  'ENOENT',
]);

function isInside(parent, child) {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
}

function assertWorkspaceId(workspaceId) {
  if (typeof workspaceId !== 'string' || !WORKSPACE_ID_PATTERN.test(workspaceId)) {
    throw new DashboardError('Workspace editorial inválido.', {
      code: 'invalid-workspace-id',
      status: 400,
    });
  }
}

function assertOperationType(type) {
  if (!OPERATION_TYPES.has(type)) {
    throw new DashboardError('Tipo de operação não permitido no MVP.', {
      code: 'invalid-operation-type',
      status: 400,
    });
  }
}

function operationKey(type, id) {
  return `${type}:${id}`;
}

function operationFilename(type, id) {
  return `${type}--${id}.json`;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJsonAtomic(path, value) {
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
}

function nextTheoryRevision(theory) {
  if (
    theory.entityType !== 'theory'
    || !Array.isArray(theory.revisions)
    || theory.revisions.length === 0
  ) {
    throw new DashboardError('A teoria não possui histórico revisionável.', {
      code: 'invalid-theory-history',
      status: 422,
    });
  }
  const match = theory.revisionId?.match(new RegExp(`^${theory.id}-r([1-9][0-9]*)$`));
  const currentOrdinal = match ? Number(match[1]) : null;
  const historyOrdinal = theory.revisions.at(-1)?.ordinal;
  if (
    currentOrdinal === null
    || historyOrdinal !== currentOrdinal
    || theory.revisions.at(-1)?.revisionId !== theory.revisionId
  ) {
    throw new DashboardError('O histórico da teoria diverge da revisão vigente.', {
      code: 'inconsistent-theory-history',
      status: 422,
    });
  }
  const ordinal = currentOrdinal + 1;
  const revisionId = `${theory.id}-r${ordinal}`;
  const record = structuredClone(theory);
  record.revisionId = revisionId;
  record.revisions.push({
    revisionId,
    ordinal,
    versionLabel: '',
    reviewedAt: '',
    label: '',
    changeSummary: '',
    responsibles: [],
  });
  return {
    ordinal,
    record,
    revisionId,
  };
}

function manifestFromState(state) {
  return {
    schemaVersion: 1,
    operations: state.operations.map((operation) => ({
      type: operation.type,
      id: operation.id,
      source: `records/${operationFilename(operation.type, operation.id)}`,
      ...(operation.changeClass ? { changeClass: operation.changeClass } : {}),
      ...(operation.force ? { force: true } : {}),
    })),
  };
}

function publicState(state) {
  return {
    schemaVersion: state.schemaVersion,
    id: state.id,
    entityType: state.entityType,
    entityId: state.entityId,
    baseRevisionId: state.baseRevisionId,
    nextRevisionId: state.nextRevisionId,
    nextRevisionOrdinal: state.nextRevisionOrdinal,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    version: state.version,
    operations: state.operations.map((operation) => ({
      type: operation.type,
      id: operation.id,
      changeClass: operation.changeClass,
      force: operation.force,
      decision: operation.decision || null,
      recordHash: operation.recordHash,
    })),
    lastImpact: state.lastImpact || null,
    lastPreview: state.lastPreview || null,
    applied: state.applied || null,
  };
}

function isRecoverableWorkspaceCorruption(error) {
  return (
    error instanceof SyntaxError
    || RECOVERABLE_WORKSPACE_ERROR_CODES.has(error?.code)
    || RECOVERABLE_WORKSPACE_FS_CODES.has(error?.code)
  );
}

function publicCorruptionCode(error) {
  if (RECOVERABLE_WORKSPACE_ERROR_CODES.has(error?.code)) return error.code;
  if (error instanceof SyntaxError) return 'workspace-json-invalid';
  if (error?.code === 'ENOENT') return 'workspace-file-missing';
  return 'workspace-file-invalid';
}

function corruptedPublicState(workspaceId, error, validState = null) {
  const safeState = validState ? publicState(validState) : null;
  return {
    schemaVersion: safeState?.schemaVersion || 1,
    id: workspaceId,
    entityType: safeState?.entityType || null,
    entityId: safeState?.entityId || null,
    baseRevisionId: safeState?.baseRevisionId || null,
    nextRevisionId: safeState?.nextRevisionId || null,
    nextRevisionOrdinal: safeState?.nextRevisionOrdinal || null,
    createdAt: safeState?.createdAt || null,
    updatedAt: safeState?.updatedAt || null,
    version: safeState?.version || null,
    operations: [],
    lastImpact: null,
    lastPreview: null,
    applied: null,
    corrupted: true,
    corruption: {
      code: publicCorruptionCode(error),
      canDelete: true,
      message: 'Os arquivos privados deste workspace estão incompletos ou inconsistentes.',
    },
  };
}

function assertNoPrivateData(record) {
  const findings = findPrivateData(record);
  if (findings.length) {
    throw new DashboardError('O rascunho contém campos privados proibidos.', {
      code: 'private-data-rejected',
      details: findings,
      status: 422,
    });
  }
}

export function createWorkspaceStore({
  projectRoot = DASHBOARD_PROJECT_ROOT,
  workspaceRoot = resolve(projectRoot, '.content-drafts', 'editorial-dashboard'),
} = {}) {
  const privateDraftRoot = resolve(
    projectRoot,
    '.content-drafts',
    'editorial-dashboard',
  );
  const publicContentRoot = resolve(projectRoot, 'content', 'public');
  if (
    !isInside(projectRoot, workspaceRoot)
    || !isInside(privateDraftRoot, workspaceRoot)
    || isInside(publicContentRoot, workspaceRoot)
  ) {
    throw new Error(
      'A raiz de workspaces precisa permanecer em .content-drafts/editorial-dashboard',
    );
  }

  const locks = new Map();
  let initialization = null;

  async function assertSafePathChain(target) {
    if (!isInside(projectRoot, target)) {
      throw new DashboardError('Caminho privado fora do projeto.', {
        code: 'unsafe-workspace-root',
        status: 500,
      });
    }
    const pathFromRoot = relative(projectRoot, target);
    let cursor = projectRoot;
    for (const segment of pathFromRoot.split(/[\\/]/).filter(Boolean)) {
      cursor = resolve(cursor, segment);
      const info = await lstat(cursor).catch((error) => {
        if (error.code === 'ENOENT') return null;
        throw error;
      });
      if (info?.isSymbolicLink()) {
        throw new DashboardError('Link simbólico recusado na área de rascunhos.', {
          code: 'workspace-symlink-rejected',
          status: 500,
        });
      }
      if (info && !info.isDirectory() && cursor !== target) {
        throw new DashboardError('A área de rascunhos possui um ancestral inválido.', {
          code: 'unsafe-workspace-root',
          status: 500,
        });
      }
    }
  }

  async function ensureWorkspaceRoot() {
    if (!initialization) {
      initialization = (async () => {
        await assertSafePathChain(dirname(workspaceRoot));
        await mkdir(workspaceRoot, { recursive: true });
        await assertSafePathChain(workspaceRoot);
        const [resolvedProject, resolvedWorkspace, resolvedPublicContent] = await Promise.all([
          realpath(projectRoot),
          realpath(workspaceRoot),
          realpath(publicContentRoot).catch(() => publicContentRoot),
        ]);
        if (
          !isInside(resolvedProject, resolvedWorkspace)
          || isInside(resolvedPublicContent, resolvedWorkspace)
        ) {
          throw new DashboardError('A raiz real de rascunhos é insegura.', {
            code: 'unsafe-workspace-root',
            status: 500,
          });
        }
      })();
    }
    return initialization;
  }

  function workspaceDirectory(workspaceId) {
    assertWorkspaceId(workspaceId);
    const directory = resolve(workspaceRoot, workspaceId);
    if (!isInside(workspaceRoot, directory)) throw new Error('Workspace fora da raiz privada');
    return directory;
  }

  function statePath(workspaceId) {
    return resolve(workspaceDirectory(workspaceId), 'state.json');
  }

  function manifestPath(workspaceId) {
    return resolve(workspaceDirectory(workspaceId), 'manifest.json');
  }

  function recordPath(workspaceId, type, id) {
    assertOperationType(type);
    assertEntityId(type, id);
    const recordsRoot = resolve(workspaceDirectory(workspaceId), 'records');
    const path = resolve(recordsRoot, operationFilename(type, id));
    if (!isInside(recordsRoot, path)) throw new Error('Registro fora do workspace');
    return path;
  }

  async function assertWorkspaceDirectory(workspaceId) {
    await ensureWorkspaceRoot();
    await assertSafePathChain(workspaceRoot);
    const directory = workspaceDirectory(workspaceId);
    const info = await lstat(directory).catch((error) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (info?.isSymbolicLink()) {
      throw new DashboardError('Link simbólico recusado na área de rascunhos.', {
        code: 'workspace-symlink-rejected',
        status: 500,
      });
    }
    if (!info?.isDirectory()) {
      throw new DashboardError('Workspace editorial não encontrado.', {
        code: 'workspace-not-found',
        status: 404,
      });
    }
    return directory;
  }

  async function readState(workspaceId) {
    await assertWorkspaceDirectory(workspaceId);
    try {
      const path = statePath(workspaceId);
      await assertSafePathChain(path);
      const state = await readJson(path);
      const operationKeys = new Set();
      if (
        !state
        || typeof state !== 'object'
        || Array.isArray(state)
        || state.schemaVersion !== 1
        || state.id !== workspaceId
        || state.entityType !== 'theory'
        || typeof state.entityId !== 'string'
        || !Number.isInteger(state.version)
        || state.version < 1
        || !Array.isArray(state.operations)
        || state.operations.length < 1
      ) {
        throw new DashboardError('Estado privado do workspace inválido.', {
          code: 'workspace-state-invalid',
          status: 409,
        });
      }
      try {
        assertEntityId('theory', state.entityId);
        for (const operation of state.operations) {
          assertOperationType(operation.type);
          assertEntityId(operation.type, operation.id);
          const key = operationKey(operation.type, operation.id);
          if (
            operationKeys.has(key)
            || operation.source
              !== `records/${operationFilename(operation.type, operation.id)}`
            || (
              operation.changeClass !== null
              && !CHANGE_CLASS_SET.has(operation.changeClass)
            )
            || typeof operation.force !== 'boolean'
            || !/^sha256:[a-f0-9]{64}$/.test(operation.recordHash || '')
          ) {
            throw new Error('operação inválida');
          }
          operationKeys.add(key);
        }
      } catch (error) {
        if (error instanceof DashboardError && error.code === 'workspace-state-invalid') {
          throw error;
        }
        throw new DashboardError('Operações privadas do workspace são inválidas.', {
          code: 'workspace-state-invalid',
          status: 409,
        });
      }
      if (!operationKeys.has(operationKey(state.entityType, state.entityId))) {
        throw new DashboardError('Operação primária ausente no workspace.', {
          code: 'workspace-state-invalid',
          status: 409,
        });
      }
      return state;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new DashboardError('Estado do workspace não encontrado.', {
          code: 'workspace-state-missing',
          status: 409,
        });
      }
      throw error;
    }
  }

  async function readOperationRecord(workspaceId, operation) {
    const path = recordPath(workspaceId, operation.type, operation.id);
    await assertSafePathChain(path);
    return readJson(path);
  }

  async function synchronizeManifest(workspaceId, state) {
    const manifest = manifestFromState(state);
    await writeJsonAtomic(manifestPath(workspaceId), manifest);
    return manifest;
  }

  async function readWorkspaceUnlocked(workspaceId) {
    const state = await readState(workspaceId);
    const operations = await Promise.all(state.operations.map(async (operation) => {
      const record = await readOperationRecord(workspaceId, operation);
      if (prefixedCanonicalHash(record) !== operation.recordHash) {
        throw new DashboardError('Um rascunho foi alterado fora da dashboard.', {
          code: 'workspace-record-tampered',
          details: { type: operation.type, id: operation.id },
          status: 409,
        });
      }
      return { ...operation, record };
    }));
    return {
      ...publicState(state),
      records: operations.map(({ record, ...operation }) => ({
        ...operation,
        record,
      })),
      primaryRecord: operations.find(({ type, id }) => (
        type === state.entityType && id === state.entityId
      ))?.record || null,
    };
  }

  async function withWorkspaceLock(workspaceId, operation) {
    assertWorkspaceId(workspaceId);
    const previous = locks.get(workspaceId) || Promise.resolve();
    let release;
    const gate = new Promise((resolveGate) => {
      release = resolveGate;
    });
    const tail = previous.then(() => gate);
    locks.set(workspaceId, tail);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (locks.get(workspaceId) === tail) locks.delete(workspaceId);
    }
  }

  async function createTheoryWorkspace(canonicalTheory) {
    await ensureWorkspaceRoot();
    await assertSafePathChain(workspaceRoot);
    assertEntityId('theory', canonicalTheory?.id);
    const revision = nextTheoryRevision(canonicalTheory);
    const workspaceId = randomUUID();
    const directory = workspaceDirectory(workspaceId);
    await mkdir(resolve(directory, 'records'), { recursive: true });
    await assertSafePathChain(resolve(directory, 'records'));
    const now = new Date().toISOString();
    const source = `records/${operationFilename('theory', canonicalTheory.id)}`;
    const operation = {
      type: 'theory',
      id: canonicalTheory.id,
      source,
      changeClass: null,
      force: true,
      decision: null,
      recordHash: prefixedCanonicalHash(revision.record),
    };
    const state = {
      schemaVersion: 1,
      id: workspaceId,
      entityType: 'theory',
      entityId: canonicalTheory.id,
      baseRevisionId: canonicalTheory.revisionId,
      baseRecordHash: prefixedCanonicalHash(canonicalTheory),
      nextRevisionId: revision.revisionId,
      nextRevisionOrdinal: revision.ordinal,
      createdAt: now,
      updatedAt: now,
      version: 1,
      operations: [operation],
      lastImpact: null,
      lastPreview: null,
      applied: null,
    };
    await writeJsonAtomic(
      recordPath(workspaceId, 'theory', canonicalTheory.id),
      revision.record,
    );
    await writeJsonAtomic(statePath(workspaceId), state);
    await synchronizeManifest(workspaceId, state);
    return readWorkspaceUnlocked(workspaceId);
  }

  function assertVersion(state, expectedVersion) {
    if (!Number.isInteger(expectedVersion) || expectedVersion !== state.version) {
      throw new DashboardError('O workspace mudou desde a última leitura.', {
        code: 'stale-workspace',
        details: { currentVersion: state.version },
        status: 409,
      });
    }
  }

  async function savePrimaryRecordUnlocked(workspaceId, {
    changeClass,
    record,
    version,
  }) {
    const state = await readState(workspaceId);
    assertVersion(state, version);
    if (
      !record
      || typeof record !== 'object'
      || Array.isArray(record)
      || record.entityType !== state.entityType
      || record.id !== state.entityId
    ) {
      throw new DashboardError('O rascunho diverge da teoria do workspace.', {
        code: 'workspace-identity-mismatch',
        status: 422,
      });
    }
    if (changeClass !== null && !CHANGE_CLASS_SET.has(changeClass)) {
      throw new DashboardError('Classe de mudança inválida.', {
        code: 'invalid-change-class',
        status: 422,
      });
    }
    assertNoPrivateData(record);
    const operation = state.operations.find(({ type, id }) => (
      type === state.entityType && id === state.entityId
    ));
    if (!operation) throw new Error('Operação primária ausente');
    operation.changeClass = changeClass;
    operation.recordHash = prefixedCanonicalHash(record);
    state.version += 1;
    state.updatedAt = new Date().toISOString();
    state.lastImpact = null;
    state.lastPreview = null;
    state.applied = null;
    const primaryPath = recordPath(workspaceId, operation.type, operation.id);
    await assertSafePathChain(dirname(primaryPath));
    await writeJsonAtomic(primaryPath, record);
    await writeJsonAtomic(statePath(workspaceId), state);
    await synchronizeManifest(workspaceId, state);
    return readWorkspaceUnlocked(workspaceId);
  }

  async function upsertOperationsUnlocked(workspaceId, {
    operations,
    version,
  }) {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new DashboardError('Informe ao menos uma operação editorial.', {
        code: 'empty-operation-set',
        status: 422,
      });
    }
    const state = await readState(workspaceId);
    assertVersion(state, version);
    const seen = new Set();
    const prepared = operations.map((operation) => {
      const {
        changeClass,
        decision = null,
        force,
        record,
        type,
      } = operation;
      assertOperationType(type);
      assertEntityId(type, record?.id);
      const key = operationKey(type, record.id);
      if (seen.has(key)) {
        throw new DashboardError(`Operação duplicada para ${key}.`, {
          code: 'duplicate-operation',
          status: 422,
        });
      }
      seen.add(key);
      if (
        !record
        || typeof record !== 'object'
        || Array.isArray(record)
        || record.entityType !== type
      ) {
        throw new DashboardError('Registro da operação inválido.', {
          code: 'operation-identity-mismatch',
          status: 422,
        });
      }
      if (!CHANGE_CLASS_SET.has(changeClass)) {
        throw new DashboardError('A operação exige uma classe de mudança válida.', {
          code: 'invalid-change-class',
          status: 422,
        });
      }
      assertNoPrivateData(record);
      return {
        type,
        id: record.id,
        source: `records/${operationFilename(type, record.id)}`,
        changeClass,
        force: Boolean(force),
        decision,
        recordHash: prefixedCanonicalHash(record),
        record,
      };
    });
    for (const operation of prepared) {
      const index = state.operations.findIndex((candidate) => (
        operationKey(candidate.type, candidate.id)
          === operationKey(operation.type, operation.id)
      ));
      const { record, ...stateOperation } = operation;
      if (index === -1) state.operations.push(stateOperation);
      else state.operations[index] = stateOperation;
    }
    state.operations.sort((left, right) => (
      operationKey(left.type, left.id).localeCompare(operationKey(right.type, right.id), 'en')
    ));
    state.version += 1;
    state.updatedAt = new Date().toISOString();
    state.lastImpact = null;
    state.lastPreview = null;
    state.applied = null;
    for (const operation of prepared) {
      const path = recordPath(workspaceId, operation.type, operation.id);
      await assertSafePathChain(dirname(path));
      await writeJsonAtomic(
        path,
        operation.record,
      );
    }
    await writeJsonAtomic(statePath(workspaceId), state);
    await synchronizeManifest(workspaceId, state);
    return readWorkspaceUnlocked(workspaceId);
  }

  async function upsertOperationUnlocked(workspaceId, operation) {
    return upsertOperationsUnlocked(workspaceId, {
      operations: [operation],
      version: operation.version,
    });
  }

  async function removeOperationsUnlocked(workspaceId, {
    operations,
    version,
  }) {
    if (!Array.isArray(operations) || operations.length === 0) {
      return readWorkspaceUnlocked(workspaceId);
    }
    const state = await readState(workspaceId);
    assertVersion(state, version);
    const keys = new Set(operations.map(({ type, id }) => {
      assertOperationType(type);
      assertEntityId(type, id);
      const key = operationKey(type, id);
      if (key === operationKey(state.entityType, state.entityId)) {
        throw new DashboardError('A operação primária não pode ser removida.', {
          code: 'primary-operation-required',
          status: 422,
        });
      }
      return key;
    }));
    const removed = state.operations.filter(({ type, id }) => (
      keys.has(operationKey(type, id))
    ));
    if (!removed.length) return readWorkspaceUnlocked(workspaceId);
    state.operations = state.operations.filter(({ type, id }) => (
      !keys.has(operationKey(type, id))
    ));
    state.version += 1;
    state.updatedAt = new Date().toISOString();
    state.lastImpact = null;
    state.lastPreview = null;
    state.applied = null;
    await writeJsonAtomic(statePath(workspaceId), state);
    await synchronizeManifest(workspaceId, state);
    for (const operation of removed) {
      const path = recordPath(workspaceId, operation.type, operation.id);
      await assertSafePathChain(dirname(path));
      await rm(path, { force: true });
    }
    return readWorkspaceUnlocked(workspaceId);
  }

  async function recordImpactUnlocked(workspaceId, {
    allowed,
    digest,
  }) {
    const state = await readState(workspaceId);
    state.lastImpact = {
      digest,
      allowed: Boolean(allowed),
      analyzedAt: new Date().toISOString(),
      workspaceVersion: state.version,
    };
    state.lastPreview = null;
    state.updatedAt = new Date().toISOString();
    await writeJsonAtomic(statePath(workspaceId), state);
    return publicState(state);
  }

  async function recordPreviewUnlocked(workspaceId, preview) {
    const state = await readState(workspaceId);
    state.lastPreview = {
      ...preview,
      workspaceVersion: state.version,
    };
    state.updatedAt = new Date().toISOString();
    await writeJsonAtomic(statePath(workspaceId), state);
    return publicState(state);
  }

  async function clearPreviewUnlocked(workspaceId, previewId = null) {
    const state = await readState(workspaceId);
    if (
      state.lastPreview
      && (previewId === null || state.lastPreview.id === previewId)
    ) {
      state.lastPreview = null;
      state.updatedAt = new Date().toISOString();
      await writeJsonAtomic(statePath(workspaceId), state);
    }
    return publicState(state);
  }

  async function recordAppliedUnlocked(workspaceId, installed) {
    const state = await readState(workspaceId);
    state.applied = {
      appliedAt: new Date().toISOString(),
      impactDigest: state.lastImpact?.digest || null,
      installed,
    };
    state.updatedAt = new Date().toISOString();
    await writeJsonAtomic(statePath(workspaceId), state);
    return publicState(state);
  }

  async function listWorkspaces() {
    await ensureWorkspaceRoot();
    await assertSafePathChain(workspaceRoot);
    const entries = await readdir(workspaceRoot, { withFileTypes: true });
    const states = [];
    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        throw new DashboardError('Link simbólico recusado na área de rascunhos.', {
          code: 'workspace-symlink-rejected',
          status: 500,
        });
      }
      if (!entry.isDirectory() || !WORKSPACE_ID_PATTERN.test(entry.name)) {
        continue;
      }
      let validState = null;
      try {
        const workspace = await withWorkspaceLock(
          entry.name,
          () => readWorkspaceUnlocked(entry.name),
        );
        const {
          primaryRecord: _primaryRecord,
          records: _records,
          ...summary
        } = workspace;
        states.push(summary);
      } catch (error) {
        if (error instanceof DashboardError && error.code === 'workspace-not-found') {
          continue;
        }
        if (!isRecoverableWorkspaceCorruption(error)) throw error;
        try {
          validState = await withWorkspaceLock(
            entry.name,
            () => readState(entry.name),
          );
        } catch (stateError) {
          if (
            stateError instanceof DashboardError
            && stateError.code === 'workspace-not-found'
          ) {
            continue;
          }
          if (!isRecoverableWorkspaceCorruption(stateError)) throw stateError;
        }
        states.push(corruptedPublicState(entry.name, error, validState));
      }
    }
    return states.sort((left, right) => {
      const timestampOrder = String(right.updatedAt || right.createdAt || '')
        .localeCompare(String(left.updatedAt || left.createdAt || ''), 'en');
      return timestampOrder || left.id.localeCompare(right.id, 'en');
    });
  }

  async function deleteWorkspaceUnlocked(workspaceId) {
    const directory = await assertWorkspaceDirectory(workspaceId);
    await rm(directory, { force: true, recursive: true });
    return true;
  }

  async function prepareManifestUnlocked(workspaceId) {
    const state = await readState(workspaceId);
    const manifest = await synchronizeManifest(workspaceId, state);
    return {
      manifest,
      manifestPath: manifestPath(workspaceId),
      state,
    };
  }

  return Object.freeze({
    createTheoryWorkspace,
    clearPreviewUnlocked,
    deleteWorkspaceUnlocked,
    listWorkspaces,
    manifestPath,
    prepareManifestUnlocked,
    readOperationRecord,
    readState,
    readWorkspaceUnlocked,
    recordImpactUnlocked,
    recordAppliedUnlocked,
    recordPreviewUnlocked,
    removeOperationsUnlocked,
    savePrimaryRecordUnlocked,
    upsertOperationUnlocked,
    upsertOperationsUnlocked,
    withWorkspaceLock,
    workspaceDirectory,
    workspaceRoot,
  });
}
