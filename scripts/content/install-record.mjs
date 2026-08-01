import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import {
  dirname,
  isAbsolute,
  relative,
} from 'node:path';
import { compileContent } from './compiler.mjs';
import {
  assertUniqueEditorialOperations,
  CHANGE_CLASSES,
  CHANGE_CLASS_REQUIRED_TYPES,
} from './content-contracts.mjs';
import {
  EDITORIAL_REVISION_ENTITY_TYPES,
  updateEditorialRevisionLedger,
} from './editorial-revision-ledger.mjs';
import { withFileLock } from './file-lock.mjs';
import {
  CONTENT_TRANSACTION_LOCK_PATH,
  EDITORIAL_REVISION_LEDGER_PATH,
  INTEGRITY_REPORT_PATH,
  PUBLIC_CONTENT_ROOT,
} from './paths.mjs';
import { mergePublicationRevisionLedger } from './publication-revision-ledger.mjs';
import { validateReplacement } from './revision-policy.mjs';

const CHANGE_CLASS_SET = new Set(CHANGE_CLASSES);
const CHANGE_CLASS_REQUIRED_TYPE_SET = new Set(CHANGE_CLASS_REQUIRED_TYPES);

function publicationLedgerSource(records, previousLedger) {
  if (previousLedger === null) {
    throw new Error('O ledger de revisões precisa existir antes de instalar uma publicação');
  }
  const ledger = mergePublicationRevisionLedger(JSON.parse(previousLedger), records);
  return `${JSON.stringify(ledger, null, 2)}\n`;
}

async function readOptional(path, readText) {
  return readText(path, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
}

function normalizeOperations(operations) {
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error('A transação editorial exige ao menos uma operação');
  }
  assertUniqueEditorialOperations(operations);
  const destinations = new Set();
  return operations.map((operation, index) => {
    if (!operation || typeof operation !== 'object') {
      throw new Error(`Operação editorial ${index + 1} inválida`);
    }
    const {
      changeClass = null,
      destination,
      force = false,
      ledgerPath = null,
      record,
      type,
    } = operation;
    if (typeof destination !== 'string' || !destination) {
      throw new Error(`Operação editorial ${index + 1} sem destino`);
    }
    if (destinations.has(destination)) {
      throw new Error(`Destino duplicado na mesma transação editorial: ${destination}`);
    }
    destinations.add(destination);
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new Error(`Operação editorial ${index + 1} sem registro válido`);
    }
    if (typeof type !== 'string' || !type) {
      throw new Error(`Operação editorial ${index + 1} sem tipo`);
    }
    if (changeClass !== null && !CHANGE_CLASS_SET.has(changeClass)) {
      throw new Error(
        `Classe de mudança inválida para ${type}:${record.id || index + 1}: ${changeClass}`,
      );
    }
    return {
      changeClass,
      destination,
      force: Boolean(force),
      ledgerPath,
      record: structuredClone(record),
      type,
    };
  });
}

export async function preparePublicationLedgerUpdates({
  operations,
  readText,
}) {
  const recordsByLedger = new Map();
  for (const operation of operations) {
    if (operation.type !== 'publication') continue;
    if (typeof operation.ledgerPath !== 'string' || !operation.ledgerPath) {
      throw new Error(
        `A publicação ${operation.record.id} exige o caminho do ledger de revisões`,
      );
    }
    const records = recordsByLedger.get(operation.ledgerPath) || [];
    records.push(operation.record);
    recordsByLedger.set(operation.ledgerPath, records);
  }

  const updates = [];
  for (const [path, records] of recordsByLedger) {
    const previous = await readOptional(path, readText);
    updates.push({
      path,
      previous,
      next: publicationLedgerSource(records, previous),
    });
  }
  return updates;
}

function isInside(parent, child) {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
}

export async function prepareContentLedgerUpdates({
  editorialChangeSet,
  editorialLedgerPath = null,
  operations,
  readText,
}) {
  const updates = await preparePublicationLedgerUpdates({ operations, readText });
  const trackedOperations = editorialChangeSet.operations.filter((operation, index) => (
    EDITORIAL_REVISION_ENTITY_TYPES.includes(operation.type)
    && (editorialLedgerPath || isInside(PUBLIC_CONTENT_ROOT, operations[index].destination))
  ));
  if (!trackedOperations.length) return updates;

  const path = editorialLedgerPath || EDITORIAL_REVISION_LEDGER_PATH;
  const previous = await readOptional(path, readText);
  if (previous === null) {
    throw new Error('O ledger editorial precisa existir antes de instalar conteúdo público');
  }
  const next = updateEditorialRevisionLedger(
    JSON.parse(previous),
    trackedOperations,
  );
  updates.push({
    path,
    previous,
    next: `${JSON.stringify(next, null, 2)}\n`,
  });
  return updates;
}

function validateLedgerUpdates(updates, destinationPaths) {
  if (!Array.isArray(updates)) {
    throw new Error('O preparador de ledgers precisa retornar uma lista de atualizações');
  }
  const ledgerPaths = new Set();
  return updates.map((update, index) => {
    if (
      !update
      || typeof update.path !== 'string'
      || typeof update.next !== 'string'
      || (
        Object.hasOwn(update, 'previous')
        && update.previous !== null
        && typeof update.previous !== 'string'
      )
    ) {
      throw new Error(`Atualização de ledger ${index + 1} inválida`);
    }
    if (destinationPaths.has(update.path)) {
      throw new Error(`Ledger e registro não podem compartilhar o mesmo destino: ${update.path}`);
    }
    if (ledgerPaths.has(update.path)) {
      throw new Error(`Ledger duplicado na mesma transação editorial: ${update.path}`);
    }
    ledgerPaths.add(update.path);
    return { ...update };
  });
}

function resolveChangeClass(operation, previous) {
  if (operation.changeClass !== null) return operation.changeClass;
  if (previous === null || !CHANGE_CLASS_REQUIRED_TYPE_SET.has(operation.type)) return 'structural';
  throw new Error(
    `A substituição de ${operation.type}:${operation.record.id} exige changeClass explícita`,
  );
}

async function restoreFiles({
  files,
  removeFile,
  writeText,
}) {
  const errors = [];
  for (const file of [...files].reverse()) {
    try {
      if (file.previous === null) await removeFile(file.path, { force: true });
      else await writeText(file.path, file.previous, 'utf8');
    } catch (error) {
      errors.push(error);
    }
  }
  return errors;
}

export async function installContentChangeSet({
  analyzeImpact = null,
  compile = compileContent,
  editorialLedgerPath = null,
  integrityReportPath = INTEGRITY_REPORT_PATH,
  lockPath = CONTENT_TRANSACTION_LOCK_PATH,
  makeDirectory = mkdir,
  operations,
  prepareLedgerUpdates = prepareContentLedgerUpdates,
  readText = readFile,
  removeFile = rm,
  trackIntegrityReport = compile === compileContent,
  validateImpact = null,
  writeText = writeFile,
}) {
  const normalizedOperations = normalizeOperations(operations);
  return withFileLock(lockPath, async () => {
    const preparedOperations = [];
    for (const operation of normalizedOperations) {
      const previous = await readOptional(operation.destination, readText);
      if (previous !== null && !operation.force) {
        throw new Error(
          `O registro ${operation.type}:${operation.record.id} já existe; `
          + 'use --force somente para substituição intencional',
        );
      }
      const previousRecord = previous === null ? null : JSON.parse(previous);
      if (previousRecord !== null) validateReplacement(previousRecord, operation.record);
      preparedOperations.push({
        ...operation,
        changeClass: resolveChangeClass(operation, previous),
        previous,
        previousRecord,
      });
    }

    const editorialChangeSet = {
      operations: preparedOperations.map((operation) => ({
        type: operation.type,
        previous: operation.previousRecord,
        next: operation.record,
        changeClass: operation.changeClass,
      })),
    };
    const impact = typeof analyzeImpact === 'function'
      ? await analyzeImpact(structuredClone(editorialChangeSet))
      : null;
    if (typeof validateImpact === 'function') {
      await validateImpact(impact, structuredClone(editorialChangeSet));
    }

    const rawLedgerUpdates = await prepareLedgerUpdates({
      editorialLedgerPath,
      editorialChangeSet: structuredClone(editorialChangeSet),
      impact,
      operations: preparedOperations.map((operation) => ({
        ...operation,
        previousRecord: operation.previousRecord === null
          ? null
          : structuredClone(operation.previousRecord),
        record: structuredClone(operation.record),
      })),
      readText,
    });
    const proposedLedgerUpdates = validateLedgerUpdates(
      rawLedgerUpdates,
      new Set(preparedOperations.map(({ destination }) => destination)),
    );
    const ledgerUpdates = [];
    for (const update of proposedLedgerUpdates) {
      const previous = await readOptional(update.path, readText);
      if (Object.hasOwn(update, 'previous') && update.previous !== previous) {
        throw new Error(`O snapshot preparado para o ledger divergiu antes da escrita: ${update.path}`);
      }
      ledgerUpdates.push({
        path: update.path,
        previous,
        next: update.next,
      });
    }
    const transactionFiles = [
      ...ledgerUpdates.map(({ path, previous }) => ({ path, previous })),
      ...preparedOperations.map(({ destination: path, previous }) => ({ path, previous })),
    ];
    if (trackIntegrityReport) {
      transactionFiles.unshift({
        path: integrityReportPath,
        previous: await readOptional(integrityReportPath, readText),
      });
    }

    try {
      const parentDirectories = new Set([
        ...ledgerUpdates.map(({ path }) => dirname(path)),
        ...preparedOperations.map(({ destination }) => dirname(destination)),
      ]);
      for (const directory of parentDirectories) {
        await makeDirectory(directory, { recursive: true });
      }
      for (const update of ledgerUpdates) {
        await writeText(update.path, update.next, 'utf8');
      }
      for (const operation of preparedOperations) {
        await writeText(
          operation.destination,
          `${JSON.stringify(operation.record, null, 2)}\n`,
          'utf8',
        );
      }
      const compileOptions = {
        writeRuntime: true,
        writeIntegrityReport: true,
        editorialChangeSet: structuredClone(editorialChangeSet),
      };
      if (lockPath === CONTENT_TRANSACTION_LOCK_PATH) {
        compileOptions.contentTransactionLockHeld = true;
      }
      await compile(compileOptions);
    } catch (error) {
      const rollbackErrors = await restoreFiles({
        files: transactionFiles,
        removeFile,
        writeText,
      });
      if (rollbackErrors.length) {
        throw new AggregateError(
          [error, ...rollbackErrors],
          'A instalação falhou e a restauração dos arquivos também encontrou erros',
        );
      }
      throw error;
    }
    return {
      impact,
      installed: preparedOperations.map(({ record, type }) => ({
        id: record.id,
        type,
      })),
    };
  }, {
    label: 'uma transação editorial de conteúdo',
  });
}

export async function installContentRecord({
  analyzeImpact = null,
  changeClass = null,
  compile = compileContent,
  destination,
  editorialLedgerPath = null,
  force = false,
  ledgerPath = null,
  lockPath = CONTENT_TRANSACTION_LOCK_PATH,
  prepareLedgerUpdates = prepareContentLedgerUpdates,
  readText = readFile,
  record,
  removeFile = rm,
  type,
  validateImpact = null,
  writeText = writeFile,
}) {
  await installContentChangeSet({
    analyzeImpact,
    compile,
    editorialLedgerPath,
    lockPath,
    operations: [{
      changeClass,
      destination,
      force,
      ledgerPath,
      record,
      type,
    }],
    prepareLedgerUpdates,
    readText,
    removeFile,
    validateImpact,
    writeText,
  });
  return true;
}
