import { CONTRIBUTION_TYPES } from '../data/contributions.js';

export const CONTRIBUTION_PROPOSAL_LIMITS = Object.freeze({
  name: Object.freeze({ min: 2, max: 120 }),
  email: Object.freeze({ min: 5, max: 254 }),
  credit: Object.freeze({ min: 2, max: 120 }),
  title: Object.freeze({ min: 4, max: 160 }),
  summary: Object.freeze({ min: 80, max: 1200 }),
  sources: Object.freeze({ min: 10, max: 800 }),
});

export const CONTRIBUTION_MAILTO_MAX_LENGTH = 7000;

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
  };

  for (const field of ['name', 'credit', 'title', 'summary', 'sources']) {
    requireLength(proposal[field], field);
  }
  return Object.freeze(proposal);
}

export function buildContributionMailto(input, contactEmail) {
  const proposal = normalizeContributionProposal(input);
  const recipient = normalizeEmail(contactEmail);
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
    'Declaração: confirmo autoria ou permissão de compartilhamento e reconheço que o envio não garante publicação.',
  ].join('\n');
  const mailto = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (mailto.length > CONTRIBUTION_MAILTO_MAX_LENGTH) {
    throw new RangeError('A proposta ficou extensa demais para ser preparada por link de e-mail.');
  }
  return Object.freeze({ mailto, proposal, subject, body });
}
