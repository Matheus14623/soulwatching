import { PUBLICATION_TYPES as CONTRIBUTION_TYPES } from '../data/generated/runtime/publications.js';

export const CONTRIBUTION_PROPOSAL_LIMITS = Object.freeze({
  name: Object.freeze({ min: 2, max: 120 }),
  email: Object.freeze({ min: 5, max: 254 }),
  credit: Object.freeze({ min: 2, max: 120 }),
  title: Object.freeze({ min: 4, max: 160 }),
  summary: Object.freeze({ min: 80, max: 1200 }),
  sources: Object.freeze({ min: 10, max: 800 }),
});

export const CONTRIBUTION_MAILTO_MAX_LENGTH = 7000;
export const CONTRIBUTION_TEXT_MAX_LENGTH = 12000;

const typeById = new Map(CONTRIBUTION_TYPES.map((type) => [type.id, type]));
const EMAIL_PATTERN = /^[A-Z0-9.!$%&'*+\-/=_^`{|}~]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

function fail(field, message) {
  throw new TypeError(`${field}: ${message}`);
}

function normalizeSingleLine(value) {
  return String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMultiline(value) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

function requireLength(value, field) {
  const limits = CONTRIBUTION_PROPOSAL_LIMITS[field];
  if (value.length < limits.min || value.length > limits.max) {
    fail(field, `use entre ${limits.min} e ${limits.max} caracteres`);
  }
}

function normalizeEmail(value) {
  const email = normalizeSingleLine(value);
  requireLength(email, 'email');
  if (!EMAIL_PATTERN.test(email)) fail('email', 'informe um endereço válido');
  return email;
}

export function normalizeContributionProposal(input) {
  if (!input || typeof input !== 'object') throw new TypeError('Proposta inválida.');
  const type = normalizeSingleLine(input.type);
  if (!typeById.has(type)) fail('type', 'selecione um formato permitido');
  if (input.rights !== true) fail('rights', 'confirme autoria ou permissão de compartilhamento');
  if (input.privacy !== true) fail('privacy', 'confirme a finalidade de uso dos dados de contato');

  const proposal = {
    name: normalizeSingleLine(input.name),
    email: normalizeEmail(input.email),
    credit: normalizeSingleLine(input.credit),
    type,
    typeLabel: typeById.get(type).label,
    title: normalizeSingleLine(input.title),
    summary: normalizeMultiline(input.summary),
    sources: normalizeMultiline(input.sources),
    rights: true,
    privacy: true,
  };

  for (const field of ['name', 'credit', 'title', 'summary', 'sources']) {
    requireLength(proposal[field], field);
  }
  return Object.freeze(proposal);
}

function proposalFileName(title) {
  const slug = normalizeSingleLine(title)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return `proposta-observatorio-${slug || 'sem-titulo'}.txt`;
}

export function buildContributionText(input) {
  const proposal = normalizeContributionProposal(input);
  const subject = `Proposta para o Observatório: ${proposal.title}`;
  const body = [
    'PROPOSTA DE CONTRIBUIÇÃO EXTERNA',
    '',
    `Nome de contato: ${proposal.name}`,
    `E-mail: ${proposal.email}`,
    `Crédito público pretendido: ${proposal.credit}`,
    `Formato: ${proposal.typeLabel}`,
    `Título provisório: ${proposal.title}`,
    '',
    'RESUMO E ARGUMENTO CENTRAL',
    proposal.summary,
    '',
    'FONTES PRINCIPAIS',
    proposal.sources,
    '',
    'DECLARAÇÕES DESTA ETAPA',
    '- Confirmo autoria ou permissão para compartilhar a proposta para avaliação.',
    '- Entendo que texto, imagens, dados e código terão direitos verificados separadamente antes de qualquer publicação.',
    '- Autorizo o uso do nome de contato e do e-mail somente para avaliar e responder esta proposta.',
    '- Entendo que o envio não garante publicação e que crédito, licença e versão final exigem aprovação posterior.',
  ].join('\n');
  if (body.length > CONTRIBUTION_TEXT_MAX_LENGTH) {
    throw new RangeError('A proposta ultrapassou o limite do documento de texto.');
  }
  return Object.freeze({
    proposal,
    subject,
    body,
    fileName: proposalFileName(proposal.title),
  });
}

export function buildContributionMailto(input, contactEmail) {
  const serialized = buildContributionText(input);
  const recipient = normalizeEmail(contactEmail);
  const mailto = `mailto:${recipient}?subject=${encodeURIComponent(serialized.subject)}&body=${encodeURIComponent(serialized.body)}`;
  if (mailto.length > CONTRIBUTION_MAILTO_MAX_LENGTH) {
    throw new RangeError('A proposta ficou extensa demais para ser preparada por link de e-mail.');
  }
  return Object.freeze({ ...serialized, mailto });
}
