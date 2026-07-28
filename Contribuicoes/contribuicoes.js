import {
  EXTERNAL_CONTRIBUTIONS as CONTRIBUTIONS,
  PUBLICATION_TYPES as CONTRIBUTION_TYPES,
} from '../assets/data/generated/runtime/publications.js';
import { CONTRIBUTION_POLICY } from '../assets/js/contribution-policy.js';
import { SITE_CONFIG } from '../assets/js/config.js';
import {
  CONTRIBUTION_PROPOSAL_LIMITS,
  buildContributionMailto,
  buildContributionText,
} from '../assets/js/contribution-proposal.js';
import {
  clearContributionDraft,
  loadContributionDraft,
  saveContributionDraft,
} from '../assets/js/contribution-draft.js';
import { initNavigation } from '../assets/js/navigation.js';
import {
  createPublicationView,
  publicationHref,
} from '../assets/js/publication-model.js';
import { initPixSupport } from '../assets/js/pix-support.js';

const allowedTypeIds = new Set(CONTRIBUTION_TYPES.map((type) => type.id));
const dom = {};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
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

function createDefinition(label, value) {
  const wrapper = document.createElement('div');
  wrapper.append(createElement('dt', '', label), createElement('dd', '', value));
  return wrapper;
}

function createContributionEntry(source) {
  const contribution = createPublicationView(source);
  const article = createElement('article', 'contribution-entry');
  const titleId = `contribution-${contribution.slug}-title`;
  article.id = contribution.slug;
  article.setAttribute('aria-labelledby', titleId);

  const title = createElement('h3', '', contribution.title);
  title.id = titleId;
  const authorNames = contribution.authors.map((author) => author.displayName).join(', ');
  article.append(
    createElement('span', 'section-kicker', `${contribution.typeLabel} · ${contribution.availabilityLabel}`),
    title,
    createElement('p', 'contribution-entry-byline', `Autoria: ${authorNames}`),
    createElement('p', 'contribution-entry-summary', contribution.summary),
  );
  if (contribution.publicNotice) {
    const notice = createElement('aside', 'contribution-public-notice');
    notice.setAttribute('role', 'note');
    notice.append(
      createElement('h4', '', `Aviso editorial · ${contribution.availabilityLabel}`),
      createElement('p', '', contribution.publicNotice.reason),
    );
    article.append(notice);
  }

  const provenance = createElement('section', 'contribution-entry-section contribution-provenance');
  provenance.append(createElement('h4', '', 'Proveniência editorial'));
  const metadata = document.createElement('dl');
  metadata.append(
    createDefinition('Origem', contribution.originLabel),
    createDefinition(
      'Revisão atual',
      contribution.latestRevision
        ? `Versão ${contribution.latestRevision.ordinal} · ${contribution.latestRevision.publishedAt}`
        : 'não informada',
    ),
    createDefinition('Licença', contribution.textLicense.label),
    createDefinition('Revisão editorial', contribution.publicDeclarations.editorialReview.description),
  );
  provenance.append(metadata);

  const credits = createElement('section', 'contribution-entry-section');
  credits.append(createElement('h4', '', 'Créditos publicados'));
  const creditList = createElement('ul', 'contribution-contributor-list');
  contribution.credits.forEach((credit) => {
    const item = createElement('li', 'contribution-contributor');
    const heading = createElement('div', 'contribution-contributor-heading');
    heading.append(
      createElement('strong', '', credit.displayName),
      createElement('span', '', credit.roleLabels.join(' · ')),
    );
    item.append(heading);
    creditList.append(item);
  });
  credits.append(creditList);

  const link = createElement('a', 'button button-secondary', 'Ler publicação completa');
  link.href = publicationHref(contribution.slug, { nested: true });
  article.append(credits, provenance, link);
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
    privacy: data.has('privacy'),
  };
}

function currentProposal() {
  return proposalFromForm(new FormData(dom.form));
}

function setStatus(message, { error = false } = {}) {
  dom.status.classList.toggle('is-error', error);
  dom.status.textContent = message;
}

function hidePreview() {
  dom.preview.hidden = true;
  dom.preview.removeAttribute('data-ready');
}

function showPreview({ moveFocus = true } = {}) {
  if (!validateForm()) {
    setStatus('Revise os campos indicados antes de preparar a prévia.', { error: true });
    return null;
  }
  try {
    const serialized = buildContributionText(currentProposal());
    dom.previewTitle.textContent = serialized.subject;
    dom.previewBody.textContent = serialized.body;
    dom.preview.hidden = false;
    dom.preview.dataset.ready = 'true';
    if (moveFocus) {
      dom.preview.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
      dom.previewHeading.focus({ preventScroll: true });
    }
    setStatus('Prévia pronta. Confira o texto antes de copiar, baixar ou abrir o e-mail.');
    return serialized;
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : 'Não foi possível preparar a prévia.',
      { error: true },
    );
    return null;
  }
}

function formDraft() {
  const data = new FormData(dom.form);
  return {
    name: data.get('name'),
    email: data.get('email'),
    credit: data.get('credit'),
    type: data.get('type'),
    title: data.get('title'),
    summary: data.get('summary'),
    sources: data.get('sources'),
  };
}

function restoreDraft(draft) {
  Object.entries(draft.fields).forEach(([name, value]) => {
    const field = dom.form.elements.namedItem(name);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
    if (field instanceof HTMLInputElement && field.type === 'checkbox') field.checked = value === true;
    else field.value = String(value ?? '');
    syncCustomValidity(field);
    clearFieldError(field);
  });
  for (const name of ['rights', 'privacy']) {
    const consent = dom.form.elements.namedItem(name);
    if (consent instanceof HTMLInputElement) {
      consent.checked = false;
      clearFieldError(consent);
    }
  }
  hidePreview();
}

async function copyPreview() {
  const serialized = showPreview({ moveFocus: false });
  if (!serialized) return;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard-unavailable');
    await navigator.clipboard.writeText(serialized.body);
    setStatus('Proposta copiada. Você pode colá-la no canal que preferir.');
  } catch {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(dom.previewBody);
    selection?.addRange(range);
    dom.previewBody.focus({ preventScroll: true });
    setStatus('A cópia automática não está disponível. O texto foi selecionado; use Ctrl+C ou Command+C.');
  }
}

function downloadPreview() {
  const serialized = showPreview({ moveFocus: false });
  if (!serialized) return;
  const url = URL.createObjectURL(new Blob([serialized.body], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = serialized.fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  setStatus('Arquivo de texto preparado no seu dispositivo.');
}

function openMailClient() {
  if (!validateForm()) {
    setStatus('Revise os campos indicados antes de abrir o e-mail.', { error: true });
    return;
  }
  try {
    const { mailto } = buildContributionMailto(currentProposal(), SITE_CONFIG.contactEmail);
    setStatus('Abrindo seu aplicativo de e-mail. Revise a mensagem antes de enviar.');
    window.location.href = mailto;
  } catch (error) {
    setStatus(
      error instanceof RangeError
        ? `${error.message} Use “Baixar .txt” e anexe ou cole o texto em uma mensagem para ${SITE_CONFIG.contactEmail}.`
        : 'Não foi possível preparar a proposta. Revise os campos e tente novamente.',
      { error: true },
    );
  }
}

function bindForm() {
  dom.form.addEventListener('input', (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
    syncCustomValidity(field);
    if (field.checkValidity()) clearFieldError(field);
    hidePreview();
  });

  dom.form.addEventListener('submit', (event) => {
    event.preventDefault();
    setStatus('');
    showPreview();
  });

  dom.saveDraft.addEventListener('click', () => {
    const result = saveContributionDraft(formDraft());
    setStatus(
      result.ok
        ? 'Rascunho salvo somente neste navegador. Ele não foi enviado ao Observatório.'
        : 'Este navegador não permitiu salvar o rascunho.',
      { error: !result.ok },
    );
  });

  dom.loadDraft.addEventListener('click', () => {
    const draft = loadContributionDraft();
    if (!draft) {
      setStatus('Nenhum rascunho local foi encontrado.');
      return;
    }
    restoreDraft(draft);
    setStatus('Rascunho local restaurado. Revise os campos antes de continuar.');
  });

  dom.clearDraft.addEventListener('click', () => {
    const cleared = clearContributionDraft();
    setStatus(
      cleared ? 'Rascunho local apagado.' : 'Não foi possível acessar o armazenamento local.',
      { error: !cleared },
    );
  });

  dom.copyPreview.addEventListener('click', copyPreview);
  dom.downloadPreview.addEventListener('click', downloadPreview);
  dom.openMail.addEventListener('click', openMailClient);
}

function boot() {
  initNavigation();
  initPixSupport();
  Object.assign(dom, {
    types: document.querySelector('[data-contribution-types]'),
    typeSelect: document.querySelector('[data-contribution-type-select]'),
    policy: document.querySelector('[data-contribution-policy]'),
    list: document.querySelector('[data-contribution-list]'),
    form: document.querySelector('[data-contribution-form]'),
    status: document.querySelector('[data-contribution-status]'),
    saveDraft: document.querySelector('[data-contribution-save-draft]'),
    loadDraft: document.querySelector('[data-contribution-load-draft]'),
    clearDraft: document.querySelector('[data-contribution-clear-draft]'),
    preview: document.querySelector('[data-contribution-preview]'),
    previewHeading: document.querySelector('[data-contribution-preview-heading]'),
    previewTitle: document.querySelector('[data-contribution-preview-title]'),
    previewBody: document.querySelector('[data-contribution-preview-body]'),
    copyPreview: document.querySelector('[data-contribution-copy]'),
    downloadPreview: document.querySelector('[data-contribution-download]'),
    openMail: document.querySelector('[data-contribution-open-mail]'),
  });
  if (Object.values(dom).some((element) => !element)) return;
  loadContributionDraft();
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
