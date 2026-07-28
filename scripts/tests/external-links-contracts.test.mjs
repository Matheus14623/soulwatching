import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  checkExternalLinks,
  extractHttpLinks,
  extractPublicHtmlLinks,
} from '../check-external-links.mjs';

test('extrator encontra URLs HTTP sem carregar pontuação textual', () => {
  assert.deepEqual(
    extractHttpLinks('Veja https://example.com/a. E também http://example.org/b?q=1;'),
    ['https://example.com/a', 'http://example.org/b?q=1'],
  );
});

test('extrator HTML ignora preconnect e mantém navegação e folha de estilo externas', () => {
  assert.deepEqual(
    extractPublicHtmlLinks([
      '<link rel="preconnect" href="https://fonts.example.com">',
      '<link href="https://fonts.example.com/styles.css" rel="stylesheet">',
      '<a href="https://example.com/artigo">Artigo</a>',
    ].join('')),
    ['https://fonts.example.com/styles.css', 'https://example.com/artigo'],
  );
});

test('verificador deduplica links e diferencia ausência de resposta', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.endsWith('/missing')) return { status: 404 };
    if (url.endsWith('/restricted')) return { status: 403 };
    return { status: 204 };
  };
  const results = await checkExternalLinks([
    'https://example.com/ok',
    'https://example.com/ok',
    'https://example.com/restricted',
    'https://example.com/missing',
  ], { fetchImpl, concurrency: 2 });

  assert.equal(calls.length, 3);
  assert.equal(results.find(({ url }) => url.endsWith('/ok')).accepted, true);
  assert.equal(results.find(({ url }) => url.endsWith('/restricted')).accepted, true);
  assert.equal(results.find(({ url }) => url.endsWith('/missing')).accepted, false);
});

test('verificador repete falha de transporte e limita o bloqueio 999 ao LinkedIn', async () => {
  const attempts = new Map();
  const fetchImpl = async (url) => {
    attempts.set(url, (attempts.get(url) || 0) + 1);
    if (url.includes('transient')) {
      if (attempts.get(url) === 1) throw new Error('socket fechado');
      return { status: 200 };
    }
    return { status: 999 };
  };
  const results = await checkExternalLinks([
    'https://example.com/transient',
    'https://www.linkedin.com/in/exemplo/',
    'https://example.com/nonstandard',
  ], {
    concurrency: 1,
    fetchImpl,
    retries: 1,
    timeoutMs: 50,
  });

  assert.equal(attempts.get('https://example.com/transient'), 2);
  assert.equal(results[0].accepted, true);
  assert.equal(results[1].accepted, true);
  assert.equal(results[2].accepted, false);
});
