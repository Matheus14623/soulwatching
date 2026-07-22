import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
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
import {
  NOTABLE_FIGURE_AREAS,
  NOTABLE_FIGURE_RELATION_TYPES,
  NOTABLE_FIGURES,
} from '../assets/data/notable-figures.js';
import { NOTABLE_FIGURE_REFERENCES } from '../assets/data/notable-figure-references.js';
import {
  CONSTELLATIONS,
  CONSTELLATION_REFERENCES,
} from '../assets/data/constellations.js';
import { THEORY_SOURCE_FILES } from './theory-sources.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'AGENTS.md',
  'ai/INDEX.md',
  'ai/ROUTING.md',
  'ai/knowledge.schema.json',
  'ai/knowledge-graph.json',
  'ai/maintenance/SOURCE_COVERAGE_LEDGER.md',
  'ai/tools/build-knowledge-graph.mjs',
  'ai/tools/build-source-coverage-ledger.mjs',
  'README.md',
  'DOCUMENTACAO_OBSERVATORIO_ATUALIZADA.md',
  'docs/INTEGRACAO_TEORIAS.md',
  'index.html',
  'teorias.html',
  'Teorias/teorias.html',
  'Teorias/teorias.css',
  'Teorias/teorias.js',
  'GrandesNomes/grandes-nomes.html',
  'GrandesNomes/grandes-nomes.css',
  'GrandesNomes/grandes-nomes.js',
  'assets/css/styles.css',
  'assets/css/observatory-pages.css',
  'assets/css/constellation-chart.css',
  'assets/css/constellations-preview.css',
  'assets/css/notable-figures-preview.css',
  'assets/data/theories.js',
  'assets/data/theory-references.js',
  'assets/data/research-tracks.js',
  'assets/data/notable-figures.js',
  'assets/data/notable-figure-references.js',
  'assets/data/constellations.js',
  'assets/js/main.js',
  'assets/js/config.js',
  'assets/js/navigation.js',
  'assets/js/observer.js',
  'assets/js/stellar-vision-info.js',
  'assets/js/theories.js',
  'assets/js/theory-model.js',
  'assets/js/theory-lab.js',
  'assets/js/philosophy.js',
  'assets/js/resonance.js',
  'assets/js/smooth-scroll.js',
  'assets/js/contact.js',
  'assets/js/utils.js',
  'assets/js/page-shell.js',
  'assets/js/notable-figures-model.js',
  'assets/js/notable-figures-preview.js',
  'assets/js/constellation-model.js',
  'assets/js/constellation-chart.js',
  'assets/js/constellations-preview.js',
  'assets/vendor/swiper/swiper-bundle.min.css',
  'assets/vendor/swiper/swiper-bundle.min.js',
  'assets/vendor/swiper/LICENSE',
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
  'Constelacoes/constelacoes.html',
  'Constelacoes/constelacoes.css',
  'Constelacoes/constelacoes.js',
  'Constelacoes/whale-shark-easter-egg.js',
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
  'Constelacoes/constelacoes.html',
  'GrandesNomes/grandes-nomes.html',
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
  'assets/data/notable-figures.js',
  'assets/data/notable-figure-references.js',
  'assets/data/constellations.js',
];
const publicData = (await Promise.all(
  publicDataFiles.map((file) => readFile(join(root, file), 'utf8')),
)).join('\n');
const publicCodeFiles = requiredFiles.filter((file) =>
  /^(?:assets|Teorias|Mapa|Constelacoes|GrandesNomes|Arquivo|Laboratorio)[\\/].*\.(?:css|js)$/i.test(file)
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

const notableFigureIds = new Set();
const notableFigureSlugs = new Set();
const notableAreaIds = new Set(NOTABLE_FIGURE_AREAS.map((area) => area.id));
const notableRelationTypeIds = new Set(
  NOTABLE_FIGURE_RELATION_TYPES.map((relationType) => relationType.id),
);
const notableReferenceIds = new Set(Object.keys(NOTABLE_FIGURE_REFERENCES));
const featuredRanks = [];

for (const figure of NOTABLE_FIGURES) {
  const missing = [
    'id', 'slug', 'name', 'lifespan', 'area', 'role', 'portrait',
    'summary', 'impact', 'contributions', 'milestones', 'sourceIds', 'theoryLinks',
  ].filter((field) => figure[field] === undefined || figure[field] === '');
  if (missing.length) errors.push(`Perfil incompleto em ${figure.id || figure.name}: ${missing.join(', ')}`);

  if (notableFigureIds.has(figure.id)) errors.push(`ID de grande nome duplicado: ${figure.id}`);
  if (notableFigureSlugs.has(figure.slug)) errors.push(`Slug de grande nome duplicado: ${figure.slug}`);
  notableFigureIds.add(figure.id);
  notableFigureSlugs.add(figure.slug);

  if (!notableAreaIds.has(figure.area) || figure.area === 'todas') {
    errors.push(`Área desconhecida em ${figure.id}: ${figure.area}`);
  }
  if (!Array.isArray(figure.contributions) || figure.contributions.length < 3) {
    errors.push(`Contribuições insuficientes em ${figure.id}`);
  }
  if (!Array.isArray(figure.milestones) || figure.milestones.length < 3) {
    errors.push(`Marcos insuficientes em ${figure.id}`);
  }
  if (!Array.isArray(figure.sourceIds) || !figure.sourceIds.length) {
    errors.push(`Fontes ausentes em ${figure.id}`);
  }
  if (!Array.isArray(figure.theoryLinks)) {
    errors.push(`Conexões com o Observatório inválidas em ${figure.id}`);
  }

  const unknownSources = figure.sourceIds.filter((id) => !notableReferenceIds.has(id));
  if (unknownSources.length) errors.push(`Fontes desconhecidas em ${figure.id}: ${unknownSources.join(', ')}`);

  for (const link of Array.isArray(figure.theoryLinks) ? figure.theoryLinks : []) {
    if (!theoryIds.has(link.theoryId)) {
      errors.push(`Teoria desconhecida em ${figure.id}: ${link.theoryId}`);
    }
    if (!notableRelationTypeIds.has(link.relationType)) {
      errors.push(`Tipo de relação desconhecido em ${figure.id}: ${link.relationType}`);
    }
    if (!link.label || !link.note) errors.push(`Relação incompleta em ${figure.id}`);
  }

  if (!figure.portrait?.src || !figure.portrait?.alt || !figure.portrait?.credit
    || !figure.portrait?.license || !figure.portrait?.sourceUrl || !figure.portrait?.modifications) {
    errors.push(`Metadados de retrato incompletos em ${figure.id}`);
  } else {
    const portraitPath = figure.portrait.src.split(/[?#]/, 1)[0];
    if (!/^assets[\\/]images[\\/]grandes-nomes[\\/]/i.test(portraitPath)) {
      errors.push(`Retrato fora do diretório público esperado em ${figure.id}`);
    }
    if (!portraitPath.toLowerCase().endsWith('.webp')) {
      errors.push(`Retrato não otimizado como WebP em ${figure.id}`);
    }
    if (!Number.isInteger(figure.portrait.width) || figure.portrait.width < 1
      || !Number.isInteger(figure.portrait.height) || figure.portrait.height < 1) {
      errors.push(`Dimensões de retrato inválidas em ${figure.id}`);
    }
    if (!(await fileExists(portraitPath))) {
      errors.push(`Retrato ausente em ${figure.id}: ${portraitPath}`);
    }
    try {
      const sourceUrl = new URL(figure.portrait.sourceUrl);
      if (!['https:', 'http:'].includes(sourceUrl.protocol)) throw new Error();
    } catch {
      errors.push(`URL de retrato inválida em ${figure.id}`);
    }
    if (/^CC/i.test(figure.portrait.license)) {
      try {
        const licenseUrl = new URL(figure.portrait.licenseUrl);
        if (licenseUrl.protocol !== 'https:') throw new Error();
      } catch {
        errors.push(`URL da licença Creative Commons inválida em ${figure.id}`);
      }
    }
  }

  if (figure.featuredRank !== null) {
    if (!Number.isInteger(figure.featuredRank) || figure.featuredRank < 1) {
      errors.push(`Posição de destaque inválida em ${figure.id}`);
    } else {
      featuredRanks.push(figure.featuredRank);
    }
  }
}

if (featuredRanks.length !== 3 || new Set(featuredRanks).size !== 3
  || featuredRanks.sort((a, b) => a - b).join(',') !== '1,2,3') {
  errors.push('A home precisa de exatamente três grandes nomes com posições 1, 2 e 3.');
}

for (const [id, reference] of Object.entries(NOTABLE_FIGURE_REFERENCES)) {
  if (!reference.title || !reference.institution || !reference.kind || !reference.url) {
    errors.push(`Referência de grande nome incompleta: ${id}`);
    continue;
  }
  try {
    const url = new URL(reference.url);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
  } catch {
    errors.push(`URL de referência de grande nome inválida: ${id}`);
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

if (CONSTELLATIONS.length !== 12) {
  errors.push(`O atlas precisa ter exatamente 12 constelações; encontrou ${CONSTELLATIONS.length}.`);
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

for (const script of [
  'ai/tools/build-source-coverage-ledger.mjs',
  'ai/tools/build-knowledge-graph.mjs',
]) {
  const result = spawnSync(process.execPath, [join(root, script), '--check'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout || '').trim();
    errors.push(`Base de conhecimento inválida em ${script}${detail ? `: ${detail}` : ''}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Verificação concluída: estrutura, referências, âncoras e linguagem principal OK.');
