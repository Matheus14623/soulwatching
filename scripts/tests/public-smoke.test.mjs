import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PUBLIC_ROUTES } from '../public-manifest.mjs';
import { readResponse, startServer, stopServer } from './test-server.mjs';

test('preview de dist entrega as rotas e assets públicos', async () => {
  const { child, origin } = await startServer('--dist');
  try {
    for (const route of PUBLIC_ROUTES) {
      const response = await readResponse(`${origin}${route.url}`);
      assert.equal(response.status, 200, route.file);
      assert.match(response.headers['content-type'] || '', /^text\/html/);
      assert.match(response.body, /<!doctype html>/i);
      assert.match(response.body, /<title>[^<]+<\/title>/i);
      assert.match(response.body, /<main(?:\s|>)/i);

      const cleanResponse = await readResponse(`${origin}${route.cleanUrl}`);
      assert.equal(cleanResponse.status, 200, route.cleanUrl);
    }

    const stylesheet = await readResponse(`${origin}/assets/css/styles.css`);
    assert.equal(stylesheet.status, 200);
    assert.match(stylesheet.headers['content-type'] || '', /^text\/css/);

    const module = await readResponse(`${origin}/assets/js/main.js`);
    assert.equal(module.status, 200);
    assert.match(module.headers['content-type'] || '', /^text\/javascript/);

    const missing = await readResponse(`${origin}/pagina-inexistente`);
    assert.equal(missing.status, 404);

    const unsupported = await readResponse(`${origin}/`, { method: 'POST' });
    assert.equal(unsupported.status, 405);
  } finally {
    await stopServer(child);
  }
});

test('servidor de desenvolvimento não expõe arquivos internos', async () => {
  const { child, origin } = await startServer('--source');
  try {
    const publicPage = await readResponse(`${origin}/`);
    assert.equal(publicPage.status, 200);

    for (const privatePath of ['/ai/INDEX.md', '/docs/INTEGRACAO_TEORIAS.md', '/package.json']) {
      const response = await readResponse(`${origin}${privatePath}`);
      assert.equal(response.status, 404, privatePath);
      assert.doesNotMatch(response.body, /Base de conhecimento|Integração das teorias|matheus-observatorio-ideias/i);
    }
  } finally {
    await stopServer(child);
  }
});
