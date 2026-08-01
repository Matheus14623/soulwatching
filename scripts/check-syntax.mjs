import './check-node-version.cjs';
import { spawnSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import {
  dirname,
  extname,
  join,
  relative,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoots = Object.freeze([
  'assets',
  'Arquivo',
  'Constelacoes',
  'Contribuicoes',
  'GrandesNomes',
  'Laboratorio',
  'Mapa',
  'Rotas',
  'Teorias',
  'scripts',
  'tools',
]);

async function listFiles(directory, { optional = false } = {}) {
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (optional && error.code === 'ENOENT') return [];
    throw error;
  });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

export function validateCssText(source, label = 'CSS') {
  const stack = [];
  let quote = '';
  let inComment = false;
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (inComment) {
      if (character === '*' && next === '/') {
        inComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '/' && next === '*') {
      inComment = true;
      index += 1;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '{') {
      stack.push(index);
    } else if (character === '}') {
      if (!stack.length) return `${label}: chave de fechamento sem abertura no caractere ${index}`;
      stack.pop();
    }
  }

  if (inComment) return `${label}: comentário CSS não encerrado`;
  if (quote) return `${label}: string CSS não encerrada`;
  if (stack.length) return `${label}: ${stack.length} bloco(s) CSS não encerrado(s)`;
  return '';
}

export async function checkSourceSyntax() {
  const files = (
    await Promise.all(sourceRoots.map((directory) => listFiles(
      join(root, directory),
      { optional: directory === 'tools' },
    )))
  ).flat();
  const errors = [];
  const scriptExtensions = new Set(['.js', '.mjs', '.cjs']);

  for (const file of files) {
    const extension = extname(file).toLowerCase();
    const label = relative(root, file).replaceAll('\\', '/');
    if (scriptExtensions.has(extension)) {
      const result = spawnSync(process.execPath, ['--check', file], {
        cwd: root,
        encoding: 'utf8',
        windowsHide: true,
      });
      if (result.status !== 0) {
        errors.push(`${label}: ${(result.stderr || result.stdout || 'sintaxe JavaScript inválida').trim()}`);
      }
    } else if (extension === '.css') {
      const source = await readFile(file, 'utf8');
      const error = validateCssText(source, label);
      if (error) errors.push(error);
    }
  }

  if (errors.length) {
    throw new Error(`Falha no gate de sintaxe:\n${errors.join('\n')}`);
  }
  return Object.freeze({
    cssFiles: files.filter((file) => extname(file).toLowerCase() === '.css').length,
    scriptFiles: files.filter((file) => scriptExtensions.has(extname(file).toLowerCase())).length,
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkSourceSyntax();
  console.log(`Sintaxe validada: ${result.scriptFiles} scripts e ${result.cssFiles} folhas de estilo.`);
}
