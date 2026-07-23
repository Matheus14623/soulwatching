import {
  CONTRIBUTIONS,
  CONTRIBUTION_POLICY,
  CONTRIBUTION_TYPES,
} from '../assets/data/contributions.js';
import { SITE_CONFIG } from '../assets/js/config.js';
import {
  CONTRIBUTION_PROPOSAL_LIMITS,
  buildContributionMailto,
} from '../assets/js/contribution-proposal.js';
import { initNavigation } from '../assets/js/navigation.js';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric',
});
const allowedTypeIds = new Set(CONTRIBUTION_TYPES.map((type) => type.id));
const dom = {};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createExternalLink(label, url, className = '') {
  const link = createElement('a', className, label);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${label} — abre em uma nova aba`);
  return link;
}

function createTime(date) {
  const time = document.createElement('time');
  time.dateTime = date;
  time.textContent = dateFormatter.format(new Date(`${date}T00:00:00Z`));
  return time;
}

function renderTypes() {
  dom.types.replaceChildren(...CONTRIBUTION_TYPES.map((type, index) => {
    const article = createElement('article', 'contribution-type-card');
    article.append(
      createElement('span', '', `FORMATO ${String(index + 1).padStart(2, '0')}`),
      createElement('h3', '', type.label),
      createElement('p', '', type.description),
    );
    return article;
  }));

  const placeholder = createElement('option', '', 'Selecione um formato');
  placeholder.value = '';
  dom.typeSelect.replaceChildren(placeholder, ...CONTRIBUTION_TYPES.map((type) => {
    const option = createElement('option', '', type.label);
    option.value = type.id;
    return option;
  }));
}

function renderPolicy() {
  dom.policy.replaceChildren(...Object.values(CONTRIBUTION_POLICY).map((item) => createElement('li', '', item)));
}

function createLinkList(links, label) {
  if (!links.length) return null;
  const nav = createElement('nav', 'contribution-link-list');
  nav.setAttribute('aria-label', label);
  links.forEach((link) => nav.append(createExternalLink(`${link.typeLabel}: ${link.label}`, link.url)));
  return nav;
}

function createContributorItem(contributor) {
  const item = createElement('li', 'contribution-contributor');
  const header = createElement('div', 'contribution-contributor-heading');
  header.append(
    createElement('strong', '', contributor.creditName),
    createElement('span', '', contributor.roleLabel),
  );
  item.append(header, createElement('p', '', contributor.contribution));
  const links = createLinkList(contributor.links, `Links públicos autorizados de ${contributor.creditName}`);
  if (links) item.append(links);
  return item;
}

function createContributorsSection(contribution) {
  const section = createElement('section', 'contribution-entry-section');
  section.append(createElement('h4', '', 'Autoria e papéis'));
  const list = createElement('ul', 'contribution-contributor-list');
  list.append(...contribution.contributors.map(createContributorItem));
  section.append(list);
  return section;
}

function createDefinition(label, value) {
  const wrapper = document.createElement('div');
  wrapper.append(createElement('dt', '', label));
  const description = document.createElement('dd');
  if (value instanceof Node) description.append(value);
  else description.textContent = value;
  wrapper.append(description);
  return wrapper;
}

function createProvenanceSection(contribution) {
  const { provenance } = contribution;
  const section = createElement('section', 'contribution-entry-section contribution-provenance');
  section.append(createElement('h4', '', 'Proveniência editorial'));
  const origin = provenance.origin.url
    ? createExternalLink(provenance.origin.label, provenance.origin.url)
    : provenance.origin.label;
  const list = document.createElement('dl');
  list.append(
    createDefinition('Origem', origin),
    createDefinition('Recebida em', createTime(provenance.receivedAt)),
    createDefinition('Publicada em', createTime(provenance.publishedAt)),
    createDefinition('Permissão', provenance.permissionStatement),
    createDefinition('Responsabilidade editorial', provenance.editorialResponsibility),
  );
  section.append(list);
  return section;
}

function createSourcesSection(contribution) {
  const section = createElement('section', 'contribution-entry-section contribution-entry-sources');
  section.append(createElement('h4', '', 'Fontes e materiais citados'));
  const list = document.createElement('ol');
  contribution.sources.forEach((source) => {
    const item = document.createElement('li');
    item.append(
      createExternalLink(source.title, source.url),
      createElement('span', '', `${source.authors} · ${source.year} · ${source.typeLabel}`),
    );
    list.append(item);
  });
  section.append(list);
  return section;
}

function createLicenseSection(contribution) {
  const section = createElement('section', 'contribution-entry-section contribution-entry-license');
  section.append(createElement('h4', '', 'Licença de publicação'));
  const line = document.createElement('p');
  line.append(createElement('strong', '', contribution.license.identifier), document.createTextNode(' · '));
  if (contribution.license.url) {
    line.append(createExternalLink(contribution.license.label, contribution.license.url));
  } else {
    line.append(document.createTextNode(contribution.license.label));
  }
  section.append(line);
  return section;
}

function createRevisionsSection(contribution) {
  const section = createElement('section', 'contribution-entry-section contribution-revisions');
  section.append(createElement('h4', '', 'Histórico completo de revisões'));
  const list = document.createElement('ol');
  contribution.revisions.forEach((revision) => {
    const item = document.createElement('li');
    const header = createElement('div', 'contribution-revision-heading');
    header.append(createElement('strong', '', `Versão ${revision.version}`), createTime(revision.reviewedAt));
    item.append(
      header,
      createElement('p', '', revision.summary),
      createElement('span', '', `Responsáveis: ${revision.responsibles.map((person) => person.creditName).join(', ')}`),
    );
    list.append(item);
  });
  section.append(list);
  return section;
}

function createContributionEntry(contribution) {
  const article = createElement('article', 'contribution-entry');
  const titleId = `contribution-${contribution.slug}-title`;
  article.id = contribution.slug;
  article.setAttribute('aria-labelledby', titleId);

  const title = createElement('h3', '', contribution.title);
  title.id = titleId;
  const authorNames = contribution.authors.map((author) => author.creditName).join(', ');
  article.append(
    createElement('span', 'section-kicker', `${contribution.typeLabel} · ${contribution.statusLabel}`),
    title,
    createElement('p', 'contribution-entry-byline', `Autoria: ${authorNames}`),
    createElement('p', 'contribution-entry-summary', contribution.summary),
  );

  const links = createLinkList(contribution.links, `Links autorizados da contribuição ${contribution.title}`);
  if (links) article.append(links);
  article.append(
    createContributorsSection(contribution),
    createProvenanceSection(contribution),
    createSourcesSection(contribution),
    createLicenseSection(contribution),
    createRevisionsSection(contribution),
  );
  return article;
}

function renderPublished() {
  if (!CONTRIBUTIONS.length) {
    const empty = createElement('div', 'contribution-empty');
    empty.append(
      createElement('span', '', 'ARQUIVO EM FORMAÇÃO'),
      createElement('h3', '', 'Nenhuma contribuição externa publicada ainda.'),
      createElement('p', '', 'A ausência de entradas evita criar autores ou endossos fictícios. A primeira publicação aparecerá aqui somente depois de autorização, revisão e definição explícita de crédito.'),
    );
    dom.list.replaceChildren(empty);
    return;
  }
  dom.list.replaceChildren(...CONTRIBUTIONS.map(createContributionEntry));
}

function syncCustomValidity(field) {
  field.setCustomValidity('');
  if (field.name === 'type' && field.value && !allowedTypeIds.has(field.value)) {
    field.setCustomValidity('Selecione um formato permitido.');
    return;
  }
  const limits = CONTRIBUTION_PROPOSAL_LIMITS[field.name];
  if (!limits || field.type === 'email') return;
  const length = field.value.trim().length;
  if (length < limits.min) field.setCustomValidity(`Use pelo menos ${limits.min} caracteres úteis.`);
  else if (length > limits.max) field.setCustomValidity(`Use no máximo ${limits.max} caracteres.`);
}

function fieldMessage(field) {
  if (field.validity.customError) return field.validationMessage;
  if (field.validity.valueMissing) return 'Preencha este campo para continuar.';
  if (field.validity.typeMismatch) return 'Informe um e-mail em formato válido.';
  if (field.validity.tooShort) return `Escreva pelo menos ${field.minLength} caracteres.`;
  if (field.validity.tooLong) return `Use no máximo ${field.maxLength} caracteres.`;
  return 'Revise o valor informado.';
}

function clearFieldError(field) {
  field.removeAttribute('aria-invalid');
  const error = dom.form.querySelector(`[data-error-for="${field.name}"]`);
  if (error) error.textContent = '';
}

function showFieldError(field) {
  field.setAttribute('aria-invalid', 'true');
  const error = dom.form.querySelector(`[data-error-for="${field.name}"]`);
  if (error) error.textContent = fieldMessage(field);
}

function formFields() {
  return Array.from(dom.form.elements).filter((field) => (
    field instanceof HTMLInputElement
    || field instanceof HTMLSelectElement
    || field instanceof HTMLTextAreaElement
  ));
}

function validateForm() {
  const fields = formFields();
  fields.forEach((field) => {
    syncCustomValidity(field);
    clearFieldError(field);
  });
  const invalid = fields.filter((field) => !field.checkValidity());
  invalid.forEach(showFieldError);
  invalid[0]?.focus();
  return invalid.length === 0;
}

function proposalFromForm(data) {
  return {
    name: data.get('name'),
    email: data.get('email'),
    credit: data.get('credit'),
    type: data.get('type'),
    title: data.get('title'),
    summary: data.get('summary'),
    sources: data.get('sources'),
    rights: data.has('rights'),
  };
}

function bindForm() {
  dom.form.addEventListener('input', (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
    syncCustomValidity(field);
    if (field.checkValidity()) clearFieldError(field);
  });

  dom.form.addEventListener('submit', (event) => {
    event.preventDefault();
    dom.status.classList.remove('is-error');
    dom.status.textContent = '';
    if (!validateForm()) {
      dom.status.classList.add('is-error');
      dom.status.textContent = 'Revise os campos indicados antes de preparar o e-mail.';
      return;
    }
    try {
      const data = new FormData(dom.form);
      const { mailto } = buildContributionMailto(proposalFromForm(data), SITE_CONFIG.contactEmail);
      dom.status.textContent = 'Abrindo seu aplicativo de e-mail. Revise a mensagem antes de enviar.';
      window.location.href = mailto;
    } catch (error) {
      dom.status.classList.add('is-error');
      dom.status.textContent = error instanceof RangeError
        ? `${error.message} Resuma os campos ou envie diretamente para ${SITE_CONFIG.contactEmail}.`
        : 'Não foi possível preparar a proposta. Revise os campos e tente novamente.';
    }
  });
}

function boot() {
  initNavigation();
  Object.assign(dom, {
    types: document.querySelector('[data-contribution-types]'),
    typeSelect: document.querySelector('[data-contribution-type-select]'),
    policy: document.querySelector('[data-contribution-policy]'),
    list: document.querySelector('[data-contribution-list]'),
    form: document.querySelector('[data-contribution-form]'),
    status: document.querySelector('[data-contribution-status]'),
  });
  if (Object.values(dom).some((element) => !element)) return;
  renderTypes();
  renderPolicy();
  renderPublished();
  bindForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
