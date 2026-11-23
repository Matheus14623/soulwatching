import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { createRequestSecurity, dashboardSecurityHeaders, isLoopbackAddress, readJsonBody } from '../services/security.mjs';
import { DashboardError, publicErrorPayload, sanitizeDiagnostics } from '../services/errors.mjs';

function requestWith(headers = {}, remoteAddress = '127.0.0.1') {
  return { socket: { remoteAddress }, headers: { host: 'localhost:4174', ...headers } };
}

test('isolamento local verifica endereço remoto, hostname e porta ativa', () => {
  const security = createRequestSecurity({ port: 4174 });
  for (const address of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) assert.equal(isLoopbackAddress(address), true);
  for (const address of ['192.168.1.1', '0.0.0.0', '', null]) assert.equal(isLoopbackAddress(address), false);
  assert.doesNotThrow(() => security.assertLoopbackRequest(requestWith()));
  assert.doesNotThrow(() => security.assertLoopbackRequest(requestWith({ host: '[::1]:4174' }, '::1')));
  assert.throws(() => security.assertLoopbackRequest(requestWith({}, '203.0.113.1')), { code: 'loopback-required' });
  for (const host of ['evil.invalid:4174', 'localhost:4175', 'localhost:0', 'localhost:4174,evil.invalid']) {
    assert.throws(() => security.assertLoopbackRequest(requestWith({ host })), { code: 'invalid-host' });
  }
  security.setPort(5000);
  assert.throws(() => security.assertLoopbackRequest(requestWith()), { code: 'invalid-host' });
  assert.throws(() => security.setPort(0), /Porta ativa/);
});

test('mutações exigem origem exata, JSON, contexto same-origin e CSRF', () => {
  const security = createRequestSecurity({ port: 4174, csrfToken: 'fixture-session-token' });
  const valid = {
    origin: 'http://localhost:4174', 'content-type': 'application/json; charset=utf-8',
    'sec-fetch-site': 'same-origin', 'x-editorial-csrf': security.csrfToken,
  };
  assert.doesNotThrow(() => security.assertMutationRequest(requestWith(valid)));
  for (const [changed, code] of [
    [{ 'content-type': 'text/plain' }, 'json-required'],
    [{ 'content-encoding': 'gzip' }, 'encoded-body-rejected'],
    [{ origin: 'http://localhost:5000' }, 'invalid-origin'],
    [{ 'sec-fetch-site': 'cross-site' }, 'cross-site-request'],
    [{ 'x-editorial-csrf': 'another-token' }, 'invalid-csrf'],
    [{ 'x-editorial-csrf': '' }, 'invalid-csrf'],
  ]) assert.throws(() => security.assertMutationRequest(requestWith({ ...valid, ...changed })), { code });
});

test('leitor JSON rejeita objetos inválidos e limites declarados ou em streaming', async () => {
  const body = (chunks, headers = {}) => Object.assign(Readable.from(chunks.map((chunk) => Buffer.from(chunk))), { headers });
  assert.deepEqual(await readJsonBody(body(['{"value":', '"ok"}'])), { value: 'ok' });
  assert.deepEqual(await readJsonBody(body(['   '])), {});
  for (const source of ['null', '[]', '"texto"', '{invalid']) {
    await assert.rejects(readJsonBody(body([source])), { code: 'invalid-json' });
  }
  await assert.rejects(readJsonBody(body([], { 'content-length': '101' }), { limit: 100 }), { code: 'body-too-large' });
  await assert.rejects(readJsonBody(body(['{"á":', '"ééé"}']), { limit: 10 }), { code: 'body-too-large' });
});

test('headers bloqueiam cache/indexação/frames e erros internos não vazam caminhos', () => {
  const headers = dashboardSecurityHeaders();
  assert.match(headers['cache-control'], /no-store/);
  assert.match(headers['x-robots-tag'], /noindex/);
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.match(headers['content-security-policy'], /frame-ancestors 'none'/);
  assert.match(headers['content-security-policy'], /script-src 'self'/);
  const hidden = publicErrorPayload(new Error('segredo em C:/private/token.json'));
  assert.equal(hidden.status, 500);
  assert(!JSON.stringify(hidden).includes('token.json'));
  const explicit = publicErrorPayload(new DashboardError('Conflito', { code: 'fixture-conflict', status: 409 }));
  assert.equal(explicit.payload.error.code, 'fixture-conflict');
  const diagnostics = sanitizeDiagnostics(new Error('Falha C:\\private\\draft.json\n/tmp/private/draft.json'));
  assert(diagnostics.every((line) => !line.includes('draft.json')));
});
