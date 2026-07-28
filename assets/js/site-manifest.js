import { SITE_PAGES as GENERATED_SITE_PAGES } from '../data/generated/runtime/site-pages.js';

const ROOT_HREFS = Object.freeze({
  home: 'index.html#topo',
  routes: 'Rotas/rotas.html',
  theories: 'Teorias/teorias.html',
  map: 'Mapa/mapa.html',
  figures: 'GrandesNomes/grandes-nomes.html',
  constellations: 'Constelacoes/constelacoes.html',
  archive: 'Arquivo/arquivo.html',
  laboratory: 'Laboratorio/laboratorio.html',
  experiment: 'Laboratorio/experimento.html',
  contributions: 'Contribuicoes/contribuicoes.html',
  about: 'index.html#sobre',
});

function hrefsFor(key) {
  if (key === 'about') {
    return Object.freeze({ root: '#sobre', nested: '../index.html#sobre' });
  }
  const root = ROOT_HREFS[key];
  if (!root) throw new Error(`Destino institucional desconhecido: ${key}`);
  return Object.freeze({ root, nested: `../${root}` });
}

function freezeSections(sections = []) {
  return Object.freeze(sections.map((section) => Object.freeze({
    ...section,
    keywords: Object.freeze([...(section.keywords || [])]),
  })));
}

function definePage(page) {
  return Object.freeze({
    ...page,
    hrefs: hrefsFor(page.id),
    keywords: Object.freeze([...(page.keywords || [])]),
    matchPaths: Object.freeze([...(page.matchPaths || [])]),
    sections: freezeSections(page.sections),
  });
}

export const SITE_PAGES = Object.freeze(GENERATED_SITE_PAGES.map(definePage));

export const PRIMARY_NAVIGATION = Object.freeze([
  Object.freeze({ pageId: 'routes', label: 'Começar', group: 'Começar' }),
  Object.freeze({ pageId: 'theories', label: 'Teorias', group: 'Explorar' }),
  Object.freeze({ pageId: 'map', label: 'Mapa', group: 'Explorar' }),
  Object.freeze({ pageId: 'figures', label: 'Grandes nomes', group: 'Explorar' }),
  Object.freeze({ pageId: 'constellations', label: 'Constelações', group: 'Explorar' }),
  Object.freeze({ pageId: 'laboratory', label: 'Laboratório', group: 'Explorar' }),
  Object.freeze({ pageId: 'contributions', label: 'Contribuir', group: 'Contribuir' }),
  Object.freeze({ pageId: 'about', label: 'Sobre', group: 'Sobre' }),
]);

export const FOOTER_NAVIGATION = Object.freeze([
  Object.freeze({ pageId: 'home', label: 'Início' }),
  Object.freeze({ pageId: 'routes', label: 'Rotas guiadas' }),
  ...PRIMARY_NAVIGATION.slice(1, 6),
  Object.freeze({ pageId: 'archive', label: 'Publicações' }),
  Object.freeze({ pageId: 'contributions', label: 'Contribuições' }),
  Object.freeze({ pageId: 'about', label: 'Sobre' }),
]);

export const SITE_STATUS = Object.freeze({
  id: 'editorial-beta',
  label: 'Beta',
  displayLabel: 'Beta editorial',
  description: 'Beta editorial: navegação e catálogos em evolução',
  scope: 'O selo descreve a maturidade editorial e técnica da navegação e dos catálogos; não mede a validade científica de uma ideia.',
  exitCriteria: Object.freeze([
    'navegação uniforme em todas as rotas públicas',
    'schemas e geração de conteúdo estáveis',
    'jornadas críticas automatizadas',
    'primeira avaliação formativa com pessoas concluída',
  ]),
});

export const PUBLIC_GLOSSARY = Object.freeze([
  Object.freeze({
    term: 'Teorias',
    functionalTerm: 'Linhas de investigação autorais',
    definition: 'Hipóteses e estruturas em desenvolvimento, apresentadas com contexto, limites, objeções e caminhos de teste; não são teorias científicas estabelecidas.',
    pageId: 'theories',
  }),
  Object.freeze({
    term: 'Mapa',
    functionalTerm: 'Mapa de relações editoriais',
    definition: 'Índice visual de relações tipadas e justificadas entre ideias. Proximidade no mapa não constitui evidência científica.',
    pageId: 'map',
  }),
  Object.freeze({
    term: 'Grandes nomes',
    functionalTerm: 'Pessoas, métodos e descobertas',
    definition: 'Contexto histórico verificável. Uma relação com o acervo explica influência, contraste ou método; não implica endosso.',
    pageId: 'figures',
  }),
  Object.freeze({
    term: 'Publicações',
    functionalTerm: 'Arquivo editorial',
    definition: 'Ensaios, notas e contribuições que passaram por decisão editorial, com autoria, fontes, licença e histórico próprios.',
    pageId: 'archive',
  }),
  Object.freeze({
    term: 'Laboratório',
    functionalTerm: 'Simulações e modelos didáticos',
    definition: 'Experimentos interativos com premissas e limites explícitos. Ilustram modelos; não produzem validação empírica por si mesmos.',
    pageId: 'laboratory',
  }),
]);

const ABOUT_PAGE = Object.freeze({
  id: 'about',
  label: 'Sobre',
  functionalLabel: 'Sobre o Observatório',
  hrefs: hrefsFor('about'),
  matchPaths: Object.freeze([]),
});

export const FOOTER_EXTERNAL_LINKS = Object.freeze([
  Object.freeze({ id: 'email', label: 'E-mail', href: 'mailto:Matheuscamargodealencar@gmail.com' }),
  Object.freeze({ id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/gomin/', external: true }),
  Object.freeze({ id: 'github', label: 'GitHub', href: 'https://github.com/Matheus14623', external: true }),
]);

const pageById = new Map(SITE_PAGES.map((page) => [page.id, page]));
pageById.set(ABOUT_PAGE.id, ABOUT_PAGE);

export function getSitePage(pageId) {
  return pageById.get(pageId) || null;
}

export function isRootDocument(pathname = '/') {
  return pathname === '/' || pathname === '/index.html' || pathname === '';
}

export function resolveManifestHref(pageId, _pathname = '/') {
  const page = getSitePage(pageId);
  if (!page) throw new Error(`Página institucional desconhecida: ${pageId}`);
  return absoluteHref(page);
}

export function findSitePageByPath(pathname = '/') {
  if (/^\/Arquivo\/publicacoes\/[a-z0-9-]+(?:\.html)?\/?$/i.test(pathname)) {
    return pageById.get('archive') || null;
  }
  return SITE_PAGES.find((page) => page.matchPaths.includes(pathname)) || null;
}

function absoluteHref(page, section = null) {
  const root = page.hrefs.root.replace(/^index\.html/, '/index.html');
  const path = root.startsWith('/') ? root : `/${root}`;
  return section ? `${path.split('#')[0]}#${section.id}` : path;
}

export function getInstitutionalSearchEntries() {
  return SITE_PAGES.flatMap((page) => {
    const pageEntry = Object.freeze({
      id: `page:${page.id}`,
      type: 'page',
      category: 'Navegação',
      title: page.functionalLabel,
      summary: page.description,
      href: absoluteHref(page),
      searchText: [page.label, page.functionalLabel, page.title, page.description, ...page.keywords].join(' '),
    });
    const sectionEntries = page.sections
      .filter((section) => (
        section.label.toLocaleLowerCase('pt-BR')
        !== page.functionalLabel.toLocaleLowerCase('pt-BR')
      ))
      .map((section) => Object.freeze({
        id: `section:${page.id}:${section.id}`,
        type: 'section',
        category: page.label,
        title: section.title,
        summary: section.description,
        href: absoluteHref(page, section),
        searchText: [page.label, page.functionalLabel, section.label, section.title, section.description, ...section.keywords].join(' '),
      }));
    return [pageEntry, ...sectionEntries];
  });
}
