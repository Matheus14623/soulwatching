import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  migrateContentRecord,
  migrationKey,
} from '../content/migrations.mjs';

test('registro na versão corrente passa sem mutar a fonte', () => {
  const source = { schemaVersion: 1, entityType: 'theory', id: 'teste' };
  const migrated = migrateContentRecord(source, 'theory');
  assert.deepEqual(migrated, source);
  assert.notStrictEqual(migrated, source);
});

test('pipeline aplica migrações consecutivas e rejeita saltos', () => {
  const validMigrations = new Map([
    [migrationKey('fixture', 1), (record) => ({ ...record, schemaVersion: 2, normalized: true })],
  ]);
  assert.deepEqual(
    migrateContentRecord(
      { schemaVersion: 1, entityType: 'fixture' },
      'fixture',
      { migrations: validMigrations, versions: { fixture: 2 } },
    ),
    { schemaVersion: 2, entityType: 'fixture', normalized: true },
  );
  assert.throws(
    () => migrateContentRecord(
      { schemaVersion: 1, entityType: 'fixture' },
      'fixture',
      {
        migrations: new Map([
          [migrationKey('fixture', 1), (record) => ({ ...record, schemaVersion: 3 })],
        ]),
        versions: { fixture: 2 },
      },
    ),
    /não avançou exatamente uma versão/,
  );
});

test('versão futura ou sem caminho de migração falha com mensagem acionável', () => {
  assert.throws(
    () => migrateContentRecord(
      { schemaVersion: 3, entityType: 'fixture' },
      'fixture',
      { versions: { fixture: 2 } },
    ),
    /mais nova/,
  );
  assert.throws(
    () => migrateContentRecord(
      { schemaVersion: 1, entityType: 'fixture' },
      'fixture',
      { versions: { fixture: 2 } },
    ),
    /migração ausente/,
  );
});
