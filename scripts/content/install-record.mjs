import { readFile, rm, writeFile } from 'node:fs/promises';
import { compileContent } from './compiler.mjs';
import { withFileLock } from './file-lock.mjs';
import { CONTENT_TRANSACTION_LOCK_PATH } from './paths.mjs';
import { validateReplacement } from './revision-policy.mjs';

function publicationLedgerSource(record, previousLedger) {
  if (previousLedger === null) {
    throw new Error('O ledger de revisões precisa existir antes de instalar uma publicação');
  }
  const ledger = JSON.parse(previousLedger);
  for (const revision of record.revisions || []) {
    const existing = ledger.revisions[revision.revisionId];
    const next = {
      publicationId: record.id,
      contentHash: revision.contentHash,
      publishedAt: revision.publishedAt,
    };
    if (existing && JSON.stringify(existing) !== JSON.stringify(next)) {
      throw new Error(`A revisão publicada ${revision.revisionId} diverge do ledger imutável`);
    }
    ledger.revisions[revision.revisionId] = next;
  }
  return `${JSON.stringify(ledger, null, 2)}\n`;
}

export async function installContentRecord({
  compile = compileContent,
  destination,
  force = false,
  ledgerPath = null,
  lockPath = CONTENT_TRANSACTION_LOCK_PATH,
  readText = readFile,
  record,
  removeFile = rm,
  type,
  writeText = writeFile,
}) {
  return withFileLock(lockPath, async () => {
    const previous = await readText(destination, 'utf8').catch((error) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    const previousLedger = type === 'publication'
      ? await readText(ledgerPath, 'utf8')
      : null;
    if (previous !== null && !force) {
      throw new Error(
        `O registro ${type}:${record.id} já existe; use --force somente para substituição intencional`,
      );
    }
    if (previous !== null) validateReplacement(JSON.parse(previous), record);
    const nextLedger = type === 'publication'
      ? publicationLedgerSource(record, previousLedger)
      : null;

    try {
      if (nextLedger !== null) await writeText(ledgerPath, nextLedger, 'utf8');
      await writeText(destination, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
      const compileOptions = {
        writeRuntime: true,
        writeIntegrityReport: true,
      };
      if (lockPath === CONTENT_TRANSACTION_LOCK_PATH) {
        compileOptions.contentTransactionLockHeld = true;
      }
      await compile(compileOptions);
    } catch (error) {
      const rollbackErrors = [];
      try {
        if (previous === null) await removeFile(destination, { force: true });
        else await writeText(destination, previous, 'utf8');
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
      if (previousLedger !== null) {
        try {
          await writeText(ledgerPath, previousLedger, 'utf8');
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError);
        }
      }
      if (rollbackErrors.length) {
        throw new AggregateError(
          [error, ...rollbackErrors],
          'A instalação falhou e a restauração dos arquivos também encontrou erros',
        );
      }
      throw error;
    }
    return true;
  }, {
    label: 'uma transação editorial de conteúdo',
  });
}
