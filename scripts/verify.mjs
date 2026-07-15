import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEORIES, THEORY_FILTERS } from '../assets/data/theories.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'README.md',
  'DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md',
  'docs/INTEGRACAO_TEORIAS.md',
  'index.html',
  'teorias.html',
  'Teorias/teorias.html',
  'Teorias/teorias.css',
  'Teorias/teorias.js',
  'assets/css/styles.css',
  'assets/css/observatory-pages.css',
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
  'assets/js/page-shell.js',
  'assets/icons/favicon.svg',
  'assets/images/rain-window.webp',
  'assets/images/calabi-yau-wireframe.webp',
  'assets/images/stoic-rock.webp',
  'assets/images/sisyphus-absurdism.webp',
  'assets/images/cosmic-scale.webp',
  'assets/images/matheus-camargo.webp',
  'assets/images/github-profile.webp',
  'assets/images/og-observatorio.jpg',
  'Mapa/mapa.html',
  'Mapa/mapa.css',
  'Mapa/mapa.js',
  'Arquivo/arquivo.html',
  'Arquivo/arquivo.css',
  'Laboratorio/laboratorio.html',
  'Laboratorio/laboratorio.css',
  'vercel.json',
];

const htmlFiles = [
  'index.html',
  'teorias.html',
  'Teorias/teorias.html',
  'Mapa/mapa.html',
  'Arquivo/arquivo.html',
  'Laboratorio/laboratorio.html',
];
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

const theoryIds = new Set();
const theorySlugs = new Set();
const filterIds = new Set(THEORY_FILTERS.map((filter) => filter.id));
const requiredTheoryFields = [
  'id', 'slug', 'code', 'title', 'summary', 'centralIdea', 'centralQuestion',
  'hypothesis', 'status', 'phase', 'stage', 'category', 'sourceFile',
  'concepts', 'questions', 'developmentNotes', 'connections',
];

for (const theory of THEORIES) {
  const missing = requiredTheoryFields.filter((field) => theory[field] === undefined || theory[field] === '');
  if (missing.length) errors.push(`${theory.code || theory.id || 'Teoria'} sem campos obrigatórios: ${missing.join(', ')}`);

  if (theoryIds.has(theory.id)) errors.push(`ID de teoria duplicado: ${theory.id}`);
  if (theorySlugs.has(theory.slug)) errors.push(`Slug de teoria duplicado: ${theory.slug}`);
  theoryIds.add(theory.id);
  theorySlugs.add(theory.slug);

  if (!Number.isFinite(theory.progress) || theory.progress < 0 || theory.progress > 100) {
    errors.push(`Progresso inválido em ${theory.id}`);
  }

  const unknownFilters = theory.filters.filter((filter) => !filterIds.has(filter));
  if (!filterIds.has(theory.category)) unknownFilters.push(theory.category);
  if (unknownFilters.length) errors.push(`Filtros desconhecidos em ${theory.id}: ${[...new Set(unknownFilters)].join(', ')}`);

  const sourcePath = theory.sourceFile.replace(/^Teorias\//, 'Teorias/');
  if (!(await fileExists(sourcePath))) errors.push(`Fonte interna inexistente em ${theory.id}: ${theory.sourceFile}`);
}

for (const theory of THEORIES) {
  const unknownConnections = theory.connections.filter((id) => !theoryIds.has(id));
  if (unknownConnections.length) errors.push(`Conexões inválidas em ${theory.id}: ${unknownConnections.join(', ')}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Verificação concluída: estrutura, referências, âncoras e linguagem principal OK.');
