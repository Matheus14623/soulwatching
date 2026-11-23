import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generatedImpactForChange } from '../content/content-dependencies.mjs';
import { PUBLIC_ROUTES } from '../public-manifest.mjs';

const publicUrls = new Set(PUBLIC_ROUTES.map(({ url }) => url));

test('mudança de teoria alcança todas as suas superfícies e consumidores diretos', () => {
  const impact = generatedImpactForChange({ type: 'theory', record: { id: 'fixture-theory' } });
  assert.deepEqual(impact.publicSurfaces, ['/', '/GrandesNomes/grandes-nomes.html', '/Mapa/mapa.html', '/Teorias/teorias.html']);
  assert.ok(impact.generatedFiles.includes('assets/data/generated/runtime/theories.js'));
  assert.ok(impact.generatedFiles.includes('assets/data/generated/search-index.js'));
  assert.deepEqual(impact.globalConsumers, ['global-search']);
  assert.ok(!impact.publicSurfaces.includes('/Rotas/rotas.html'));
  assert.ok(!impact.publicSurfaces.includes('/Laboratorio/experimento.html'));
  const withDependents = generatedImpactForChange({ type: 'theory', record: { id: 'fixture-theory' }, pathsAffected: ['fixture-path'], experimentsAffected: ['fixture-experiment'] });
  assert.ok(withDependents.publicSurfaces.includes('/Rotas/rotas.html'));
  assert.ok(withDependents.publicSurfaces.includes('/Laboratorio/experimento.html'));
});

test('figuras, referências, publicações e partes possuem dependências proporcionais', () => {
  for (const [type, expectedSurfaces, usesSearch] of [
    ['figure', ['/', '/GrandesNomes/grandes-nomes.html', '/Teorias/teorias.html'], true],
    ['reference', ['/Arquivo/publicacao.html', '/Constelacoes/constelacoes.html', '/GrandesNomes/grandes-nomes.html', '/Teorias/teorias.html'], true],
    ['publication', ['/Arquivo/arquivo.html', '/Arquivo/publicacao.html', '/Contribuicoes/contribuicoes.html'], true],
    ['party', ['/Arquivo/arquivo.html', '/Arquivo/publicacao.html', '/Contribuicoes/contribuicoes.html'], false],
    ['experiment', ['/', '/Laboratorio/experimento.html', '/Laboratorio/laboratorio.html'], true],
  ]) {
    const impact = generatedImpactForChange({ type, record: { id: `fixture-${type}` } });
    assert.deepEqual(impact.publicSurfaces, expectedSurfaces, type);
    assert.deepEqual(impact.globalConsumers, usesSearch ? ['global-search'] : [], type);
    assert.ok(impact.publicSurfaces.every((url) => publicUrls.has(url)), type);
    assert.ok(impact.generatedFiles.includes('assets/data/generated/runtime/content-snapshot.js'), type);
  }
});

test('mudança de extremos de relação mantém projeções antigas e novas no impacto', () => {
  const previousRecord = { source: { type: 'theory', id: 'fixture-a' }, target: { type: 'theory', id: 'fixture-b' } };
  const record = { source: { type: 'figure', id: 'fixture-person' }, target: { type: 'theory', id: 'fixture-b' } };
  const before = structuredClone({ previousRecord, record });
  const impact = generatedImpactForChange({ type: 'relation', previousRecord, record });
  assert.deepEqual(impact.publicSurfaces, ['/', '/GrandesNomes/grandes-nomes.html', '/Mapa/mapa.html', '/Teorias/teorias.html']);
  assert.ok(impact.generatedFiles.includes('assets/data/generated/runtime/theories.js'));
  assert.ok(impact.generatedFiles.includes('assets/data/generated/runtime/notable-figures.js'));
  assert.ok(impact.generatedFiles.includes('assets/data/generated/runtime/relations.js'));
  assert.deepEqual({ previousRecord, record }, before);
  assert.deepEqual(impact.publicSurfaces, [...new Set(impact.publicSurfaces)].sort());
  assert.deepEqual(impact.generatedFiles, [...new Set(impact.generatedFiles)].sort());
});

test('relação de publicação não invalida por tabela as superfícies de teoria', () => {
  const impact = generatedImpactForChange({
    type: 'relation',
    record: { source: { type: 'publication', id: 'fixture-publication' }, target: { type: 'theory', id: 'fixture-theory' } },
  });
  assert.deepEqual(impact.publicSurfaces, ['/Arquivo/publicacao.html']);
  assert.ok(!impact.generatedFiles.includes('assets/data/generated/runtime/theories.js'));
  assert.deepEqual(impact.globalConsumers, []);
});
