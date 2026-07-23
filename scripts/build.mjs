import * as fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_BUILD_PATHS } from './public-manifest.mjs';

const { copyFile, lstat, mkdir, readdir } = fs;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');

if (dirname(output) !== root || basename(output) !== 'dist') {
  throw new Error('Diretório de saída inválido.');
}

const verification = spawnSync(process.execPath, [join(root, 'scripts', 'verify.mjs')], {
  cwd: root,
  stdio: 'inherit',
});

if (verification.status !== 0) process.exit(verification.status || 1);

async function removeDirectory(directory) {
  if (typeof fs.rm === 'function') {
    await fs.rm(directory, { recursive: true, force: true });
    return;
  }

  try {
    await fs.rmdir(directory, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function copyPath(source, destination) {
  const sourceStats = await lstat(source);
  if (!sourceStats.isDirectory()) {
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
    return;
  }

  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  await Promise.all(entries.map((entry) => (
    copyPath(join(source, entry.name), join(destination, entry.name))
  )));
}

await removeDirectory(output);
await mkdir(output, { recursive: true });

for (const entry of PUBLIC_BUILD_PATHS) {
  const source = resolve(root, entry);
  const destination = resolve(output, entry);
  await copyPath(source, destination);
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat();
}

const outputFiles = await listFiles(output);
const forbiddenExtensions = /\.(?:docx|pdf|py|cjs|md)$/i;
const forbiddenDirectories = /^(?:ai|docs|ia|scripts)(?:[\\/]|$)/i;

for (const file of outputFiles) {
  const publicPath = relative(output, file);
  if (forbiddenExtensions.test(publicPath) || forbiddenDirectories.test(publicPath)) {
    throw new Error(`Arquivo interno encontrado no artefato público: ${publicPath}`);
  }
  if (/^Teorias[\\/].*\.txt$/i.test(publicPath)) {
    throw new Error(`Fonte editorial encontrada no artefato público: ${publicPath}`);
  }
}

console.log(`Build público concluído: ${outputFiles.length} arquivos permitidos em dist.`);
