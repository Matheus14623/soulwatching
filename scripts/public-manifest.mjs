import { GENERATED_FILES } from './content/paths.mjs';

export function validatePublicManifestPath(path) {
  if (typeof path !== 'string' || !path) {
    throw new Error('Caminho vazio no manifesto público.');
  }
  const normalized = path.replaceAll('\\', '/');
  if (
    normalized !== path
    || normalized.startsWith('/')
    || normalized.startsWith('//')
    || /^[a-z]:\//i.test(normalized)
    || normalized.includes('?')
    || normalized.includes('#')
    || normalized.split('/').some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error(`Caminho inseguro no manifesto público: ${path}`);
  }
  return normalized;
}

export const PUBLIC_GENERATED_FILES = Object.freeze([
  'assets/data/generated/content-metrics.js',
  'assets/data/generated/search-index.js',
  'assets/data/generated/runtime/content-snapshot.js',
  'assets/data/generated/runtime/constellations.js',
  'assets/data/generated/runtime/experiments.js',
  'assets/data/generated/runtime/learning-paths.js',
  'assets/data/generated/runtime/notable-figures.js',
  'assets/data/generated/runtime/parties.js',
  'assets/data/generated/runtime/publications.js',
  'assets/data/generated/runtime/references.js',
  'assets/data/generated/runtime/relations.js',
  'assets/data/generated/runtime/research-tracks.js',
  'assets/data/generated/runtime/site-pages.js',
  'assets/data/generated/runtime/theories.js',
]);

const generatedFiles = new Set(GENERATED_FILES);
for (const file of PUBLIC_GENERATED_FILES) {
  if (!generatedFiles.has(file)) {
    throw new Error(`Artefato gerado público não pertence ao contrato do compilador: ${file}`);
  }
}

export const PUBLIC_ROUTES = Object.freeze([
  Object.freeze({ id: 'inicio', url: '/', cleanUrl: '/', file: 'index.html' }),
  Object.freeze({ id: 'teorias', url: '/Teorias/teorias.html', cleanUrl: '/Teorias/teorias', file: 'Teorias/teorias.html' }),
  Object.freeze({ id: 'mapa', url: '/Mapa/mapa.html', cleanUrl: '/Mapa/mapa', file: 'Mapa/mapa.html' }),
  Object.freeze({ id: 'grandes-nomes', url: '/GrandesNomes/grandes-nomes.html', cleanUrl: '/GrandesNomes/grandes-nomes', file: 'GrandesNomes/grandes-nomes.html' }),
  Object.freeze({ id: 'constelacoes', url: '/Constelacoes/constelacoes.html', cleanUrl: '/Constelacoes/constelacoes', file: 'Constelacoes/constelacoes.html' }),
  Object.freeze({ id: 'arquivo', url: '/Arquivo/arquivo.html', cleanUrl: '/Arquivo/arquivo', file: 'Arquivo/arquivo.html' }),
  Object.freeze({
    id: 'publicacao',
    url: '/Arquivo/publicacao.html',
    cleanUrl: '/Arquivo/publicacao',
    canonicalCleanUrl: '/Arquivo/arquivo',
    file: 'Arquivo/publicacao.html',
    sitemap: false,
  }),
  Object.freeze({ id: 'laboratorio', url: '/Laboratorio/laboratorio.html', cleanUrl: '/Laboratorio/laboratorio', file: 'Laboratorio/laboratorio.html' }),
  Object.freeze({ id: 'rotas', url: '/Rotas/rotas.html', cleanUrl: '/Rotas/rotas', file: 'Rotas/rotas.html' }),
  Object.freeze({ id: 'contribuicoes', url: '/Contribuicoes/contribuicoes.html', cleanUrl: '/Contribuicoes/contribuicoes', file: 'Contribuicoes/contribuicoes.html' }),
  Object.freeze({
    id: 'experimento',
    url: '/Laboratorio/experimento.html',
    cleanUrl: '/Laboratorio/experimento',
    canonicalCleanUrl: '/Laboratorio/laboratorio',
    file: 'Laboratorio/experimento.html',
    sitemap: false,
  }),
]);

export const PUBLIC_BUILD_DIRECTORIES = Object.freeze([
  'assets/css',
  'assets/icons',
  'assets/js',
  'Mapa',
  'Constelacoes',
  'Arquivo',
  'Laboratorio',
  'Rotas',
  'Contribuicoes',
]);

export const PUBLIC_BUILD_FILES = Object.freeze([
  'index.html',
  'teorias.html',
  'robots.txt',
  ...PUBLIC_GENERATED_FILES,
  'assets/vendor/swiper/swiper-bundle.min.css',
  'assets/vendor/swiper/swiper-bundle.min.js',
  'assets/vendor/swiper/LICENSE',
  'assets/images/camargo.webp',
  'assets/images/rain-window.webp',
  'assets/images/stoic-rock.webp',
  'assets/images/sisyphus-absurdism.webp',
  'assets/images/cosmic-scale.webp',
  'assets/images/matheus-camargo.webp',
  'assets/images/github-profile.webp',
  'assets/images/pix-apoio-observatorio.png',
  'assets/images/og-observatorio.jpg',
  'assets/data/constellations.js',
  'assets/data/contributions.js',
  'assets/data/experiments.js',
  'assets/data/learning-paths.js',
  'assets/data/notable-figure-references.js',
  'assets/data/notable-figures.js',
  'assets/data/research-tracks.js',
  'assets/data/theories.js',
  'assets/data/theory-references.js',
  'Teorias/teorias.html',
  'Teorias/teorias.css',
  'Teorias/teorias.js',
  'GrandesNomes/grandes-nomes.html',
  'GrandesNomes/grandes-nomes.css',
  'GrandesNomes/grandes-nomes.js',
]);

export const PUBLIC_BUILD_PATHS = Object.freeze([
  ...PUBLIC_BUILD_FILES,
  ...PUBLIC_BUILD_DIRECTORIES,
]);

export const PUBLIC_HTML_FILES = Object.freeze([
  ...PUBLIC_ROUTES.map((route) => route.file),
  'teorias.html',
]);

export const PUBLIC_REQUIRED_FILES = Object.freeze([
  ...PUBLIC_HTML_FILES,
  'robots.txt',
  'assets/css/styles.css',
  'assets/css/observatory-pages.css',
  'assets/css/constellation-chart.css',
  'assets/css/constellations-preview.css',
  'assets/css/global-search.css',
  'assets/css/notable-figures-preview.css',
  'assets/css/route-continuity.css',
  'assets/css/site-navigation.css',
  'assets/data/theories.js',
  'assets/data/theory-references.js',
  'assets/data/research-tracks.js',
  'assets/data/notable-figures.js',
  'assets/data/notable-figure-references.js',
  'assets/data/constellations.js',
  'assets/data/contributions.js',
  'assets/data/experiments.js',
  'assets/data/learning-paths.js',
  ...PUBLIC_GENERATED_FILES,
  'assets/js/main.js',
  'assets/js/config.js',
  'assets/js/navigation.js',
  'assets/js/observer.js',
  'assets/js/stellar-vision-info.js',
  'assets/js/theories.js',
  'assets/js/theory-figure-model.js',
  'assets/js/theory-model.js',
  'assets/js/theory-lab.js',
  'assets/js/philosophy.js',
  'assets/js/resonance.js',
  'assets/js/relation-review.js',
  'assets/js/smooth-scroll.js',
  'assets/js/route-continuity.js',
  'assets/js/site-manifest.js',
  'assets/js/site-navigation.js',
  'assets/js/contact.js',
  'assets/js/contribution-proposal.js',
  'assets/js/contribution-policy.js',
  'assets/js/contribution-draft.js',
  'assets/js/content-platform.js',
  'assets/js/content-repository.js',
  'assets/js/content-source.js',
  'assets/js/experiment-model.js',
  'assets/js/global-search.js',
  'assets/js/utils.js',
  'assets/js/page-shell.js',
  'assets/js/publication-model.js',
  'assets/js/publication-routing.js',
  'assets/js/public-content-text.js',
  'assets/js/pix-support.js',
  'assets/js/reference-model.js',
  'assets/js/notable-figures-model.js',
  'assets/js/notable-figures-preview.js',
  'assets/js/constellation-model.js',
  'assets/js/constellation-chart.js',
  'assets/js/constellations-preview.js',
  'assets/js/learning-paths-model.js',
  'assets/js/learning-paths-preview.js',
  'assets/js/site-metrics.js',
  'assets/vendor/swiper/swiper-bundle.min.css',
  'assets/vendor/swiper/swiper-bundle.min.js',
  'assets/vendor/swiper/LICENSE',
  'assets/icons/favicon.svg',
  'assets/images/camargo.webp',
  'assets/images/rain-window.webp',
  'assets/images/stoic-rock.webp',
  'assets/images/sisyphus-absurdism.webp',
  'assets/images/cosmic-scale.webp',
  'assets/images/matheus-camargo.webp',
  'assets/images/github-profile.webp',
  'assets/images/pix-apoio-observatorio.png',
  'assets/images/og-observatorio.jpg',
  'Teorias/teorias.css',
  'Teorias/teorias.js',
  'GrandesNomes/grandes-nomes.css',
  'GrandesNomes/grandes-nomes.js',
  'Mapa/mapa.css',
  'Mapa/mapa.js',
  'Constelacoes/constelacoes.css',
  'Constelacoes/constelacoes.js',
  'Constelacoes/whale-shark-easter-egg.js',
  'Arquivo/arquivo.css',
  'Arquivo/arquivo.js',
  'Arquivo/publicacao.css',
  'Arquivo/publicacao.js',
  'Laboratorio/laboratorio.css',
  'Laboratorio/laboratorio.js',
  'Laboratorio/experimento.css',
  'Laboratorio/experimento.js',
  'Laboratorio/simulations/astrobiology.js',
  'Laboratorio/simulations/finite-recurrence.js',
  'Laboratorio/simulations/light-cone.js',
  'Laboratorio/simulations/simulation-ui.js',
  'Laboratorio/simulations/zero-epsilon.js',
  'Rotas/rotas.css',
  'Rotas/rotas.js',
  'Contribuicoes/contribuicoes.css',
  'Contribuicoes/contribuicoes.js',
]);

for (const path of [
  ...PUBLIC_BUILD_FILES,
  ...PUBLIC_BUILD_DIRECTORIES,
  ...PUBLIC_REQUIRED_FILES,
]) {
  validatePublicManifestPath(path);
}
