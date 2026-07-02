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
  'assets/js/philosophy.js',
  'assets/js/resonance.js',
  'assets/js/contact.js',
  'assets/js/utils.js',
  'assets/icons/favicon.svg',
  'assets/images/rain-window.webp',
  'assets/images/calabi-yau-wireframe.webp',
  'assets/images/celta-2010.webp',
  'assets/images/ford-focus.webp',
  'assets/images/stoic-rock.webp',
  'assets/images/sisyphus-absurdism.webp',
  'assets/images/cosmic-scale.webp',
  'assets/images/og-observador.jpg',
];

const errors = [];

for (const file of requiredFiles) {
  const info = await stat(join(root, file)).catch(() => null);
  if (!info || !info.isFile()) errors.push(`Arquivo ausente: ${file}`);
}

const html = await readFile(join(root, 'index.html'), 'utf8');
if (html.includes('blob:')) errors.push('index.html ainda contém URL blob.');
if (html.includes('{{PASTE_THE_CURRENT_HTML_FILE_HERE}}')) errors.push('index.html contém placeholder do prompt.');
if (html.includes('cdn.tailwindcss.com')) errors.push('Tailwind CDN não foi removido.');
if (html.includes('Tone.js')) errors.push('Tone.js CDN não foi removido.');

const refs = [...html.matchAll(/(?:src|href)="(assets\/[^"#?]+)"/g)].map((match) => match[1]);
for (const ref of refs) {
  const info = await stat(join(root, ref)).catch(() => null);
  if (!info || !info.isFile()) errors.push(`Referência local inexistente: ${ref}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Verificação concluída: arquivos, referências locais e remoção de placeholders OK.');
