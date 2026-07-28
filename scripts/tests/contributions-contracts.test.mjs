import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CONTRIBUTIONS,
  CONTRIBUTION_POLICY,
  CONTRIBUTION_ROLES,
  CONTRIBUTION_TYPES,
} from '../../assets/data/contributions.js';
import {
  EXTERNAL_CONTRIBUTIONS,
  PUBLICATION_CREDIT_ROLES,
  PUBLICATION_TYPES,
} from '../../assets/data/generated/runtime/publications.js';
import {
  CONTRIBUTION_MAILTO_MAX_LENGTH,
  buildContributionMailto,
  normalizeContributionProposal,
} from '../../assets/js/contribution-proposal.js';
import { SITE_CONFIG } from '../../assets/js/config.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function proposal(overrides = {}) {
  return {
    name: 'Ana Silva',
    email: 'ana@example.org',
    credit: 'Ana Silva',
    type: 'ensaio',
    title: 'Uma hipótese observacional',
    summary: 'Esta proposta apresenta uma pergunta delimitada, explicita suas premissas e descreve quais evidências poderiam contrariar a conclusão formulada.',
    sources: 'Example, A. Artigo de referência. https://example.org/artigo',
    rights: true,
    privacy: true,
    ...overrides,
  };
}

test('compatibilidade de contribuições projeta a única taxonomia e o único catálogo canônicos', () => {
  assert.strictEqual(CONTRIBUTIONS, EXTERNAL_CONTRIBUTIONS);
  assert.strictEqual(CONTRIBUTION_TYPES, PUBLICATION_TYPES);
  assert.strictEqual(CONTRIBUTION_ROLES, PUBLICATION_CREDIT_ROLES);
  assert.ok(CONTRIBUTION_TYPES.length >= 5);
  assert.ok(CONTRIBUTION_ROLES.length >= 2);
  assert.equal(new Set(CONTRIBUTION_TYPES.map(({ id }) => id)).size, CONTRIBUTION_TYPES.length);
  assert.ok(Object.values(CONTRIBUTION_POLICY).every((item) => item.length >= 20));
  assert.match(CONTRIBUTION_POLICY.independence, /endosso|autoria/i);
  assert.ok(CONTRIBUTIONS.every(({ authorshipOrigin }) => authorshipOrigin === 'external'));
});
test('proposta por mailto normaliza dados, codifica o conteúdo e bloqueia entradas inseguras', () => {
  const built = buildContributionMailto(
    proposal({ title: 'Órbitas & evidências\r\nBcc: intruso@example.org' }),
    SITE_CONFIG.contactEmail,
  );
  assert.ok(built.mailto.startsWith(`mailto:${SITE_CONFIG.contactEmail}?subject=`));
  assert.doesNotMatch(built.mailto, /[\r\n]/);
  assert.doesNotMatch(built.mailto, /& evidências/);
  assert.equal(built.proposal.title, 'Órbitas & evidências Bcc: intruso@example.org');
  assert.match(decodeURIComponent(built.mailto), /Formato: Ensaio/);
  assert.match(built.body, /autoria ou permissÃ£o|autoria ou permissão/i);

  assert.throws(() => normalizeContributionProposal(proposal({ type: 'inexistente' })), /formato permitido/);
  assert.throws(() => normalizeContributionProposal(proposal({ rights: false })), /autoria ou permissÃ£o|autoria ou permissão/);
  assert.throws(() => normalizeContributionProposal(proposal({ privacy: false })), /finalidade de uso/);
  assert.throws(() => buildContributionMailto(proposal(), 'destino@example.org?bcc=intruso@example.org'), /endereÃ§o vÃ¡lido|endereço válido/);

  const oversized = proposal({
    summary: 'á'.repeat(1200),
    sources: 'á'.repeat(800),
  });
  assert.throws(
    () => buildContributionMailto(oversized, SITE_CONFIG.contactEmail),
    (error) => error instanceof RangeError && error.message.includes('extensa demais'),
  );
  assert.ok(CONTRIBUTION_MAILTO_MAX_LENGTH <= 7000);
});

test('interface separa proposta privada da projeção pública canônica', async () => {
  const [html, controller, proposalModule, draftModule] = await Promise.all([
    readFile(resolve(root, 'Contribuicoes', 'contribuicoes.html'), 'utf8'),
    readFile(resolve(root, 'Contribuicoes', 'contribuicoes.js'), 'utf8'),
    readFile(resolve(root, 'assets', 'js', 'contribution-proposal.js'), 'utf8'),
    readFile(resolve(root, 'assets', 'js', 'contribution-draft.js'), 'utf8'),
  ]);

  assert.match(controller, /EXTERNAL_CONTRIBUTIONS as CONTRIBUTIONS/);
  assert.match(controller, /createPublicationView/);
  assert.match(controller, /publicationHref/);
  assert.match(controller, /Nenhuma contribuição externa publicada ainda\./);
  assert.match(controller, /Proveniência editorial/);
  assert.match(controller, /Créditos publicados/);
  assert.match(html, /name="credit"[^>]+required/i);
  assert.match(html, /name="rights"[^>]+required/i);
  assert.match(html, /name="privacy"[^>]+required/i);
  assert.match(html, /data-contribution-preview/);
  assert.match(html, /data-contribution-save-draft/);
  assert.match(html, /data-contribution-status[^>]*aria-atomic="true"|aria-atomic="true"[^>]*data-contribution-status/);
  assert.doesNotMatch(`${controller}\n${proposalModule}`, /\b(?:fetch|localStorage|sessionStorage)\b/);
  assert.match(draftModule, /localStorage|storage/);
  assert.match(proposalModule, /encodeURIComponent\(serialized\.subject\)/);
  assert.match(proposalModule, /encodeURIComponent\(serialized\.body\)/);
});
