import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'index.html',
  'assets/css/styles.css',
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
  'assets/images/og-observatorio.jpg',
  'vercel.json',
];

const errors = [];

for (const file of requiredFiles) {
  const info = await stat(join(root, file)).catch(() => null);
  if (!info || !info.isFile()) errors.push(`Arquivo ausente: ${file}`);
}

const html = await readFile(join(root, 'index.html'), 'utf8');
const css = await readFile(join(root, 'assets/css/styles.css'), 'utf8');

if (html.includes('blob:')) errors.push('index.html ainda contém URL blob.');
if (html.includes('{{PASTE_THE_CURRENT_HTML_FILE_HERE}}')) errors.push('index.html contém placeholder do prompt.');
if (/\bdi[aá]rio\b/i.test(html)) errors.push('index.html ainda usa linguagem de diário.');
if (html.includes('cdn.tailwindcss.com')) errors.push('Tailwind CDN não foi removido.');
if (html.includes('Tone.js')) errors.push('Tone.js CDN não foi removido.');
if (/TODO:/i.test(html + css)) errors.push('Há TODO visível em arquivos principais.');

const refs = [...html.matchAll(/(?:src|href)="(assets\/[^"#?]+)"/g)].map((match) => match[1]);
for (const ref of refs) {
  const info = await stat(join(root, ref)).catch(() => null);
  if (!info || !info.isFile()) errors.push(`Referência local inexistente: ${ref}`);
}

const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]).filter((id) => id !== '');
for (const id of anchors) {
  if (!html.includes(`id="${id}"`)) errors.push(`Âncora sem destino: #${id}`);
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
