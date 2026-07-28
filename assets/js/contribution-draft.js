const STORAGE_KEY = 'observatorio:contribution-draft:v2';
const DRAFT_VERSION = 2;
const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const FIELD_NAMES = Object.freeze([
  'name',
  'email',
  'credit',
  'type',
  'title',
  'summary',
  'sources',
]);

function safeText(value, maxLength = 2000) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .slice(0, maxLength);
}

function draftPayload(input) {
  const fields = {};
  FIELD_NAMES.forEach((name) => {
    fields[name] = safeText(input?.[name], name === 'summary' ? 1200 : 800);
  });
  return Object.freeze({
    version: DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    fields: Object.freeze(fields),
  });
}

function resolveStorage(storage) {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function saveContributionDraft(input, storage) {
  const target = resolveStorage(storage);
  if (!target) return Object.freeze({ ok: false, reason: 'unavailable' });
  const draft = draftPayload(input);
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(draft));
    return Object.freeze({ ok: true, draft });
  } catch {
    return Object.freeze({ ok: false, reason: 'storage-error' });
  }
}

export function loadContributionDraft(storage) {
  const target = resolveStorage(storage);
  if (!target) return null;
  try {
    const raw = target.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== DRAFT_VERSION || !parsed.fields || typeof parsed.fields !== 'object') {
      target.removeItem(STORAGE_KEY);
      return null;
    }
    const savedAt = Date.parse(parsed.savedAt);
    const age = Date.now() - savedAt;
    if (!Number.isFinite(savedAt) || age < 0 || age > DRAFT_MAX_AGE_MS) {
      target.removeItem(STORAGE_KEY);
      return null;
    }
    return draftPayload(parsed.fields);
  } catch {
    try {
      target.removeItem(STORAGE_KEY);
    } catch {
      return null;
    }
    return null;
  }
}

export function clearContributionDraft(storage) {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export const CONTRIBUTION_DRAFT_STORAGE_KEY = STORAGE_KEY;
export const CONTRIBUTION_DRAFT_MAX_AGE_MS = DRAFT_MAX_AGE_MS;
