import {
  lstat,
  mkdir,
  rename,
  rm,
} from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

function validateSiblingPaths(paths) {
  const resolvedPaths = Object.fromEntries(
    Object.entries(paths).map(([name, path]) => {
      if (typeof path !== 'string' || !path.trim()) {
        throw new TypeError(`Caminho obrigatório ausente na transação pública: ${name}.`);
      }
      return [name, resolve(path)];
    }),
  );
  const uniquePaths = new Set(Object.values(resolvedPaths));
  if (uniquePaths.size !== Object.keys(resolvedPaths).length) {
    throw new Error('Os diretórios da transação pública precisam ser distintos.');
  }
  const parents = new Set(Object.values(resolvedPaths).map((path) => dirname(path)));
  if (parents.size !== 1) {
    throw new Error('Os diretórios da transação pública precisam compartilhar o mesmo diretório pai.');
  }
  return resolvedPaths;
}

async function inspectPath(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function removeDirectory(path) {
  await rm(path, { force: true, recursive: true });
}

async function restorePreviousBuild(finalOutput, previousOutput) {
  const [current, previous] = await Promise.all([
    inspectPath(finalOutput),
    inspectPath(previousOutput),
  ]);
  if (!current && previous) await rename(previousOutput, finalOutput);
}

export async function recoverInterruptedBuildSwap({
  finalOutput,
  previousOutput,
}) {
  const paths = validateSiblingPaths({ finalOutput, previousOutput });
  const [current, previous] = await Promise.all([
    inspectPath(paths.finalOutput),
    inspectPath(paths.previousOutput),
  ]);
  if (!current && previous) {
    await rename(paths.previousOutput, paths.finalOutput);
    return 'restored';
  }
  if (current && previous) {
    await removeDirectory(paths.previousOutput);
    return 'discarded-previous';
  }
  return 'unchanged';
}

export async function runPublicBuildTransaction({
  finalOutput,
  previousOutput,
  stagingOutput,
  prepare,
}) {
  if (typeof prepare !== 'function') {
    throw new TypeError('A transação pública requer uma função prepare.');
  }
  const paths = validateSiblingPaths({
    finalOutput,
    previousOutput,
    stagingOutput,
  });

  await recoverInterruptedBuildSwap(paths);
  await removeDirectory(paths.stagingOutput);
  await mkdir(paths.stagingOutput, { recursive: true });

  let result;
  try {
    result = await prepare(paths.stagingOutput);
  } catch (error) {
    await removeDirectory(paths.stagingOutput).catch(() => {});
    throw error;
  }

  try {
    await removeDirectory(paths.previousOutput);
    if (await inspectPath(paths.finalOutput)) {
      await rename(paths.finalOutput, paths.previousOutput);
    }
    try {
      await rename(paths.stagingOutput, paths.finalOutput);
    } catch (error) {
      await restorePreviousBuild(paths.finalOutput, paths.previousOutput);
      throw error;
    }
    await removeDirectory(paths.previousOutput);
    return result;
  } catch (error) {
    await removeDirectory(paths.stagingOutput).catch(() => {});
    throw error;
  }
}
