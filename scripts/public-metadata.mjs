import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ROUTES } from './public-manifest.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SOCIAL_IMAGE = '/assets/images/og-observatorio.jpg';

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function normalizeSiteOrigin(value) {
  if (!value) return '';
  const candidate = String(value).trim();
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;
  const url = new URL(withProtocol);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new TypeError('A origem pública precisa ser uma URL HTTPS sem credenciais, query ou fragmento.');
  }
  if (url.pathname !== '/' && url.pathname !== '') {
    throw new TypeError('A origem pública não pode conter caminho.');
  }
  return url.origin;
}

export function siteOriginFromEnvironment(environment = process.env) {
  const configured = environment.PUBLIC_SITE_ORIGIN || environment.VERCEL_PROJECT_PRODUCTION_URL || '';
  return normalizeSiteOrigin(configured);
}

export function publicOriginIsRequired(environment = process.env) {
  return environment.VERCEL === '1' || environment.REQUIRE_PUBLIC_SITE_ORIGIN === '1';
}

function replaceOrInsert(html, pattern, markup) {
  if (pattern.test(html)) return html.replace(pattern, markup);
  return html.replace('</head>', `    ${markup}\n  </head>`);
}

function structuredDataMarkup(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script type="application/ld+json" data-public-metadata>${json}</script>`;
}

function pageStructuredData(route, { canonicalUrl, origin, title }) {
  const site = {
    '@type': 'WebSite',
    name: 'Observatório de Ideias',
    url: new URL('/', `${origin}/`).href,
  };
  if (route.structuredData) {
    return {
      '@context': 'https://schema.org',
      ...route.structuredData,
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      isPartOf: site,
    };
  }
  if (route.id === 'inicio') {
    return {
      '@context': 'https://schema.org',
      ...site,
      url: canonicalUrl,
      inLanguage: 'pt-BR',
    };
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: canonicalUrl,
    inLanguage: 'pt-BR',
    isPartOf: site,
  };
}

export function applyPageMetadata(html, { canonicalUrl, socialImageUrl, structuredData }) {
  let result = replaceOrInsert(
    html,
    /<link\s+rel=["']canonical["'][^>]*>\s*/i,
    `<link rel="canonical" href="${canonicalUrl}" />\n    `,
  );
  result = replaceOrInsert(
    result,
    /<meta\s+property=["']og:url["'][^>]*>\s*/i,
    `<meta property="og:url" content="${canonicalUrl}" />\n    `,
  );
  result = replaceOrInsert(
    result,
    /<meta\s+property=["']og:image["']\s+content=["'][^"']*["']\s*\/?>\s*/i,
    `<meta property="og:image" content="${socialImageUrl}" />\n    `,
  );
  result = replaceOrInsert(
    result,
    /<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']\s*\/?>\s*/i,
    `<meta name="twitter:image" content="${socialImageUrl}" />\n    `,
  );
  if (structuredData) {
    result = replaceOrInsert(
      result,
      /<script\s+type=["']application\/ld\+json["']\s+data-public-metadata>[\s\S]*?<\/script>\s*/i,
      `${structuredDataMarkup(structuredData)}\n    `,
    );
  }
  return result;
}

export function createSitemap(origin, routes = PUBLIC_ROUTES) {
  const locations = routes
    .filter((route) => route.sitemap !== false)
    .map((route) => new URL(route.cleanUrl, `${origin}/`).href);
  const urls = [...new Set(locations)]
    .map((location) => `  <url><loc>${escapeXml(location)}</loc></url>`)
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
}

export async function finalizePublicMetadata(outputDirectory, {
  environment = process.env,
  routes = PUBLIC_ROUTES,
} = {}) {
  const origin = siteOriginFromEnvironment(environment);
  if (!origin) return Object.freeze({ applied: false, reason: 'missing-origin' });

  for (const route of routes) {
    const file = join(outputDirectory, route.file);
    const html = await readFile(file, 'utf8');
    const canonicalPath = route.canonicalCleanUrl || route.cleanUrl;
    const canonicalUrl = new URL(canonicalPath, `${origin}/`).href;
    const socialImageUrl = new URL(DEFAULT_SOCIAL_IMAGE, `${origin}/`).href;
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || 'Observatório de Ideias';
    const structuredData = pageStructuredData(route, {
      canonicalUrl,
      origin,
      title,
    });
    await writeFile(file, applyPageMetadata(html, {
      canonicalUrl,
      socialImageUrl,
      structuredData,
    }), 'utf8');
  }

  const legacyPath = join(outputDirectory, 'teorias.html');
  const legacyHtml = await readFile(legacyPath, 'utf8');
  const theoriesUrl = new URL('/Teorias/teorias', `${origin}/`).href;
  await writeFile(
    legacyPath,
    applyPageMetadata(legacyHtml, {
      canonicalUrl: theoriesUrl,
      socialImageUrl: new URL(DEFAULT_SOCIAL_IMAGE, `${origin}/`).href,
    }),
    'utf8',
  );

  await writeFile(join(outputDirectory, 'sitemap.xml'), createSitemap(origin, routes), 'utf8');
  const robotsPath = join(outputDirectory, 'robots.txt');
  const robots = (await readFile(robotsPath, 'utf8'))
    .split(/\r?\n/)
    .filter((line) => !/^Sitemap:/i.test(line.trim()))
    .join('\n')
    .trimEnd();
  await writeFile(robotsPath, `${robots}\nSitemap: ${origin}/sitemap.xml\n`, 'utf8');

  return Object.freeze({ applied: true, origin });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await finalizePublicMetadata(join(root, 'dist'));
  console.log(result.applied
    ? `Metadados públicos finalizados para ${result.origin}.`
    : 'Metadados absolutos não gerados: origem pública indisponível.');
}
