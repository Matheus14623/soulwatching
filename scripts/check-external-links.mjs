import './check-node-version.cjs';
import { readFile } from 'node:fs/promises';
import {
  dirname,
  join,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_REFERENCES } from '../assets/data/generated/runtime/content-entities.js';
import { PUBLIC_HTML_FILES } from './public-manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const acceptedRestrictedStatuses = new Set([401, 403, 405, 429]);

export function extractHttpLinks(source) {
  return [...String(source).matchAll(/\bhttps?:\/\/[^\s"'<>\\)]+/gi)]
    .map(([url]) => url.replace(/[.,;:]$/, ''));
}

export function extractPublicHtmlLinks(source) {
  const links = [];
  for (const [tagSource] of String(source).matchAll(/<(?:a|link)\b[^>]*>/gi)) {
    const href = tagSource.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (!href || !/^https?:\/\//i.test(href)) continue;
    if (/^<link\b/i.test(tagSource)) {
      const rel = tagSource.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
      if (!rel.split(/\s+/).some((token) => token.toLowerCase() === 'stylesheet')) continue;
    }
    links.push(href);
  }
  return links;
}

function isAcceptedStatus(status, url) {
  if ((status >= 200 && status < 400) || acceptedRestrictedStatuses.has(status)) {
    return true;
  }
  if (status === 999) {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com');
  }
  return false;
}

async function probeOnce(url, fetchImpl, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.8,*/*;q=0.5',
        Range: 'bytes=0-1023',
        'User-Agent': 'Observatorio-Ideias-Link-Checker/1.0',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    return Object.freeze({
      accepted: isAcceptedStatus(response.status, url),
      status: response.status,
      url,
    });
  } catch (error) {
    return Object.freeze({
      accepted: false,
      error: error.name === 'AbortError' ? 'timeout' : error.message,
      status: 0,
      url,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function probe(url, fetchImpl, timeoutMs, retries) {
  let result = await probeOnce(url, fetchImpl, timeoutMs);
  for (let attempt = 0; attempt < retries && result.status === 0; attempt += 1) {
    result = await probeOnce(url, fetchImpl, timeoutMs);
  }
  return result;
}

export async function checkExternalLinks(urls, {
  concurrency = 4,
  fetchImpl = globalThis.fetch,
  retries = 1,
  timeoutMs = 15000,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('A verificação de links exige uma implementação de fetch.');
  }
  const queue = [...new Set(urls)].filter((url) => /^https?:\/\//i.test(url));
  const results = new Array(queue.length);
  let cursor = 0;

  async function worker() {
    while (cursor < queue.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await probe(queue[index], fetchImpl, timeoutMs, retries);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, concurrency), queue.length || 1) }, worker),
  );
  return Object.freeze(results);
}

async function collectPublicLinks() {
  const html = await Promise.all(
    PUBLIC_HTML_FILES.map((file) => readFile(join(root, file), 'utf8')),
  );
  return [
    ...html.flatMap(extractPublicHtmlLinks),
    ...CONTENT_REFERENCES.map(({ url }) => url),
  ];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const results = await checkExternalLinks(await collectPublicLinks());
  const failures = results.filter(({ accepted }) => !accepted);
  results.forEach((result) => {
    const state = result.accepted ? 'OK' : 'FALHA';
    console.log(`${state} ${result.status || result.error} ${result.url}`);
  });
  if (failures.length) {
    console.error(`${failures.length} link(s) externo(s) não responderam de forma aceitável.`);
    process.exit(1);
  }
  console.log(`${results.length} links externos únicos responderam.`);
}
