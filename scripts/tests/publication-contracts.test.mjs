import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  createPublicationView,
  publicationCanonicalHref,
  publicationHref,
  publicationRobots,
  resolvePublication,
} from '../../assets/js/publication-model.js';
import {
  generatePublicationPages,
  publicationAliasRoute,
  publicationRoute,
  renderPublicationPage,
} from '../publication-pages.mjs';
import {
  publicationContextFixture,
  publicationFixture,
} from './fixtures/publication.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('prerender de publicações pode iniciar em clone limpo sem depender do runtime gerado', async () => {
  const [generator, routing] = await Promise.all([
    readFile(resolve(root, 'scripts', 'publication-pages.mjs'), 'utf8'),
    readFile(resolve(root, 'assets', 'js', 'publication-routing.js'), 'utf8'),
  ]);

  assert.match(generator, /assets\/js\/publication-routing\.js/);
  assert.doesNotMatch(generator, /assets\/js\/publication-model\.js/);
  assert.doesNotMatch(routing, /data\/generated|content-snapshot|publications\.js/);
});

test('modelo de publicação resolve slug e alias e deriva uma única projeção de leitura', () => {
  const fixture = publicationFixture();
  assert.strictEqual(resolvePublication([fixture], fixture.slug), fixture);
  assert.strictEqual(resolvePublication([fixture], fixture.aliases[0]), fixture);
  assert.equal(resolvePublication([fixture], '../invalido'), null);

  const view = createPublicationView(fixture);
  assert.equal(view.typeLabel, 'Ensaio');
  assert.equal(view.availabilityLabel, 'Publicada');
  assert.equal(view.originLabel, 'Contribuição externa');
  assert.equal(view.credits[0].displayName, 'Autora');
  assert.deepEqual(view.authors.map(({ displayName }) => displayName), ['Autora']);
  assert.strictEqual(view.latestRevision, view.revisions[0]);
  assert.ok(Object.isFrozen(view));
});

test('URL pública é estável e rejeita identificadores inseguros', () => {
  assert.equal(
    publicationHref('ensaio-de-teste'),
    '/Arquivo/publicacoes/ensaio-de-teste.html',
  );
  assert.equal(
    publicationCanonicalHref('ensaio-de-teste'),
    '/Arquivo/publicacoes/ensaio-de-teste',
  );
  assert.equal(publicationRobots('published'), 'index, follow');
  assert.equal(publicationRobots('withdrawn'), 'noindex, follow');
  assert.throws(() => publicationHref('../segredo'), /inválido/);
});

test('Arquivo, Contribuições e leitura individual consomem o catálogo gerado sem inventar entradas', async () => {
  const [archiveHtml, archiveController, publicationHtml, publicationController, contributionController] = await Promise.all([
    readFile(resolve(root, 'Arquivo', 'arquivo.html'), 'utf8'),
    readFile(resolve(root, 'Arquivo', 'arquivo.js'), 'utf8'),
    readFile(resolve(root, 'Arquivo', 'publicacao.html'), 'utf8'),
    readFile(resolve(root, 'Arquivo', 'publicacao.js'), 'utf8'),
    readFile(resolve(root, 'Contribuicoes', 'contribuicoes.js'), 'utf8'),
  ]);

  assert.match(archiveController, /PUBLICATIONS/);
  assert.match(archiveHtml, /data-publication-empty/);
  assert.match(archiveHtml, /data-publication-list/);
  assert.match(publicationHtml, /name="robots" content="noindex, follow"/);
  assert.match(publicationController, /resolvePublication\(PUBLICATIONS/);
  assert.match(publicationController, /publicSnapshot/);
  assert.match(publicationController, /claimLinks/);
  assert.match(publicationController, /assetRights/);
  assert.match(contributionController, /EXTERNAL_CONTRIBUTIONS/);
});

test('prerender gera uma rota canônica indexável e conteúdo útil sem JavaScript', () => {
  const fixture = publicationFixture();
  const template = [
    '<!doctype html><html><head>',
    '<meta name="author" content="Observatório" data-publication-author />',
    '<meta name="robots" content="noindex, follow" data-publication-robots />',
    '<meta property="og:title" content="Publicação" data-publication-og-title />',
    '<meta property="og:description" content="Resumo" data-publication-og-description />',
    '<title>Publicação</title></head>',
    '<body class="observatory-page-body publication-page-body" data-mode="normal">',
    '<section data-publication-state></section>',
    '<article data-publication-document hidden>',
    '<p data-publication-kicker></p><h1 data-publication-title></h1>',
    '<p data-publication-summary></p><p data-publication-byline></p>',
    '<strong data-publication-status></strong>',
    '<dl class="page-status-list" data-publication-metadata></dl>',
    '<aside data-publication-notice hidden></aside>',
    '<div data-publication-body></div><ul data-publication-credits></ul>',
    '<div data-publication-transparency></div>',
    '<section data-publication-references-section hidden><ol data-publication-references></ol></section>',
    '<section data-publication-relations-section hidden><ul data-publication-relations></ul></section>',
    '<section data-publication-assets-section hidden><div data-publication-assets></div></section>',
    '<ol data-publication-history></ol></article></body></html>',
  ].join('');
  const html = renderPublicationPage(template, fixture, publicationContextFixture());
  const route = publicationRoute(fixture);

  assert.equal(route.cleanUrl, '/Arquivo/publicacoes/ensaio-de-teste');
  assert.equal(route.structuredData['@type'], 'Article');
  assert.doesNotMatch(html, /<base\b/);
  assert.match(html, /rel="canonical" href="\/Arquivo\/publicacoes\/ensaio-de-teste"/);
  assert.match(html, /name="author" content="Autora"/);
  assert.match(html, /content="index, follow"/);
  assert.match(html, /data-publication-slug="ensaio-de-teste"/);
  assert.match(html, /<h1 data-publication-title>Ensaio de teste<\/h1>/);
  assert.match(html, /Texto público com &lt;caracteres&gt;/);
  assert.match(html, /Sustenta esta afirmação/);
  assert.match(html, /Fonte de teste/);
  assert.match(html, /Revisão editorial concluída/);
  assert.match(html, /Creative Commons Atribuição 4.0/);
  assert.match(html, /Linha de teste/);
  assert.match(html, /Gráfico da Autora/);
  assert.match(html, /<summary>Ler o texto desta versão<\/summary>/);
  assert.match(html, /Texto preservado no snapshot público\./);
  assert.match(html, /href="#revisao-ensaio-de-teste-r1">Link para citar esta revisão<\/a>/);
  assert.doesNotMatch(html, /<code>sha256:/);
  assert.doesNotMatch(html, /data-publication-references-section hidden/);
  assert.doesNotMatch(html, /data-publication-relations-section hidden/);
  assert.doesNotMatch(html, /data-publication-assets-section hidden/);
  assert.doesNotMatch(html, /data-publication-document hidden/);
  assert.match(
    html,
    /data-publication-references-section><ol data-publication-references><li>/,
  );
  assert.match(
    html,
    /data-publication-relations-section><ul data-publication-relations><li>/,
  );
  assert.match(
    html,
    /data-publication-assets-section><div data-publication-assets><figure/,
  );

  const organization = publicationFixture();
  const author = organization.credits.find(({ roles }) => roles.includes('author'));
  author.partyType = 'organization';
  author.authorizedLinks = ['https://example.com/organizacao'];
  const organizationRoute = publicationRoute(organization);
  assert.deepEqual(organizationRoute.structuredData.author[0], {
    '@type': 'Organization',
    name: 'Autora',
    url: 'https://example.com/organizacao',
  });
});

test('aliases geram arquivos estáticos noindex com canonical para o slug principal', async () => {
  const fixture = publicationFixture();
  fixture.aliases = [
    fixture.slug,
    fixture.id,
    'ensaio-antigo',
    'ensaio-antigo',
  ];
  const directory = await mkdtemp(resolve(tmpdir(), 'observatorio-publication-'));
  const archiveDirectory = resolve(directory, 'Arquivo');
  await mkdir(archiveDirectory, { recursive: true });
  await writeFile(
    resolve(archiveDirectory, 'publicacao.html'),
    [
      '<!doctype html><html><head>',
      '<meta name="author" content="Observatório" data-publication-author />',
      '<meta name="robots" content="noindex, follow" data-publication-robots />',
      '<meta property="og:title" content="Publicação" data-publication-og-title />',
      '<meta property="og:description" content="Resumo" data-publication-og-description />',
      '<title>Publicação</title></head>',
      '<body class="observatory-page-body publication-page-body" data-mode="normal">',
      '<a href="#conteudo">Ir ao conteúdo</a>',
      '<section data-publication-state></section>',
      '<article data-publication-document hidden>',
      '<p data-publication-kicker></p><h1 data-publication-title></h1>',
      '<p data-publication-summary></p><p data-publication-byline></p>',
      '<strong data-publication-status></strong>',
      '<dl class="page-status-list" data-publication-metadata></dl>',
      '<aside data-publication-notice hidden></aside>',
      '<div data-publication-body></div><ul data-publication-credits></ul>',
      '<ol data-publication-history></ol></article></body></html>',
    ].join(''),
    'utf8',
  );

  try {
    const routes = await generatePublicationPages(directory, [fixture]);
    const canonical = await readFile(
      resolve(directory, 'Arquivo', 'publicacoes', 'ensaio-de-teste.html'),
      'utf8',
    );
    const alias = await readFile(
      resolve(directory, 'Arquivo', 'publicacoes', 'ensaio-antigo.html'),
      'utf8',
    );
    assert.equal(routes.length, 2);
    assert.equal(publicationAliasRoute(fixture, 'ensaio-antigo').sitemap, false);
    assert.match(canonical, /content="index, follow"/);
    assert.match(alias, /content="noindex, follow"/);
    assert.match(alias, /rel="canonical" href="\/Arquivo\/publicacoes\/ensaio-de-teste"/);
    assert.match(alias, /href="#conteudo"/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test('estado retirado preserva aviso e contestação no HTML sem JavaScript', () => {
  const fixture = publicationFixture();
  fixture.availabilityState = 'withdrawn';
  fixture.publicNotice = {
    type: 'withdrawn',
    effectiveAt: '2026-07-20',
    affectedRevisionId: 'ensaio-de-teste-r1',
    reason: 'A autoria solicitou a retirada enquanto revisa o argumento publicado.',
    decisionAuthority: 'author-request',
    contest: {
      channelPath: '/Contribuicoes/contribuicoes.html',
      responseWindowDays: 30,
      instructions: 'Envie uma contestação identificando a publicação e a revisão.',
    },
  };
  const template = [
    '<!doctype html><html><head>',
    '<meta name="author" content="Observatório" data-publication-author />',
    '<meta name="robots" content="noindex, follow" data-publication-robots />',
    '<meta property="og:title" content="Publicação" data-publication-og-title />',
    '<meta property="og:description" content="Resumo" data-publication-og-description />',
    '<title>Publicação</title></head>',
    '<body class="observatory-page-body publication-page-body" data-mode="normal">',
    '<section data-publication-state></section><article data-publication-document hidden>',
    '<p data-publication-kicker></p><h1 data-publication-title></h1>',
    '<p data-publication-summary></p><p data-publication-byline></p>',
    '<strong data-publication-status></strong>',
    '<dl class="page-status-list" data-publication-metadata></dl>',
    '<aside data-publication-notice hidden></aside>',
    '<div data-publication-body></div><ul data-publication-credits></ul>',
    '<ol data-publication-history></ol></article></body></html>',
  ].join('');
  const html = renderPublicationPage(template, fixture);

  assert.match(html, /content="noindex, follow"/);
  assert.match(html, /A autoria solicitou a retirada/);
  assert.match(html, /Abrir canal de contestação/);
  assert.doesNotMatch(html, /data-publication-notice hidden/);
});
