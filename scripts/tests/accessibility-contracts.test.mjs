import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('home oferece seis controles acessíveis para a ressonância', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const controls = [...html.matchAll(/<button[^>]+data-string-key="(\d)"[^>]*>/g)];
  assert.deepEqual(controls.map((match) => Number(match[1])), [0, 1, 2, 3, 4, 5]);
  controls.forEach(([button]) => assert.match(button, /aria-label="[^"]+"/));
  assert.match(html, /id="resonance-instructions"[^>]*>[^<]*seis botões/i);
});

test('erros do formulário estão ligados aos respectivos campos', async () => {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  for (const field of ['name', 'email', 'message']) {
    assert.match(html, new RegExp(`(?:input|textarea)[^>]+(?:id|name)="${field}"[^>]+aria-describedby="${field}-error"`, 'i'));
    assert.match(html, new RegExp(`id="${field}-error"[^>]+data-error-for="${field}"`, 'i'));
  }
  assert.match(html, /aria-atomic="true"[^>]*data-contact-status/);
});

test('alvos invisíveis saem da navegação por teclado', async () => {
  const [html, navigation, css] = await Promise.all([
    readFile(resolve(root, 'index.html'), 'utf8'),
    readFile(resolve(root, 'assets/js/navigation.js'), 'utf8'),
    readFile(resolve(root, 'assets/css/styles.css'), 'utf8'),
  ]);
  assert.match(html, /data-back-to-top[^>]+aria-hidden="true"[^>]+tabindex="-1"/);
  assert.match(navigation, /nav\.inert\s*=/);
  assert.match(navigation, /backToTop\.inert\s*=/);
  assert.match(css, /\.back-to-top\s*\{[\s\S]*?visibility:\s*hidden/);
  assert.match(css, /@media \(max-width: 1080px\)[\s\S]*?\.primary-nav\s*\{[\s\S]*?visibility:\s*hidden/);
});

test('busca global tolera o índice pendente e restaura foco apenas em alvos utilizáveis', async () => {
  const search = await readFile(resolve(root, 'assets/js/global-search.js'), 'utf8');
  assert.match(search, /entriesPromise:\s*null/);
  assert.match(search, /if \(!searchState\.entries\)\s*\{[\s\S]*?Carregando índice/);
  assert.match(search, /candidate\.isConnected/);
  assert.match(search, /closest\('\[inert\], \[hidden\], \[aria-hidden="true"\]'\)/);
  assert.match(search, /candidate\.matches\(':disabled'\)/);
  assert.match(search, /candidate\.getClientRects\(\)\.length > 0/);
  assert.match(search, /desktop[\s\S]*?\? \[searchState\.trigger, searchState\.returnFocus, menuToggle, brand\]/);
});

test('cards das rotas preservam HTML válido e levam o foco ao percurso aberto', async () => {
  const [html, script] = await Promise.all([
    readFile(resolve(root, 'Rotas/rotas.html'), 'utf8'),
    readFile(resolve(root, 'Rotas/rotas.js'), 'utf8'),
  ]);
  const cardStart = script.indexOf('function createCatalogCard');
  const cardEnd = script.indexOf('function renderCatalog');
  const cardFactory = script.slice(cardStart, cardEnd);
  assert.doesNotMatch(cardFactory, /createElement\('(h3|p|div)'/);
  assert.match(cardFactory, /createElement\('span', 'route-catalog-title'/);
  assert.match(cardFactory, /createElement\('span', 'route-catalog-summary'/);
  assert.match(cardFactory, /createElement\('span', 'route-catalog-meta'/);
  assert.match(html, /id="route-player-title" tabindex="-1" data-route-title/);
  assert.match(script, /selectPath\(button\.dataset\.routeId, \{ focusPlayer: true \}\)/);
  assert.match(script, /dom\.title\.focus\(\{ preventScroll: true \}\)/);
});

test('treino do Atlas usa uma única região para anunciar a resposta', async () => {
  const [html, script] = await Promise.all([
    readFile(resolve(root, 'Constelacoes/constelacoes.html'), 'utf8'),
    readFile(resolve(root, 'Constelacoes/constelacoes.js'), 'utf8'),
  ]);
  const feedback = html.match(/<p[^>]*data-atlas-training-feedback[^>]*>/)?.[0] || '';
  const announcement = html.match(/<p[^>]*data-atlas-announcement[^>]*>/)?.[0] || '';
  assert.doesNotMatch(feedback, /aria-live/);
  assert.match(announcement, /aria-live="polite"/);
  assert.match(announcement, /aria-atomic="true"/);
  assert.match(script, /announce\(dom\.trainingFeedback\.textContent\)/);
});
