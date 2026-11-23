import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { normalizePixKey } from '../../assets/js/pix-support.js';
import {
  PUBLIC_BUILD_FILES,
  PUBLIC_REQUIRED_FILES,
  PUBLIC_ROUTES,
} from '../public-manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const expectedKey = 'f52f5728-47de-40fe-8fc5-b7f4cac8b0bd';
const imagePath = 'assets/images/pix-apoio-observatorio.png';
const compactInvitationPages = Object.freeze([
  Object.freeze({ file: 'index.html', href: 'Contribuicoes/contribuicoes.html#apoiar' }),
  Object.freeze({ file: 'Teorias/teorias.html', href: '../Contribuicoes/contribuicoes.html#apoiar' }),
  Object.freeze({ file: 'Mapa/mapa.html', href: '../Contribuicoes/contribuicoes.html#apoiar' }),
  Object.freeze({ file: 'GrandesNomes/grandes-nomes.html', href: '../Contribuicoes/contribuicoes.html#apoiar' }),
  Object.freeze({ file: 'Constelacoes/constelacoes.html', href: '../Contribuicoes/contribuicoes.html#apoiar' }),
  Object.freeze({ file: 'Arquivo/arquivo.html', href: '../Contribuicoes/contribuicoes.html#apoiar' }),
  Object.freeze({ file: 'Arquivo/publicacao.html', href: '/Contribuicoes/contribuicoes.html#apoiar' }),
  Object.freeze({ file: 'Laboratorio/laboratorio.html', href: '../Contribuicoes/contribuicoes.html#apoiar' }),
  Object.freeze({ file: 'Laboratorio/experimento.html', href: '../Contribuicoes/contribuicoes.html#apoiar' }),
  Object.freeze({ file: 'Rotas/rotas.html', href: '../Contribuicoes/contribuicoes.html#apoiar' }),
]);

test('chave Pix pública usa o formato aleatório informado', () => {
  assert.equal(normalizePixKey(` ${expectedKey} `), expectedKey);
  assert.throws(() => normalizePixKey('email@example.org'), /inválida/i);
  assert.throws(() => normalizePixKey(''), /inválida/i);
});

test('páginas pertinentes encaminham uma única vez ao painel completo de apoio', async () => {
  const [pages, contributions, homePage, contributionsPage] = await Promise.all([
    Promise.all(compactInvitationPages.map(async ({ file, href }) => ({
      file,
      href,
      html: await readFile(resolve(root, file), 'utf8'),
    }))),
    readFile(resolve(root, 'Contribuicoes', 'contribuicoes.html'), 'utf8'),
    readFile(resolve(root, 'content', 'public', 'site-pages', 'home.json'), 'utf8'),
    readFile(resolve(root, 'content', 'public', 'site-pages', 'contributions.json'), 'utf8'),
  ]);

  const eligibleRoutes = PUBLIC_ROUTES
    .filter(({ id }) => id !== 'contribuicoes')
    .map(({ file }) => file)
    .sort();
  assert.deepEqual(
    compactInvitationPages.map(({ file }) => file).sort(),
    eligibleRoutes,
  );

  for (const { file, href, html } of pages) {
    const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] ?? '';
    assert.ok(main, `${file} deve possuir conteúdo principal`);
    assert.equal(
      main.match(/class="container about-support-invitation"/g)?.length ?? 0,
      1,
      `${file} deve possuir um único convite compacto`,
    );
    assert.equal(
      main.match(/id="apoio"/g)?.length ?? 0,
      1,
      `${file} deve possuir um único destino local de apoio`,
    );
    assert.ok(
      main.includes('<strong>Ajude a manter este campo em órbita.</strong>'),
      `${file} deve preservar a mensagem institucional`,
    );
    assert.ok(
      main.includes(`href="${href}"`),
      `${file} deve usar o caminho correto até Contribuições`,
    );
    assert.doesNotMatch(html, new RegExp(expectedKey));
    assert.doesNotMatch(html, /data-pix-support/);
  }

  assert.doesNotMatch(contributions, /about-support-invitation/);
  assert.match(contributions, /id="apoiar"[^>]+aria-labelledby="pix-support-title"/);
  assert.equal(contributions.match(/id="apoiar"/g)?.length ?? 0, 1);
  assert.match(contributions, new RegExp(`value="${expectedKey}"`));
  assert.match(contributions, /data-pix-key/);
  assert.match(contributions, /data-pix-copy/);
  assert.match(contributions, /role="status"[^>]+aria-live="polite"[^>]+aria-atomic="true"[^>]+data-pix-status/);
  assert.match(contributions, /Apoio não compra influência\./);
  assert.match(homePage, /"id": "sobre"[\s\S]+?"apoio"/);
  assert.doesNotMatch(homePage, /"id": "apoio"/);
  assert.match(contributionsPage, /"id": "apoiar"/);
});

test('QR Code é local, quadrado, explícito no manifesto e possui alternativa textual', async () => {
  const [image, contributions] = await Promise.all([
    readFile(resolve(root, imagePath)),
    readFile(resolve(root, 'Contribuicoes', 'contribuicoes.html'), 'utf8'),
  ]);

  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(image.readUInt32BE(16), 500);
  assert.equal(image.readUInt32BE(20), 500);
  assert.ok(image.byteLength > 1_000);
  assert.ok(PUBLIC_BUILD_FILES.includes(imagePath));
  assert.ok(PUBLIC_REQUIRED_FILES.includes(imagePath));
  assert.match(contributions, /src="\.\.\/assets\/images\/pix-apoio-observatorio\.png"/);
  assert.match(contributions, /alt="QR Code Pix para apoiar voluntariamente o Observatório de Ideias"/);
  assert.match(contributions, /width="500"[\s\S]+height="500"/);
});

test('módulo de apoio é local, idempotente e não transmite dados', async () => {
  const [module, controller] = await Promise.all([
    readFile(resolve(root, 'assets', 'js', 'pix-support.js'), 'utf8'),
    readFile(resolve(root, 'Contribuicoes', 'contribuicoes.js'), 'utf8'),
  ]);

  assert.ok(PUBLIC_REQUIRED_FILES.includes('assets/js/pix-support.js'));
  assert.match(module, /dataset\.pixSupportReady/);
  assert.match(module, /navigator\.clipboard\?\.writeText/);
  assert.match(module, /keyInput\.select\(\)/);
  assert.doesNotMatch(module, /\b(?:fetch|sendBeacon|localStorage|sessionStorage|document\.cookie)\b/);
  assert.match(controller, /import \{ initPixSupport \} from '\.\.\/assets\/js\/pix-support\.js'/);
  assert.match(controller, /initPixSupport\(\)/);
});
