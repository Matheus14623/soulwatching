import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { test } from 'node:test';
import {
  analyzeManifestOperations,
  assertEditorialImpactAllowed,
  loadChangeSetManifest,
  loadPrivateDraftOperation,
  prepareEditorialChangeSet,
  toEditorialChangeSet,
} from '../content/change-set.mjs';
import { PROJECT_ROOT, PUBLIC_CONTENT_ROOT } from '../content/paths.mjs';

const draftParent = resolve(PROJECT_ROOT, '.content-drafts');
const canonicalReferencePath = resolve(PUBLIC_CONTENT_ROOT, 'references', 'hogg-distance.json');

async function workspace(t) {
  await mkdir(draftParent, { recursive: true });
  const directory = await mkdtemp(resolve(draftParent, 'change-set-test-'));
  const checked = relative(draftParent, directory);
  assert.ok(checked && !checked.startsWith('..') && !isAbsolute(checked));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return path;
}

function reference() {
  const id = `fixture-change-set-${randomUUID()}`;
  return {
    schemaVersion: 1, entityType: 'reference', revisionId: `${id}-r1`,
    id, aliases: [], title: 'Referência sintética de contrato', kind: 'fixture',
    url: `https://example.invalid/${id}`,
  };
}

async function manifestFor(directory, record, overrides = {}) {
  await writeJson(resolve(directory, 'record.json'), record);
  const operation = { type: record.entityType, id: record.id, source: 'record.json', ...overrides };
  return writeJson(resolve(directory, 'manifest.json'), { schemaVersion: 1, operations: [operation] });
}

test('manifesto privado produz overlay válido sem instalar a referência', async (t) => {
  const directory = await workspace(t);
  const record = reference();
  const path = await manifestFor(directory, record);
  const canonicalBefore = await readFile(canonicalReferencePath, 'utf8');
  const loaded = await loadChangeSetManifest(path);
  assert.equal(loaded.operations.length, 1);
  assert.deepEqual(loaded.operations[0].record, record);
  const destination = resolve(PUBLIC_CONTENT_ROOT, 'references', `${record.id}.json`);
  assert.equal(loaded.operations[0].destination, destination);
  const result = await analyzeManifestOperations(loaded.operations, { lockPath: resolve(directory, 'analysis.lock') });
  assert.equal(result.impact.allowed, true);
  assert.equal(result.impact.changes[0].entity.id, record.id);
  assert.ok(result.impact.orphanReferenceIds.includes(record.id));
  assert.ok(result.impact.warnings.some(({ code, referenceId }) => code === 'orphan-reference' && referenceId === record.id));
  assert.ok(result.impact.requiredCommands.includes('npm run content:check'));
  assert.equal(await stat(destination).catch((error) => { if (error.code === 'ENOENT') return null; throw error; }), null);
  assert.equal(await readFile(canonicalReferencePath, 'utf8'), canonicalBefore);
});

test('carregador rejeita schema inválido, campo privado e esqueleto incompleto', async (t) => {
  const directory = await workspace(t);
  for (const [mutate, expected] of [
    [(record) => { record.unrecognized = true; }, /campo desconhecido/],
    [(record) => { record.email = 'fixture@example.invalid'; }, /privado proibido/],
    [(record) => { record.title = '__PREENCHER__'; }, /marcadores __PREENCHER__/],
  ]) {
    const record = reference();
    mutate(record);
    const path = await manifestFor(directory, record);
    await assert.rejects(loadChangeSetManifest(path), expected);
  }
});

test('manifesto não aceita operações duplicadas nem sua fonte pública como rascunho', async (t) => {
  const directory = await workspace(t);
  const record = reference();
  const path = await manifestFor(directory, record);
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  manifest.operations.push({ ...manifest.operations[0] });
  await writeJson(path, manifest);
  await assert.rejects(loadChangeSetManifest(path), /Operação editorial duplicada/);
  await assert.rejects(loadPrivateDraftOperation({ type: 'reference', id: 'hogg-distance', source: canonicalReferencePath }), /fora de content\/public/);
  await assert.rejects(loadChangeSetManifest(canonicalReferencePath), /privado e não pode ficar em content\/public/);
  await assert.rejects(loadPrivateDraftOperation({ type: 'reference', id: record.id, source: 'not-json.txt' }), /source JSON/);
  await assert.rejects(loadPrivateDraftOperation({ type: 'site-page', id: record.id, source: path }), /tipo não permitido/);
});

test('substituição exige force, classe e revisão nova, mesmo sem aplicar', async (t) => {
  const directory = await workspace(t);
  const previous = JSON.parse(await readFile(canonicalReferencePath, 'utf8'));
  const ordinal = Number(previous.revisionId.match(/-r([1-9][0-9]*)$/)[1]);
  const next = { ...previous, title: `${previous.title} — fixture privada`, revisionId: `${previous.id}-r${ordinal + 1}` };
  const source = await writeJson(resolve(directory, 'record.json'), next);
  const options = { type: 'reference', id: next.id, source };
  await assert.rejects(loadPrivateDraftOperation(options), /changeClass explícita/);
  await assert.rejects(loadPrivateDraftOperation({ ...options, changeClass: 'semantic' }), /force:true explícito/);
  const operation = await loadPrivateDraftOperation({ ...options, changeClass: 'semantic', force: true });
  const prepared = await prepareEditorialChangeSet([operation]);
  assert.deepEqual(prepared.operations[0].previous, previous);
  assert.deepEqual(prepared.operations[0].next, next);
  assert.equal(prepared.operations[0].changeClass, 'semantic');
  operation.record.revisionId = previous.revisionId;
  await assert.rejects(prepareEditorialChangeSet([operation]), /novo revisionId/);
  assert.deepEqual(JSON.parse(await readFile(canonicalReferencePath, 'utf8')), previous);
});

test('overlay detecta referência duplicada antes de qualquer escrita canônica', async (t) => {
  const directory = await workspace(t);
  const previous = JSON.parse(await readFile(canonicalReferencePath, 'utf8'));
  const record = { ...reference(), url: previous.url };
  const loaded = await loadChangeSetManifest(await manifestFor(directory, record));
  await assert.rejects(
    analyzeManifestOperations(loaded.operations, { lockPath: resolve(directory, 'analysis.lock') }),
    /provável duplicata de referência por URL/,
  );
  const destination = loaded.operations[0].destination;
  await assert.rejects(stat(destination), { code: 'ENOENT' });
});

test('conversão mantém classe e isola a proposta; gate comunica bloqueio acionável', () => {
  const record = reference();
  const destination = resolve(PUBLIC_CONTENT_ROOT, 'references', `${record.id}.json`);
  const operations = [{ type: 'reference', destination, record, changeClass: 'metadata' }];
  const changeSet = toEditorialChangeSet(operations, new Map());
  assert.equal(changeSet.operations[0].previous, null);
  assert.equal(changeSet.operations[0].changeClass, 'metadata');
  changeSet.operations[0].next.title = 'Alteração somente no overlay';
  assert.equal(record.title, 'Referência sintética de contrato');
  assert.equal(assertEditorialImpactAllowed({ allowed: true, blockers: [] }), true);
  assert.throws(() => assertEditorialImpactAllowed({ allowed: false, blockers: [{ entity: { type: 'theory', id: 'fixture-theory' }, relationId: 'fixture-relation', code: 'stale-reviewed-relation' }] }), /fixture-theory.*fixture-relation.*stale-reviewed-relation/);
});
