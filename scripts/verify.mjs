import './check-node-version.cjs';
import { lstat, readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileContent } from './content/compiler.mjs';
import { checkSourceSyntax } from './check-syntax.mjs';
import {
  PUBLIC_BUILD_DIRECTORIES,
  PUBLIC_BUILD_FILES,
  PUBLIC_BUILD_PATHS,
  PUBLIC_HTML_FILES,
  PUBLIC_REQUIRED_FILES,
  PUBLIC_ROUTES,
} from './public-manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contentCompilation = await compileContent({ writeRuntime: true });
if (contentCompilation.report.warnings.length) {
  console.warn(
    `Avisos editoriais não bloqueantes: ${contentCompilation.report.warnings.join(' | ')}`,
  );
}
await checkSourceSyntax();

const [
  theoryModule,
  theoryReferenceModule,
  researchTrackModule,
  notableFigureModule,
  constellationModule,
  publicationModule,
] = await Promise.all([
  import('../assets/data/theories.js'),
  import('../assets/data/theory-references.js'),
  import('../assets/data/research-tracks.js'),
  import('../assets/data/notable-figures.js'),
  import('../assets/data/constellations.js'),
  import('../assets/data/generated/runtime/publications.js'),
]);

const {
  THEORIES,
  THEORY_FILTERS,
  THEORY_REVIEW_STATES,
  THEORY_TYPES,
} = theoryModule;
const { THEORY_REFERENCES } = theoryReferenceModule;
const { RESEARCH_TRACKS } = researchTrackModule;
const { NOTABLE_FIGURES } = notableFigureModule;
const {
  CONSTELLATIONS,
  CONSTELLATION_REFERENCES,
} = constellationModule;
const {
  EXTERNAL_CONTRIBUTIONS,
  PUBLICATION_CREDIT_ROLES,
  PUBLICATION_TYPES,
} = publicationModule;
const requiredFiles = [
  'package.json',
  'package-lock.json',
  'scripts/build-deploy.mjs',
  'scripts/build.mjs',
  'scripts/check-node-version.cjs',
  'scripts/public-manifest.mjs',
  'scripts/public-metadata.mjs',
  'scripts/serve.mjs',
  'vercel.json',
  '.nvmrc',
  ...PUBLIC_REQUIRED_FILES,
];

const htmlFiles = PUBLIC_HTML_FILES;
const errors = [];

async function fileExists(path) {
  const info = await stat(join(root, path)).catch(() => null);
  return Boolean(info?.isFile());
}

async function directoryExists(path) {
  const info = await stat(join(root, path)).catch(() => null);
  return Boolean(info?.isDirectory());
}

function normalizeManifestPath(path) {
  return normalize(path).replaceAll('\\', '/');
}

function isCoveredByBuildManifest(path) {
  const normalizedPath = normalizeManifestPath(path);
  if (PUBLIC_BUILD_FILES.some((file) => normalizeManifestPath(file) === normalizedPath)) return true;
  return PUBLIC_BUILD_DIRECTORIES.some((directory) => {
    const normalizedDirectory = normalizeManifestPath(directory);
    return normalizedPath.startsWith(`${normalizedDirectory}/`);
  });
}

async function listPublicFiles(directory) {
  const entries = await readdir(join(root, directory), { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = normalizeManifestPath(join(directory, entry.name));
    const info = await lstat(join(root, path));
    if (info.isSymbolicLink()) {
      errors.push(`Link simbólico não permitido em diretório público: ${path}`);
      return [];
    }
    return info.isDirectory() ? listPublicFiles(path) : [path];
  }));
  return files.flat();
}

for (const file of requiredFiles) {
  if (!(await fileExists(file))) errors.push(`Arquivo ausente: ${file}`);
}

for (const directory of PUBLIC_BUILD_DIRECTORIES) {
  if (!(await directoryExists(directory))) errors.push(`Diretório público ausente: ${directory}`);
}

for (const file of PUBLIC_BUILD_FILES) {
  if (!(await fileExists(file))) errors.push(`Arquivo público ausente: ${file}`);
}

const publicFiles = [
  ...PUBLIC_BUILD_FILES.map(normalizeManifestPath),
  ...(await Promise.all(PUBLIC_BUILD_DIRECTORIES.map(listPublicFiles))).flat(),
];
const allowedPublicFiles = new Set([
  ...PUBLIC_BUILD_FILES,
  ...PUBLIC_REQUIRED_FILES,
  ...NOTABLE_FIGURES.map(({ portrait }) => (
    normalizeManifestPath(portrait.src.split(/[?#]/, 1)[0])
  )),
].map(normalizeManifestPath));
const unregisteredPublicFiles = publicFiles.filter((file) => !allowedPublicFiles.has(file));
if (unregisteredPublicFiles.length) {
  errors.push(`Arquivo não registrado no manifesto público: ${unregisteredPublicFiles.join(', ')}`);
}
const discoveredHtmlFiles = publicFiles.filter((file) => file.endsWith('.html'));
const unregisteredHtmlFiles = discoveredHtmlFiles.filter((file) => !PUBLIC_HTML_FILES.includes(file));
if (unregisteredHtmlFiles.length) {
  errors.push(`HTML público sem rota declarada: ${unregisteredHtmlFiles.join(', ')}`);
}

for (const file of PUBLIC_REQUIRED_FILES) {
  if (!isCoveredByBuildManifest(file)) errors.push(`Arquivo obrigatório fora do manifesto de build: ${file}`);
}

for (const [label, entries] of [
  ['caminho de build', PUBLIC_BUILD_PATHS],
  ['arquivo HTML', PUBLIC_HTML_FILES],
  ['arquivo obrigatório', PUBLIC_REQUIRED_FILES],
]) {
  const duplicates = entries.filter((entry, index) => entries.indexOf(entry) !== index);
  if (duplicates.length) errors.push(`Duplicidade no manifesto (${label}): ${[...new Set(duplicates)].join(', ')}`);
}

for (const key of ['id', 'url', 'cleanUrl', 'file']) {
  const values = PUBLIC_ROUTES.map((route) => route[key]);
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length) {
    errors.push(`Rotas públicas duplicam ${key}: ${[...new Set(duplicates)].join(', ')}`);
  }
}

for (const route of PUBLIC_ROUTES) {
  if (!PUBLIC_HTML_FILES.includes(route.file)) errors.push(`Rota fora da lista HTML: ${route.file}`);
  if (!route.url.startsWith('/') || !route.cleanUrl.startsWith('/')) {
    errors.push(`URL pública inválida na rota ${route.id}`);
  }
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
  'assets/data/notable-figures.js',
  'assets/data/notable-figure-references.js',
  'assets/data/constellations.js',
  'assets/data/contributions.js',
  ...(await listPublicFiles('content/public')).filter((file) => file.endsWith('.json')),
];
const publicData = (await Promise.all(
  publicDataFiles.map((file) => readFile(join(root, file), 'utf8')),
)).join('\n');
const publicCodeFiles = publicFiles.filter((file) =>
  /\.(?:css|js)$/i.test(file)
  && !/^assets[\\/]vendor[\\/]/i.test(file));
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
  return /^(?:https?:|mailto:|tel:|#|javascript:|\/\/)/i.test(ref);
}

function resolveLocalReference(file, ref) {
  const normalizedRef = ref.replaceAll('\\', '/');
  if (normalizedRef.startsWith('/')) {
    return normalizeManifestPath(normalizedRef.replace(/^\/+/, ''));
  }

  const resolved = normalizeManifestPath(join(dirname(file), normalizedRef));
  if (resolved === '..' || resolved.startsWith('../')) return null;
  return resolved;
}

for (const [file, html] of htmlByFile) {
  const refs = [...html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (isExternal(ref)) continue;
    const resolved = resolveLocalReference(file, ref);
    if (!resolved) {
      errors.push(`Referência local escapa da raiz pública em ${file}: ${ref}`);
      continue;
    }
    if (!(await fileExists(resolved))) errors.push(`Referência local inexistente em ${file}: ${ref}`);
  }

  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]).filter(Boolean);
  for (const id of anchors) {
    if (!html.includes(`id="${id}"`)) errors.push(`Âncora sem destino em ${file}: #${id}`);
  }
}

for (const jsFile of publicCodeFiles.filter((file) => file.endsWith('.js'))) {
  const js = await readFile(join(root, jsFile), 'utf8');
  if (/console\.log\(/.test(js)) errors.push(`console.log encontrado em ${jsFile}`);
}

if (EXTERNAL_CONTRIBUTIONS.some(({ authorshipOrigin }) => authorshipOrigin !== 'external')) {
  errors.push('Projeção de contribuições contém publicação sem autoria externa');
}

for (const [label, definitions] of [
  ['tipos de publicação', PUBLICATION_TYPES],
  ['papéis de crédito', PUBLICATION_CREDIT_ROLES],
]) {
  if (!definitions.length) {
    errors.push(`Catálogo vazio: ${label}`);
    continue;
  }
  const ids = definitions.map((definition) => definition.id);
  const labels = definitions.map((definition) => definition.label);
  if (new Set(ids).size !== ids.length) errors.push(`IDs duplicados em ${label}`);
  if (new Set(labels).size !== labels.length) errors.push(`Rótulos duplicados em ${label}`);
  if (definitions.some((definition) => !definition.id || !definition.label)) {
    errors.push(`Definição incompleta em ${label}`);
  }
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

const constellationIds = new Set();
const constellationSlugs = new Set();
const constellationAbbreviations = new Set();
const constellationReferenceIds = new Set(Object.keys(CONSTELLATION_REFERENCES));
const constellationFeaturedRanks = [];
const constellationSeasonIds = new Set(['verao', 'outono', 'inverno', 'primavera']);
const constellationStarRoles = new Set(['anchor', 'guide', 'landmark', 'context']);
const constellationLabelAnchors = new Set(['start', 'middle', 'end']);

if (CONSTELLATIONS.length < 12) {
  errors.push(`O atlas não pode regredir abaixo dos 12 campos de referência; encontrou ${CONSTELLATIONS.length}.`);
}

for (const constellation of CONSTELLATIONS) {
  const missing = [
    'id', 'slug', 'name', 'latinName', 'abbreviation', 'season', 'seasonId', 'signature',
    'recognition', 'fact', 'guideNote', 'sourceIds', 'relatedConstellationIds', 'stars', 'lines',
  ].filter((field) => constellation[field] === undefined || constellation[field] === '');
  if (missing.length) {
    errors.push(`Constelação incompleta em ${constellation.id || constellation.name}: ${missing.join(', ')}`);
  }

  if (constellationIds.has(constellation.id)) errors.push(`ID de constelação duplicado: ${constellation.id}`);
  if (constellationSlugs.has(constellation.slug)) errors.push(`Slug de constelação duplicado: ${constellation.slug}`);
  if (constellationAbbreviations.has(constellation.abbreviation)) {
    errors.push(`Abreviação de constelação duplicada: ${constellation.abbreviation}`);
  }
  constellationIds.add(constellation.id);
  constellationSlugs.add(constellation.slug);
  constellationAbbreviations.add(constellation.abbreviation);

  if (!/^[A-Z][A-Za-z]{2}$/.test(constellation.abbreviation)) {
    errors.push(`Abreviação inválida em ${constellation.id}: ${constellation.abbreviation}`);
  }
  if (!constellationSeasonIds.has(constellation.seasonId)) {
    errors.push(`Estação inválida em ${constellation.id}: ${constellation.seasonId}`);
  }
  if (typeof constellation.signature !== 'string' || !constellation.signature.trim()) {
    errors.push(`Assinatura visual ausente em ${constellation.id}`);
  }
  if (!Array.isArray(constellation.sourceIds) || !constellation.sourceIds.length) {
    errors.push(`Fontes ausentes em ${constellation.id}`);
  }
  if (!Array.isArray(constellation.relatedConstellationIds)) {
    errors.push(`Relações de constelação inválidas em ${constellation.id}`);
  }
  if (!Array.isArray(constellation.stars) || constellation.stars.length < 4) {
    errors.push(`Estrelas insuficientes em ${constellation.id}`);
  }
  if (!Array.isArray(constellation.lines) || !constellation.lines.length) {
    errors.push(`Linhas-guia ausentes em ${constellation.id}`);
  }

  const unknownSources = constellation.sourceIds.filter((id) => !constellationReferenceIds.has(id));
  if (unknownSources.length) {
    errors.push(`Fontes desconhecidas em ${constellation.id}: ${unknownSources.join(', ')}`);
  }

  const starIds = new Set();
  for (const star of Array.isArray(constellation.stars) ? constellation.stars : []) {
    const missingStarFields = ['id', 'name', 'designation', 'magnitude', 'x', 'y', 'tone', 'label', 'role']
      .filter((field) => star[field] === undefined || star[field] === '');
    if (missingStarFields.length) {
      errors.push(`Estrela incompleta em ${constellation.id}: ${missingStarFields.join(', ')}`);
    }
    if (starIds.has(star.id)) errors.push(`ID de estrela duplicado em ${constellation.id}: ${star.id}`);
    starIds.add(star.id);
    if (!Number.isFinite(star.magnitude)) errors.push(`Magnitude inválida em ${constellation.id}/${star.id}`);
    if (!Number.isFinite(star.x) || !Number.isFinite(star.y)
      || star.x < 0 || star.x > 100 || star.y < 0 || star.y > 100) {
      errors.push(`Posição inválida em ${constellation.id}/${star.id}`);
    }
    if (!['warm', 'cool', 'white'].includes(star.tone)) {
      errors.push(`Tom estelar inválido em ${constellation.id}/${star.id}: ${star.tone}`);
    }
    if (typeof star.label !== 'boolean') errors.push(`Indicador de rótulo inválido em ${constellation.id}/${star.id}`);
    if (!constellationStarRoles.has(star.role)) {
      errors.push(`Papel estelar inválido em ${constellation.id}/${star.id}: ${star.role}`);
    }
    for (const offset of ['labelDx', 'labelDy']) {
      if (star[offset] !== undefined && !Number.isFinite(star[offset])) {
        errors.push(`Deslocamento de rótulo inválido em ${constellation.id}/${star.id}: ${offset}`);
      }
    }
    if (star.labelAnchor !== undefined && !constellationLabelAnchors.has(star.labelAnchor)) {
      errors.push(`Âncora de rótulo inválida em ${constellation.id}/${star.id}: ${star.labelAnchor}`);
    }
    if (star.chartLabel !== undefined && (typeof star.chartLabel !== 'string' || !star.chartLabel.trim())) {
      errors.push(`Rótulo visual inválido em ${constellation.id}/${star.id}`);
    }
  }

  const connectedStarIds = new Set();
  const lineKeys = new Set();
  for (const line of Array.isArray(constellation.lines) ? constellation.lines : []) {
    if (!Array.isArray(line) || line.length !== 2) {
      errors.push(`Linha-guia inválida em ${constellation.id}`);
      continue;
    }
    const [sourceId, targetId] = line;
    const lineKey = [sourceId, targetId].sort().join('\u0000');
    if (lineKeys.has(lineKey)) {
      errors.push(`Linha-guia duplicada em ${constellation.id}: ${sourceId} → ${targetId}`);
    }
    lineKeys.add(lineKey);
    connectedStarIds.add(sourceId);
    connectedStarIds.add(targetId);
    if (!starIds.has(sourceId) || !starIds.has(targetId)) {
      errors.push(`Linha-guia aponta para estrela desconhecida em ${constellation.id}: ${sourceId} → ${targetId}`);
    }
    if (sourceId === targetId) errors.push(`Linha-guia circular em ${constellation.id}: ${sourceId}`);
  }

  for (const star of Array.isArray(constellation.stars) ? constellation.stars : []) {
    if (!connectedStarIds.has(star.id) && !['landmark', 'context'].includes(star.role)) {
      errors.push(`Estrela isolada precisa ser landmark ou context em ${constellation.id}/${star.id}`);
    }
  }

  if (constellation.featuredRank !== null) {
    if (!Number.isInteger(constellation.featuredRank) || constellation.featuredRank < 1) {
      errors.push(`Posição de destaque inválida em ${constellation.id}`);
    } else {
      constellationFeaturedRanks.push(constellation.featuredRank);
    }
  }
}

for (const constellation of CONSTELLATIONS) {
  if (!Array.isArray(constellation.relatedConstellationIds)) continue;
  const relatedIds = new Set();
  for (const relatedId of constellation.relatedConstellationIds) {
    if (relatedIds.has(relatedId)) {
      errors.push(`Constelação relacionada duplicada em ${constellation.id}: ${relatedId}`);
    }
    relatedIds.add(relatedId);
    if (relatedId === constellation.id) {
      errors.push(`Constelação não pode se relacionar consigo mesma: ${constellation.id}`);
    } else if (!constellationIds.has(relatedId)) {
      errors.push(`Constelação relacionada desconhecida em ${constellation.id}: ${relatedId}`);
    }
  }
}

if (constellationFeaturedRanks.length !== 3 || new Set(constellationFeaturedRanks).size !== 3
  || constellationFeaturedRanks.sort((a, b) => a - b).join(',') !== '1,2,3') {
  errors.push('A home precisa de exatamente três constelações com posições de destaque 1, 2 e 3.');
}

for (const [id, reference] of Object.entries(CONSTELLATION_REFERENCES)) {
  if (!reference.title || !reference.institution || !reference.url) {
    errors.push(`Referência de constelação incompleta: ${id}`);
    continue;
  }
  try {
    const url = new URL(reference.url);
    if (url.protocol !== 'https:') throw new Error();
  } catch {
    errors.push(`URL de referência de constelação inválida: ${id}`);
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
