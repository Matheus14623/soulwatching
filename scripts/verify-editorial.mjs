import './check-node-version.cjs';
import { spawnSync } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEORY_SOURCE_FILES } from './theory-sources.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function runNode(script, args = []) {
  const result = spawnSync(process.execPath, [join(root, script), ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout || '').trim();
    errors.push(`${script}${detail ? `: ${detail}` : ''}`);
  }
}

runNode('scripts/verify.mjs');

const { THEORIES } = await import('../assets/data/theories.js');
for (const theory of THEORIES) {
  const sourcePath = THEORY_SOURCE_FILES[theory.id];
  if (!sourcePath) {
    errors.push(`Fonte editorial não mapeada para ${theory.id}`);
    continue;
  }
  const info = await stat(join(root, sourcePath)).catch(() => null);
  if (!info?.isFile()) errors.push(`Fonte editorial inexistente em ${theory.id}: ${sourcePath}`);
}

runNode('ai/tools/build-source-coverage-ledger.mjs', ['--check']);
runNode('ai/tools/build-knowledge-graph.mjs', ['--check']);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Verificação editorial concluída: fontes privadas e base de conhecimento estão coerentes.');
