import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  resolve,
  sep,
} from 'node:path';

const GENERATED_FILES = new Set(['ROUTING.md', 'knowledge-graph.json']);
const NODE_ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const ROUTE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CANONICAL_SCOPES = new Set(['project', 'frontend', 'domains', 'quality', 'infrastructure', 'maintenance']);
const YAML_UNSUPPORTED_PREFIX = /^[&*!@`?]/;
const MAX_YAML_BYTES = 1024 * 1024;
const MAX_YAML_DEPTH = 64;
const MAX_SCALAR_LENGTH = 256 * 1024;

export class KnowledgeError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'KnowledgeError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new KnowledgeError(code, message, details);
}

function yamlFail(source, line, column, message) {
  fail('YAML_PARSE_ERROR', `${source}:${line}:${column}: ${message}`, {
    source,
    line,
    column,
  });
}

function own(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function createRecord() {
  return Object.create(null);
}

function defineSafe(object, key, value, source, line, column) {
  if (['__proto__', 'prototype', 'constructor'].includes(key)) {
    yamlFail(source, line, column, `chave insegura não permitida: ${key}`);
  }
  if (own(object, key)) {
    yamlFail(source, line, column, `chave duplicada: ${key}`);
  }
  object[key] = value;
}

function stripYamlComment(value) {
  let quote = '';
  let escaped = false;
  let square = 0;
  let curly = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote === '"') {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quote = '';
      continue;
    }
    if (quote === "'") {
      if (character === "'" && value[index + 1] === "'") index += 1;
      else if (character === "'") quote = '';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '[') square += 1;
    else if (character === ']') square -= 1;
    else if (character === '{') curly += 1;
    else if (character === '}') curly -= 1;
    else if (character === '#' && square === 0 && curly === 0 && (index === 0 || /\s/.test(value[index - 1]))) {
      return value.slice(0, index).trimEnd();
    }
  }
  return value.trimEnd();
}

function findMappingColon(value) {
  let quote = '';
  let escaped = false;
  let square = 0;
  let curly = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote === '"') {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quote = '';
      continue;
    }
    if (quote === "'") {
      if (character === "'" && value[index + 1] === "'") index += 1;
      else if (character === "'") quote = '';
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '[') square += 1;
    else if (character === ']') square -= 1;
    else if (character === '{') curly += 1;
    else if (character === '}') curly -= 1;
    else if (character === ':' && square === 0 && curly === 0 && (index + 1 === value.length || /\s/.test(value[index + 1]))) {
      return index;
    }
  }
  return -1;
}

function parseSingleQuoted(value, source, line, column) {
  let result = '';
  for (let index = 1; index < value.length; index += 1) {
    if (value[index] !== "'") {
      result += value[index];
      continue;
    }
    if (value[index + 1] === "'") {
      result += "'";
      index += 1;
      continue;
    }
    if (value.slice(index + 1).trim()) {
      yamlFail(source, line, column + index + 1, 'conteúdo inesperado após string');
    }
    return result;
  }
  yamlFail(source, line, column, 'string com aspas simples não terminada');
}

function parseDoubleQuoted(value, source, line, column) {
  let result = '';
  const escapes = {
    '0': '\0',
    a: '\x07',
    b: '\b',
    t: '\t',
    n: '\n',
    v: '\v',
    f: '\f',
    r: '\r',
    e: '\x1b',
    ' ': ' ',
    '"': '"',
    '/': '/',
    '\\': '\\',
  };

  for (let index = 1; index < value.length; index += 1) {
    const character = value[index];
    if (character === '"') {
      if (value.slice(index + 1).trim()) {
        yamlFail(source, line, column + index + 1, 'conteúdo inesperado após string');
      }
      return result;
    }
    if (character !== '\\') {
      result += character;
      continue;
    }
    const escaped = value[index + 1];
    if (own(escapes, escaped)) {
      result += escapes[escaped];
      index += 1;
      continue;
    }
    if (escaped === 'u' || escaped === 'U' || escaped === 'x') {
      const length = escaped === 'U' ? 8 : escaped === 'u' ? 4 : 2;
      const hexadecimal = value.slice(index + 2, index + 2 + length);
      if (!new RegExp(`^[0-9a-fA-F]{${length}}$`).test(hexadecimal)) {
        yamlFail(source, line, column + index + 1, 'escape Unicode inválido');
      }
      const point = Number.parseInt(hexadecimal, 16);
      if (point > 0x10ffff) yamlFail(source, line, column + index + 1, 'code point Unicode inválido');
      result += String.fromCodePoint(point);
      index += length + 1;
      continue;
    }
    yamlFail(source, line, column + index + 1, `escape não suportado: \\${escaped || ''}`);
  }
  yamlFail(source, line, column, 'string com aspas duplas não terminada');
}

function parsePlainScalar(value, source, line, column) {
  const trimmed = value.trim();
  if (trimmed.length > MAX_SCALAR_LENGTH) yamlFail(source, line, column, 'escalar excede o limite permitido');
  if (!trimmed || /^(?:null|~)$/i.test(trimmed)) return null;
  if (/^(?:true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === 'true';
  if (/^[+-]?(?:0|[1-9][0-9_]*)$/.test(trimmed)) {
    const number = Number(trimmed.replace(/_/g, ''));
    if (!Number.isSafeInteger(number)) yamlFail(source, line, column, 'inteiro fora do intervalo seguro');
    return number;
  }
  if (/^[+-]?(?:(?:0|[1-9][0-9_]*)\.[0-9_]+|(?:0|[1-9][0-9_]*)(?:[eE][+-]?[0-9]+)|(?:0|[1-9][0-9_]*)\.[0-9_]+(?:[eE][+-]?[0-9]+))$/.test(trimmed)) {
    const number = Number(trimmed.replace(/_/g, ''));
    if (!Number.isFinite(number)) yamlFail(source, line, column, 'número não finito não permitido');
    return number;
  }
  if (/^0x[0-9a-fA-F_]+$/.test(trimmed)) return Number.parseInt(trimmed.slice(2).replace(/_/g, ''), 16);
  if (/^0o[0-7_]+$/.test(trimmed)) return Number.parseInt(trimmed.slice(2).replace(/_/g, ''), 8);
  if (/^(?:[-+]?\.(?:inf|nan))$/i.test(trimmed)) yamlFail(source, line, column, 'NaN e infinito não são permitidos');
  if (YAML_UNSUPPORTED_PREFIX.test(trimmed) || trimmed === '---' || trimmed === '...') {
    yamlFail(source, line, column, `sintaxe YAML não suportada: ${trimmed}`);
  }
  if (/^[\[{]/.test(trimmed) || /[\]}]$/.test(trimmed)) {
    yamlFail(source, line, column, 'coleção flow inválida ou não terminada');
  }
  return trimmed;
}

class FlowParser {
  constructor(value, source, line, column) {
    this.value = value;
    this.source = source;
    this.line = line;
    this.column = column;
    this.index = 0;
  }

  error(message) {
    yamlFail(this.source, this.line, this.column + this.index, message);
  }

  skipSpace() {
    while (/\s/.test(this.value[this.index] || '')) this.index += 1;
  }

  parse() {
    const result = this.parseValue();
    this.skipSpace();
    if (this.index !== this.value.length) this.error('conteúdo inesperado em coleção flow');
    return result;
  }

  parseValue() {
    this.skipSpace();
    const character = this.value[this.index];
    if (character === '[') return this.parseArray();
    if (character === '{') return this.parseObject();
    if (character === '"' || character === "'") return this.parseQuoted();
    return this.parseToken([',', ']', '}']);
  }

  parseQuoted() {
    const start = this.index;
    const quote = this.value[this.index];
    this.index += 1;
    let escaped = false;
    while (this.index < this.value.length) {
      const character = this.value[this.index];
      if (quote === '"' && character === '\\' && !escaped) {
        escaped = true;
        this.index += 1;
        continue;
      }
      if (character === quote && !(quote === "'" && this.value[this.index + 1] === "'")) {
        this.index += 1;
        const raw = this.value.slice(start, this.index);
        return quote === '"'
          ? parseDoubleQuoted(raw, this.source, this.line, this.column + start)
          : parseSingleQuoted(raw, this.source, this.line, this.column + start);
      }
      if (quote === "'" && character === "'" && this.value[this.index + 1] === "'") this.index += 2;
      else {
        escaped = false;
        this.index += 1;
      }
    }
    this.error('string flow não terminada');
  }

  parseToken(stoppers) {
    const start = this.index;
    while (this.index < this.value.length && !stoppers.includes(this.value[this.index])) this.index += 1;
    const token = this.value.slice(start, this.index).trim();
    if (!token) this.error('valor flow ausente');
    return parsePlainScalar(token, this.source, this.line, this.column + start);
  }

  parseArray() {
    const result = [];
    this.index += 1;
    this.skipSpace();
    if (this.value[this.index] === ']') {
      this.index += 1;
      return result;
    }
    while (this.index < this.value.length) {
      result.push(this.parseValue());
      this.skipSpace();
      if (this.value[this.index] === ']') {
        this.index += 1;
        return result;
      }
      if (this.value[this.index] !== ',') this.error('esperado "," ou "]"');
      this.index += 1;
      this.skipSpace();
      if (this.value[this.index] === ']') this.error('vírgula final não suportada');
    }
    this.error('lista flow não terminada');
  }

  parseObject() {
    const result = createRecord();
    this.index += 1;
    this.skipSpace();
    if (this.value[this.index] === '}') {
      this.index += 1;
      return result;
    }
    while (this.index < this.value.length) {
      this.skipSpace();
      const keyStart = this.index;
      let key;
      if (this.value[this.index] === '"' || this.value[this.index] === "'") key = this.parseQuoted();
      else {
        while (this.index < this.value.length && this.value[this.index] !== ':') this.index += 1;
        key = this.value.slice(keyStart, this.index).trim();
      }
      if (typeof key !== 'string' || !key) this.error('chave flow inválida');
      this.skipSpace();
      if (this.value[this.index] !== ':') this.error('esperado ":" em mapa flow');
      this.index += 1;
      const parsed = this.parseValue();
      defineSafe(result, key, parsed, this.source, this.line, this.column + keyStart);
      this.skipSpace();
      if (this.value[this.index] === '}') {
        this.index += 1;
        return result;
      }
      if (this.value[this.index] !== ',') this.error('esperado "," ou "}"');
      this.index += 1;
      this.skipSpace();
      if (this.value[this.index] === '}') this.error('vírgula final não suportada');
    }
    this.error('mapa flow não terminado');
  }
}

function parseInlineValue(value, source, line, column) {
  const trimmed = value.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return new FlowParser(trimmed, source, line, column).parse();
  }
  if (trimmed.startsWith('"')) return parseDoubleQuoted(trimmed, source, line, column);
  if (trimmed.startsWith("'")) return parseSingleQuoted(trimmed, source, line, column);
  return parsePlainScalar(trimmed, source, line, column);
}

class YamlBlockParser {
  constructor(text, source) {
    this.source = source;
    const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    if (Buffer.byteLength(normalized, 'utf8') > MAX_YAML_BYTES) fail('YAML_TOO_LARGE', `${source}: YAML excede ${MAX_YAML_BYTES} bytes`);
    if (normalized.includes('\0')) fail('YAML_PARSE_ERROR', `${source}: caractere NUL não permitido`);
    this.lines = normalized.split('\n');
    this.index = 0;
    this.prepareDocumentMarkers();
  }

  rawInfo(index) {
    const raw = this.lines[index] ?? '';
    const match = raw.match(/^ */);
    const indent = match ? match[0].length : 0;
    if (raw.slice(0, Math.max(indent + 1, 1)).includes('\t') || raw[indent] === '\t') {
      yamlFail(this.source, index + 1, indent + 1, 'tabs não são permitidos na indentação');
    }
    const content = stripYamlComment(raw.slice(indent));
    const blank = !content.trim();
    if (!blank && indent % 2 !== 0) yamlFail(this.source, index + 1, 1, 'indentação deve usar múltiplos de dois espaços');
    return { raw, indent, content, blank, line: index + 1 };
  }

  prepareDocumentMarkers() {
    const meaningful = [];
    for (let index = 0; index < this.lines.length; index += 1) {
      const info = this.rawInfo(index);
      if (!info.blank) meaningful.push(index);
    }
    if (meaningful.length && this.rawInfo(meaningful[0]).content.trim() === '---') {
      this.lines[meaningful[0]] = '';
      meaningful.shift();
    }
    if (meaningful.length && this.rawInfo(meaningful[meaningful.length - 1]).content.trim() === '...') {
      this.lines[meaningful.pop()] = '';
    }
    for (const index of meaningful) {
      const marker = this.rawInfo(index).content.trim();
      if (marker === '---' || marker === '...') yamlFail(this.source, index + 1, 1, 'múltiplos documentos YAML não são suportados');
    }
  }

  skipBlank() {
    while (this.index < this.lines.length && this.rawInfo(this.index).blank) this.index += 1;
  }

  peek() {
    this.skipBlank();
    return this.index < this.lines.length ? this.rawInfo(this.index) : null;
  }

  parse() {
    const first = this.peek();
    if (!first) return null;
    if (first.indent !== 0) yamlFail(this.source, first.line, 1, 'documento deve começar na coluna 1');
    const result = this.parseNode(0, 0);
    const remaining = this.peek();
    if (remaining) yamlFail(this.source, remaining.line, remaining.indent + 1, 'conteúdo inesperado após o documento');
    return result;
  }

  parseNode(indent, depth) {
    if (depth > MAX_YAML_DEPTH) fail('YAML_TOO_DEEP', `${this.source}: profundidade YAML excedida`);
    const info = this.peek();
    if (!info) return null;
    if (info.indent !== indent) yamlFail(this.source, info.line, info.indent + 1, `indentação esperada: ${indent} espaços`);
    return /^-(?:\s|$)/.test(info.content) ? this.parseSequence(indent, depth) : this.parseMap(indent, depth);
  }

  parseSequence(indent, depth) {
    const result = [];
    while (true) {
      const info = this.peek();
      if (!info || info.indent < indent) return result;
      if (info.indent > indent) yamlFail(this.source, info.line, info.indent + 1, 'indentação inesperada em sequência');
      if (!/^-(?:\s|$)/.test(info.content)) return result;
      const remainder = info.content.slice(1).trimStart();
      this.index += 1;
      if (!remainder) {
        const child = this.peek();
        if (!child || child.indent <= indent) result.push(null);
        else {
          if (child.indent !== indent + 2) yamlFail(this.source, child.line, child.indent + 1, `item aninhado deve usar ${indent + 2} espaços`);
          result.push(this.parseNode(indent + 2, depth + 1));
        }
        continue;
      }

      const colon = findMappingColon(remainder);
      if (colon >= 0) {
        const object = createRecord();
        this.parseMapEntry(object, remainder, info.line, indent + 2, depth + 1, info.indent + 3);
        this.parseMapContinuation(object, indent + 2, depth + 1);
        result.push(object);
      } else {
        result.push(parseInlineValue(remainder, this.source, info.line, info.indent + 3));
        const child = this.peek();
        if (child && child.indent > indent) yamlFail(this.source, child.line, child.indent + 1, 'escalar não pode possuir bloco aninhado');
      }
    }
  }

  parseMap(indent, depth) {
    const result = createRecord();
    this.parseMapContinuation(result, indent, depth);
    return result;
  }

  parseMapContinuation(result, indent, depth) {
    while (true) {
      const info = this.peek();
      if (!info || info.indent < indent) return result;
      if (info.indent > indent) yamlFail(this.source, info.line, info.indent + 1, 'indentação inesperada em mapa');
      if (/^-(?:\s|$)/.test(info.content)) return result;
      this.index += 1;
      this.parseMapEntry(result, info.content, info.line, indent, depth, info.indent + 1);
    }
  }

  parseMapEntry(result, content, line, indent, depth, column) {
    const colon = findMappingColon(content);
    if (colon < 0) yamlFail(this.source, line, column, 'entrada de mapa precisa de ":"');
    const rawKey = content.slice(0, colon).trim();
    if (!rawKey) yamlFail(this.source, line, column, 'chave vazia');
    const parsedKey = parseInlineValue(rawKey, this.source, line, column);
    if (typeof parsedKey !== 'string') yamlFail(this.source, line, column, 'chaves devem ser strings');
    const rawValue = content.slice(colon + 1).trimStart();

    if (/^[|>][+-]?$/.test(rawValue)) {
      const value = this.parseBlockScalar(rawValue, indent, line);
      defineSafe(result, parsedKey, value, this.source, line, column);
      return;
    }
    if (rawValue) {
      const value = parseInlineValue(rawValue, this.source, line, column + colon + 2);
      defineSafe(result, parsedKey, value, this.source, line, column);
      return;
    }

    const child = this.peek();
    if (!child || child.indent <= indent) {
      defineSafe(result, parsedKey, null, this.source, line, column);
      return;
    }
    if (child.indent !== indent + 2) yamlFail(this.source, child.line, child.indent + 1, `valor aninhado deve usar ${indent + 2} espaços`);
    const value = this.parseNode(indent + 2, depth + 1);
    defineSafe(result, parsedKey, value, this.source, line, column);
  }

  parseBlockScalar(indicator, parentIndent, headerLine) {
    const style = indicator[0];
    const chomp = indicator[1] || '';
    const requiredIndent = parentIndent + 2;
    const lines = [];

    while (this.index < this.lines.length) {
      const raw = this.lines[this.index];
      const blank = !raw.trim();
      const indent = raw.match(/^ */)?.[0].length || 0;
      if (!blank && indent <= parentIndent) break;
      if (!blank && indent < requiredIndent) yamlFail(this.source, this.index + 1, indent + 1, `bloco escalar iniciado na linha ${headerLine} requer ${requiredIndent} espaços`);
      lines.push(blank ? '' : raw.slice(requiredIndent));
      this.index += 1;
    }

    let value;
    if (style === '|') value = lines.join('\n');
    else {
      value = '';
      for (let index = 0; index < lines.length; index += 1) {
        const current = lines[index];
        const next = lines[index + 1];
        value += current;
        if (index < lines.length - 1) value += current && next ? ' ' : '\n';
      }
    }
    if (chomp === '-') return value.replace(/\n+$/g, '');
    if (chomp === '+') return `${value}\n`;
    return `${value.replace(/\n+$/g, '')}\n`;
  }
}

export function parseYaml(text, options = {}) {
  const source = options.source || '<yaml>';
  if (typeof text !== 'string') fail('YAML_INPUT_ERROR', `${source}: entrada YAML deve ser string`);
  return new YamlBlockParser(text, source).parse();
}

const SCHEMA_KEYWORDS = new Set([
  '$schema', '$id', '$anchor', '$comment', '$defs', 'definitions', '$ref',
  'title', 'description', 'default', 'examples', 'deprecated', 'readOnly', 'writeOnly',
  'type', 'enum', 'const', 'allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else',
  'required', 'properties', 'patternProperties', 'additionalProperties', 'propertyNames',
  'minProperties', 'maxProperties', 'dependentRequired',
  'items', 'prefixItems', 'contains', 'minContains', 'maxContains', 'minItems', 'maxItems', 'uniqueItems',
  'minLength', 'maxLength', 'pattern', 'format',
  'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf',
]);

function schemaFail(path, message) {
  fail('SCHEMA_INVALID', `${path}: ${message}`, { schemaPath: path });
}

function assertSchemaKeywords(schema, path = '#', seen = new WeakSet()) {
  if (typeof schema === 'boolean') return;
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) schemaFail(path, 'schema deve ser objeto ou booleano');
  if (seen.has(schema)) return;
  seen.add(schema);
  for (const keyword of Object.keys(schema)) {
    if (!SCHEMA_KEYWORDS.has(keyword)) schemaFail(`${path}/${keyword}`, `keyword JSON Schema desconhecida: ${keyword}`);
  }
  const maps = ['$defs', 'definitions', 'properties', 'patternProperties'];
  for (const keyword of maps) {
    if (schema[keyword] === undefined) continue;
    if (!schema[keyword] || typeof schema[keyword] !== 'object' || Array.isArray(schema[keyword])) schemaFail(`${path}/${keyword}`, 'deve ser objeto');
    for (const [key, child] of Object.entries(schema[keyword])) assertSchemaKeywords(child, `${path}/${keyword}/${escapeJsonPointer(key)}`, seen);
  }
  for (const keyword of ['additionalProperties', 'propertyNames', 'items', 'contains', 'not', 'if', 'then', 'else']) {
    if (schema[keyword] !== undefined) assertSchemaKeywords(schema[keyword], `${path}/${keyword}`, seen);
  }
  for (const keyword of ['prefixItems', 'allOf', 'anyOf', 'oneOf']) {
    if (schema[keyword] === undefined) continue;
    if (!Array.isArray(schema[keyword])) schemaFail(`${path}/${keyword}`, 'deve ser array');
    schema[keyword].forEach((child, index) => assertSchemaKeywords(child, `${path}/${keyword}/${index}`, seen));
  }
}

function escapeJsonPointer(value) {
  return String(value).replace(/~/g, '~0').replace(/\//g, '~1');
}

function deepEqual(left, right) {
  return stableStringify(left) === stableStringify(right);
}

function typeMatches(value, type) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === type;
}

function resolveLocalReference(rootSchema, reference, schemaPath) {
  if (!reference.startsWith('#')) schemaFail(schemaPath, 'somente $ref local é suportado');
  if (reference === '#') return rootSchema;
  if (!reference.startsWith('#/')) schemaFail(schemaPath, '$ref local inválido');
  let current = rootSchema;
  for (const encoded of reference.slice(2).split('/')) {
    const key = encoded.replace(/~1/g, '/').replace(/~0/g, '~');
    if (!current || typeof current !== 'object' || !own(current, key)) schemaFail(schemaPath, `$ref não encontrado: ${reference}`);
    current = current[key];
  }
  return current;
}

function valueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function validateFormat(value, format) {
  if (format === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }
  if (format === 'date-time') return !Number.isNaN(Date.parse(value)) && /T/.test(value);
  if (format === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (format === 'uuid') return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  if (format === 'ipv4') return value.split('.').length === 4 && value.split('.').every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
  if (format === 'hostname') return value.length <= 253 && value.split('.').every((part) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(part));
  if (format === 'uri' || format === 'uri-reference') {
    try {
      if (format === 'uri') return Boolean(new URL(value).protocol);
      new URL(value, 'https://knowledge.invalid/');
      return true;
    } catch {
      return false;
    }
  }
  schemaFail('#/format', `formato não suportado: ${format}`);
}

function collectSchemaErrors(value, schema, rootSchema, instancePath, schemaPath, depth, active) {
  if (depth > 128) return [{ instancePath, schemaPath, message: 'profundidade de validação excedida' }];
  if (schema === true) return [];
  if (schema === false) return [{ instancePath, schemaPath, message: 'schema booleano rejeitou o valor' }];
  const errors = [];
  const add = (message, suffix = '') => errors.push({ instancePath, schemaPath: `${schemaPath}${suffix}`, message });

  if (schema.$ref) {
    const referenced = resolveLocalReference(rootSchema, schema.$ref, `${schemaPath}/$ref`);
    const key = `${schema.$ref}|${instancePath}`;
    if (!active.has(key)) {
      active.add(key);
      errors.push(...collectSchemaErrors(value, referenced, rootSchema, instancePath, schema.$ref, depth + 1, active));
      active.delete(key);
    }
  }

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const known = new Set(['null', 'boolean', 'object', 'array', 'number', 'integer', 'string']);
    if (!types.length || types.some((type) => !known.has(type))) schemaFail(`${schemaPath}/type`, 'tipo inválido');
    if (!types.some((type) => typeMatches(value, type))) {
      add(`esperado ${types.join('|')}; recebido ${valueType(value)}`, '/type');
      return errors;
    }
  }

  if (schema.enum && !schema.enum.some((candidate) => deepEqual(candidate, value))) add('valor fora de enum', '/enum');
  if (own(schema, 'const') && !deepEqual(schema.const, value)) add('valor diferente de const', '/const');

  for (const [keyword, expected] of [['allOf', 'all'], ['anyOf', 'any'], ['oneOf', 'one']]) {
    if (!schema[keyword]) continue;
    const results = schema[keyword].map((child, index) => collectSchemaErrors(value, child, rootSchema, instancePath, `${schemaPath}/${keyword}/${index}`, depth + 1, new Set(active)));
    const validCount = results.filter((result) => result.length === 0).length;
    if ((expected === 'all' && validCount !== results.length) || (expected === 'any' && validCount === 0) || (expected === 'one' && validCount !== 1)) {
      add(`${keyword} não satisfeito`, `/${keyword}`);
    }
  }
  if (schema.not && collectSchemaErrors(value, schema.not, rootSchema, instancePath, `${schemaPath}/not`, depth + 1, new Set(active)).length === 0) add('not não satisfeito', '/not');
  if (schema.if) {
    const condition = collectSchemaErrors(value, schema.if, rootSchema, instancePath, `${schemaPath}/if`, depth + 1, new Set(active));
    if (condition.length === 0 && schema.then) errors.push(...collectSchemaErrors(value, schema.then, rootSchema, instancePath, `${schemaPath}/then`, depth + 1, active));
    if (condition.length > 0 && schema.else) errors.push(...collectSchemaErrors(value, schema.else, rootSchema, instancePath, `${schemaPath}/else`, depth + 1, active));
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) add('string menor que minLength', '/minLength');
    if (schema.maxLength !== undefined && [...value].length > schema.maxLength) add('string maior que maxLength', '/maxLength');
    if (schema.pattern !== undefined) {
      let expression;
      try { expression = new RegExp(schema.pattern, 'u'); } catch { schemaFail(`${schemaPath}/pattern`, 'expressão regular inválida'); }
      if (!expression.test(value)) add('string não corresponde a pattern', '/pattern');
    }
    if (schema.format !== undefined && !validateFormat(value, schema.format)) add(`formato inválido: ${schema.format}`, '/format');
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (schema.minimum !== undefined && value < schema.minimum) add('número menor que minimum', '/minimum');
    if (schema.maximum !== undefined && value > schema.maximum) add('número maior que maximum', '/maximum');
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) add('número não excede exclusiveMinimum', '/exclusiveMinimum');
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) add('número não está abaixo de exclusiveMaximum', '/exclusiveMaximum');
    if (schema.multipleOf !== undefined) {
      if (!(schema.multipleOf > 0)) schemaFail(`${schemaPath}/multipleOf`, 'multipleOf deve ser positivo');
      const quotient = value / schema.multipleOf;
      if (Math.abs(quotient - Math.round(quotient)) > Number.EPSILON * 16) add('número não é múltiplo', '/multipleOf');
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) add('array menor que minItems', '/minItems');
    if (schema.maxItems !== undefined && value.length > schema.maxItems) add('array maior que maxItems', '/maxItems');
    if (schema.uniqueItems && new Set(value.map((item) => stableStringify(item))).size !== value.length) add('array possui itens duplicados', '/uniqueItems');
    if (schema.prefixItems) {
      schema.prefixItems.forEach((child, index) => {
        if (index < value.length) errors.push(...collectSchemaErrors(value[index], child, rootSchema, `${instancePath}/${index}`, `${schemaPath}/prefixItems/${index}`, depth + 1, active));
      });
    }
    if (schema.items && typeof schema.items === 'object') {
      const start = schema.prefixItems?.length || 0;
      for (let index = start; index < value.length; index += 1) {
        errors.push(...collectSchemaErrors(value[index], schema.items, rootSchema, `${instancePath}/${index}`, `${schemaPath}/items`, depth + 1, active));
      }
    } else if (schema.items === false && value.length > (schema.prefixItems?.length || 0)) add('itens adicionais não permitidos', '/items');
    if (schema.contains) {
      const count = value.filter((item, index) => collectSchemaErrors(item, schema.contains, rootSchema, `${instancePath}/${index}`, `${schemaPath}/contains`, depth + 1, new Set(active)).length === 0).length;
      const minimum = schema.minContains ?? 1;
      const maximum = schema.maxContains ?? Number.POSITIVE_INFINITY;
      if (count < minimum || count > maximum) add('contains fora dos limites', '/contains');
    }
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value);
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) add('objeto menor que minProperties', '/minProperties');
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) add('objeto maior que maxProperties', '/maxProperties');
    for (const required of schema.required || []) {
      if (!own(value, required)) errors.push({ instancePath, schemaPath: `${schemaPath}/required`, message: `propriedade obrigatória ausente: ${required}` });
    }
    const matched = new Set();
    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (!own(value, key)) continue;
      matched.add(key);
      errors.push(...collectSchemaErrors(value[key], child, rootSchema, `${instancePath}/${escapeJsonPointer(key)}`, `${schemaPath}/properties/${escapeJsonPointer(key)}`, depth + 1, active));
    }
    for (const [pattern, child] of Object.entries(schema.patternProperties || {})) {
      let expression;
      try { expression = new RegExp(pattern, 'u'); } catch { schemaFail(`${schemaPath}/patternProperties/${escapeJsonPointer(pattern)}`, 'expressão regular inválida'); }
      for (const key of keys) {
        if (!expression.test(key)) continue;
        matched.add(key);
        errors.push(...collectSchemaErrors(value[key], child, rootSchema, `${instancePath}/${escapeJsonPointer(key)}`, `${schemaPath}/patternProperties/${escapeJsonPointer(pattern)}`, depth + 1, active));
      }
    }
    const extras = keys.filter((key) => !matched.has(key));
    if (schema.additionalProperties === false && extras.length) add(`propriedades adicionais não permitidas: ${extras.join(', ')}`, '/additionalProperties');
    else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      for (const key of extras) errors.push(...collectSchemaErrors(value[key], schema.additionalProperties, rootSchema, `${instancePath}/${escapeJsonPointer(key)}`, `${schemaPath}/additionalProperties`, depth + 1, active));
    }
    if (schema.propertyNames) {
      for (const key of keys) errors.push(...collectSchemaErrors(key, schema.propertyNames, rootSchema, `${instancePath}/${escapeJsonPointer(key)}`, `${schemaPath}/propertyNames`, depth + 1, active));
    }
    for (const [key, dependencies] of Object.entries(schema.dependentRequired || {})) {
      if (!own(value, key)) continue;
      for (const dependency of dependencies) if (!own(value, dependency)) add(`propriedade ${dependency} exigida por ${key}`, '/dependentRequired');
    }
  }
  return errors;
}

export function validateJsonSchema(value, schema, options = {}) {
  const rootSchema = options.rootSchema || schema;
  assertSchemaKeywords(rootSchema);
  if (schema !== rootSchema) assertSchemaKeywords(schema);
  return collectSchemaErrors(value, schema, rootSchema, '', options.schemaPath || '#', 0, new Set());
}

export function assertJsonSchema(value, schema, options = {}) {
  const errors = validateJsonSchema(value, schema, options);
  if (!errors.length) return value;
  const source = options.source || '<data>';
  const message = errors.map((error) => `${source}${error.instancePath || ''}: ${error.message} (${error.schemaPath})`).join('\n');
  fail('SCHEMA_VALIDATION_ERROR', message, { source, errors });
}

export function snakeToCamelKey(key) {
  return String(key).replace(/_+([a-zA-Z0-9])/g, (_, character) => character.toUpperCase());
}

export function snakeToCamelDeep(value, path = '$') {
  if (Array.isArray(value)) return value.map((item, index) => snakeToCamelDeep(item, `${path}[${index}]`));
  if (!value || typeof value !== 'object') return value;
  const result = createRecord();
  for (const [key, child] of Object.entries(value)) {
    const converted = snakeToCamelKey(key);
    if (own(result, converted)) fail('KEY_COLLISION', `${path}: colisão após converter snake_case: ${key} -> ${converted}`);
    result[converted] = snakeToCamelDeep(child, `${path}.${converted}`);
  }
  return result;
}

function toPosix(value) {
  return value.split(sep).join('/');
}

function normalizeRelativePath(value, label = 'caminho') {
  if (typeof value !== 'string' || !value.trim()) fail('PATH_INVALID', `${label}: caminho vazio`);
  if (value.includes('\\') || isAbsolute(value) || /^[a-zA-Z]:/.test(value)) fail('PATH_INVALID', `${label}: use caminho POSIX relativo`);
  const normalized = value.normalize('NFC').replace(/^\.\//, '');
  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) fail('PATH_INVALID', `${label}: segmento inválido em ${value}`);
  return normalized;
}

function caseFold(value) {
  return value.normalize('NFC').toLowerCase();
}

async function walkFiles(root, options = {}) {
  const output = [];
  async function visit(directory, relativeDirectory = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
    const folded = new Map();
    for (const entry of entries) {
      const key = caseFold(entry.name);
      if (folded.has(key) && folded.get(key) !== entry.name) fail('CASE_COLLISION', `colisão de case: ${join(directory, folded.get(key))} e ${join(directory, entry.name)}`);
      folded.set(key, entry.name);
      const relativePath = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
      if (options.exclude?.(relativePath, entry)) continue;
      const absolute = join(directory, entry.name);
      const info = await lstat(absolute);
      if (info.isSymbolicLink()) fail('SYMLINK_FORBIDDEN', `symlink não permitido: ${relativePath}`);
      if (entry.isDirectory()) await visit(absolute, relativePath);
      else if (entry.isFile() && (!options.accept || options.accept(relativePath))) output.push(relativePath.normalize('NFC'));
    }
  }
  await visit(root);
  return output;
}

async function exists(path) {
  return Boolean(await lstat(path).catch(() => null));
}

async function assertExactCase(root, relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  let current = root;
  for (const segment of normalized.split('/')) {
    const entries = await readdir(current, { withFileTypes: true }).catch(() => null);
    if (!entries) fail('PATH_MISSING', `diretório ausente ao resolver ${normalized}`);
    const exact = entries.find((entry) => entry.name.normalize('NFC') === segment);
    if (!exact) {
      const folded = entries.find((entry) => caseFold(entry.name) === caseFold(segment));
      if (folded) fail('PATH_CASE_MISMATCH', `case incorreto em ${normalized}; encontrado ${folded.name}`);
      fail('PATH_MISSING', `caminho inexistente: ${normalized}`);
    }
    current = join(current, exact.name);
    const info = await lstat(current);
    if (info.isSymbolicLink()) fail('SYMLINK_FORBIDDEN', `symlink não permitido: ${normalized}`);
  }
  return current;
}

function stripInlineMarkdown(value) {
  return value
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!??\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_~]/g, '')
    .trim();
}

function headingSlug(value) {
  return stripInlineMarkdown(value)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

function withoutInlineCode(value) {
  let result = '';
  let ticks = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '`') {
      result += ticks ? ' ' : value[index];
      continue;
    }
    let count = 1;
    while (value[index + count] === '`') count += 1;
    if (!ticks) ticks = count;
    else if (ticks === count) ticks = 0;
    result += ' '.repeat(count);
    index += count - 1;
  }
  return result;
}

function parseLinkDestination(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('<')) {
    const end = trimmed.indexOf('>');
    return end >= 0 ? trimmed.slice(1, end) : '';
  }
  let escaped = false;
  let depth = 0;
  for (let index = 0; index < trimmed.length; index += 1) {
    const character = trimmed[index];
    if (escaped) { escaped = false; continue; }
    if (character === '\\') { escaped = true; continue; }
    if (character === '(') depth += 1;
    else if (character === ')') depth -= 1;
    else if (/\s/.test(character) && depth === 0) return trimmed.slice(0, index);
  }
  return trimmed;
}

function scanInlineLinks(line, definitions) {
  const links = [];
  const value = withoutInlineCode(line);
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] !== '[' || (index > 0 && value[index - 1] === '\\')) continue;
    const close = value.indexOf(']', index + 1);
    if (close < 0) continue;
    if (value[close + 1] === '(') {
      let depth = 1;
      let cursor = close + 2;
      let escaped = false;
      for (; cursor < value.length; cursor += 1) {
        const character = value[cursor];
        if (escaped) { escaped = false; continue; }
        if (character === '\\') { escaped = true; continue; }
        if (character === '(') depth += 1;
        else if (character === ')' && --depth === 0) break;
      }
      if (depth !== 0) continue;
      const target = parseLinkDestination(value.slice(close + 2, cursor));
      if (target) links.push(target);
      index = cursor;
      continue;
    }
    if (value[close + 1] === '[') {
      const referenceEnd = value.indexOf(']', close + 2);
      if (referenceEnd < 0) continue;
      const label = (value.slice(close + 2, referenceEnd) || value.slice(index + 1, close)).trim().toLowerCase();
      if (definitions.has(label)) links.push(definitions.get(label));
      index = referenceEnd;
    }
  }
  return links;
}

function parseMarkdown(relativePath, text) {
  const normalized = text.replace(/\r\n?/g, '\n');
  let frontMatter = createRecord();
  let body = normalized;
  let bodyStartLine = 1;
  if (normalized.startsWith('---\n')) {
    const lines = normalized.split('\n');
    let closing = -1;
    for (let index = 1; index < lines.length; index += 1) {
      if (lines[index] === '---' || lines[index] === '...') { closing = index; break; }
    }
    if (closing < 0) fail('FRONT_MATTER_INVALID', `${relativePath}: front matter sem fechamento`);
    frontMatter = snakeToCamelDeep(parseYaml(lines.slice(1, closing).join('\n'), { source: `${relativePath}:front-matter` }) || createRecord());
    body = lines.slice(closing + 1).join('\n');
    bodyStartLine = closing + 2;
  }

  const lines = body.split('\n');
  const definitions = new Map();
  let fenced = false;
  let fenceCharacter = '';
  let fenceLength = 0;
  for (const line of lines) {
    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (!fenced) { fenced = true; fenceCharacter = fence[1][0]; fenceLength = fence[1].length; }
      else if (fence[1][0] === fenceCharacter && fence[1].length >= fenceLength) fenced = false;
      continue;
    }
    if (fenced) continue;
    const definition = line.match(/^\s{0,3}\[([^\]]+)\]:\s*(.+)$/);
    if (definition) definitions.set(definition[1].trim().toLowerCase(), parseLinkDestination(definition[2]));
  }

  const headings = [];
  const links = [];
  const anchors = new Set();
  const slugCounts = new Map();
  fenced = false;
  fenceCharacter = '';
  fenceLength = 0;
  let previousLevel = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (!fenced) { fenced = true; fenceCharacter = fence[1][0]; fenceLength = fence[1].length; }
      else if (fence[1][0] === fenceCharacter && fence[1].length >= fenceLength) fenced = false;
      continue;
    }
    if (fenced) continue;

    for (const anchor of line.matchAll(/<a\s+(?:[^>]*?\s)?(?:id|name)=["']([^"']+)["'][^>]*>/gi)) {
      if (anchors.has(anchor[1])) fail('HEADING_DUPLICATE', `${relativePath}:${bodyStartLine + index}: anchor duplicado: ${anchor[1]}`);
      anchors.add(anchor[1]);
    }

    let heading = line.match(/^\s{0,3}(#{1,6})(?:\s+|$)(.*)$/);
    let level;
    let title;
    if (heading) {
      level = heading[1].length;
      title = heading[2].replace(/\s+#+\s*$/, '').trim();
    } else if (index + 1 < lines.length && /^\s{0,3}(?:=+|-+)\s*$/.test(lines[index + 1]) && line.trim()) {
      level = lines[index + 1].trim()[0] === '=' ? 1 : 2;
      title = line.trim();
      index += 1;
    }
    if (level) {
      if (!title) fail('HEADING_INVALID', `${relativePath}:${bodyStartLine + index}: heading vazio`);
      if (previousLevel && level > previousLevel + 1) fail('HEADING_LEVEL_SKIP', `${relativePath}:${bodyStartLine + index}: salto de H${previousLevel} para H${level}`);
      previousLevel = level;
      const base = headingSlug(title);
      if (!base) fail('HEADING_INVALID', `${relativePath}:${bodyStartLine + index}: heading sem fragmento válido`);
      const count = slugCounts.get(base) || 0;
      slugCounts.set(base, count + 1);
      const fragment = count ? `${base}-${count}` : base;
      anchors.add(fragment);
      headings.push({ level, title: stripInlineMarkdown(title), fragment, line: bodyStartLine + index });
    }
    if (!/^\s{0,3}\[[^\]]+\]:/.test(line)) {
      for (const target of scanInlineLinks(line, definitions)) links.push({ target, line: bodyStartLine + index });
    }
  }
  if (fenced) fail('MARKDOWN_FENCE_UNCLOSED', `${relativePath}: bloco de código sem fechamento`);
  const h1 = headings.filter((heading) => heading.level === 1);
  if (h1.length !== 1) fail('HEADING_H1_COUNT', `${relativePath}: esperado exatamente um H1; encontrado ${h1.length}`);
  return { frontMatter, headings, links, anchors: [...anchors].sort(), title: h1[0].title };
}

export function deriveDocumentType(relativePath, kind = 'canonical-reference') {
  const path = normalizeRelativePath(relativePath);
  if (path === 'INDEX.md') return 'root-index';
  if (basename(path).toLowerCase() === 'index.md') return 'scope-index';
  if (path === 'ROUTING.md') return 'routing-map';
  const directKinds = new Set(['flow-map', 'checklist', 'template', 'standard', 'migration-ledger', 'legacy-reference']);
  return directKinds.has(kind) ? kind : 'canonical-reference';
}

const FRONT_MATTER_FIELDS = new Set([
  'id', 'title', 'scope', 'kind', 'status', 'canonicalFor', 'triggers',
  'requiredContext', 'conditionalContext', 'relatedContext', 'evidenceSources',
  'supersedes', 'supersededBy', 'notes',
]);

function ensureNodeId(value, label) {
  if (typeof value !== 'string' || !NODE_ID_PATTERN.test(value)) fail('ID_INVALID', `${label}: id de nó inválido: ${String(value)}`);
  return value;
}

function ensureRouteId(value, label) {
  if (typeof value !== 'string' || !ROUTE_ID_PATTERN.test(value)) fail('ID_INVALID', `${label}: id de rota inválido: ${String(value)}`);
  return value;
}

function arrayValue(value, label = 'campo') {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) fail('MODEL_INVALID', `${label} deve ser array`);
  return value;
}

function relationTarget(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.id === 'string') return value.id;
  return '';
}

export async function discoverCanonicalMarkdown(aiRoot) {
  const files = await walkFiles(aiRoot, {
    accept: (path) => {
      if (!path.toLowerCase().endsWith('.md') || GENERATED_FILES.has(path)) return false;
      if (path === 'INDEX.md') return true;
      if (path === 'pending-knowledge/INDEX.md') return true;
      return CANONICAL_SCOPES.has(path.split('/')[0]);
    },
    exclude: (path, entry) => {
      const foldedPath = caseFold(path);
      const excludedPendingRecords = [
        'pending-knowledge/new',
        'pending-knowledge/incorporated',
      ].some((directory) => foldedPath === directory || foldedPath.startsWith(`${directory}/`));
      return excludedPendingRecords || (entry.isDirectory() && foldedPath === '.git');
    },
  });
  const documents = [];
  const ids = new Map();
  for (const path of files) {
    const absolute = await assertExactCase(aiRoot, path);
    const parsed = parseMarkdown(path, await readFile(absolute, 'utf8'));
    const metadata = parsed.frontMatter;
    for (const key of Object.keys(metadata)) {
      if (!FRONT_MATTER_FIELDS.has(key)) fail('FRONT_MATTER_FIELD_UNKNOWN', `${path}: campo desconhecido no front matter: ${key}`);
    }
    const id = ensureNodeId(metadata.id, path);
    if (ids.has(id)) fail('ID_DUPLICATE', `id duplicado: ${id} (${ids.get(id)} e ${path})`);
    ids.set(id, path);
    if (metadata.title !== parsed.title) fail('TITLE_MISMATCH', `${path}: title do front matter difere do H1`);
    const inferredScope = path === 'INDEX.md'
      ? 'project'
      : path === 'pending-knowledge/INDEX.md'
        ? 'maintenance'
        : path.split('/')[0];
    if (metadata.scope !== inferredScope) fail('SCOPE_PATH_MISMATCH', `${path}: scope ${metadata.scope} difere de ${inferredScope}`);
    documents.push({
      id,
      relativePath: path,
      repoPath: `ai/${path}`,
      title: parsed.title,
      documentType: deriveDocumentType(path, metadata.kind),
      headings: parsed.headings,
      anchors: parsed.anchors,
      links: parsed.links,
      metadata,
    });
  }
  return documents.sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
}

async function loadKnowledgeSchema(aiRoot) {
  const path = 'knowledge.schema.json';
  const absolute = await assertExactCase(aiRoot, path);
  let schema;
  try { schema = JSON.parse(await readFile(absolute, 'utf8')); }
  catch (error) { fail('SCHEMA_JSON_ERROR', `${path}: ${error.message}`); }
  assertSchemaKeywords(schema);
  for (const definition of ['node', 'route', 'graph']) {
    if (!schema.$defs?.[definition]) fail('SCHEMA_INVALID', `${path}: definição ausente: $defs.${definition}`);
  }
  return schema;
}

async function loadJsonShards(aiRoot, kind, schema, definition) {
  const directory = `graph/${kind}`;
  const absoluteDirectory = await assertExactCase(aiRoot, directory);
  const files = await walkFiles(absoluteDirectory, { accept: (path) => path.toLowerCase().endsWith('.json') });
  if (!files.length) fail('SHARD_DISCOVERY_ERROR', `nenhum shard JSON em ai/${directory}`);
  const records = [];
  for (const file of files) {
    const relativePath = `${directory}/${file}`;
    const absolute = await assertExactCase(aiRoot, relativePath);
    let data;
    try { data = snakeToCamelDeep(JSON.parse(await readFile(absolute, 'utf8'))); }
    catch (error) {
      if (error instanceof KnowledgeError) throw error;
      fail('SHARD_JSON_ERROR', `${relativePath}: ${error.message}`);
    }
    assertJsonSchema(data, schema.$defs[definition], {
      source: relativePath,
      rootSchema: schema,
      schemaPath: `#/$defs/${definition}`,
    });
    records.push({ data, sourcePath: `ai/${relativePath}` });
  }
  return records;
}

function topologicalCycle(nodes, edges) {
  const nodeList = [...nodes];
  const adjacency = new Map(nodeList.map((node) => [node, []]));
  for (const [source, target] of edges) adjacency.get(source)?.push(target);
  for (const targets of adjacency.values()) targets.sort();
  const state = new Map();
  const stack = [];
  function visit(node) {
    state.set(node, 1);
    stack.push(node);
    for (const target of adjacency.get(node) || []) {
      if (state.get(target) === 1) return [...stack.slice(stack.indexOf(target)), target];
      if (!state.get(target)) {
        const cycle = visit(target);
        if (cycle) return cycle;
      }
    }
    stack.pop();
    state.set(node, 2);
    return null;
  }
  for (const node of nodeList.sort()) {
    if (!state.get(node)) {
      const cycle = visit(node);
      if (cycle) return cycle;
    }
  }
  return null;
}

async function validateMarkdownLinks(repoRoot, documents, nodesByPath) {
  const byPath = new Map(documents.map((document) => [document.repoPath, document]));
  const folded = new Map();
  for (const document of documents) {
    const key = caseFold(document.repoPath);
    if (folded.has(key) && folded.get(key) !== document.repoPath) fail('PATH_CASE_COLLISION', `documentos colidem por case: ${folded.get(key)} e ${document.repoPath}`);
    folded.set(key, document.repoPath);
  }
  const edges = [];
  for (const document of documents) {
    for (const link of document.links) {
      const raw = link.target.trim();
      if (!raw || /^(?:https?:|mailto:|tel:)/i.test(raw)) continue;
      if (/^(?:javascript:|data:|file:)/i.test(raw)) fail('LINK_PROTOCOL_FORBIDDEN', `${document.repoPath}:${link.line}: protocolo proibido`);
      const hashIndex = raw.indexOf('#');
      const rawPath = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
      let fragment = hashIndex >= 0 ? raw.slice(hashIndex + 1) : '';
      try { fragment = decodeURIComponent(fragment); } catch { fail('LINK_INVALID', `${document.repoPath}:${link.line}: fragmento percent-encoded inválido`); }
      let targetPath = document.repoPath;
      if (rawPath) {
        let decoded;
        try { decoded = decodeURIComponent(rawPath.split('?')[0]); } catch { fail('LINK_INVALID', `${document.repoPath}:${link.line}: caminho percent-encoded inválido`); }
        if (decoded.includes('\\') || isAbsolute(decoded)) fail('LINK_INVALID', `${document.repoPath}:${link.line}: link deve ser relativo e POSIX`);
        const baseSegments = dirname(document.repoPath).split('/').filter((segment) => segment !== '.');
        const targetSegments = [...baseSegments];
        for (const segment of decoded.split('/')) {
          if (!segment || segment === '.') continue;
          if (segment === '..') {
            if (!targetSegments.length) fail('LINK_ESCAPE', `${document.repoPath}:${link.line}: link escapa do repositório`);
            targetSegments.pop();
          } else targetSegments.push(segment);
        }
        targetPath = targetSegments.join('/');
        if (decoded.endsWith('/')) targetPath += '/README.md';
      }
      const exactDocument = byPath.get(targetPath);
      if (!exactDocument) {
        const caseMatch = folded.get(caseFold(targetPath));
        if (caseMatch) fail('LINK_CASE_MISMATCH', `${document.repoPath}:${link.line}: use ${caseMatch}, não ${targetPath}`);
        if (targetPath === 'ai/ROUTING.md' || targetPath === 'ai/knowledge-graph.json') {
          const generatedNode = nodesByPath.get(targetPath);
          if (generatedNode) edges.push([document.id, generatedNode.id]);
          continue;
        }
        const targetAbsolute = await assertExactCase(repoRoot, targetPath).catch((error) => {
          if (error instanceof KnowledgeError) fail('LINK_TARGET_MISSING', `${document.repoPath}:${link.line}: alvo ausente: ${targetPath}`);
          throw error;
        });
        if (fragment) {
          if (!targetPath.toLowerCase().endsWith('.md')) fail('LINK_FRAGMENT_UNVERIFIABLE', `${document.repoPath}:${link.line}: fragmento em arquivo não Markdown: ${targetPath}`);
          const parsedTarget = parseMarkdown(targetPath, await readFile(targetAbsolute, 'utf8'));
          if (!parsedTarget.anchors.includes(fragment)) fail('LINK_FRAGMENT_MISSING', `${document.repoPath}:${link.line}: fragmento ausente em ${targetPath}: #${fragment}`);
        }
        const linkedNode = nodesByPath.get(targetPath);
        if (linkedNode) edges.push([document.id, linkedNode.id]);
        continue;
      }
      if (fragment && !exactDocument.anchors.includes(fragment)) fail('LINK_FRAGMENT_MISSING', `${document.repoPath}:${link.line}: fragmento ausente em ${targetPath}: #${fragment}`);
      edges.push([document.id, exactDocument.id]);
    }
  }
  return edges;
}
function markdownNode(document) {
  const metadata = document.metadata;
  return {
    id: document.id,
    title: document.title,
    path: document.repoPath,
    scope: metadata.scope,
    kind: metadata.kind,
    status: metadata.status,
    documentType: document.documentType,
    canonicalFor: arrayValue(metadata.canonicalFor, `${document.id}.canonicalFor`),
    triggers: arrayValue(metadata.triggers, `${document.id}.triggers`),
    requiredContext: arrayValue(metadata.requiredContext, `${document.id}.requiredContext`),
    conditionalContext: arrayValue(metadata.conditionalContext, `${document.id}.conditionalContext`),
    relatedContext: arrayValue(metadata.relatedContext, `${document.id}.relatedContext`),
    evidenceSources: arrayValue(metadata.evidenceSources, `${document.id}.evidenceSources`),
    supersedes: arrayValue(metadata.supersedes, `${document.id}.supersedes`),
    supersededBy: arrayValue(metadata.supersededBy, `${document.id}.supersededBy`),
    sourceFiles: [document.repoPath],
    headings: document.headings.map(({ level, title }) => ({ level, text: title })),
    notes: arrayValue(metadata.notes, `${document.id}.notes`),
  };
}

function routingNode(routeRecords) {
  return {
    id: 'root.routing',
    title: 'Roteamento da base de conhecimento',
    path: 'ai/ROUTING.md',
    scope: 'project',
    kind: 'routing-map',
    status: 'canonical',
    documentType: 'routing-map',
    canonicalFor: ['roteamento progressivo de tarefas para contexto obrigatório'],
    triggers: ['roteamento', 'tipo de tarefa', 'contexto obrigatório'],
    requiredContext: ['root.index'],
    conditionalContext: [],
    relatedContext: ['maintenance.graph-standard'],
    evidenceSources: [],
    supersedes: [],
    supersededBy: [],
    sourceFiles: routeRecords.map((record) => record.sourcePath).sort(),
    headings: [
      { level: 1, text: 'Roteamento da base de conhecimento' },
      { level: 2, text: 'Como usar' },
      { level: 2, text: 'Rotas disponíveis' },
      ...routeRecords.map((record) => ({ level: 3, text: record.data.id })).sort((left, right) => left.text < right.text ? -1 : 1),
    ],
    notes: ['Arquivo gerado; não editar manualmente.'],
  };
}

async function validateRepoPath(repoRoot, path, options = {}) {
  const normalized = normalizeRelativePath(path, options.label || 'path');
  if (normalized === 'ai/knowledge-graph.json' && options.allowGraphBootstrap) return normalized;
  await assertExactCase(repoRoot, normalized);
  return normalized;
}

async function validateNodePathsAndHeadings(repoRoot, nodes, options) {
  for (const node of nodes.values()) {
    const isGeneratedRouting = node.path === 'ai/ROUTING.md' && node.id === 'root.routing';
    const isGraphBootstrap = node.path === 'ai/knowledge-graph.json' && options.allowGraphBootstrap;
    const normalizedPath = normalizeRelativePath(node.path, `${node.id}.path`);
    let absolute;
    try {
      absolute = await assertExactCase(repoRoot, normalizedPath);
    } catch (error) {
      if (!(error instanceof KnowledgeError) || error.code !== 'PATH_MISSING' || (!isGeneratedRouting && !isGraphBootstrap)) throw error;
      absolute = null;
    }
    for (const path of [...node.evidenceSources, ...node.sourceFiles]) {
      await validateRepoPath(repoRoot, path, { allowGraphBootstrap: options.allowGraphBootstrap, label: `${node.id}.source` });
    }
    if (absolute && node.path.toLowerCase().endsWith('.md') && node.path !== 'ai/ROUTING.md' && node.id.startsWith('external.')) {
      const parsed = parseMarkdown(node.path, await readFile(absolute, 'utf8'));
      const actual = new Set(parsed.headings.map((heading) => `${heading.level}\0${heading.title}`));
      for (const heading of node.headings) {
        if (!actual.has(`${heading.level}\0${heading.text}`)) fail('REFERENCE_HEADING_MISSING', `${node.id}: heading não encontrado em ${node.path}: H${heading.level} ${heading.text}`);
      }
    }
  }
}

function validateRelationships(nodes, routes, markdownEdges, canonicalMarkdownIds) {
  const ids = new Set(nodes.keys());
  const requiredEdges = [];
  for (const node of nodes.values()) {
    for (const target of node.requiredContext) {
      ensureNodeId(target, `${node.id}.requiredContext`);
      if (!ids.has(target)) fail('REQUIRED_CONTEXT_MISSING', `${node.id}: contexto obrigatório ausente: ${target}`);
      requiredEdges.push([node.id, target]);
    }
    for (const item of node.conditionalContext) {
      const target = relationTarget(item);
      ensureNodeId(target, `${node.id}.conditionalContext`);
      if (!ids.has(target)) fail('RELATION_TARGET_MISSING', `${node.id}: contexto condicional ausente: ${target}`);
    }
    for (const field of ['relatedContext', 'supersedes', 'supersededBy']) {
      for (const target of node[field]) {
        ensureNodeId(target, `${node.id}.${field}`);
        if (!ids.has(target)) fail('RELATION_TARGET_MISSING', `${node.id}: relação ${field} aponta para nó ausente: ${target}`);
      }
    }
  }
  for (const node of nodes.values()) {
    for (const target of node.supersedes) {
      if (!nodes.get(target).supersededBy.includes(node.id)) fail('SUPERSESSION_MISMATCH', `${node.id} supersedes ${target}, mas a relação inversa está ausente`);
    }
    for (const target of node.supersededBy) {
      if (!nodes.get(target).supersedes.includes(node.id)) fail('SUPERSESSION_MISMATCH', `${node.id} supersededBy ${target}, mas a relação inversa está ausente`);
    }
  }
  for (const route of routes.values()) {
    const contexts = [
      ...route.requiredContext,
      ...route.conditionalContext.map((item) => item.id),
      ...route.relatedContext,
    ];
    contexts.forEach((id) => {
      ensureNodeId(id, `${route.id}.context`);
      if (!ids.has(id)) fail('ROUTE_CONTEXT_MISSING', `${route.id}: nó ausente: ${id}`);
    });
  }
  const cycle = topologicalCycle(ids, requiredEdges);
  if (cycle) fail('REQUIRED_CONTEXT_CYCLE', `ciclo em required_context: ${cycle.join(' -> ')}`, { cycle });
  if (!ids.has('root.index')) fail('ROOT_NODE_MISSING', 'nó obrigatório root.index ausente');

  // Orphan detection deliberately follows navigable links, not semantic
  // relationships. A node is discoverable only when a reader can reach it by
  // starting at ai/INDEX.md and following Markdown links. ROUTING.md is
  // generated, so its route-context links are represented explicitly here.
  const linked = new Map([...ids].map((id) => [id, new Set()]));
  for (const [source, target] of markdownEdges) linked.get(source)?.add(target);
  const routingLinks = linked.get('root.routing');
  if (routingLinks) {
    for (const route of routes.values()) {
      for (const target of [
        ...route.requiredContext,
        ...route.conditionalContext.map((item) => item.id),
        ...route.relatedContext,
      ]) routingLinks.add(target);
    }
  }
  const visited = new Set(['root.index']);
  const queue = ['root.index'];
  while (queue.length) {
    const current = queue.shift();
    for (const target of linked.get(current) || []) {
      if (!visited.has(target)) { visited.add(target); queue.push(target); }
    }
  }
  const orphans = [...canonicalMarkdownIds].filter((id) => !visited.has(id)).sort();
  if (orphans.length) fail('ORPHAN_NODE', `nós órfãos no grafo: ${orphans.join(', ')}`);
}

export async function buildKnowledgeModel(aiRoot, options = {}) {
  const absoluteRoot = resolve(aiRoot);
  const repoRoot = resolve(absoluteRoot, '..');
  if (!(await exists(absoluteRoot))) fail('AI_ROOT_MISSING', `diretório ai ausente: ${absoluteRoot}`);
  const schema = await loadKnowledgeSchema(absoluteRoot);
  const documents = await discoverCanonicalMarkdown(absoluteRoot);
  if (!documents.length) fail('ORPHAN_KNOWLEDGE_BASE', 'nenhum Markdown canônico encontrado em ai/');
  const routeRecords = await loadJsonShards(absoluteRoot, 'routes', schema, 'route');
  const referenceRecords = await loadJsonShards(absoluteRoot, 'references', schema, 'node');
  const nodes = new Map();
  for (const document of documents) {
    const node = markdownNode(document);
    assertJsonSchema(node, schema.$defs.node, { source: document.repoPath, rootSchema: schema, schemaPath: '#/$defs/node' });
    nodes.set(node.id, node);
  }
  const generatedRouting = routingNode(routeRecords);
  assertJsonSchema(generatedRouting, schema.$defs.node, { source: 'ai/ROUTING.md', rootSchema: schema, schemaPath: '#/$defs/node' });
  if (nodes.has(generatedRouting.id)) fail('ID_DUPLICATE', `id reservado duplicado: ${generatedRouting.id}`);
  nodes.set(generatedRouting.id, generatedRouting);
  for (const record of referenceRecords) {
    if (nodes.has(record.data.id)) fail('ID_DUPLICATE', `id duplicado em referência: ${record.data.id}`);
    nodes.set(record.data.id, record.data);
  }
  const routes = new Map();
  for (const record of routeRecords) {
    ensureRouteId(record.data.id, record.sourcePath);
    if (routes.has(record.data.id)) fail('ID_DUPLICATE', `rota duplicada: ${record.data.id}`);
    routes.set(record.data.id, record.data);
  }
  const nodesByPath = new Map([...nodes.values()].map((node) => [node.path, node]));
  const markdownEdges = await validateMarkdownLinks(repoRoot, documents, nodesByPath);
  validateRelationships(nodes, routes, markdownEdges, new Set(documents.map((document) => document.id)));
  await validateNodePathsAndHeadings(repoRoot, nodes, { allowGraphBootstrap: Boolean(options.allowGraphBootstrap) });
  const graph = {
    schemaVersion: '1.0.0',
    generated: true,
    nodes: Object.fromEntries([...nodes].sort(([left], [right]) => left < right ? -1 : 1)),
    routes: Object.fromEntries([...routes].sort(([left], [right]) => left < right ? -1 : 1)),
  };
  assertJsonSchema(graph, schema, { source: 'ai/knowledge-graph.json' });
  return graph;
}

function escapeTableCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
}

function routingHref(repoPath) {
  return repoPath.startsWith('ai/') ? repoPath.slice(3) : `../${repoPath}`;
}

export function renderRoutingMarkdown(model) {
  const routing = model.nodes['root.routing'];
  if (!routing) fail('ROOT_NODE_MISSING', 'nó obrigatório root.routing ausente');
  const lines = [
    '---',
    `id: ${JSON.stringify(routing.id)}`,
    `title: ${JSON.stringify(routing.title)}`,
    `scope: ${JSON.stringify(routing.scope)}`,
    `kind: ${JSON.stringify(routing.kind)}`,
    `status: ${JSON.stringify(routing.status)}`,
    `canonical_for: ${JSON.stringify(routing.canonicalFor)}`,
    `triggers: ${JSON.stringify(routing.triggers)}`,
    `required_context: ${JSON.stringify(routing.requiredContext)}`,
    `conditional_context: ${JSON.stringify(routing.conditionalContext)}`,
    `related_context: ${JSON.stringify(routing.relatedContext)}`,
    `evidence_sources: ${JSON.stringify(routing.evidenceSources)}`,
    `supersedes: ${JSON.stringify(routing.supersedes)}`,
    `superseded_by: ${JSON.stringify(routing.supersededBy)}`,
    `notes: ${JSON.stringify(routing.notes)}`,
    '---',
    '',
    `# ${routing.title}`,
    '',
    'Arquivo gerado deterministicamente a partir de `ai/graph/routes/*.json` e dos nós validados.',
    '',
    '## Como usar',
    '',
    'Escolha a rota que corresponde à tarefa, leia primeiro o contexto obrigatório e abra o contexto condicional somente quando sua condição for verdadeira.',
    '',
    '## Rotas disponíveis',
  ];
  for (const route of Object.values(model.routes).sort((left, right) => left.id < right.id ? -1 : 1)) {
    lines.push('', `### ${route.id}`, '', route.description, '');
    const required = route.requiredContext.map((id) => model.nodes[id]);
    lines.push(`- Contexto obrigatório: ${required.map((node) => `[${escapeTableCell(node.title)}](${routingHref(node.path)})`).join(', ') || 'nenhum'}.`);
    if (route.conditionalContext.length) {
      lines.push('- Contexto condicional:');
      for (const item of route.conditionalContext) {
        const node = model.nodes[item.id];
        lines.push(`  - [${escapeTableCell(node.title)}](${routingHref(node.path)}): ${item.condition}`);
      }
    } else lines.push('- Contexto condicional: nenhum.');
    const related = route.relatedContext.map((id) => model.nodes[id]);
    lines.push(`- Contexto relacionado: ${related.map((node) => `[${escapeTableCell(node.title)}](${routingHref(node.path)})`).join(', ') || 'nenhum'}.`);
  }
  return `${lines.join('\n')}\n`;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  const result = createRecord();
  for (const key of Object.keys(value).sort()) result[key] = canonicalize(value[key]);
  return result;
}

export function stableStringify(value, space = 0) {
  return JSON.stringify(canonicalize(value), null, space);
}

export function renderKnowledgeGraph(model) {
  return `${stableStringify(model, 2)}\n`;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function atomicWrite(path, content) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}-${sha256(path).slice(0, 8)}`;
  await writeFile(temporary, content, 'utf8');
  try {
    await rename(temporary, path);
  } catch (error) {
    if (!['EEXIST', 'EPERM'].includes(error.code)) throw error;
    await rm(path, { force: true });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
}

export async function runKnowledgeBuild(options = {}) {
  const aiRoot = resolve(options.aiRoot || join(process.cwd(), 'ai'));
  const check = Boolean(options.check);
  const model = await buildKnowledgeModel(aiRoot, { allowGraphBootstrap: !check });
  const expected = new Map([
    ['ROUTING.md', renderRoutingMarkdown(model)],
    ['knowledge-graph.json', renderKnowledgeGraph(model)],
  ]);
  const differences = [];
  for (const [path, content] of expected) {
    const absolute = join(aiRoot, path);
    const actual = await readFile(absolute, 'utf8').catch((error) => error.code === 'ENOENT' ? null : Promise.reject(error));
    if (actual === null) differences.push({ path, status: 'missing', expectedSha256: sha256(content) });
    else if (actual !== content) differences.push({ path, status: 'changed', expectedSha256: sha256(content), actualSha256: sha256(actual) });
  }
  if (check) {
    if (differences.length) fail('KNOWLEDGE_OUTDATED', `base gerada desatualizada: ${differences.map((item) => `${item.path}:${item.status}`).join(', ')}`, { differences });
    return { mode: 'check', written: [], differences, model };
  }
  const written = [];
  for (const [path, content] of expected) {
    const difference = differences.find((item) => item.path === path);
    if (!difference) continue;
    await atomicWrite(join(aiRoot, path), content);
    written.push(path);
  }
  return { mode: 'generate', written, differences, model };
}
