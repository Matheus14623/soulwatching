import { createHash } from 'node:crypto';

export function canonicalizeJson(value) {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalizeJson(value[key])]),
  );
}

export function stableCanonicalStringify(value, spacing = 0) {
  return JSON.stringify(canonicalizeJson(value), null, spacing);
}

export function hashCanonicalJson(value) {
  return createHash('sha256')
    .update(stableCanonicalStringify(value))
    .digest('hex');
}

export function prefixedCanonicalHash(value) {
  return `sha256:${hashCanonicalJson(value)}`;
}
