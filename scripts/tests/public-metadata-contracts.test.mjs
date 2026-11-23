import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  applyPageMetadata,
  createSitemap,
  normalizeSiteOrigin,
  publicOriginIsRequired,
  siteOriginFromEnvironment,
} from '../public-metadata.mjs';

test('origem pública prioriza configuração explícita e aceita domínio da Vercel', () => {
  assert.equal(
    siteOriginFromEnvironment({
      PUBLIC_SITE_ORIGIN: 'https://observatorio.example',
      VERCEL_PROJECT_PRODUCTION_URL: 'fallback.vercel.app',
    }),
    'https://observatorio.example',
  );
  assert.equal(
    siteOriginFromEnvironment({ VERCEL_PROJECT_PRODUCTION_URL: 'observatorio.vercel.app' }),
    'https://observatorio.vercel.app',
  );
  assert.throws(() => normalizeSiteOrigin('http://example.com'), /HTTPS/);
  assert.throws(() => normalizeSiteOrigin('https://example.com/caminho'), /caminho/);
  assert.equal(publicOriginIsRequired({ VERCEL: '1' }), true);
  assert.equal(publicOriginIsRequired({ REQUIRE_PUBLIC_SITE_ORIGIN: '1' }), true);
  assert.equal(publicOriginIsRequired({}), false);
});

test('metadados substituem valores anteriores sem duplicar canonical', () => {
  const html = '<head><meta property="og:image" content="../old.jpg" /><link rel="canonical" href="/old" /></head>';
  const result = applyPageMetadata(html, {
    canonicalUrl: 'https://example.com/Teorias/teorias',
    socialImageUrl: 'https://example.com/assets/images/og-observatorio.jpg',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Teorias',
      url: 'https://example.com/Teorias/teorias',
    },
  });
  assert.equal((result.match(/rel="canonical"/g) || []).length, 1);
  assert.equal((result.match(/property="og:url"/g) || []).length, 1);
  assert.equal((result.match(/name="twitter:image"/g) || []).length, 1);
  assert.match(result, /https:\/\/example\.com\/assets\/images\/og-observatorio\.jpg/);
  assert.match(result, /type="application\/ld\+json" data-public-metadata/);
  assert.match(result, /"@type":"WebPage"/);
});

test('sitemap usa URLs limpas e não indexa o shell sem experimento', () => {
  const xml = createSitemap('https://example.com', [
    { id: 'inicio', cleanUrl: '/' },
    { id: 'teorias', cleanUrl: '/Teorias/teorias' },
    { id: 'experimento', cleanUrl: '/Laboratorio/experimento', sitemap: false },
  ]);
  assert.match(xml, /<loc>https:\/\/example\.com\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/example\.com\/Teorias\/teorias<\/loc>/);
  assert.doesNotMatch(xml, /Laboratorio\/experimento/);
});

test('sitemap inclui páginas prerenderizadas de publicação', () => {
  const xml = createSitemap('https://example.com', [
    {
      id: 'publication:ensaio',
      cleanUrl: '/Arquivo/publicacoes/ensaio',
      file: 'Arquivo/publicacoes/ensaio.html',
    },
  ]);
  assert.match(xml, /<loc>https:\/\/example\.com\/Arquivo\/publicacoes\/ensaio<\/loc>/);
});
