import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { CONTENT_METRICS } from '../../assets/data/generated/content-metrics.js';
import {
  PUBLICATIONS,
  PUBLICATION_TYPES,
} from '../../assets/data/generated/runtime/publications.js';
import {
  THEORIES,
  THEORY_FILTERS,
  THEORY_TYPES,
} from '../../assets/data/generated/runtime/theories.js';
import {
  createPublicContentMetricContext,
  PUBLIC_CONTENT_METRIC_CONTRACTS,
  synchronizePublicContentMetrics,
  validatePublicContentMetricCoverage,
} from '../public-content-metrics.mjs';

const root = resolve(import.meta.dirname, '..', '..');
const context = createPublicContentMetricContext({
  metrics: CONTENT_METRICS,
  publications: PUBLICATIONS,
  publicationTypes: PUBLICATION_TYPES,
  theories: THEORIES,
  theoryFilters: THEORY_FILTERS,
  theoryTypes: THEORY_TYPES,
});

test('contexto público deriva contagens editoriais sem duplicar catálogos', () => {
  assert.equal(context.values.theories, THEORIES.length);
  assert.equal(
    context.values.independentTheories,
    THEORIES.filter(({ independent }) => independent !== false).length,
  );
  assert.equal(context.values.theoryTypes, THEORY_TYPES.length);
  assert.equal(
    context.values.theoryAxes,
    THEORY_FILTERS.filter(({ id }) => id !== 'todas').length,
  );
  for (const type of PUBLICATION_TYPES) {
    assert.equal(
      context.values[`publicationType:${type.id}`],
      PUBLICATIONS.filter(({ publicationType }) => publicationType === type.id).length,
    );
  }
});

test('sincronização é determinística para texto simples e metadados sociais', () => {
  const stale = [
    '<head>',
    '  <meta name="description" data-content-metric="constellations" data-content-format="constellation-meta-description" content="catálogo antigo" />',
    '</head>',
    '<p data-content-metric="figures" data-content-format="available-profiles">1 perfil disponível</p>',
  ].join('\n');
  const first = synchronizePublicContentMetrics(stale, context);
  const second = synchronizePublicContentMetrics(first, context);

  assert.equal(first, second);
  assert.match(
    first,
    new RegExp(`reconhecer ${CONTENT_METRICS.constellations} constelações no céu`),
  );
  assert.match(first, new RegExp(`>${CONTENT_METRICS.figures} perfis disponíveis<`));
  assert.doesNotMatch(first, /catálogo antigo|>1 perfil disponível</);
});

test('marcadores desconhecidos ou estruturalmente ambíguos interrompem o build', () => {
  assert.throws(
    () => synchronizePublicContentMetrics(
      '<span data-content-metric="nao-existe">10</span>',
      context,
    ),
    /Métrica pública desconhecida/,
  );
  assert.throws(
    () => synchronizePublicContentMetrics(
      '<span data-content-metric="theories"><strong>10</strong></span>',
      context,
    ),
    /não puderam ser sincronizados/,
  );
});

test('HTML-fonte mantém todos os contratos públicos explicitamente marcados', async () => {
  for (const publicPath of Object.keys(PUBLIC_CONTENT_METRIC_CONTRACTS)) {
    const html = await readFile(resolve(root, publicPath), 'utf8');
    assert.doesNotThrow(
      () => validatePublicContentMetricCoverage(html, publicPath),
      publicPath,
    );
    assert.doesNotThrow(
      () => synchronizePublicContentMetrics(html, context, { publicPath }),
      publicPath,
    );
  }

  const home = await readFile(resolve(root, 'index.html'), 'utf8');
  const markerRemoved = home.replace(' data-content-metric="paths"', '');
  assert.throws(
    () => validatePublicContentMetricCoverage(markerRemoved, 'index.html'),
    /data-site-route-count-label deve usar/,
  );
});

test('artefato dist contém fallbacks e SEO sincronizados com o conteúdo gerado', async () => {
  for (const publicPath of Object.keys(PUBLIC_CONTENT_METRIC_CONTRACTS)) {
    const html = await readFile(resolve(root, 'dist', publicPath), 'utf8');
    assert.equal(
      synchronizePublicContentMetrics(html, context, { publicPath }),
      html,
      publicPath,
    );
  }

  const constellationPage = await readFile(
    resolve(root, 'dist', 'Constelacoes', 'constelacoes.html'),
    'utf8',
  );
  assert.match(
    constellationPage,
    new RegExp(`reconhecer ${CONTENT_METRICS.constellations} constelações no céu`),
  );
});
