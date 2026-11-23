import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CONTENT_SEARCH_INDEX } from '../../assets/data/generated/search-index.js';
import {
  findLearningPath,
  resolveLearningPath,
} from '../../assets/js/learning-paths-model.js';
import {
  FOOTER_EXTERNAL_LINKS,
  FOOTER_NAVIGATION,
  getInstitutionalSearchEntries,
  PRIMARY_NAVIGATION,
  resolveManifestHref,
  SITE_PAGES,
  SITE_STATUS,
} from '../../assets/js/site-manifest.js';
import {
  resolveRouteContext,
  withRouteContext,
} from '../../assets/js/route-continuity.js';
import { PUBLIC_ROUTES } from '../public-manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const publicHtmlFiles = PUBLIC_ROUTES.map(({ file }) => file);

function anchorLabels(fragment) {
  return [...fragment.matchAll(/<a\b[^>]*>([^<>]+)<\/a>/g)].map((match) => match[1].trim());
}

function navigationFragment(html, className) {
  return html.match(new RegExp(`<nav\\b[^>]*class="${className}"[\\s\\S]*?<\\/nav>`))?.[0] || '';
}

test('manifesto institucional mantém identidade, metadados e estado Beta centralizados', () => {
  assert.equal(new Set(SITE_PAGES.map((page) => page.id)).size, SITE_PAGES.length);
  assert.ok(SITE_PAGES.length > 0);
  for (const page of SITE_PAGES) {
    assert.ok(page.label);
    assert.ok(page.functionalLabel);
    assert.ok(page.hrefs.root);
    assert.ok(page.hrefs.nested);
    assert.ok(page.title.length >= 12);
    assert.ok(page.description.length >= 40);
    assert.ok(page.keywords.length >= 3);
    assert.ok(page.sections.length >= 1);
  }
  assert.equal(SITE_STATUS.id, 'editorial-beta');
  assert.equal(SITE_STATUS.label, 'Beta');
  assert.equal(SITE_STATUS.description, 'Versão beta');
  assert.ok(!Object.hasOwn(SITE_STATUS, 'exitCriteria'));
  assert.ok(PRIMARY_NAVIGATION.some((item) => item.pageId === 'archive' && item.group === 'Explorar'));
  assert.ok(FOOTER_NAVIGATION.some((item) => item.pageId === 'archive'));
});

test('navegação institucional permanece válida em páginas prerenderizadas profundas', () => {
  const publicationPath = '/Arquivo/publicacoes/ensaio-de-teste.html';
  assert.equal(
    resolveManifestHref('theories', publicationPath),
    '/Teorias/teorias.html',
  );
  assert.equal(
    resolveManifestHref('about', publicationPath),
    '/index.html#sobre',
  );
  assert.equal(
    resolveManifestHref('archive', publicationPath),
    '/Arquivo/arquivo.html',
  );
});

test('documentos públicos mantêm o mesmo fallback de cabeçalho e rodapé sem JavaScript', async () => {
  const expectedPrimary = PRIMARY_NAVIGATION.map((item) => item.label);
  const expectedFooter = [
    ...FOOTER_NAVIGATION.filter((item) => item.group === 'Explorar').map((item) => item.label),
    ...FOOTER_NAVIGATION.filter((item) => item.group !== 'Explorar').map((item) => item.label),
    ...FOOTER_EXTERNAL_LINKS.map((item) => item.label),
  ];

  for (const file of publicHtmlFiles) {
    const html = await readFile(resolve(root, file), 'utf8');
    assert.deepEqual(anchorLabels(navigationFragment(html, 'primary-nav')), expectedPrimary, file);
    assert.deepEqual(anchorLabels(navigationFragment(html, 'footer-links')), expectedFooter, file);
    assert.match(html, /site-navigation\.css/, file);
    assert.match(html, /data-footer-nav/, file);
    assert.ok(html.includes(`data-site-status-label>${SITE_STATUS.displayLabel}<`), `${file}: estado Beta no rodapé`);
    for (const label of ['Explorar', 'Observatório', 'Conectar']) {
      assert.ok(navigationFragment(html, 'footer-links').includes(`<strong>${label}</strong>`), `${file}: grupo ${label}`);
    }
  }
});

test('busca institucional deriva páginas e seções e cobre dúvidas de orientação', () => {
  const entries = getInstitutionalSearchEntries();
  assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length);
  const normalized = entries.map((entry) => `${entry.title} ${entry.summary} ${entry.searchText}`.toLocaleLowerCase('pt-BR'));
  for (const query of ['como contribuir', 'sobre', 'visão estelar']) {
    const terms = query.toLocaleLowerCase('pt-BR').split(' ');
    assert.ok(normalized.some((text) => terms.every((term) => text.includes(term))), query);
  }
  assert.ok(entries.every((entry) => entry.href.startsWith('/')));
  CONTENT_SEARCH_INDEX.forEach((entry) => {
    if (entry.type === 'figure') assert.match(entry.url, /\?perfil=[^#]+#galeria$/);
    if (entry.type === 'theory') assert.match(entry.url, /\?teoria=/);
  });
});

test('contexto de Rota aceita URLs locais e limpas, preserva etapa e rejeita origem forjada', () => {
  const path = resolveLearningPath(findLearningPath('tempo-gravidade-causalidade'));
  const stepIndex = 2;
  const contextualHref = withRouteContext(path.steps[stepIndex].href, path, stepIndex);
  const localContext = resolveRouteContext(`http://localhost:5173${contextualHref}`);
  assert.equal(localContext?.path.id, path.id);
  assert.equal(localContext?.stepNumber, stepIndex + 1);
  assert.match(localContext?.resumeHref || '', /rota=tempo-gravidade-causalidade/);
  assert.match(localContext?.nextHref || '', /etapa=4/);
  assert.match(localContext?.nextHref || '', /origem=rotas/);

  const cleanHref = contextualHref.replace('.html', '');
  const cleanContext = resolveRouteContext(`https://example.test${cleanHref}`);
  assert.equal(cleanContext?.step.id, path.steps[stepIndex].id);

  const forged = new URL(`https://example.test${contextualHref}`);
  forged.searchParams.set('origem', 'https://malicioso.example');
  assert.equal(resolveRouteContext(forged), null);

  const wrongDestination = new URL(`https://example.test${contextualHref}`);
  wrongDestination.pathname = '/Arquivo/arquivo';
  assert.equal(resolveRouteContext(wrongDestination), null);
});

test('páginas densas oferecem navegação local e interpretação antes das ferramentas', async () => {
  const [theories, figures] = await Promise.all([
    readFile(resolve(root, 'Teorias', 'teorias.html'), 'utf8'),
    readFile(resolve(root, 'GrandesNomes', 'grandes-nomes.html'), 'utf8'),
  ]);
  assert.match(theories, /data-local-navigation-links/);
  assert.match(figures, /data-local-navigation-links/);
  assert.ok(theories.indexOf('id="como-ler"') < theories.indexOf('id="comparar"'));
  assert.ok(figures.indexOf('id="como-ler"') < figures.indexOf('id="galeria"'));
  assert.match(theories, /<details class="theory-comparison-tool"/);
});

test('filtros de Teorias e relações do Mapa preservam contexto acessível', async () => {
  const [theoriesController, mapController] = await Promise.all([
    readFile(resolve(root, 'Teorias', 'teorias.js'), 'utf8'),
    readFile(resolve(root, 'Mapa', 'mapa.js'), 'utf8'),
  ]);
  assert.match(theoriesController, /if \(activeChanged\) syncUrl\(theories\[0\]\)/);
  assert.match(theoriesController, /requestAnimationFrame\(\(\) => .*?focus/s);
  assert.match(mapController, /relation\.relationLabel/);
  assert.match(mapController, /getPublicRelationJustification\(relation\)/);
  assert.match(mapController, /justification \? `<span class="map-related-justification"/);
  assert.match(mapController, /map-related-justification/);
});

test('entrada pública usa vocabulário funcional e não expõe telefone pessoal', async () => {
  const [home, legacyTheories, laboratory] = await Promise.all([
    readFile(resolve(root, 'index.html'), 'utf8'),
    readFile(resolve(root, 'teorias.html'), 'utf8'),
    readFile(resolve(root, 'Laboratorio', 'laboratorio.html'), 'utf8'),
  ]);
  assert.doesNotMatch(home, /tel:|BETA TEST/i);
  assert.doesNotMatch(home, /data-site-status-summary|O selo sai quando/);
  assert.ok(home.includes(`data-site-status-label>${SITE_STATUS.displayLabel}<`));
  assert.ok(home.indexOf('01 · orientação') < home.indexOf('02 · catálogo central'));
  assert.match(home, />Mapa de relações</);
  assert.doesNotMatch(legacyTheories, /Constelação de Teorias/i);
  assert.match(laboratory, />Entrar em contato</);
});
