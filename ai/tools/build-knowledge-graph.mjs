import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { KnowledgeError, runKnowledgeBuild } from './lib/knowledge-core.mjs';

function usage() {
  return 'Uso: node ai/tools/build-knowledge-graph.mjs [--check]';
}

export async function main(argv = process.argv.slice(2), options = {}) {
  let check = false;
  for (const argument of argv) {
    if (argument === '--check') check = true;
    else if (argument === '--help' || argument === '-h') {
      options.stdout?.write?.(`${usage()}\n`);
      return 0;
    } else throw new KnowledgeError('CLI_USAGE_ERROR', `${usage()}\nArgumento desconhecido: ${argument}`);
  }

  const defaultAiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const result = await runKnowledgeBuild({ aiRoot: options.aiRoot || defaultAiRoot, check });
  const output = options.stdout || process.stdout;
  if (check) output.write('Base de conhecimento íntegra e determinística.\n');
  else if (result.written.length) output.write(`Base de conhecimento gerada: ${result.written.join(', ')}.\n`);
  else output.write('Base de conhecimento já estava atualizada.\n');
  return 0;
}

const direct = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (direct) {
  main().catch((error) => {
    const prefix = error instanceof KnowledgeError ? `[${error.code}] ` : '';
    process.stderr.write(`${prefix}${error.message}\n`);
    process.exitCode = error?.code === 'CLI_USAGE_ERROR' ? 2 : 1;
  });
}

