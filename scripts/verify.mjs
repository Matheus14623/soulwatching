import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  THEORIES,
  THEORY_FILTERS,
  THEORY_REVIEW_STATES,
  THEORY_TYPES,
} from '../assets/data/theories.js';
import { THEORY_REFERENCES } from '../assets/data/theory-references.js';
import { RESEARCH_TRACKS } from '../assets/data/research-tracks.js';
import { THEORY_SOURCE_FILES } from './theory-sources.mjs';

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
  'assets/data/theory-references.js',
  'assets/data/research-tracks.js',
  'assets/js/main.js',
  'assets/js/config.js',
  'assets/js/navigation.js',
  'assets/js/observer.js',
  'assets/js/theories.js',
  'assets/js/theory-model.js',
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
  'scripts/build.mjs',
  'scripts/theory-sources.mjs',
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
const publicDataFiles = [
  'assets/data/theories.js',
  'assets/data/theory-references.js',
  'assets/data/research-tracks.js',
];
const publicData = (await Promise.all(
  publicDataFiles.map((file) => readFile(join(root, file), 'utf8')),
)).join('\n');
const publicCodeFiles = requiredFiles.filter((file) =>
  /^(?:assets|Teorias|Mapa|Arquivo|Laboratorio)[\\/].*\.(?:css|js)$/i.test(file));
const publicCode = (await Promise.all(
  publicCodeFiles.map((file) => readFile(join(root, file), 'utf8')),
)).join('\n');

if (combinedHtml.includes('blob:')) errors.push('Algum HTML ainda contém URL blob.');
if (combinedHtml.includes('{{PASTE_THE_CURRENT_HTML_FILE_HERE}}')) errors.push('Algum HTML contém placeholder do prompt.');
if (/\bdi[aá]rio\b/i.test(combinedHtml)) errors.push('HTML ainda usa linguagem de diário.');
if (combinedHtml.includes('cdn.tailwindcss.com')) errors.push('Tailwind CDN não foi removido.');
if (combinedHtml.includes('Tone.js')) errors.push('Tone.js CDN não foi removido.');
if (/TODO:/i.test(combinedHtml + css + theoryCss)) errors.push('Há TODO visível em arquivos principais.');
if (/<!--[\s\S]*?-->/.test(combinedHtml)) errors.push('HTML de produção contém comentários ou blocos desativados.');
if (/\/\*[\s\S]*?\*\//.test(publicCode) || /^\s*\/\//m.test(publicCode)) {
  errors.push('CSS ou JavaScript público contém comentários de implementação.');
}
if (/\b(?:ChatGPT|GPT)\b|intelig[eê]ncia artificial/i.test(combinedHtml + publicData)) {
  errors.push('Conteúdo público contém linguagem de bastidor sobre IA.');
}
if (/\bsourceFile\b/.test(publicData)) errors.push('Dados públicos expõem caminhos de fontes editoriais.');
if (/BlackHoleRenderer|data-black-hole|black-hole-(?:canvas|overlay|system)|black-hole\.js/i.test(combinedHtml + publicCode)) {
  errors.push('O sistema visual descartado de buraco negro reapareceu nos arquivos públicos.');
}

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
const typeIds = new Set(THEORY_TYPES.map((type) => type.id));
const reviewStateIds = new Set(THEORY_REVIEW_STATES.map((state) => state.id));
const referenceIds = new Set(Object.keys(THEORY_REFERENCES));
const requiredTheoryFields = [
  'id', 'slug', 'code', 'title', 'shortTitle', 'subtitle', 'summary',
  'centralIdea', 'centralQuestion', 'proposal', 'kind', 'typeLabel',
  'typeShortLabel', 'reviewState', 'reviewStateLabel', 'independent',
  'category', 'color', 'glow', 'position', 'concepts', 'questions',
  'nextSteps', 'connections', 'referenceIds', 'review', 'revision',
];
const requiredArrayFields = ['filters', 'concepts', 'questions', 'nextSteps', 'connections', 'referenceIds'];
const requiredReviewFields = ['assessment', 'known', 'focus', 'limit', 'test'];

for (const theory of THEORIES) {
  const missing = requiredTheoryFields.filter((field) => theory[field] === undefined || theory[field] === '');
  if (missing.length) errors.push(`${theory.code || theory.id || 'Entrada'} sem campos obrigatórios: ${missing.join(', ')}`);

  if (theoryIds.has(theory.id)) errors.push(`ID de teoria duplicado: ${theory.id}`);
  if (theorySlugs.has(theory.slug)) errors.push(`Slug de teoria duplicado: ${theory.slug}`);
  theoryIds.add(theory.id);
  theorySlugs.add(theory.slug);

  if ('progress' in theory) errors.push(`Percentual editorial ainda presente em ${theory.id}`);
  if ('sourceFile' in theory) errors.push(`Caminho interno ainda presente nos dados públicos de ${theory.id}`);

  const invalidArrays = requiredArrayFields.filter((field) => !Array.isArray(theory[field]));
  if (invalidArrays.length) errors.push(`Arrays inválidos em ${theory.id}: ${invalidArrays.join(', ')}`);

  if (!typeIds.has(theory.kind)) errors.push(`Natureza desconhecida em ${theory.id}: ${theory.kind}`);
  if (!reviewStateIds.has(theory.reviewState)) {
    errors.push(`Estado de revisão desconhecido em ${theory.id}: ${theory.reviewState}`);
  }

  const missingReview = requiredReviewFields.filter((field) => !theory.review?.[field]);
  if (missingReview.length) errors.push(`Leitura crítica incompleta em ${theory.id}: ${missingReview.join(', ')}`);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(theory.revision?.reviewedAt || '')) {
    errors.push(`Data de revisão inválida em ${theory.id}`);
  }
  if (!theory.revision?.version) errors.push(`Versão ausente em ${theory.id}`);
  if (!theory.revision?.label) errors.push(`Rótulo de revisão ausente em ${theory.id}`);
  if (typeof theory.independent !== 'boolean') errors.push(`Indicador de independência inválido em ${theory.id}`);
  if (
    !Number.isFinite(theory.position?.x)
    || !Number.isFinite(theory.position?.y)
    || theory.position.x < 0
    || theory.position.x > 100
    || theory.position.y < 0
    || theory.position.y > 100
  ) {
    errors.push(`Posição de mapa inválida em ${theory.id}`);
  }

  const unknownFilters = theory.filters.filter((filter) => !filterIds.has(filter));
  if (!filterIds.has(theory.category)) unknownFilters.push(theory.category);
  if (unknownFilters.length) errors.push(`Filtros desconhecidos em ${theory.id}: ${[...new Set(unknownFilters)].join(', ')}`);

  const unknownReferences = theory.referenceIds.filter((id) => !referenceIds.has(id));
  if (unknownReferences.length) errors.push(`Referências desconhecidas em ${theory.id}: ${unknownReferences.join(', ')}`);

  const sourcePath = THEORY_SOURCE_FILES[theory.id];
  if (!sourcePath) errors.push(`Fonte editorial não mapeada para ${theory.id}`);
  else if (!(await fileExists(sourcePath))) errors.push(`Fonte editorial inexistente em ${theory.id}: ${sourcePath}`);
}

for (const theory of THEORIES) {
  const unknownConnections = theory.connections.filter((id) => !theoryIds.has(id));
  if (unknownConnections.length) errors.push(`Conexões inválidas em ${theory.id}: ${unknownConnections.join(', ')}`);
  if (theory.parentId && !theoryIds.has(theory.parentId)) {
    errors.push(`Linha principal inválida em ${theory.id}: ${theory.parentId}`);
  }
}

for (const [id, reference] of Object.entries(THEORY_REFERENCES)) {
  if (!reference.title || !reference.authors || !reference.year || !reference.url || !reference.kind) {
    errors.push(`Referência incompleta: ${id}`);
    continue;
  }
  try {
    const url = new URL(reference.url);
    if (!['https:', 'http:'].includes(url.protocol)) errors.push(`URL de referência inválida: ${id}`);
  } catch {
    errors.push(`URL de referência inválida: ${id}`);
  }
}

const trackIds = new Set();
for (const track of RESEARCH_TRACKS) {
  const missing = ['id', 'code', 'title', 'kind', 'summary', 'boundary', 'nextStep']
    .filter((field) => !track[field]);
  if (missing.length) errors.push(`Linha do radar incompleta em ${track.id || track.code}: ${missing.join(', ')}`);
  if (trackIds.has(track.id)) errors.push(`ID duplicado no radar: ${track.id}`);
  trackIds.add(track.id);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Verificação concluída: estrutura, referências, âncoras e linguagem principal OK.');
