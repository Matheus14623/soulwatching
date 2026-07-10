import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'index.html',
  'teorias.html',
  'Teorias/teorias.html',
  'Teorias/teorias.css',
  'Teorias/teorias.js',
  'assets/css/styles.css',
  'assets/data/theories.js',
  'assets/js/main.js',
  'assets/js/config.js',
  'assets/js/navigation.js',
  'assets/js/observer.js',
  'assets/js/theories.js',
  'assets/js/theory-lab.js',
  'assets/js/philosophy.js',
  'assets/js/resonance.js',
  'assets/js/contact.js',
  'assets/js/utils.js',
  'assets/icons/favicon.svg',
  'assets/images/rain-window.webp',
  'assets/images/calabi-yau-wireframe.webp',
  'assets/images/stoic-rock.webp',
  'assets/images/sisyphus-absurdism.webp',
  'assets/images/cosmic-scale.webp',
  'assets/images/matheus-camargo.webp',
  'assets/images/github-profile.webp',
  'assets/images/og-observatorio.jpg',
  'vercel.json',
];

const htmlFiles = ['index.html', 'teorias.html', 'Teorias/teorias.html'];
const errors = [];

async function fileExists(path) {
  const info = await stat(join(root, path)).catch(() => null);
  return Boolean(info?.isFile());
}

for (const file of requiredFiles) {
  if (!(await fileExists(file))) errors.push(`Arquivo ausente: ${file}`);
}

const htmlByFile = new Map();
for (const file of htmlFiles) {
  htmlByFile.set(file, await readFile(join(root, file), 'utf8'));
}

const combinedHtml = [...htmlByFile.values()].join('\n');
const css = await readFile(join(root, 'assets/css/styles.css'), 'utf8');
const theoryCss = await readFile(join(root, 'Teorias/teorias.css'), 'utf8');

if (combinedHtml.includes('blob:')) errors.push('Algum HTML ainda contém URL blob.');
if (combinedHtml.includes('{{PASTE_THE_CURRENT_HTML_FILE_HERE}}')) errors.push('Algum HTML contém placeholder do prompt.');
if (/\bdi[aá]rio\b/i.test(combinedHtml)) errors.push('HTML ainda usa linguagem de diário.');
if (combinedHtml.includes('cdn.tailwindcss.com')) errors.push('Tailwind CDN não foi removido.');
if (combinedHtml.includes('Tone.js')) errors.push('Tone.js CDN não foi removido.');
if (/TODO:/i.test(combinedHtml + css + theoryCss)) errors.push('Há TODO visível em arquivos principais.');

function isExternal(ref) {
  return /^(https?:|mailto:|tel:|#|javascript:)/i.test(ref);
}

for (const [file, html] of htmlByFile) {
  const base = dirname(file);
  const refs = [...html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (isExternal(ref)) continue;
    const resolved = normalize(join(base, ref));
    if (resolved.startsWith('..')) continue;
    if (!(await fileExists(resolved))) errors.push(`Referência local inexistente em ${file}: ${ref}`);
  }

  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]).filter(Boolean);
  for (const id of anchors) {
    if (!html.includes(`id="${id}"`)) errors.push(`Âncora sem destino em ${file}: #${id}`);
  }
}

for (const jsFile of requiredFiles.filter((file) => file.endsWith('.js'))) {
  const js = await readFile(join(root, jsFile), 'utf8');
  if (/console\.log\(/.test(js)) errors.push(`console.log encontrado em ${jsFile}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Verificação concluída: estrutura, referências, âncoras e linguagem principal OK.');
