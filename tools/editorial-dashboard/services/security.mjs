import {
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { DashboardError } from './errors.mjs';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const LOOPBACK_ADDRESSES = new Set([
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
]);

export const DEFAULT_BODY_LIMIT = 1024 * 1024;
export const CSRF_HEADER = 'x-editorial-csrf';

function parseHostHeader(value) {
  if (typeof value !== 'string' || !value || value.includes(',')) return null;
  const match = value.match(/^(\[[^\]]+\]|[^:]+)(?::([0-9]{1,5}))?$/);
  if (!match) return null;
  const port = match[2] === undefined ? null : Number(match[2]);
  if (port !== null && (!Number.isInteger(port) || port < 1 || port > 65535)) return null;
  return {
    hostname: match[1].toLowerCase(),
    port,
    value: value.toLowerCase(),
  };
}

function secureEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');
  return (
    leftBuffer.length === rightBuffer.length
    && timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function isLoopbackAddress(address) {
  return LOOPBACK_ADDRESSES.has(String(address || '').toLowerCase());
}

export function dashboardSecurityHeaders() {
  return {
    'cache-control': 'no-store, max-age=0',
    'content-security-policy': [
      "default-src 'self'",
      "base-uri 'none'",
      "connect-src 'self'",
      "font-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'frame-src http://localhost:* http://127.0.0.1:* http://[::1]:*',
      "img-src 'self' data:",
      "object-src 'none'",
      "script-src 'self'",
      "style-src 'self'",
    ].join('; '),
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-robots-tag': 'noindex, nofollow, noarchive',
  };
}

export function createRequestSecurity({
  csrfToken = randomBytes(32).toString('base64url'),
  port = null,
} = {}) {
  let activePort = port;

  function assertLoopbackRequest(request) {
    if (!isLoopbackAddress(request.socket?.remoteAddress)) {
      throw new DashboardError('A dashboard aceita somente conexões locais.', {
        code: 'loopback-required',
        status: 403,
      });
    }
    const host = parseHostHeader(request.headers.host);
    if (
      !host
      || !LOOPBACK_HOSTS.has(host.hostname)
      || (
        activePort !== null
        && host.port !== activePort
      )
    ) {
      throw new DashboardError('Host local inválido.', {
        code: 'invalid-host',
        status: 403,
      });
    }
    return host;
  }

  function assertMutationRequest(request) {
    const host = assertLoopbackRequest(request);
    const contentType = String(request.headers['content-type'] || '')
      .split(';', 1)[0]
      .trim()
      .toLowerCase();
    if (contentType !== 'application/json') {
      throw new DashboardError('Operações de escrita exigem application/json.', {
        code: 'json-required',
        status: 415,
      });
    }
    if (request.headers['content-encoding']) {
      throw new DashboardError('Corpo comprimido não é aceito.', {
        code: 'encoded-body-rejected',
        status: 415,
      });
    }
    const origin = String(request.headers.origin || '');
    if (origin !== `http://${host.value}`) {
      throw new DashboardError('Origem da operação não autorizada.', {
        code: 'invalid-origin',
        status: 403,
      });
    }
    const fetchSite = String(request.headers['sec-fetch-site'] || '').toLowerCase();
    if (fetchSite && fetchSite !== 'same-origin') {
      throw new DashboardError('Contexto de navegação não autorizado.', {
        code: 'cross-site-request',
        status: 403,
      });
    }
    if (!secureEqual(request.headers[CSRF_HEADER], csrfToken)) {
      throw new DashboardError('Token de sessão inválido ou expirado.', {
        code: 'invalid-csrf',
        status: 403,
      });
    }
  }

  return Object.freeze({
    csrfToken,
    headers: dashboardSecurityHeaders(),
    assertLoopbackRequest,
    assertMutationRequest,
    setPort(value) {
      if (!Number.isInteger(value) || value < 1 || value > 65535) {
        throw new TypeError('Porta ativa inválida');
      }
      activePort = value;
    },
  });
}

export async function readJsonBody(request, {
  limit = DEFAULT_BODY_LIMIT,
} = {}) {
  const declaredLength = Number(request.headers['content-length'] || 0);
  if (Number.isFinite(declaredLength) && declaredLength > limit) {
    throw new DashboardError(`O corpo excede o limite de ${limit} bytes.`, {
      code: 'body-too-large',
      status: 413,
    });
  }

  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > limit) {
      throw new DashboardError(`O corpo excede o limite de ${limit} bytes.`, {
        code: 'body-too-large',
        status: 413,
      });
    }
    chunks.push(chunk);
  }

  const source = Buffer.concat(chunks).toString('utf8');
  if (!source.trim()) return {};
  try {
    const value = JSON.parse(source);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError('JSON precisa ser um objeto');
    }
    return value;
  } catch {
    throw new DashboardError('Corpo JSON inválido.', {
      code: 'invalid-json',
      status: 400,
    });
  }
}
