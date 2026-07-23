export const CONTRIBUTION_TYPES = Object.freeze([
  Object.freeze({ id: 'ensaio', label: 'Ensaio', description: 'Argumento autoral com escopo, fontes e distinção clara entre fato, interpretação e proposta.' }),
  Object.freeze({ id: 'nota-tecnica', label: 'Nota técnica', description: 'Explicação reproduzível de método, modelo, cálculo, código ou conjunto de dados.' }),
  Object.freeze({ id: 'visualizacao', label: 'Visualização', description: 'Representação visual acompanhada de origem dos dados, limites e licença de uso.' }),
  Object.freeze({ id: 'revisao-objecao', label: 'Revisão ou objeção', description: 'Crítica rastreável a uma ideia publicada, com justificativa e referências verificáveis.' }),
  Object.freeze({ id: 'linha-convidada', label: 'Linha de investigação convidada', description: 'Hipótese ou estrutura conceitual de outra autoria, publicada em área própria e sem confusão de titularidade.' }),
]);

export const CONTRIBUTION_STATUSES = Object.freeze([
  Object.freeze({ id: 'published', label: 'Publicada' }),
  Object.freeze({ id: 'updated', label: 'Atualizada' }),
]);

export const CONTRIBUTION_ROLES = Object.freeze([
  Object.freeze({ id: 'author', label: 'Autoria' }),
  Object.freeze({ id: 'coauthor', label: 'Coautoria' }),
  Object.freeze({ id: 'editor', label: 'Edição' }),
  Object.freeze({ id: 'reviewer', label: 'Revisão' }),
  Object.freeze({ id: 'translator', label: 'Tradução' }),
  Object.freeze({ id: 'research', label: 'Pesquisa e dados' }),
  Object.freeze({ id: 'visualization', label: 'Visualização' }),
]);

export const CONTRIBUTION_LINK_TYPES = Object.freeze([
  Object.freeze({ id: 'content', label: 'Conteúdo completo' }),
  Object.freeze({ id: 'profile', label: 'Perfil público' }),
  Object.freeze({ id: 'code', label: 'Código ou repositório' }),
  Object.freeze({ id: 'data', label: 'Dados' }),
  Object.freeze({ id: 'supplement', label: 'Material complementar' }),
]);

export const CONTRIBUTION_SOURCE_TYPES = Object.freeze([
  Object.freeze({ id: 'article', label: 'Artigo' }),
  Object.freeze({ id: 'book', label: 'Livro' }),
  Object.freeze({ id: 'dataset', label: 'Conjunto de dados' }),
  Object.freeze({ id: 'repository', label: 'Repositório' }),
  Object.freeze({ id: 'institutional', label: 'Fonte institucional' }),
  Object.freeze({ id: 'primary-work', label: 'Obra original' }),
]);

export const CONTRIBUTION_POLICY = Object.freeze({
  review: 'Toda proposta passa por leitura editorial, checagem de autoria, fontes, permissões e adequação ao escopo antes de qualquer publicação.',
  credit: 'Uma contribuição publicada preserva o nome de crédito escolhido pelo autor, a natureza da participação e os links autorizados.',
  independence: 'Publicar uma contribuição não significa endosso científico do Observatório nem transferência de autoria para Matheus Camargo.',
  rights: 'O envio deve ser original ou acompanhado de permissões compatíveis para texto, dados, imagens e código.',
  revisions: 'Correções e versões posteriores permanecem identificáveis por data, responsáveis e nota de revisão.',
});

const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VERSION_PATTERN = /^\d+\.\d+(?:\.\d+)?$/;
const typeById = new Map(CONTRIBUTION_TYPES.map((item) => [item.id, item]));
const statusById = new Map(CONTRIBUTION_STATUSES.map((item) => [item.id, item]));
const roleById = new Map(CONTRIBUTION_ROLES.map((item) => [item.id, item]));
const linkTypeById = new Map(CONTRIBUTION_LINK_TYPES.map((item) => [item.id, item]));
const sourceTypeById = new Map(CONTRIBUTION_SOURCE_TYPES.map((item) => [item.id, item]));

function fail(context, message) {
  throw new TypeError(`${context}: ${message}`);
}

function assertObject(value, context) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(context, 'objeto obrigatório ausente ou inválido');
}

function assertString(value, context, { min = 1, max = Infinity } = {}) {
  if (typeof value !== 'string') fail(context, 'texto obrigatório ausente ou inválido');
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    fail(context, `texto deve ter entre ${min} e ${Number.isFinite(max) ? max : '∞'} caracteres`);
  }
  return normalized;
}

function assertIdentifier(value, context) {
  const identifier = assertString(value, context, { min: 2, max: 80 });
  if (!IDENTIFIER_PATTERN.test(identifier)) fail(context, 'use apenas letras minúsculas, números e hífens');
  return identifier;
}

function assertArray(value, context, { min = 0 } = {}) {
  if (!Array.isArray(value) || value.length < min) fail(context, `lista obrigatória com pelo menos ${min} item(ns)`);
}

function assertUnique(values, context) {
  if (new Set(values).size !== values.length) fail(context, 'valores duplicados');
}

function assertIsoDate(value, context) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(context, 'data deve usar AAAA-MM-DD');
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) fail(context, 'data inexistente');
}

function assertHttpsUrl(value, context, { optional = false } = {}) {
  if (optional && value === '') return;
  const urlText = assertString(value, context, { min: 8, max: 2048 });
  try {
    const url = new URL(urlText);
    if (url.protocol !== 'https:' || url.username || url.password) fail(context, 'URL deve usar HTTPS e não pode conter credenciais');
  } catch (error) {
    if (error instanceof TypeError && error.message.startsWith(`${context}:`)) throw error;
    fail(context, 'URL HTTPS inválida');
  }
}

function validateDefinitions(label, entries) {
  assertArray(entries, label, { min: 1 });
  entries.forEach((entry, index) => {
    assertObject(entry, `${label}[${index}]`);
    assertIdentifier(entry.id, `${label}[${index}].id`);
    assertString(entry.label, `${label}[${index}].label`, { min: 2, max: 80 });
  });
  assertUnique(entries.map((entry) => entry.id), `${label}.id`);
  assertUnique(entries.map((entry) => entry.label), `${label}.label`);
}

function validateAuthorizedLink(link, context) {
  assertObject(link, context);
  if (!linkTypeById.has(link.type)) fail(`${context}.type`, 'tipo de link desconhecido');
  assertString(link.label, `${context}.label`, { min: 2, max: 120 });
  assertHttpsUrl(link.url, `${context}.url`);
  if (link.authorized !== true) fail(`${context}.authorized`, 'o responsável precisa autorizar explicitamente a publicação do link');
}

function validateContributor(contributor, context) {
  assertObject(contributor, context);
  assertIdentifier(contributor.id, `${context}.id`);
  assertString(contributor.creditName, `${context}.creditName`, { min: 2, max: 120 });
  if (!roleById.has(contributor.role)) fail(`${context}.role`, 'papel editorial desconhecido');
  assertString(contributor.contribution, `${context}.contribution`, { min: 8, max: 300 });
  assertArray(contributor.links, `${context}.links`);
  contributor.links.forEach((link, index) => validateAuthorizedLink(link, `${context}.links[${index}]`));
  assertUnique(contributor.links.map((link) => link.url), `${context}.links.url`);
}

function validateSource(source, context) {
  assertObject(source, context);
  assertIdentifier(source.id, `${context}.id`);
  if (!sourceTypeById.has(source.type)) fail(`${context}.type`, 'tipo de fonte desconhecido');
  assertString(source.title, `${context}.title`, { min: 3, max: 300 });
  assertString(source.authors, `${context}.authors`, { min: 2, max: 240 });
  if (!Number.isInteger(source.year) || source.year < 1000 || source.year > new Date().getUTCFullYear() + 1) {
    fail(`${context}.year`, 'ano inválido');
  }
  assertHttpsUrl(source.url, `${context}.url`);
}

function validateLicense(license, context) {
  assertObject(license, context);
  const identifier = assertString(license.identifier, `${context}.identifier`, { min: 2, max: 80 });
  if (!/^[A-Za-z0-9][A-Za-z0-9.+-]*$/.test(identifier)) fail(`${context}.identifier`, 'identificação de licença inválida');
  assertString(license.label, `${context}.label`, { min: 3, max: 160 });
  if (typeof license.url !== 'string') fail(`${context}.url`, 'campo URL obrigatório, ainda que vazio quando não houver página pública');
  assertHttpsUrl(license.url, `${context}.url`, { optional: true });
  if (/^(CC|MIT|Apache|GPL|BSD)/i.test(identifier) && !license.url) {
    fail(`${context}.url`, 'licenças padronizadas precisam apontar para sua página oficial');
  }
}

function validateProvenance(provenance, context) {
  assertObject(provenance, context);
  assertObject(provenance.origin, `${context}.origin`);
  assertString(provenance.origin.label, `${context}.origin.label`, { min: 4, max: 180 });
  if (typeof provenance.origin.url !== 'string') fail(`${context}.origin.url`, 'campo URL obrigatório, ainda que vazio');
  if (typeof provenance.origin.authorized !== 'boolean') fail(`${context}.origin.authorized`, 'autorização precisa ser booleana');
  assertHttpsUrl(provenance.origin.url, `${context}.origin.url`, { optional: true });
  if (provenance.origin.url && !provenance.origin.authorized) fail(`${context}.origin.authorized`, 'a URL de origem precisa de autorização explícita');
  assertIsoDate(provenance.receivedAt, `${context}.receivedAt`);
  assertIsoDate(provenance.publishedAt, `${context}.publishedAt`);
  if (provenance.receivedAt > provenance.publishedAt) fail(context, 'a publicação não pode anteceder o recebimento');
  assertString(provenance.permissionStatement, `${context}.permissionStatement`, { min: 20, max: 400 });
  assertString(provenance.editorialResponsibility, `${context}.editorialResponsibility`, { min: 10, max: 300 });
}

function validateRevision(revision, context, contributorIds) {
  assertObject(revision, context);
  const version = assertString(revision.version, `${context}.version`, { min: 3, max: 20 });
  if (!VERSION_PATTERN.test(version)) fail(`${context}.version`, 'versão deve seguir o formato numérico 1.0 ou 1.0.0');
  assertIsoDate(revision.reviewedAt, `${context}.reviewedAt`);
  assertString(revision.summary, `${context}.summary`, { min: 12, max: 500 });
  assertArray(revision.contributorIds, `${context}.contributorIds`, { min: 1 });
  revision.contributorIds.forEach((id, index) => {
    assertIdentifier(id, `${context}.contributorIds[${index}]`);
    if (!contributorIds.has(id)) fail(`${context}.contributorIds[${index}]`, 'responsável não existe em contributors');
  });
  assertUnique(revision.contributorIds, `${context}.contributorIds`);
}

export function validateContribution(contribution, context = 'contribution') {
  assertObject(contribution, context);
  assertIdentifier(contribution.id, `${context}.id`);
  assertIdentifier(contribution.slug, `${context}.slug`);
  if (!typeById.has(contribution.type)) fail(`${context}.type`, 'tipo de contribuição desconhecido');
  if (!statusById.has(contribution.status)) fail(`${context}.status`, 'status público desconhecido');
  assertString(contribution.title, `${context}.title`, { min: 4, max: 160 });
  assertString(contribution.summary, `${context}.summary`, { min: 80, max: 1200 });

  assertArray(contribution.contributors, `${context}.contributors`, { min: 1 });
  contribution.contributors.forEach((contributor, index) => validateContributor(contributor, `${context}.contributors[${index}]`));
  assertUnique(contribution.contributors.map((contributor) => contributor.id), `${context}.contributors.id`);
  const primaryAuthors = contribution.contributors.filter((contributor) => ['author', 'coauthor'].includes(contributor.role));
  if (!primaryAuthors.length) fail(`${context}.contributors`, 'ao menos uma pessoa precisa ter papel de autoria ou coautoria');

  assertArray(contribution.links, `${context}.links`);
  contribution.links.forEach((link, index) => validateAuthorizedLink(link, `${context}.links[${index}]`));
  assertUnique(contribution.links.map((link) => link.url), `${context}.links.url`);

  assertArray(contribution.sources, `${context}.sources`, { min: 1 });
  contribution.sources.forEach((source, index) => validateSource(source, `${context}.sources[${index}]`));
  assertUnique(contribution.sources.map((source) => source.id), `${context}.sources.id`);

  validateLicense(contribution.license, `${context}.license`);
  validateProvenance(contribution.provenance, `${context}.provenance`);

  const contributorIds = new Set(contribution.contributors.map((contributor) => contributor.id));
  assertArray(contribution.revisions, `${context}.revisions`, { min: 1 });
  contribution.revisions.forEach((revision, index) => validateRevision(revision, `${context}.revisions[${index}]`, contributorIds));
  assertUnique(contribution.revisions.map((revision) => revision.version), `${context}.revisions.version`);
  contribution.revisions.forEach((revision, index) => {
    if (index > 0 && contribution.revisions[index - 1].reviewedAt > revision.reviewedAt) {
      fail(`${context}.revisions`, 'histórico precisa estar em ordem cronológica');
    }
  });
  if (contribution.revisions[0].reviewedAt !== contribution.provenance.publishedAt) {
    fail(`${context}.revisions[0].reviewedAt`, 'a primeira revisão pública precisa coincidir com a data de publicação');
  }
  return true;
}

export function validateContributionCatalog(contributions) {
  if (!Array.isArray(contributions)) fail('CONTRIBUTIONS', 'catálogo precisa ser uma lista');
  contributions.forEach((contribution, index) => validateContribution(contribution, `CONTRIBUTIONS[${index}]`));
  assertUnique(contributions.map((contribution) => contribution.id), 'CONTRIBUTIONS.id');
  assertUnique(contributions.map((contribution) => contribution.slug), 'CONTRIBUTIONS.slug');
  return true;
}

function freezeLink(link) {
  return Object.freeze({ ...link, typeLabel: linkTypeById.get(link.type).label });
}

function freezeContributor(contributor) {
  return Object.freeze({
    ...contributor,
    roleLabel: roleById.get(contributor.role).label,
    links: Object.freeze(contributor.links.map(freezeLink)),
  });
}

export function createContribution(contribution) {
  validateContribution(contribution);
  const contributors = Object.freeze(contribution.contributors.map(freezeContributor));
  const contributorById = new Map(contributors.map((contributor) => [contributor.id, contributor]));
  const revisions = Object.freeze(contribution.revisions.map((revision) => Object.freeze({
    ...revision,
    contributorIds: Object.freeze([...revision.contributorIds]),
    responsibles: Object.freeze(revision.contributorIds.map((id) => contributorById.get(id))),
  })));
  return Object.freeze({
    ...contribution,
    typeLabel: typeById.get(contribution.type).label,
    statusLabel: statusById.get(contribution.status).label,
    contributors,
    authors: Object.freeze(contributors.filter((contributor) => ['author', 'coauthor'].includes(contributor.role))),
    links: Object.freeze(contribution.links.map(freezeLink)),
    sources: Object.freeze(contribution.sources.map((source) => Object.freeze({
      ...source,
      typeLabel: sourceTypeById.get(source.type).label,
    }))),
    license: Object.freeze({ ...contribution.license }),
    provenance: Object.freeze({
      ...contribution.provenance,
      origin: Object.freeze({ ...contribution.provenance.origin }),
    }),
    revisions,
    latestRevision: revisions.at(-1),
  });
}

validateDefinitions('CONTRIBUTION_TYPES', CONTRIBUTION_TYPES);
validateDefinitions('CONTRIBUTION_STATUSES', CONTRIBUTION_STATUSES);
validateDefinitions('CONTRIBUTION_ROLES', CONTRIBUTION_ROLES);
validateDefinitions('CONTRIBUTION_LINK_TYPES', CONTRIBUTION_LINK_TYPES);
validateDefinitions('CONTRIBUTION_SOURCE_TYPES', CONTRIBUTION_SOURCE_TYPES);
CONTRIBUTION_TYPES.forEach((type, index) => {
  assertString(type.description, `CONTRIBUTION_TYPES[${index}].description`, { min: 20, max: 240 });
});

const rawContributions = [];

validateContributionCatalog(rawContributions);

export const CONTRIBUTIONS = Object.freeze(rawContributions.map(createContribution));
