const PRIVATE_FIELD_NAMES = new Set([
  'address',
  'consentevidence',
  'email',
  'permissionproof',
  'phone',
  'privatecontactdata',
  'privatedecisionnotes',
  'privatereviewnotes',
  'revieweremail',
  'secret',
  'submission',
  'submissionid',
  'telephone',
  'token',
]);

export const PRIVATE_CANARY = 'CONTENT_PRIVATE_CANARY_DO_NOT_PUBLISH';

function valueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function allowedTypes(schema) {
  const declared = Array.isArray(schema.type) ? schema.type : [schema.type];
  return new Set(declared.filter(Boolean));
}

function hasType(schema, value) {
  const allowed = allowedTypes(schema);
  if (!allowed.size) return true;
  const actual = valueType(value);
  if (actual === 'integer' && allowed.has('number')) return true;
  return allowed.has(actual);
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isValidUri(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
  );
}

function validateNode(value, schema, path, errors) {
  if (!hasType(schema, value)) {
    errors.push(`${path}: tipo ${valueType(value)}; esperado ${[...allowedTypes(schema)].join(' ou ')}`);
    return;
  }

  if ('const' in schema && value !== schema.const) {
    errors.push(`${path}: deve ser ${JSON.stringify(schema.const)}`);
  }

  if (schema.enum && !schema.enum.some((item) => Object.is(item, value))) {
    errors.push(`${path}: valor fora do vocabulário permitido`);
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: texto deve ter ao menos ${schema.minLength} caracteres`);
    }
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) {
      errors.push(`${path}: formato inválido`);
    }
    if (schema.format === 'date' && !isValidDate(value)) {
      errors.push(`${path}: data inválida; use AAAA-MM-DD`);
    }
    if (schema.format === 'uri' && !isValidUri(value)) {
      errors.push(`${path}: URL HTTPS inválida`);
    }
    if (value.includes(PRIVATE_CANARY)) {
      errors.push(`${path}: canary privado encontrado em conteúdo público`);
    }
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path}: deve ser maior ou igual a ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${path}: deve ser menor ou igual a ${schema.maximum}`);
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: exige ao menos ${schema.minItems} item(ns)`);
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(`${path}: permite no máximo ${schema.maxItems} item(ns)`);
    }
    if (schema.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(stableValue(item)));
      if (new Set(serialized).size !== serialized.length) {
        errors.push(`${path}: itens devem ser únicos`);
      }
    }
    if (schema.items) {
      value.forEach((item, index) => validateNode(item, schema.items, `${path}[${index}]`, errors));
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const properties = schema.properties || {};
    for (const required of schema.required || []) {
      if (!(required in value)) errors.push(`${path}.${required}: campo obrigatório ausente`);
    }

    for (const [key, child] of Object.entries(value)) {
      if (PRIVATE_FIELD_NAMES.has(key.toLowerCase())) {
        errors.push(`${path}.${key}: campo privado proibido na fonte pública`);
        continue;
      }
      if (properties[key]) {
        validateNode(child, properties[key], `${path}.${key}`, errors);
        continue;
      }
      if (schema.additionalProperties === false) {
        errors.push(`${path}.${key}: campo desconhecido; a projeção pública usa allowlist`);
        continue;
      }
      if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        validateNode(child, schema.additionalProperties, `${path}.${key}`, errors);
      }
    }
  }
}

export function validateWithSchema(value, schema, sourceLabel = 'conteúdo') {
  const errors = [];
  validateNode(value, schema, sourceLabel, errors);
  return errors;
}

export function projectBySchema(value, schema) {
  if (Array.isArray(value)) {
    return value.map((item) => projectBySchema(item, schema.items || {}));
  }
  if (!value || typeof value !== 'object') return value;

  const output = {};
  const properties = schema.properties || {};
  for (const key of Object.keys(properties)) {
    if (key in value) output[key] = projectBySchema(value[key], properties[key]);
  }
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    for (const key of Object.keys(value).sort()) {
      if (!(key in properties)) {
        output[key] = projectBySchema(value[key], schema.additionalProperties);
      }
    }
  }
  return output;
}

export function findPrivateData(value, path = '$', findings = []) {
  if (typeof value === 'string' && value.includes(PRIVATE_CANARY)) {
    findings.push(`${path}: canary privado`);
    return findings;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => findPrivateData(item, `${path}[${index}]`, findings));
    return findings;
  }
  if (!value || typeof value !== 'object') return findings;

  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_FIELD_NAMES.has(key.toLowerCase())) findings.push(`${path}.${key}`);
    findPrivateData(child, `${path}.${key}`, findings);
  }
  return findings;
}
