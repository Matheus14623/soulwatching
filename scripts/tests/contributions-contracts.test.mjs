import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CONTRIBUTIONS,
  CONTRIBUTION_LINK_TYPES,
  CONTRIBUTION_ROLES,
  CONTRIBUTION_SOURCE_TYPES,
  CONTRIBUTION_STATUSES,
  CONTRIBUTION_TYPES,
  createContribution,
  validateContributionCatalog,
} from '../../assets/data/contributions.js';
import {
  CONTRIBUTION_MAILTO_MAX_LENGTH,
  buildContributionMailto,
  normalizeContributionProposal,
} from '../../assets/js/contribution-proposal.js';
import { SITE_CONFIG } from '../../assets/js/config.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function fixture() {
  return {
    id: 'ensaio-convidado',
    slug: 'ensaio-convidado',
    type: 'ensaio',
    status: 'updated',
    title: 'Como testar uma hipótese observacional',
    summary: 'Este ensaio apresenta uma pergunta delimitada, distingue a proposta das evidências disponíveis e descreve quais observações poderiam contrariar a interpretação apresentada.',
    contributors: [
      {
        id: 'ana-silva',
        creditName: 'Ana Silva',
        role: 'author',
        contribution: 'Autoria do argumento, seleção das fontes e revisão final.',
        links: [
          {
            type: 'profile',
            label: 'Perfil público da autora',
            url: 'https://example.org/autores/ana-silva',
            authorized: true,
          },
        ],
      },
      {
        id: 'rui-costa',
        creditName: 'Rui Costa',
        role: 'reviewer',
        contribution: 'Revisão metodológica e conferência das referências.',
        links: [],
      },
    ],
    links: [
      {
        type: 'content',
        label: 'Ler a versão integral',
        url: 'https://example.org/ensaios/hipotese-observacional',
        authorized: true,
      },
    ],
    sources: [
      {
        id: 'fonte-principal',
        type: 'article',
        title: 'A reference about observational tests',
        authors: 'A. Example e B. Example',
        year: 2025,
        url: 'https://doi.org/10.0000/example',
      },
    ],
    license: {
      identifier: 'CC-BY-4.0',
      label: 'Creative Commons Atribuição 4.0 Internacional',
      url: 'https://creativecommons.org/licenses/by/4.0/',
    },
    provenance: {
      origin: {
        label: 'Envio direto da autora ao Observatório',
        url: '',
        authorized: true,
      },
      receivedAt: '2026-07-01',
      publishedAt: '2026-07-10',
      permissionStatement: 'A autora autorizou por escrito a publicação do texto e dos links indicados.',
      editorialResponsibility: 'O Observatório revisou clareza, atribuição, fontes e apresentação.',
    },
    revisions: [
      {
        version: '1.0',
        reviewedAt: '2026-07-10',
        summary: 'Primeira versão pública após revisão editorial e autorização.',
        contributorIds: ['ana-silva', 'rui-costa'],
      },
      {
        version: '1.1',
        reviewedAt: '2026-07-20',
        summary: 'Referência principal atualizada sem alterar a tese central.',
        contributorIds: ['ana-silva'],
      },
    ],
  };
}

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
    ...overrides,
  };
}

test('modelo de contribuições preserva estado vazio e deriva rótulos públicos em português', () => {
  assert.equal(CONTRIBUTIONS.length, 0);
  for (const definitions of [
    CONTRIBUTION_TYPES,
    CONTRIBUTION_STATUSES,
    CONTRIBUTION_ROLES,
    CONTRIBUTION_LINK_TYPES,
    CONTRIBUTION_SOURCE_TYPES,
  ]) {
    assert.ok(definitions.length > 0);
    assert.equal(new Set(definitions.map((item) => item.id)).size, definitions.length);
    assert.equal(new Set(definitions.map((item) => item.label)).size, definitions.length);
  }

  const contribution = createContribution(fixture());
  assert.equal(contribution.typeLabel, 'Ensaio');
  assert.equal(contribution.statusLabel, 'Atualizada');
  assert.equal(contribution.contributors[0].roleLabel, 'Autoria');
  assert.equal(contribution.links[0].typeLabel, 'Conteúdo completo');
  assert.equal(contribution.sources[0].typeLabel, 'Artigo');
  assert.deepEqual(contribution.authors.map((author) => author.creditName), ['Ana Silva']);
  assert.equal(contribution.license.identifier, 'CC-BY-4.0');
  assert.equal(contribution.license.url, 'https://creativecommons.org/licenses/by/4.0/');
  assert.equal(contribution.revisions.length, 2);
  assert.deepEqual(contribution.revisions[0].responsibles.map((person) => person.creditName), ['Ana Silva', 'Rui Costa']);
  assert.equal(contribution.latestRevision.version, '1.1');
  assert.ok(Object.isFrozen(contribution));
  assert.ok(Object.isFrozen(contribution.revisions));
  assert.equal(validateContributionCatalog([contribution]), true);
});

test('schema rejeita campos incompletos, relações inválidas, links sem autorização e histórico inconsistente', () => {
  const invalidCases = [
    (entry) => { delete entry.title; },
    (entry) => { entry.type = 'formato-inexistente'; },
    (entry) => { entry.status = 'draft'; },
    (entry) => { entry.contributors[0].role = 'papel-inexistente'; },
    (entry) => { entry.contributors.forEach((person) => { person.role = 'reviewer'; }); },
    (entry) => { entry.contributors[0].links[0].authorized = false; },
    (entry) => { entry.links[0].url = 'http://example.org/sem-https'; },
    (entry) => { entry.sources = []; },
    (entry) => { delete entry.license.identifier; },
    (entry) => { entry.license.url = ''; },
    (entry) => { entry.provenance.origin.url = 'https://example.org/origem'; entry.provenance.origin.authorized = false; },
    (entry) => { entry.provenance.receivedAt = '2026-07-30'; },
    (entry) => { entry.revisions[1].contributorIds = ['pessoa-inexistente']; },
    (entry) => { entry.revisions[1].reviewedAt = '2026-07-09'; },
    (entry) => { entry.revisions = []; },
  ];

  invalidCases.forEach((mutate, index) => {
    const entry = structuredClone(fixture());
    mutate(entry);
    assert.throws(() => createContribution(entry), TypeError, `caso inválido ${index + 1}`);
  });

  const duplicate = fixture();
  assert.throws(() => validateContributionCatalog([duplicate, structuredClone(duplicate)]), /duplicados/);
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
  assert.match(built.body, /autoria ou permissão/i);

  assert.throws(() => normalizeContributionProposal(proposal({ type: 'inexistente' })), /formato permitido/);
  assert.throws(() => normalizeContributionProposal(proposal({ rights: false })), /autoria ou permissão/);
  assert.throws(() => buildContributionMailto(proposal(), 'destino@example.org?bcc=intruso@example.org'), /endereço válido/);

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

test('interface mantém o estado vazio e prevê autoria, proveniência, licença e todo o histórico', async () => {
  const [html, controller, proposalModule] = await Promise.all([
    readFile(resolve(root, 'Contribuicoes', 'contribuicoes.html'), 'utf8'),
    readFile(resolve(root, 'Contribuicoes', 'contribuicoes.js'), 'utf8'),
    readFile(resolve(root, 'assets', 'js', 'contribution-proposal.js'), 'utf8'),
  ]);

  assert.match(controller, /Nenhuma contribuição externa publicada ainda\./);
  assert.match(controller, /contribution\.statusLabel/);
  assert.match(controller, /contributor\.roleLabel/);
  assert.match(controller, /contribution\.license\.identifier/);
  assert.match(controller, /Proveniência editorial/);
  assert.match(controller, /Histórico completo de revisões/);
  assert.match(controller, /contribution\.revisions\.forEach/);
  assert.doesNotMatch(controller, /revisions\.at\(-1\)/);
  assert.match(controller, /noopener noreferrer/);
  assert.match(html, /name="credit"[^>]+required/i);
  assert.match(html, /name="rights"[^>]+required/i);
  assert.match(html, /data-contribution-status[^>]*aria-atomic="true"|aria-atomic="true"[^>]*data-contribution-status/);
  assert.doesNotMatch(`${controller}\n${proposalModule}`, /\b(?:fetch|localStorage|sessionStorage)\b/);
  assert.match(proposalModule, /encodeURIComponent\(subject\)/);
  assert.match(proposalModule, /encodeURIComponent\(body\)/);
});
