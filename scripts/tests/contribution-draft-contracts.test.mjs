import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CONTRIBUTION_DRAFT_STORAGE_KEY,
  CONTRIBUTION_DRAFT_MAX_AGE_MS,
  clearContributionDraft,
  loadContributionDraft,
  saveContributionDraft,
} from '../../assets/js/contribution-draft.js';
import {
  buildContributionMailto,
  buildContributionText,
} from '../../assets/js/contribution-proposal.js';

function proposal() {
  return {
    name: 'Ana Silva',
    email: 'ana@example.com',
    credit: 'Ana S.',
    type: 'ensaio',
    title: 'Uma proposta verificável',
    summary: 'Este resumo apresenta uma afirmação delimitada, explica sua base e registra o que poderia contrariá-la de maneira verificável.',
    sources: 'Fonte Institucional. https://example.com/fonte',
    rights: true,
    privacy: true,
  };
}

function memoryStorage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    removeItem: (key) => entries.delete(key),
    setItem: (key, value) => entries.set(key, value),
  };
}

test('proposta gera a mesma base para prévia, texto e e-mail', () => {
  const text = buildContributionText(proposal());
  const mail = buildContributionMailto(proposal(), 'contato@example.com');
  assert.equal(mail.body, text.body);
  assert.equal(mail.subject, text.subject);
  assert.match(text.fileName, /^proposta-observatorio-[a-z0-9-]+\.txt$/);
  assert.match(text.body, /uso do nome de contato e do e-mail somente/);
  assert.match(mail.mailto, /^mailto:contato%40example\.com|^mailto:contato@example\.com/);
});

test('consentimento de contato é independente da declaração de direitos', () => {
  assert.throws(
    () => buildContributionText({ ...proposal(), privacy: false }),
    /privacy: confirme a finalidade/,
  );
  assert.throws(
    () => buildContributionText({ ...proposal(), rights: false }),
    /rights: confirme autoria/,
  );
});

test('rascunho só existe depois de ação explícita e pode ser apagado', () => {
  const storage = memoryStorage();
  assert.equal(loadContributionDraft(storage), null);
  const saved = saveContributionDraft(proposal(), storage);
  assert.equal(saved.ok, true);
  assert.ok(storage.getItem(CONTRIBUTION_DRAFT_STORAGE_KEY));
  const restored = loadContributionDraft(storage);
  assert.equal(restored.fields.title, proposal().title);
  assert.equal(restored.fields.privacy, undefined);
  assert.equal(restored.fields.rights, undefined);

  storage.setItem(CONTRIBUTION_DRAFT_STORAGE_KEY, JSON.stringify({
    version: 2,
    savedAt: new Date(Date.now() - CONTRIBUTION_DRAFT_MAX_AGE_MS - 1).toISOString(),
    fields: proposal(),
  }));
  assert.equal(loadContributionDraft(storage), null);
  assert.equal(storage.getItem(CONTRIBUTION_DRAFT_STORAGE_KEY), null);
  storage.setItem(CONTRIBUTION_DRAFT_STORAGE_KEY, '{json-corrompido');
  assert.equal(loadContributionDraft(storage), null);
  assert.equal(storage.getItem(CONTRIBUTION_DRAFT_STORAGE_KEY), null);
  assert.equal(clearContributionDraft(storage), true);
  assert.equal(loadContributionDraft(storage), null);
});
