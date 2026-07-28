import {
  mkdir,
  open,
  readFile,
  rm,
  stat,
} from 'node:fs/promises';
import { dirname } from 'node:path';

function wait(milliseconds) {
  return new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

async function lockOwnerIsAlive(lockPath) {
  const source = await readFile(lockPath, 'utf8').catch(() => '');
  if (!source) return null;
  try {
    const pid = JSON.parse(source).pid;
    if (!Number.isInteger(pid) || pid <= 0) return null;
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    if (error.code === 'EPERM') return true;
    return null;
  }
}

export async function acquireFileLock(lockPath, {
  label = 'operação',
  pollMs = 50,
  staleMs = 5 * 60 * 1000,
  waitMs = 30 * 1000,
} = {}) {
  await mkdir(dirname(lockPath), { recursive: true });
  const deadline = Date.now() + waitMs;

  while (true) {
    try {
      const handle = await open(lockPath, 'wx');
      await handle.writeFile(`${JSON.stringify({
        acquiredAt: new Date().toISOString(),
        label,
        pid: process.pid,
      })}\n`, 'utf8');
      let released = false;
      return async () => {
        if (released) return;
        released = true;
        await handle.close();
        await rm(lockPath, { force: true });
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const lock = await stat(lockPath).catch(() => null);
      const ownerIsAlive = await lockOwnerIsAlive(lockPath);
      if (
        ownerIsAlive === false
        || (ownerIsAlive === null && lock && Date.now() - lock.mtimeMs > staleMs)
      ) {
        await rm(lockPath, { force: true });
        continue;
      }
      if (Date.now() >= deadline) {
        throw new Error(
          `Outra execução está realizando ${label}; aguarde a conclusão ou remova `
          + `${lockPath} somente se nenhum processo do projeto estiver ativo`,
        );
      }
      await wait(pollMs);
    }
  }
}

export async function withFileLock(lockPath, operation, options) {
  const release = await acquireFileLock(lockPath, options);
  try {
    return await operation();
  } finally {
    await release();
  }
}
