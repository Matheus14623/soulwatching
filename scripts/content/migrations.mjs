export const CURRENT_SCHEMA_VERSIONS = Object.freeze({
  constellation: 1,
  experiment: 1,
  'experiment-taxonomy': 1,
  figure: 1,
  'figure-taxonomy': 1,
  'figure-trail': 1,
  party: 1,
  path: 1,
  publication: 1,
  'publication-catalog': 1,
  'publication-revision-ledger': 1,
  'publication-taxonomy': 1,
  reference: 1,
  relation: 1,
  'relation-type-taxonomy': 1,
  'research-track': 1,
  'site-page': 1,
  theory: 1,
  'theory-taxonomy': 1,
  'timeline-event': 1,
});

const migrationRegistry = new Map();

export function migrationKey(entityType, fromVersion) {
  return `${entityType}:${fromVersion}->${fromVersion + 1}`;
}

export function migrateContentRecord(
  source,
  expectedType,
  {
    label = expectedType,
    migrations = migrationRegistry,
    versions = CURRENT_SCHEMA_VERSIONS,
  } = {},
) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error(`${label}: registro de conteúdo inválido`);
  }
  const targetVersion = versions[expectedType];
  if (!targetVersion) throw new Error(`${label}: tipo sem versão de schema registrada (${expectedType})`);
  if (!Number.isInteger(source.schemaVersion) || source.schemaVersion < 1) {
    throw new Error(`${label}.schemaVersion: informe uma versão inteira suportada`);
  }
  if (source.schemaVersion > targetVersion) {
    throw new Error(
      `${label}.schemaVersion: versão ${source.schemaVersion} é mais nova que a suportada (${targetVersion})`,
    );
  }

  let record = structuredClone(source);
  while (record.schemaVersion < targetVersion) {
    const key = migrationKey(expectedType, record.schemaVersion);
    const migrate = migrations.get(key);
    if (typeof migrate !== 'function') {
      throw new Error(`${label}.schemaVersion: migração ausente ${key}`);
    }
    const next = migrate(structuredClone(record));
    if (!next || next.schemaVersion !== record.schemaVersion + 1) {
      throw new Error(`${label}.schemaVersion: migração ${key} não avançou exatamente uma versão`);
    }
    record = next;
  }
  return record;
}
