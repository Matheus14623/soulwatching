import {
  EditorialApiError,
  editorialApi,
  setEditorialCsrfToken,
} from './api.js';
import { createWorkspaceContextGuard } from './workspace-context.js';
import {
  corruptedWorkspacePresentation,
  isCorruptedWorkspace,
} from './workspace-recovery.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const changeClassLabels = Object.freeze({
  editorial: 'Editorial',
  presentation: 'Apresentação',
  metadata: 'Metadados',
  semantic: 'Semântica',
  structural: 'Estrutural',
});

const recordStateLabels = Object.freeze({
  current: 'Vigente',
  reviewed: 'Revisada',
  pending: 'Pendente',
  deprecated: 'Descontinuada',
  'needs-review': 'Revisão necessária',
  reformulacao: 'Em reformulação',
});

const blockerLabels = Object.freeze({
  'stale-reviewed-relation': 'A relação foi revisada contra uma versão anterior e exige nova decisão.',
  'reviewed-relation-deferred': 'Adiar esta relação mantém a mudança bloqueada.',
  'declared-change-class-too-weak': 'A classe declarada é mais fraca do que a mudança detectada.',
  'explicit-relation-review-required': 'A relação precisa de uma revisão editorial explícita.',
});

const relationDecisionLabels = Object.freeze({
  confirm: 'confirmar vigência',
  defer: 'adiar decisão',
  deprecate: 'descontinuar relação',
  revise: 'revisar relação',
});

const fieldLabels = Object.freeze({
  aliases: 'Aliases',
  claimLinks: 'Afirmações e fontes específicas',
  concepts: 'Conceitos',
  decisionBoundary: 'Limites de decisão',
  filters: 'Filtros',
  nextSteps: 'Próximos passos',
  objections: 'Objeções',
  position: 'Posição no mapa',
  proposal: 'Proposta atual',
  questions: 'Perguntas',
  referenceIds: 'Referências',
  review: 'Revisão crítica',
  revisions: 'Histórico da revisão',
  reviewState: 'Estado de revisão',
  summary: 'Resumo',
});

const state = {
  activeView: 'catalog',
  canonicalRecord: null,
  catalog: [],
  changeClass: 'semantic',
  dirty: false,
  formRecord: null,
  impact: null,
  impactDigest: '',
  lastSavedRecord: null,
  overview: null,
  preview: null,
  previewPollToken: 0,
  publicIdentityAuthorization: false,
  parties: [],
  references: [],
  relationTypes: [],
  schema: null,
  session: null,
  workspace: null,
  workspaces: null,
};

const workspaceContextGuard = createWorkspaceContextGuard();

const dom = {
  applyConfirmationInput: $('[data-apply-confirmation-input]'),
  applyDialog: $('[data-apply-dialog]'),
  applyReviewed: $('[data-apply-reviewed]'),
  catalogFeedback: $('[data-catalog-feedback]'),
  catalogList: $('[data-catalog-list]'),
  catalogSearch: $('[data-catalog-search]'),
  form: $('[data-theory-form]'),
  formErrorList: $('[data-form-error-list]'),
  formErrorSummary: $('[data-form-error-summary]'),
  liveStatus: $('[data-live-status]'),
  main: $('[data-editorial-main]'),
  previewFrame: $('[data-preview-frame]'),
  previewPlaceholder: $('[data-preview-placeholder]'),
  previewStatus: $('[data-preview-status]'),
  serverState: $('[data-server-state]'),
  serverStateLabel: $('[data-server-state-label]'),
  sidebar: $('[data-sidebar]'),
  sidebarScrim: $('[data-sidebar-scrim]'),
  sidebarToggle: $('[data-sidebar-toggle]'),
  skipLink: $('[data-skip-link]'),
  workspaceList: $('[data-workspace-list]'),
};

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function setText(selector, value, root = document) {
  const element = $(selector, root);
  if (element) element.textContent = value ?? '—';
}

function setServerState(kind, label) {
  dom.serverState.classList.remove('is-online', 'is-error');
  if (kind) dom.serverState.classList.add(`is-${kind}`);
  dom.serverStateLabel.textContent = label;
}

function announce(message) {
  dom.liveStatus.textContent = '';
  requestAnimationFrame(() => {
    dom.liveStatus.textContent = message;
  });
}

function ensureToastStack() {
  let stack = $('[data-toast-stack]');
  if (stack) return stack;
  stack = document.createElement('div');
  stack.className = 'toast-stack';
  stack.dataset.toastStack = '';
  document.body.append(stack);
  return stack;
}

function showToast(message, type = 'info') {
  const stack = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = `editorial-toast is-${type}`;
  const text = document.createElement('p');
  text.textContent = message;
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Fechar';
  close.addEventListener('click', () => toast.remove());
  toast.append(text, close);
  stack.append(toast);
  window.setTimeout(() => toast.remove(), type === 'error' ? 9000 : 5500);
  announce(message);
}

function messageFromError(error) {
  if (error instanceof EditorialApiError) return error.message;
  return error?.message || 'A operação não pôde ser concluída.';
}

function detailsFromError(error) {
  if (!(error instanceof EditorialApiError)) return [];
  if (Array.isArray(error.details)) {
    return error.details.map((detail) => (
      typeof detail === 'string'
        ? detail
        : detail?.message || JSON.stringify(detail)
    ));
  }
  if (typeof error.details === 'string') return [error.details];
  return [];
}

function setButtonBusy(button, busy, busyLabel = 'Processando…') {
  if (!button) return;
  if (busy) {
    button.dataset.originalLabel = button.textContent.trim();
    button.dataset.originalDisabled = String(button.disabled);
    button.textContent = busyLabel;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    return;
  }
  if (button.dataset.originalLabel) button.textContent = button.dataset.originalLabel;
  if (button.dataset.originalDisabled !== undefined) {
    button.disabled = button.dataset.originalDisabled === 'true';
  }
  delete button.dataset.originalLabel;
  delete button.dataset.originalDisabled;
  button.removeAttribute('aria-busy');
}

async function withBusyButton(button, busyLabel, action) {
  setButtonBusy(button, true, busyLabel);
  try {
    return await action();
  } finally {
    setButtonBusy(button, false);
  }
}

function unwrapWorkspace(payload) {
  const nested = firstDefined(
    payload?.workspace,
    payload?.data?.workspace,
  );
  if (nested && typeof nested === 'object') return nested;
  if (
    payload
    && typeof payload === 'object'
    && (
      payload.id
      || payload.workspaceId
      || payload.primaryRecord
      || Array.isArray(payload.records)
    )
  ) {
    return payload;
  }
  return null;
}

function workspaceId() {
  return firstDefined(
    state.workspace?.workspaceId,
    state.workspace?.id,
  );
}

function workspaceVersion() {
  return firstDefined(
    state.workspace?.version,
    state.workspace?.workspaceVersion,
    1,
  );
}

function captureWorkspaceContext() {
  return workspaceContextGuard.capture(workspaceId());
}

function isWorkspaceContextCurrent(context) {
  return workspaceContextGuard.isCurrent(context, workspaceId());
}

function stopRemotePreview(workspaceIdValue) {
  if (!workspaceIdValue || !state.session) return;
  editorialApi.deletePreview(workspaceIdValue).catch(() => {});
}

function beginWorkspaceTransition({ stopPreview = true } = {}) {
  const previousWorkspaceId = workspaceId();
  const epoch = workspaceContextGuard.beginTransition();
  state.previewPollToken += 1;
  if (stopPreview) stopRemotePreview(previousWorkspaceId);
  return epoch;
}

function recordFromPayload(payload) {
  const explicitRecord = firstDefined(
    payload?.primaryRecord,
    payload?.record,
    payload?.draft?.record,
    payload?.operation?.record,
    payload?.content,
    payload?.entity,
  );
  if (explicitRecord) return explicitRecord;
  const primaryOperation = asArray(payload?.records).find(({ type, id }) => (
    type === firstDefined(payload?.entityType, 'theory')
    && id === payload?.entityId
  ));
  if (primaryOperation?.record) return primaryOperation.record;
  if (payload?.entityType && payload?.id) return payload;
  return null;
}

function canonicalRecordFromPayload(payload) {
  return firstDefined(
    payload?.canonicalRecord,
    payload?.publishedRecord,
    payload?.previous,
    payload?.canonical?.record,
  );
}

function catalogItemsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  return asArray(firstDefined(
    payload?.items,
    payload?.entries,
    payload?.theories,
    payload?.records,
  ));
}

function workspaceItemsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  return asArray(firstDefined(payload?.items, payload?.workspaces));
}

function draftWorkspaces() {
  return asArray(state.workspaces).filter(({ applied }) => !applied);
}

function primaryOperationFromWorkspace(workspace) {
  const operations = [
    ...asArray(workspace?.records),
    ...asArray(workspace?.operations),
  ];
  return operations.find(({ type, id }) => (
    type === workspace?.entityType
    && id === workspace?.entityId
  )) || operations.find(({ type }) => type === 'theory') || null;
}

function updateWorkspace(payload, fallbackRecord = null) {
  const next = unwrapWorkspace(payload);
  if (next) {
    const current = state.workspace || {};
    state.workspace = {
      ...current,
      ...next,
    };
  } else if (!state.workspace) {
    return;
  }
  const returnedVersion = payload?.workspaceVersion;
  if (Number.isInteger(returnedVersion)) {
    state.workspace.version = returnedVersion;
  }
  const record = recordFromPayload(next) || recordFromPayload(payload) || fallbackRecord;
  if (record) state.workspace.record = clone(record);
}

function latestRevision(record = state.formRecord) {
  const revisions = asArray(record?.revisions);
  return revisions[revisions.length - 1] || null;
}

function setAtPath(target, path, value) {
  const segments = path.split('.');
  let current = target;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      current[segment] = value;
      return;
    }
    if (!current[segment] || typeof current[segment] !== 'object') current[segment] = {};
    current = current[segment];
  });
}

function getAtPath(target, path) {
  return path.split('.').reduce((value, segment) => value?.[segment], target);
}

function schemaNodeAt(path) {
  if (!state.schema || !path) return null;
  let node = state.schema;
  for (const segment of path.split('.')) {
    if (!node) return null;
    node = segment === '*' ? node.items : node.properties?.[segment];
  }
  return node || null;
}

function schemaParentAt(path) {
  const segments = path.split('.');
  const property = segments.pop();
  const parent = segments.length ? schemaNodeAt(segments.join('.')) : state.schema;
  return { parent, property };
}

function schemaRequiresPath(path) {
  if (path.endsWith('.*')) return true;
  const { parent, property } = schemaParentAt(path);
  return asArray(parent?.required).includes(property);
}

function applySchemaConstraint(field) {
  const path = field.dataset.schemaPath;
  const schema = schemaNodeAt(path);
  if (!schema) return;
  field.required = schemaRequiresPath(path);
  if (Number.isInteger(schema.minLength)) field.minLength = schema.minLength;
  if (Number.isInteger(schema.maxLength)) field.maxLength = schema.maxLength;
  if (typeof schema.pattern === 'string') field.pattern = schema.pattern;
  if (typeof schema.minimum === 'number') field.min = String(schema.minimum);
  if (typeof schema.maximum === 'number') field.max = String(schema.maximum);
}

function applyAllSchemaConstraints(root = dom.form) {
  $$('[data-schema-path]', root).forEach(applySchemaConstraint);
}

function fieldErrorMessage(field) {
  if (field.validity.valid) return '';
  if (field.validity.valueMissing) return 'Este campo é obrigatório.';
  if (field.validity.tooShort) return `Use pelo menos ${field.minLength} caracteres.`;
  if (field.validity.patternMismatch) return 'O valor não segue o formato exigido.';
  if (field.validity.typeMismatch) return 'Informe um valor válido.';
  if (field.validity.customError) return field.validationMessage;
  return 'Revise este campo.';
}

function clearFieldErrors() {
  $$('[aria-invalid="true"]', dom.form).forEach((field) => {
    field.removeAttribute('aria-invalid');
  });
  $$('.form-field.has-error', dom.form).forEach((field) => field.classList.remove('has-error'));
  $$('[data-error-for]', dom.form).forEach((error) => {
    error.textContent = '';
  });
  dom.formErrorSummary.hidden = true;
  dom.formErrorList.replaceChildren();
}

function connectVisibleFieldError(field, message) {
  const key = firstDefined(
    field.dataset.field,
    field.dataset.revisionField ? `revisions.${field.dataset.revisionField}` : null,
  );
  if (!key) return;
  const error = $(`[data-error-for="${CSS.escape(key)}"]`, dom.form);
  if (error) error.textContent = message;
  field.closest('.form-field')?.classList.toggle('has-error', Boolean(message));
}

function validateTheoryForm() {
  clearFieldErrors();
  const revision = latestRevision();
  const responsibleName = $('[data-responsible-field="name"]', dom.form);
  const responsibleRole = $('[data-responsible-field="role"]', dom.form);
  const authorization = $('[data-public-identity-authorization]', dom.form);

  responsibleName.setCustomValidity('');
  responsibleRole.setCustomValidity('');
  authorization.setCustomValidity('');

  if (!revision || revision.revisionId !== state.formRecord?.revisionId) {
    showFormErrors([
      {
        field: null,
        message: 'O workspace não forneceu uma nova revisão válida. Recrie o workspace antes de editar.',
      },
    ]);
    return false;
  }

  if (!responsibleName.value.trim()) {
    responsibleName.setCustomValidity('Informe o nome público responsável pela revisão.');
  }
  if (!responsibleRole.value.trim()) {
    responsibleRole.setCustomValidity('Informe o papel público responsável pela revisão.');
  }
  if (!authorization.checked) {
    authorization.setCustomValidity('Confirme a autorização pública desta identidade.');
  }

  const invalidFields = $$('input, textarea, select', dom.form)
    .filter((field) => !field.validity.valid);
  const errors = invalidFields.map((field) => ({
    field,
    message: fieldErrorMessage(field),
  }));

  invalidFields.forEach((field) => {
    field.setAttribute('aria-invalid', 'true');
    connectVisibleFieldError(field, fieldErrorMessage(field));
  });

  if (errors.length) {
    showFormErrors(errors);
    return false;
  }

  return true;
}

function showFormErrors(errors) {
  dom.formErrorList.replaceChildren();
  errors.forEach(({ field, message }) => {
    const item = document.createElement('li');
    if (field) {
      if (!field.id) field.id = `editor-field-${crypto.randomUUID()}`;
      const link = document.createElement('a');
      link.href = `#${field.id}`;
      link.textContent = message;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        field.focus();
      });
      item.append(link);
    } else {
      item.textContent = message;
    }
    dom.formErrorList.append(item);
  });
  dom.formErrorSummary.hidden = false;
  dom.formErrorSummary.focus();
}

function showApiErrorsInForm(error) {
  const details = detailsFromError(error);
  showFormErrors(
    (details.length ? details : [messageFromError(error)])
      .map((message) => ({ field: null, message })),
  );
}

function setDirty(dirty) {
  if (
    dirty
    && !state.dirty
    && (state.impact || state.impactDigest || state.preview)
  ) {
    const previewWorkspaceId = workspaceId();
    const hadPreview = Boolean(state.preview);
    clearAnalysisState();
    if (hadPreview) stopRemotePreview(previewWorkspaceId);
  }
  state.dirty = dirty;
  const indicator = $('[data-unsaved-state]');
  if (!indicator) return;
  indicator.classList.toggle('is-dirty', dirty);
  indicator.replaceChildren();
  const symbol = document.createElement('span');
  symbol.setAttribute('aria-hidden', 'true');
  symbol.textContent = dirty ? '●' : '○';
  indicator.append(symbol, document.createTextNode(
    dirty ? ' Existem alterações não salvas.' : ' Nenhuma alteração não salva.',
  ));
}

function entityRecord(item) {
  return firstDefined(item?.record, item?.entity, item);
}

function renderOverview() {
  const overview = state.overview || {};
  const metrics = firstDefined(overview.metrics, overview.counts, overview) || {};
  const relationReviewReport = overview.report?.relationsNeedingReview;
  const values = {
    theories: firstDefined(metrics.theories, metrics.theoryCount, state.catalog.length, 0),
    relations: firstDefined(metrics.relations, metrics.relationCount, 0),
    needsReview: firstDefined(
      metrics.needsReview,
      metrics.relationsNeedingReview,
      metrics.staleRelations,
      Array.isArray(relationReviewReport) ? relationReviewReport.length : relationReviewReport,
      0,
    ),
    drafts: Array.isArray(state.workspaces)
      ? draftWorkspaces().length
      : firstDefined(metrics.drafts, metrics.workspaces, metrics.workspaceCount, 0),
  };
  Object.entries(values).forEach(([key, value]) => {
    setText(`[data-metric="${key}"]`, String(value));
  });
  setText(
    '[data-source-fingerprint]',
    firstDefined(overview.fingerprint, overview.contentFingerprint, '—'),
  );
  setText(
    '[data-last-validation]',
    firstDefined(overview.lastValidation, overview.validatedAt, 'Sessão atual'),
  );
}

function formatLocalTimestamp(value) {
  if (!value) return 'sem data registrada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function workspaceStateLabel(workspace) {
  if (isCorruptedWorkspace(workspace)) return 'Somente exclusão segura';
  if (workspace.lastImpact?.allowed === true) return 'Impacto aprovado';
  if (workspace.lastImpact?.allowed === false) return 'Com decisões pendentes';
  if (workspace.operations?.some(({ changeClass }) => Boolean(changeClass))) return 'Rascunho salvo';
  return 'Iniciado';
}

function renderWorkspaceList() {
  const drafts = draftWorkspaces();
  dom.workspaceList.replaceChildren();
  dom.workspaceList.setAttribute('aria-busy', 'false');
  setText(
    '[data-drafts-count]',
    `${drafts.length} ${drafts.length === 1 ? 'item local' : 'itens locais'}`,
  );

  if (!drafts.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhum rascunho local. Inicie uma revisão pelo catálogo abaixo.';
    dom.workspaceList.append(empty);
    return;
  }

  drafts.forEach((workspace) => {
    const recovery = corruptedWorkspacePresentation(workspace);
    const entity = state.catalog
      .map(entityRecord)
      .find(({ id }) => id === workspace.entityId);
    const article = document.createElement('article');
    article.className = 'draft-card';
    article.classList.toggle('is-corrupted', Boolean(recovery));
    article.dataset.workspaceId = workspace.id;

    const copy = document.createElement('div');
    copy.className = 'draft-card-copy';
    const eyebrow = document.createElement('span');
    eyebrow.className = 'draft-card-code';
    eyebrow.textContent = recovery?.eyebrow || entity?.code || workspace.entityId;
    const title = document.createElement('h3');
    title.textContent = recovery?.title || entity?.title || workspace.entityId;
    const meta = document.createElement('p');
    meta.textContent = recovery?.description
      || `${workspaceStateLabel(workspace)} · atualizado em ${formatLocalTimestamp(workspace.updatedAt)}`;
    copy.append(eyebrow, title, meta);

    const actions = document.createElement('div');
    actions.className = 'draft-card-actions';
    if (recovery?.canResume !== false) {
      const resume = document.createElement('button');
      resume.className = 'button button-secondary';
      resume.type = 'button';
      resume.dataset.resumeWorkspace = workspace.id;
      resume.textContent = 'Retomar';
      resume.setAttribute('aria-label', `Retomar rascunho de ${title.textContent}`);
      actions.append(resume);
    }
    const remove = document.createElement('button');
    remove.className = recovery
      ? 'button button-danger'
      : 'text-button danger-text-button';
    remove.type = 'button';
    remove.dataset.deleteWorkspace = workspace.id;
    remove.textContent = recovery?.deleteLabel || 'Excluir';
    remove.setAttribute(
      'aria-label',
      recovery?.deleteLabel || `Excluir rascunho de ${title.textContent}`,
    );
    actions.append(remove);
    article.append(copy, actions);
    dom.workspaceList.append(article);
  });
}

function suggestionLabel(item, type) {
  const id = firstDefined(item.id, item.partyId, item.referenceId);
  if (type === 'reference') {
    const year = item.year ? ` (${item.year})` : '';
    return `${id} — ${item.title || 'sem título'}${year}`;
  }
  return `${id} — ${item.displayName || item.name || item.title || 'sem nome público'}`;
}

function renderSuggestionLists() {
  const referenceList = $('[data-reference-options]');
  const partyList = $('[data-party-options]');
  referenceList.replaceChildren();
  partyList.replaceChildren();

  state.references.forEach((item) => {
    const id = firstDefined(item.id, item.referenceId);
    if (!id) return;
    const option = document.createElement('option');
    option.value = id;
    option.label = suggestionLabel(item, 'reference');
    referenceList.append(option);
  });
  state.parties.forEach((item) => {
    const id = firstDefined(item.id, item.partyId);
    if (!id) return;
    const option = document.createElement('option');
    option.value = id;
    option.label = suggestionLabel(item, 'party');
    partyList.append(option);
  });
}

function renderCatalog() {
  const query = normalizeText(dom.catalogSearch.value);
  const filtered = state.catalog
    .map(entityRecord)
    .filter(Boolean)
    .filter((record) => normalizeText([
      record.code,
      record.title,
      record.shortTitle,
      record.summary,
      ...asArray(record.concepts),
    ].join(' ')).includes(query));

  dom.catalogList.replaceChildren();
  dom.catalogList.setAttribute('aria-busy', 'false');
  dom.catalogFeedback.textContent = `${filtered.length} ${
    filtered.length === 1 ? 'teoria encontrada' : 'teorias encontradas'
  }.`;

  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhuma teoria corresponde à busca atual.';
    dom.catalogList.append(empty);
    return;
  }

  const template = $('#catalog-card-template');
  filtered.forEach((record) => {
    const fragment = template.content.cloneNode(true);
    const card = $('.catalog-card', fragment);
    card.dataset.entityId = record.id;
    setText('[data-catalog-field="code"]', record.code || 'Teoria', fragment);
    setText('[data-catalog-field="title"]', record.title, fragment);
    setText('[data-catalog-field="summary"]', record.summary, fragment);
    setText('[data-catalog-field="revisionId"]', record.revisionId, fragment);
    setText(
      '[data-catalog-field="reviewState"]',
      recordStateLabels[record.reviewState] || record.reviewState || '—',
      fragment,
    );
    const button = $('[data-create-workspace]', fragment);
    button.dataset.entityId = record.id;
    dom.catalogList.append(fragment);
  });
}

function renderIdentity() {
  ['code', 'id', 'slug', 'revisionId', 'title', 'subtitle'].forEach((key) => {
    setText(`[data-identity="${key}"]`, state.formRecord?.[key] || '—');
  });
  setText('[data-summary-entity]', `${state.formRecord?.code || ''} · ${state.formRecord?.title || '—'}`);
  setText('[data-summary-from-revision]', state.canonicalRecord?.revisionId || '—');
  setText('[data-summary-to-revision]', state.formRecord?.revisionId || '—');
  setText('[data-summary-change-class]', changeClassLabels[state.changeClass] || state.changeClass);
  setText('[data-workspace-title]', state.formRecord?.title || 'Editar teoria');
  setText(
    '[data-workspace-subtitle]',
    `${state.formRecord?.code || 'Teoria'} · de ${state.canonicalRecord?.revisionId || '—'} para ${state.formRecord?.revisionId || '—'}`,
  );
  setText('[data-workspace-status]', firstDefined(state.workspace?.statusLabel, state.workspace?.status, 'Rascunho privado'));
  setText('[data-workspace-id]', workspaceId() || '—');
}

function minimumItemsForList(name) {
  return Number(schemaNodeAt(name)?.minItems || 0);
}

function renderStringList(name, focusIndex = null) {
  const container = $(`[data-list-editor="${name}"]`);
  if (!container) return;
  const items = asArray(state.formRecord?.[name]);
  container.replaceChildren();

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhum item nesta lista.';
    container.append(empty);
    return;
  }

  const template = $('#string-list-item-template');
  const minItems = minimumItemsForList(name);
  items.forEach((value, index) => {
    const fragment = template.content.cloneNode(true);
    const item = $('.repeatable-item', fragment);
    item.dataset.listName = name;
    item.dataset.listIndex = String(index);
    const input = $('[data-list-item-input]', fragment);
    const id = `${name}-${index}`;
    input.id = id;
    input.value = value ?? '';
    input.dataset.schemaPath = `${name}.*`;
    input.rows = ['concepts', 'referenceIds'].includes(name) ? 1 : 2;
    if (name === 'referenceIds') {
      input.setAttribute('list', 'reference-options');
      input.placeholder = 'Digite ou escolha um ID da biblioteca';
      input.setAttribute('autocomplete', 'off');
    }
    const label = $('[data-list-item-label]', fragment);
    label.htmlFor = id;
    label.textContent = `${listLabel(name)} ${index + 1}`;
    applySchemaConstraint(input);
    const up = $('[data-list-action="up"]', fragment);
    const down = $('[data-list-action="down"]', fragment);
    const remove = $('[data-list-action="remove"]', fragment);
    up.disabled = index === 0;
    down.disabled = index === items.length - 1;
    remove.disabled = items.length <= minItems;
    container.append(fragment);
  });

  if (focusIndex !== null) {
    $(`.repeatable-item[data-list-index="${focusIndex}"] [data-list-item-input]`, container)
      ?.focus();
  }
}

function listLabel(name) {
  return {
    concepts: 'Conceito',
    nextSteps: 'Próximo passo',
    questions: 'Pergunta',
    referenceIds: 'Referência',
  }[name] || 'Item';
}

function renderObjections(focusIndex = null) {
  const container = $('[data-objections-editor]');
  const objections = asArray(state.formRecord?.objections);
  const canonicalIds = new Set(asArray(state.canonicalRecord?.objections).map(({ id }) => id));
  container.replaceChildren();

  if (!objections.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhuma objeção cadastrada.';
    container.append(empty);
    return;
  }

  const template = $('#objection-template');
  const minItems = Number(schemaNodeAt('objections')?.minItems || 0);
  objections.forEach((objection, index) => {
    const fragment = template.content.cloneNode(true);
    const card = $('.objection-editor-card', fragment);
    card.dataset.objectionIndex = String(index);
    setText('[data-objection-number]', `Objeção ${index + 1}`, fragment);

    $$('[data-objection-field]', fragment).forEach((field) => {
      const key = field.dataset.objectionField;
      field.id = `objection-${index}-${key}`;
      field.value = objection?.[key] ?? '';
      field.dataset.schemaPath = `objections.*.${key}`;
      const label = field.closest('label');
      if (label) label.htmlFor = field.id;
      if (key === 'id' && canonicalIds.has(objection?.id)) {
        field.readOnly = true;
        field.setAttribute('aria-describedby', `${field.id}-help`);
        const help = document.createElement('small');
        help.id = `${field.id}-help`;
        help.textContent = 'O identificador de uma objeção já publicada é preservado.';
        label?.append(help);
      }
      applySchemaConstraint(field);
    });

    const up = $('[data-objection-action="up"]', fragment);
    const down = $('[data-objection-action="down"]', fragment);
    const remove = $('[data-objection-action="remove"]', fragment);
    up.disabled = index === 0;
    down.disabled = index === objections.length - 1;
    remove.disabled = objections.length <= minItems;
    container.append(fragment);
  });

  if (focusIndex !== null) {
    $(`.objection-editor-card[data-objection-index="${focusIndex}"] [data-objection-field]`, container)
      ?.focus();
  }
}

function renderEditor() {
  if (!state.formRecord) return;
  renderIdentity();
  $$('[data-field]', dom.form).forEach((field) => {
    field.value = getAtPath(state.formRecord, field.dataset.field) ?? '';
  });

  const revision = latestRevision();
  $$('[data-revision-field]', dom.form).forEach((field) => {
    field.value = revision?.[field.dataset.revisionField] ?? '';
  });
  const responsible = asArray(revision?.responsibles)[0] || {};
  $$('[data-responsible-field]', dom.form).forEach((field) => {
    field.value = responsible[field.dataset.responsibleField] ?? '';
  });
  $('[data-public-identity-authorization]', dom.form).checked = state.publicIdentityAuthorization;
  const classInput = $(`input[name="change-class"][value="${state.changeClass}"]`, dom.form);
  if (classInput) classInput.checked = true;

  ['questions', 'concepts', 'nextSteps', 'referenceIds'].forEach((name) => renderStringList(name));
  renderObjections();
  applyAllSchemaConstraints();
  clearFieldErrors();
  setDirty(false);
  $('[data-run-validation]').disabled = false;
  $('[data-run-impact]').disabled = false;
}

function updateWorkflowStep(current) {
  const order = ['draft', 'impact', 'decisions', 'preview', 'apply'];
  const currentIndex = order.indexOf(current);
  $$('[data-workflow-step]').forEach((step) => {
    const index = order.indexOf(step.dataset.workflowStep);
    step.classList.toggle('is-current', index === currentIndex);
    step.classList.toggle('is-complete', index < currentIndex);
  });
}

function setNavigationAvailability({
  apply = false,
  editor = Boolean(state.workspace),
  impact = Boolean(state.impact),
  preview = Boolean(state.preview),
} = {}) {
  $$('[data-view-target]').forEach((button) => {
    const view = button.dataset.viewTarget;
    if (view === 'catalog') button.disabled = false;
    if (view === 'editor') button.disabled = !editor;
    if (view === 'impact') button.disabled = !impact;
    if (view === 'preview') button.disabled = !preview && !state.impact?.allowed;
    if (view === 'apply') button.disabled = !apply;
  });
}

function focusViewHeading(view) {
  const section = $(`[data-view="${view}"]`);
  const heading = $('h1', section);
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

function setView(view, { focus = true } = {}) {
  const targetButton = $(`[data-view-target="${view}"]`);
  if (targetButton?.disabled) return;
  state.activeView = view;
  $$('[data-view]').forEach((section) => {
    const active = section.dataset.view === view;
    section.hidden = !active;
    section.classList.toggle('is-active', active);
  });
  $$('[data-view-target]').forEach((button) => {
    const active = button.dataset.viewTarget === view;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (focus) focusViewHeading(view);
}

function updateSidebarInert() {
  const compact = window.matchMedia('(max-width: 960px)').matches;
  const open = document.body.classList.contains('is-sidebar-open');
  dom.sidebar.inert = compact && !open;
  dom.main.inert = compact && open;
  dom.skipLink.tabIndex = compact && open ? -1 : 0;
  dom.sidebarScrim.tabIndex = compact && open ? 0 : -1;
}

function openSidebar() {
  document.body.classList.add('is-sidebar-open');
  dom.sidebarToggle.setAttribute('aria-expanded', 'true');
  updateSidebarInert();
  $('.sidebar-link:not(:disabled)', dom.sidebar)?.focus();
}

function closeSidebar({ returnFocus = false } = {}) {
  const wasOpen = document.body.classList.contains('is-sidebar-open');
  document.body.classList.remove('is-sidebar-open');
  dom.sidebarToggle.setAttribute('aria-expanded', 'false');
  updateSidebarInert();
  if (returnFocus && wasOpen) dom.sidebarToggle.focus();
}

function resetApplyConfirmation() {
  dom.applyReviewed.checked = false;
  dom.applyConfirmationInput.value = '';
  $('[data-open-apply-dialog]').disabled = true;
}

function clearPreviewState() {
  state.preview = null;
  state.previewPollToken += 1;
  $('[data-continue-apply]').disabled = true;
  dom.previewFrame.hidden = true;
  dom.previewFrame.removeAttribute('src');
  dom.previewPlaceholder.hidden = false;
  const previewLink = $('[data-open-preview]');
  previewLink.removeAttribute('href');
  previewLink.tabIndex = -1;
  previewLink.classList.add('is-disabled');
  previewLink.setAttribute('aria-disabled', 'true');
  resetApplyConfirmation();
  setNavigationAvailability({
    editor: Boolean(state.workspace),
    impact: Boolean(state.impact),
    preview: false,
    apply: false,
  });
}

function clearAnalysisState() {
  state.impact = null;
  state.impactDigest = '';
  clearPreviewState();
  setNavigationAvailability({ editor: true });
  $('[data-continue-preview]').disabled = true;
}

function activateWorkspace(workspacePayload, contentPayload) {
  state.workspace = null;
  updateWorkspace(workspacePayload);
  const workspaceRecord = recordFromPayload(state.workspace)
    || recordFromPayload(workspacePayload);
  const canonicalRecord = canonicalRecordFromPayload(state.workspace)
    || canonicalRecordFromPayload(workspacePayload)
    || recordFromPayload(contentPayload);
  if (!workspaceRecord || !canonicalRecord) {
    throw new Error('O servidor não devolveu os registros necessários para abrir o workspace.');
  }
  const primaryOperation = primaryOperationFromWorkspace(state.workspace);
  state.canonicalRecord = clone(canonicalRecord);
  state.formRecord = clone(workspaceRecord);
  state.lastSavedRecord = clone(workspaceRecord);
  state.changeClass = firstDefined(
    primaryOperation?.changeClass,
    state.workspace?.changeClass,
    'semantic',
  );
  state.publicIdentityAuthorization = false;
  clearAnalysisState();
  renderEditor();
  setNavigationAvailability({ editor: true });
  setView('editor');
  updateWorkflowStep('draft');
}

async function refreshWorkspaceList({ reportError = true } = {}) {
  try {
    const payload = await editorialApi.workspaces();
    state.workspaces = workspaceItemsFromPayload(payload);
    renderWorkspaceList();
    renderOverview();
  } catch (error) {
    if (reportError) showToast(messageFromError(error), 'error');
    dom.workspaceList.setAttribute('aria-busy', 'false');
    const failure = document.createElement('p');
    failure.className = 'empty-state';
    failure.textContent = 'Não foi possível consultar os rascunhos locais.';
    dom.workspaceList.replaceChildren(failure);
  }
}

async function createWorkspace(entityId, button) {
  if (
    state.dirty
    && !window.confirm('Há alterações não salvas no workspace atual. Deseja descartá-las e iniciar outra revisão?')
  ) {
    return;
  }
  const transitionEpoch = beginWorkspaceTransition();
  let createdWorkspaceId = null;
  let activated = false;
  await withBusyButton(button, 'Criando workspace…', async () => {
    try {
      const workspacePayload = await editorialApi.createWorkspace('theory', entityId);
      createdWorkspaceId = unwrapWorkspace(workspacePayload)?.id || null;
      if (!workspaceContextGuard.isEpochCurrent(transitionEpoch)) {
        if (createdWorkspaceId) {
          editorialApi.deleteWorkspace(createdWorkspaceId).catch(() => {});
        }
        return;
      }
      const contentPayload = await editorialApi.content('theory', entityId);
      if (!workspaceContextGuard.isEpochCurrent(transitionEpoch)) {
        if (createdWorkspaceId) {
          editorialApi.deleteWorkspace(createdWorkspaceId).catch(() => {});
        }
        return;
      }
      activateWorkspace(workspacePayload, contentPayload);
      activated = true;
      await refreshWorkspaceList({ reportError: false });
      showToast('Workspace privado criado. A fonte pública permanece intacta.', 'success');
    } catch (error) {
      if (createdWorkspaceId && !activated) {
        editorialApi.deleteWorkspace(createdWorkspaceId).catch(() => {});
      }
      if (!workspaceContextGuard.isEpochCurrent(transitionEpoch)) return;
      showToast(messageFromError(error), 'error');
    }
  });
}

async function resumeWorkspace(workspaceStub, button) {
  if (
    state.dirty
    && !window.confirm('Há alterações não salvas no workspace atual. Deseja descartá-las e retomar outro rascunho?')
  ) {
    return;
  }
  const transitionEpoch = beginWorkspaceTransition();
  await withBusyButton(button, 'Abrindo…', async () => {
    try {
      const [workspacePayload, contentPayload] = await Promise.all([
        editorialApi.workspace(workspaceStub.id),
        editorialApi.content('theory', workspaceStub.entityId),
      ]);
      if (!workspaceContextGuard.isEpochCurrent(transitionEpoch)) return;
      activateWorkspace(workspacePayload, contentPayload);
      const canonicalRecord = recordFromPayload(contentPayload);
      const baseChanged = (
        workspacePayload?.baseRevisionId
        && canonicalRecord?.revisionId
        && workspacePayload.baseRevisionId !== canonicalRecord.revisionId
      );
      showToast(
        baseChanged
          ? 'Rascunho retomado. A fonte canônica mudou; salve e recalcule o impacto antes de continuar.'
          : 'Rascunho local retomado.',
        baseChanged ? 'warning' : 'success',
      );
    } catch (error) {
      if (!workspaceContextGuard.isEpochCurrent(transitionEpoch)) return;
      showToast(messageFromError(error), 'error');
      await refreshWorkspaceList({ reportError: false });
    }
  });
}

async function deleteWorkspace(workspaceStub, button) {
  const recovery = corruptedWorkspacePresentation(workspaceStub);
  const entity = state.catalog
    .map(entityRecord)
    .find(({ id }) => id === workspaceStub.entityId);
  const label = entity?.title || workspaceStub.entityId || workspaceStub.id;
  const confirmed = window.confirm(recovery
    ? 'Excluir definitivamente este workspace corrompido? '
      + 'Ele não poderá ser recuperado. A fonte pública não será alterada.'
    : `Excluir definitivamente o rascunho local de “${label}”? A fonte pública não será alterada.`);
  if (!confirmed) return;

  const deletingActiveWorkspace = workspaceId() === workspaceStub.id;
  const transitionEpoch = deletingActiveWorkspace
    ? beginWorkspaceTransition({ stopPreview: false })
    : null;
  await withBusyButton(button, 'Excluindo…', async () => {
    try {
      await editorialApi.deleteWorkspace(workspaceStub.id);
      if (
        deletingActiveWorkspace
        && workspaceContextGuard.isEpochCurrent(transitionEpoch)
        && workspaceId() === workspaceStub.id
      ) {
        state.workspace = null;
        state.formRecord = null;
        state.canonicalRecord = null;
        state.lastSavedRecord = null;
        state.dirty = false;
        clearAnalysisState();
        setNavigationAvailability();
      }
      await refreshWorkspaceList({ reportError: false });
      showToast(
        recovery
          ? 'Workspace corrompido excluído. A fonte pública permaneceu intacta.'
          : 'Rascunho local excluído. A fonte pública permaneceu intacta.',
        'success',
      );
    } catch (error) {
      if (
        deletingActiveWorkspace
        && !workspaceContextGuard.isEpochCurrent(transitionEpoch)
      ) return;
      showToast(messageFromError(error), 'error');
    }
  });
}

function synchronizeRevisionResponsible() {
  const revision = latestRevision();
  if (!revision) return;
  const name = $('[data-responsible-field="name"]', dom.form).value.trim();
  const role = $('[data-responsible-field="role"]', dom.form).value.trim();
  revision.responsibles = name || role ? [{ name, role }] : [];
}

async function saveDraft() {
  synchronizeRevisionResponsible();
  state.publicIdentityAuthorization = $('[data-public-identity-authorization]', dom.form).checked;
  if (!validateTheoryForm()) return;
  const button = $('[data-save-draft]');
  const context = captureWorkspaceContext();
  await withBusyButton(button, 'Salvando…', async () => {
    try {
      const payload = await editorialApi.saveWorkspaceRecord(context.workspaceId, {
        changeClass: state.changeClass,
        record: clone(state.formRecord),
        version: workspaceVersion(),
      });
      if (!isWorkspaceContextCurrent(context)) return;
      updateWorkspace(payload, state.formRecord);
      const savedRecord = recordFromPayload(state.workspace) || state.formRecord;
      state.formRecord = clone(savedRecord);
      state.lastSavedRecord = clone(savedRecord);
      clearAnalysisState();
      setDirty(false);
      renderIdentity();
      $('[data-run-validation]').disabled = false;
      $('[data-run-impact]').disabled = false;
      await refreshWorkspaceList({ reportError: false });
      showToast('Rascunho salvo no workspace privado.', 'success');
    } catch (error) {
      if (!isWorkspaceContextCurrent(context)) return;
      showApiErrorsInForm(error);
      showToast(messageFromError(error), 'error');
    }
  });
}

async function validateWorkspace(button) {
  if (state.dirty) {
    showToast('Salve o rascunho antes de validar.', 'error');
    return;
  }
  const context = captureWorkspaceContext();
  await withBusyButton(button, 'Validando…', async () => {
    try {
      const result = await editorialApi.validateWorkspace(context.workspaceId);
      if (!isWorkspaceContextCurrent(context)) return;
      updateWorkspace(result, state.formRecord);
      const valid = firstDefined(result?.valid, result?.validation?.valid, true);
      if (!valid) {
        const details = asArray(firstDefined(result?.errors, result?.validation?.errors));
        showFormErrors(details.map((message) => ({
          field: null,
          message: typeof message === 'string' ? message : message?.message || String(message),
        })));
        showToast('A validação encontrou campos que precisam de revisão.', 'error');
        setView('editor');
        return;
      }
      showToast('Rascunho válido contra os contratos atuais.', 'success');
    } catch (error) {
      if (!isWorkspaceContextCurrent(context)) return;
      showApiErrorsInForm(error);
      showToast(messageFromError(error), 'error');
      setView('editor');
    }
  });
}

function primaryTheoryChange(impact = state.impact) {
  return asArray(impact?.changes)
    .find(({ entity }) => entity?.type === 'theory' && entity.id === state.formRecord?.id)
    || asArray(impact?.changes)[0]
    || null;
}

function impactFromPayload(payload) {
  return firstDefined(payload?.impact, payload?.analysis?.impact, payload);
}

function impactDigestFromPayload(payload) {
  return firstDefined(
    payload?.impactDigest,
    payload?.digest,
    payload?.analysis?.digest,
    payload?.impact?.impactDigest,
    '',
  );
}

async function runImpact(button, { stayOnRelations = false } = {}) {
  if (state.dirty) {
    showToast('Salve o rascunho antes de calcular o impacto.', 'error');
    return;
  }
  const context = captureWorkspaceContext();
  await withBusyButton(button, 'Analisando…', async () => {
    try {
      const payload = await editorialApi.impactWorkspace(context.workspaceId);
      if (!isWorkspaceContextCurrent(context)) return;
      updateWorkspace(payload, state.formRecord);
      clearPreviewState();
      state.impact = impactFromPayload(payload);
      state.impactDigest = impactDigestFromPayload(payload);
      renderImpact();
      setNavigationAvailability({
        editor: true,
        impact: true,
        preview: false,
      });
      setView('impact');
      updateWorkflowStep(state.impact.allowed ? 'preview' : 'decisions');
      if (stayOnRelations) selectImpactTab('relations', { focus: false });
      showToast(
        state.impact.allowed
          ? 'Impacto calculado. O conjunto está liberado para preview.'
          : 'Impacto calculado. Existem decisões obrigatórias.',
        state.impact.allowed ? 'success' : 'warning',
      );
    } catch (error) {
      if (!isWorkspaceContextCurrent(context)) return;
      showToast(messageFromError(error), 'error');
    }
  });
}

function valueAtJsonPointer(record, pointer) {
  if (pointer === '') return record;
  return pointer
    .slice(1)
    .split('/')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce((value, segment) => value?.[segment], record);
}

function formatValue(value) {
  if (value === undefined) return 'Ausente';
  if (value === null) return 'Nulo';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) {
    if (!value.length) return 'Lista vazia';
    return value.map((item, index) => (
      typeof item === 'object'
        ? `${index + 1}. ${formatObject(item)}`
        : `${index + 1}. ${String(item)}`
    )).join('\n');
  }
  if (typeof value === 'object') return formatObject(value);
  return String(value);
}

function formatObject(value) {
  return Object.entries(value)
    .map(([key, item]) => {
      if (Array.isArray(item)) return `${key}: ${item.map(formatValue).join(', ')}`;
      if (item && typeof item === 'object') return `${key}: ${formatObject(item)}`;
      return `${key}: ${formatValue(item)}`;
    })
    .join(' · ');
}

function fieldLabelFromPointer(pointer) {
  const segments = pointer.slice(1).split('/');
  const root = segments[0] || 'registro';
  const base = fieldLabels[root] || root;
  if (segments.length === 1) return base;
  const tail = segments
    .slice(1)
    .map((segment) => (/^\d+$/.test(segment) ? `item ${Number(segment) + 1}` : segment))
    .join(' · ');
  return `${base} · ${tail}`;
}

function renderDiff(change) {
  const list = $('[data-diff-list]');
  list.replaceChildren();
  const paths = asArray(change?.classification?.changedPaths);
  if (!paths.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'O motor não encontrou diferenças editoriais.';
    list.append(empty);
    return;
  }
  const template = $('#diff-item-template');
  paths.forEach((path) => {
    const fragment = template.content.cloneNode(true);
    setText('[data-diff-label]', fieldLabelFromPointer(path), fragment);
    setText('[data-diff-path]', path, fragment);
    setText('[data-diff-before]', formatValue(valueAtJsonPointer(state.canonicalRecord, path)), fragment);
    setText('[data-diff-after]', formatValue(valueAtJsonPointer(state.formRecord, path)), fragment);
    list.append(fragment);
  });
}

function renderImpactState(impact) {
  const panel = $('[data-impact-state]');
  panel.classList.remove('is-allowed', 'is-blocked');
  panel.classList.add(impact.allowed ? 'is-allowed' : 'is-blocked');
  setText('.impact-state-icon', impact.allowed ? '✓' : '!', panel);
  setText('span', 'Estado do conjunto', panel);
  setText('h2', impact.allowed ? 'Liberado para preview' : 'Decisões obrigatórias pendentes', panel);
  setText(
    'p',
    impact.allowed
      ? 'O gate não encontrou bloqueios no overlay atual. Gere o preview antes de aplicar.'
      : `${asArray(impact.blockers).length} bloqueio(s) impedem a aplicação desta revisão.`,
    panel,
  );
}

function renderClassification(change) {
  const panel = $('[data-impact-classification]');
  panel.hidden = false;
  const classification = change?.classification || {};
  setText(
    '[data-classification="declared"]',
    changeClassLabels[classification.declaredClass] || classification.declaredClass || '—',
  );
  setText(
    '[data-classification="suggested"]',
    changeClassLabels[classification.suggestedClass] || classification.suggestedClass || '—',
  );
  setText(
    '[data-classification="effective"]',
    changeClassLabels[classification.effectiveClass] || classification.effectiveClass || '—',
  );
  setText(
    '[data-classification="paths"]',
    String(asArray(classification.changedPaths).length),
  );
}

function relationDetailsFromImpact(impact, change) {
  const details = firstDefined(impact?.relationDetails, change?.relationDetails, []);
  const detailEntries = Array.isArray(details)
    ? details
    : Object.values(details || {});
  const byId = new Map();

  detailEntries.forEach((entry) => {
    const relation = entry?.relation || entry;
    if (relation?.id) byId.set(relation.id, { ...relation, ...entry });
  });
  asArray(change?.relations).forEach((relation) => {
    const current = byId.get(relation.id) || {};
    byId.set(relation.id, {
      ...current,
      ...relation,
      decision: current.decision || relation.decision || null,
    });
  });
  return [...byId.values()];
}

function relationTypeLabel(typeId) {
  const type = state.relationTypes.find(({ id }) => id === typeId);
  return type?.label || typeId || 'Relação';
}

function endpointLabel(endpoint) {
  if (!endpoint) return 'Entidade desconhecida';
  return `${endpoint.type || 'entidade'}:${endpoint.id || 'sem-id'}`;
}

function populateRelationTypeSelect(select, relation) {
  select.replaceChildren();
  const candidates = state.relationTypes.filter((type) => (
    (!type.sourceType || type.sourceType === relation.source?.type)
    && (!type.targetType || type.targetType === relation.target?.type)
  ));
  const available = candidates.length ? candidates : state.relationTypes;
  available.forEach((type) => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.label || type.id;
    option.selected = type.id === relation.type;
    select.append(option);
  });
  if (!available.some(({ id }) => id === relation.type)) {
    const option = document.createElement('option');
    option.value = relation.type || '';
    option.textContent = relationTypeLabel(relation.type);
    option.selected = true;
    select.prepend(option);
  }
}

function renderBlockers(impact) {
  const list = $('[data-blocker-list]');
  list.replaceChildren();
  asArray(impact.blockers).forEach((blocker) => {
    const item = document.createElement('div');
    item.className = 'blocker-item';
    const mark = document.createElement('span');
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '!';
    const text = document.createElement('div');
    const label = blockerLabels[blocker.code] || blocker.code || 'Bloqueio editorial';
    text.textContent = blocker.relationId ? `${label} Relação: ${blocker.relationId}.` : label;
    item.append(mark, text);
    list.append(item);
  });
}

function renderRelationDecisions(impact, change) {
  const list = $('[data-relation-decision-list]');
  const details = relationDetailsFromImpact(impact, change);
  setText('[data-relations-count]', String(details.length));
  list.replaceChildren();

  if (!details.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Nenhuma relação direta foi afetada.';
    list.append(empty);
    return;
  }

  const template = $('#relation-decision-template');
  details.forEach((detail) => {
    const relation = detail.relation || detail;
    const fragment = template.content.cloneNode(true);
    const card = $('.relation-decision-card', fragment);
    card.dataset.relationId = relation.id;
    setText('[data-relation-type]', relationTypeLabel(relation.type), fragment);
    setText(
      '[data-relation-title]',
      `${endpointLabel(relation.source)} → ${endpointLabel(relation.target)}`,
      fragment,
    );
    setText(
      '[data-relation-state]',
      recordStateLabels[relation.reviewStatus]
        || recordStateLabels[relation.reviewState]
        || relation.reviewStatus
        || relation.reviewState
        || '—',
      fragment,
    );
    setText(
      '[data-relation-justification]',
      relation.justification || 'A relação ainda não possui justificativa visível neste resultado.',
      fragment,
    );
    const reasons = asArray(firstDefined(relation.reasons, relation.reviewReasons, detail.reasons))
      .map((reason) => reason?.code || reason?.message || String(reason));
    setText(
      '[data-relation-reason]',
      reasons.length
        ? `Motivo da revisão: ${reasons.join(', ')}.`
        : 'Esta relação aparece para conferência direta da mudança.',
      fragment,
    );

    const decisionAction = typeof relation.decision === 'object'
      ? relation.decision?.action
      : relation.decision;
    $$('[data-relation-decision]', fragment).forEach((radio) => {
      radio.name = `relation-decision-${relation.id}`;
      radio.checked = radio.value === decisionAction;
    });

    const typeSelect = $('[data-relation-input="type"]', fragment);
    populateRelationTypeSelect(typeSelect, relation);
    $('[data-relation-input="label"]', fragment).value = relation.label || '';
    $('[data-relation-input="justification"]', fragment).value = relation.justification || '';
    $('[data-relation-input="referenceIds"]', fragment).value = asArray(relation.referenceIds).join(', ');

    const fields = $('[data-relation-revision-fields]', fragment);
    fields.hidden = decisionAction !== 'revise';
    const save = $('[data-save-relation-decision]', fragment);
    save.disabled = !decisionAction;
    setText(
      '[data-relation-decision-status]',
      decisionAction
        ? `Decisão atual no workspace: ${relationDecisionLabels[decisionAction] || decisionAction}.`
        : 'Nenhuma decisão registrada neste workspace.',
      fragment,
    );
    list.append(fragment);
  });
}

function renderImpactList(name, values) {
  const list = $(`[data-impact-list="${name}"]`);
  if (!list) return;
  list.replaceChildren();
  const items = asArray(values);
  if (!items.length) {
    const item = document.createElement('li');
    item.className = 'empty-list';
    item.textContent = 'Nenhum item.';
    list.append(item);
    return;
  }
  items.forEach((value) => {
    const item = document.createElement('li');
    item.textContent = typeof value === 'string'
      ? value
      : value?.title || value?.id || formatObject(value);
    list.append(item);
  });
}

function renderImpactDetails(impact, change) {
  renderImpactList('referencesAdded', change?.referencesAdded);
  renderImpactList('referencesRemoved', change?.referencesRemoved);
  renderImpactList('claimsAffected', change?.claimsAffected);
  renderImpactList('orphanReferenceIds', impact?.orphanReferenceIds);
  renderImpactList('experimentsAffected', change?.experimentsAffected);
  renderImpactList('pathsAffected', change?.pathsAffected);
  renderImpactList('surfaces', [
    ...asArray(change?.publicSurfaces),
    ...asArray(change?.generatedFiles),
    ...asArray(change?.globalConsumers),
  ]);
}

function renderImpact() {
  if (!state.impact) return;
  const change = primaryTheoryChange();
  renderImpactState(state.impact);
  renderClassification(change);
  renderDiff(change);
  renderBlockers(state.impact);
  renderRelationDecisions(state.impact, change);
  renderImpactDetails(state.impact, change);
  $('[data-continue-preview]').disabled = !state.impact.allowed;
  setNavigationAvailability({
    editor: true,
    impact: true,
    preview: Boolean(state.preview),
    apply: Boolean(state.preview),
  });
  renderApplySummary();
}

function selectImpactTab(name, { focus = true } = {}) {
  const selected = $(`[data-impact-tab="${name}"]`);
  if (!selected) return;
  $$('[data-impact-tab]').forEach((tab) => {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  $$('[data-impact-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.impactPanel !== name;
  });
  if (focus) selected.focus();
}

function relationReviewerPayload() {
  const partyId = $('[data-relation-reviewer-party-id]').value.trim();
  const displayName = $('[data-relation-reviewer-display-name]').value.trim();
  const partyType = $('[data-relation-reviewer-party-type]').value;
  const publicLinks = $('[data-relation-reviewer-public-links]').value
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const authorized = $('[data-relation-identity-authorization]').checked;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(partyId)) {
    throw new Error('Informe um ID público válido para a parte revisora.');
  }
  if (!authorized) {
    throw new Error('Confirme a autorização pública da identidade revisora.');
  }
  publicLinks.forEach((value) => {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error('Os links públicos precisam usar HTTPS e não podem conter credenciais.');
    }
  });

  const reviewer = {
    partyId,
    publicIdentityAuthorized: true,
  };
  if (displayName) {
    Object.assign(reviewer, {
      aliases: [],
      displayName,
      partyType,
      publicLinks,
      slug: partyId,
    });
  }
  return reviewer;
}

async function saveRelationDecision(card, button) {
  const context = captureWorkspaceContext();
  const selected = $('[data-relation-decision]:checked', card);
  if (!selected) return;
  const decision = selected.value;
  const body = {
    decision,
    version: workspaceVersion(),
  };
  if (['confirm', 'revise'].includes(decision)) {
    const reviewedAt = $('[data-relation-reviewed-at]').value;
    if (!reviewedAt) {
      showToast('Informe a data da revisão relacional.', 'error');
      $('[data-relation-reviewed-at]').focus();
      return;
    }
    try {
      body.reviewer = relationReviewerPayload();
    } catch (error) {
      showToast(messageFromError(error), 'error');
      $('[data-relation-reviewer-party-id]').focus();
      return;
    }
    body.reviewedAt = reviewedAt;
  }
  if (decision === 'revise') {
    body.type = $('[data-relation-input="type"]', card).value;
    body.label = $('[data-relation-input="label"]', card).value.trim();
    body.justification = $('[data-relation-input="justification"]', card).value.trim();
    body.referenceIds = $('[data-relation-input="referenceIds"]', card).value
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (!body.label || !body.justification) {
      showToast('Preencha o rótulo e a justificativa revisada da relação.', 'error');
      return;
    }
  }

  await withBusyButton(button, 'Registrando…', async () => {
    try {
      const payload = await editorialApi.saveRelationDecision(
        context.workspaceId,
        card.dataset.relationId,
        body,
      );
      if (!isWorkspaceContextCurrent(context)) return;
      updateWorkspace(payload, state.formRecord);
      showToast('Decisão registrada no workspace. Recalculando o impacto…', 'success');
      await runImpact($('[data-rerun-impact]'), { stayOnRelations: true });
    } catch (error) {
      if (!isWorkspaceContextCurrent(context)) return;
      showToast(messageFromError(error), 'error');
    }
  });
}

function previewFromPayload(payload) {
  return firstDefined(payload?.preview, payload?.data?.preview, payload);
}

function previewUrl(preview) {
  return firstDefined(
    preview?.openUrl,
    preview?.url,
    preview?.previewUrl,
    preview?.origin,
    preview?.href,
    '',
  );
}

function safePreviewUrl(value) {
  const url = new URL(value, window.location.origin);
  const allowedHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
  const unlockPath = /^\/__editorial-preview\/open\/[A-Za-z0-9_-]+$/.test(url.pathname);
  const destination = url.searchParams.get('path');
  const allowedQuery = (
    [...url.searchParams.keys()].every((key) => key === 'path')
    && typeof destination === 'string'
    && destination.startsWith('/')
    && !destination.startsWith('//')
    && !destination.includes('\\')
  );
  const authorized = (
    url.protocol === 'http:'
    && allowedHosts.has(url.hostname)
    && Boolean(url.port)
    && !url.username
    && !url.password
    && !url.hash
    && unlockPath
    && allowedQuery
  );
  if (!authorized) {
    throw new Error('O servidor devolveu uma origem de preview não autorizada.');
  }
  return url.href;
}

function setPreviewStatus(status, title, message) {
  dom.previewStatus.classList.remove('is-building', 'is-ready', 'is-error');
  if (status) dom.previewStatus.classList.add(`is-${status}`);
  setText('.preview-status-icon', status === 'ready' ? '✓' : status === 'error' ? '!' : '◇', dom.previewStatus);
  setText('strong', title, dom.previewStatus);
  setText('p', message, dom.previewStatus);
}

function renderPreviewReady(preview) {
  const rawUrl = previewUrl(preview);
  if (!rawUrl) return false;
  const url = safePreviewUrl(rawUrl);
  state.preview = { ...preview, url };
  dom.previewFrame.src = url;
  dom.previewFrame.hidden = false;
  dom.previewPlaceholder.hidden = true;
  const link = $('[data-open-preview]');
  link.href = url;
  link.tabIndex = 0;
  link.classList.remove('is-disabled');
  link.removeAttribute('aria-disabled');
  setPreviewStatus('ready', 'Preview pronto', 'Confira as superfícies afetadas antes de continuar.');
  $('[data-continue-apply]').disabled = false;
  setNavigationAvailability({
    editor: true,
    impact: true,
    preview: true,
    apply: true,
  });
  updateWorkflowStep('preview');
  renderApplySummary();
  return true;
}

async function waitForPreview(initialPreview, pollToken, context) {
  let current = initialPreview;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (
      pollToken !== state.previewPollToken
      || !isWorkspaceContextCurrent(context)
    ) return false;
    if (renderPreviewReady(current)) return true;
    if (['failed', 'error'].includes(current?.status)) {
      throw new Error(current.message || 'A geração do preview falhou.');
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
    current = previewFromPayload(await editorialApi.preview(context.workspaceId));
  }
  throw new Error('O preview não terminou no tempo esperado.');
}

async function generatePreview(button) {
  if (!state.impact?.allowed) {
    showToast('Resolva os bloqueios antes de gerar o preview.', 'error');
    return;
  }
  const context = captureWorkspaceContext();
  const impactDigest = state.impactDigest;
  clearPreviewState();
  const pollToken = state.previewPollToken;
  setPreviewStatus('building', 'Gerando preview isolado…', 'Validação, aplicação temporária e build estão em andamento.');
  await withBusyButton(button, 'Gerando…', async () => {
    try {
      const payload = await editorialApi.createPreview(
        context.workspaceId,
        impactDigest,
      );
      if (!isWorkspaceContextCurrent(context)) {
        editorialApi.deletePreview(context.workspaceId).catch(() => {});
        return;
      }
      const preview = previewFromPayload(payload);
      const ready = await waitForPreview(preview, pollToken, context);
      if (!ready || !isWorkspaceContextCurrent(context)) {
        editorialApi.deletePreview(context.workspaceId).catch(() => {});
        return;
      }
      showToast('Preview isolado pronto para conferência.', 'success');
    } catch (error) {
      if (!isWorkspaceContextCurrent(context)) {
        editorialApi.deletePreview(context.workspaceId).catch(() => {});
        return;
      }
      setPreviewStatus('error', 'Não foi possível gerar o preview', messageFromError(error));
      showToast(messageFromError(error), 'error');
    }
  });
}

function renderApplySummary() {
  const change = primaryTheoryChange();
  const classification = change?.classification || {};
  const relationDetails = relationDetailsFromImpact(state.impact, change);
  const decided = relationDetails.filter(({ decision }) => Boolean(decision)).length;
  setText('[data-apply-entity]', `${state.formRecord?.code || ''} · ${state.formRecord?.title || '—'}`);
  setText(
    '[data-apply-revision]',
    `${state.canonicalRecord?.revisionId || '—'} → ${state.formRecord?.revisionId || '—'}`,
  );
  setText(
    '[data-apply-class]',
    changeClassLabels[classification.effectiveClass] || classification.effectiveClass || '—',
  );
  setText('[data-apply-decisions]', `${decided} de ${relationDetails.length}`);
  setText('[data-apply-digest]', state.impactDigest || '—');
  setText(
    '[data-dialog-summary]',
    `${state.formRecord?.id || 'teoria'} · ${state.formRecord?.revisionId || 'nova revisão'} · digest ${state.impactDigest || 'indisponível'}`,
  );
}

function updateApplyButton() {
  const ready = dom.applyReviewed.checked
    && dom.applyConfirmationInput.value.trim() === 'APLICAR'
    && !state.dirty
    && Boolean(state.impact?.allowed)
    && Boolean(state.preview)
    && Boolean(state.impactDigest);
  $('[data-open-apply-dialog]').disabled = !ready;
}

async function applyWorkspace(button) {
  const context = captureWorkspaceContext();
  const impactDigest = state.impactDigest;
  await withBusyButton(button, 'Aplicando…', async () => {
    try {
      const payload = await editorialApi.applyWorkspace(context.workspaceId, {
        confirmation: 'APLICAR',
        impactDigest,
      });
      if (!isWorkspaceContextCurrent(context)) return;
      updateWorkspace(payload, state.formRecord);
      dom.applyDialog.close();
      $$('input, textarea, select, button', dom.form).forEach((control) => {
        control.disabled = true;
      });
      $('[data-open-apply-dialog]').disabled = true;
      const operationalWarning = payload?.operationalWarning || null;
      setText(
        '[data-workspace-status]',
        operationalWarning
          ? 'Instalado · estado local requer conferência'
          : 'Instalado localmente',
      );
      updateWorkflowStep('apply');
      if (operationalWarning) {
        const appliedState = {
          appliedAt: new Date().toISOString(),
          impactDigest,
          recoveryRequired: true,
        };
        state.workspace.applied = appliedState;
        state.workspaces = asArray(state.workspaces).map((workspace) => (
          workspace.id === context.workspaceId
            ? { ...workspace, applied: appliedState }
            : workspace
        ));
        renderWorkspaceList();
        renderOverview();
      } else {
        await refreshWorkspaceList({ reportError: false });
      }
      showToast(
        operationalWarning?.message
          || 'Revisão instalada na fonte canônica. Commit e deploy continuam separados.',
        operationalWarning ? 'warning' : 'success',
      );
      state.dirty = false;
      resetApplyConfirmation();
    } catch (error) {
      if (!isWorkspaceContextCurrent(context)) return;
      dom.applyDialog.close();
      showToast(messageFromError(error), 'error');
      if (error instanceof EditorialApiError && error.status === 409) {
        clearPreviewState();
        showToast('A fonte ou o workspace mudou. Recalcule o impacto e gere outro preview.', 'warning');
      }
    }
  });
}

function renderRelationTypes(payload) {
  const taxonomy = firstDefined(payload?.taxonomy, payload);
  state.relationTypes = asArray(firstDefined(taxonomy?.types, taxonomy?.items, taxonomy));
}

async function loadSuggestionCatalog(type) {
  try {
    return catalogItemsFromPayload(await editorialApi.catalog(type));
  } catch (error) {
    if (error instanceof EditorialApiError && [400, 404].includes(error.status)) return [];
    throw error;
  }
}

async function refreshCatalog(button = null) {
  const action = async () => {
    try {
      dom.catalogList.setAttribute('aria-busy', 'true');
      dom.workspaceList.setAttribute('aria-busy', 'true');
      const [overview, catalog, workspaces, references, parties] = await Promise.all([
        editorialApi.overview(),
        editorialApi.catalog('theory'),
        editorialApi.workspaces(),
        loadSuggestionCatalog('reference'),
        loadSuggestionCatalog('party'),
      ]);
      state.overview = overview;
      state.catalog = catalogItemsFromPayload(catalog);
      state.workspaces = workspaceItemsFromPayload(workspaces);
      state.references = references;
      state.parties = parties;
      renderOverview();
      renderWorkspaceList();
      renderSuggestionLists();
      renderCatalog();
      showToast('Catálogo sincronizado com a fonte local.', 'success');
    } catch (error) {
      dom.catalogList.setAttribute('aria-busy', 'false');
      dom.workspaceList.setAttribute('aria-busy', 'false');
      dom.catalogFeedback.textContent = 'Não foi possível carregar o catálogo.';
      showToast(messageFromError(error), 'error');
    }
  };
  if (button) return withBusyButton(button, 'Atualizando…', action);
  return action();
}

function handleListAction(button) {
  const item = button.closest('.repeatable-item');
  const name = item?.dataset.listName;
  const index = Number(item?.dataset.listIndex);
  const list = state.formRecord?.[name];
  if (!Array.isArray(list) || !Number.isInteger(index)) return;
  const action = button.dataset.listAction;
  let focusIndex = index;
  if (action === 'up' && index > 0) {
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
    focusIndex = index - 1;
  }
  if (action === 'down' && index < list.length - 1) {
    [list[index + 1], list[index]] = [list[index], list[index + 1]];
    focusIndex = index + 1;
  }
  if (action === 'remove' && list.length > minimumItemsForList(name)) {
    list.splice(index, 1);
    focusIndex = Math.max(0, index - 1);
  }
  renderStringList(name, list.length ? focusIndex : null);
  setDirty(true);
}

function handleObjectionAction(button) {
  const card = button.closest('.objection-editor-card');
  const index = Number(card?.dataset.objectionIndex);
  const objections = state.formRecord?.objections;
  if (!Array.isArray(objections) || !Number.isInteger(index)) return;
  const action = button.dataset.objectionAction;
  let focusIndex = index;
  if (action === 'up' && index > 0) {
    [objections[index - 1], objections[index]] = [objections[index], objections[index - 1]];
    focusIndex = index - 1;
  }
  if (action === 'down' && index < objections.length - 1) {
    [objections[index + 1], objections[index]] = [objections[index], objections[index + 1]];
    focusIndex = index + 1;
  }
  if (action === 'remove' && objections.length > Number(schemaNodeAt('objections')?.minItems || 0)) {
    objections.splice(index, 1);
    focusIndex = Math.max(0, index - 1);
  }
  renderObjections(objections.length ? focusIndex : null);
  setDirty(true);
}

function bindEvents() {
  dom.sidebarToggle.addEventListener('click', () => {
    if (document.body.classList.contains('is-sidebar-open')) closeSidebar({ returnFocus: true });
    else openSidebar();
  });
  dom.sidebarScrim.addEventListener('click', () => closeSidebar({ returnFocus: true }));
  window.matchMedia('(max-width: 960px)').addEventListener('change', () => {
    closeSidebar();
    updateSidebarInert();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('is-sidebar-open')) {
      closeSidebar({ returnFocus: true });
    }
  });
  window.addEventListener('beforeunload', (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  $$('[data-view-target]').forEach((button) => {
    button.addEventListener('click', () => setView(button.dataset.viewTarget));
  });
  dom.catalogSearch.addEventListener('input', renderCatalog);
  $('[data-refresh-catalog]').addEventListener('click', (event) => refreshCatalog(event.currentTarget));
  dom.catalogList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-create-workspace]');
    if (button) createWorkspace(button.dataset.entityId, button);
  });
  dom.workspaceList.addEventListener('click', (event) => {
    const resumeButton = event.target.closest('[data-resume-workspace]');
    const deleteButton = event.target.closest('[data-delete-workspace]');
    const workspaceIdValue = firstDefined(
      resumeButton?.dataset.resumeWorkspace,
      deleteButton?.dataset.deleteWorkspace,
    );
    const workspace = asArray(state.workspaces)
      .find(({ id }) => id === workspaceIdValue);
    if (!workspace) return;
    if (resumeButton) resumeWorkspace(workspace, resumeButton);
    if (deleteButton) deleteWorkspace(workspace, deleteButton);
  });
  $('[data-back-to-catalog]').addEventListener('click', () => setView('catalog'));
  $('[data-return-to-editor]').addEventListener('click', () => setView('editor'));
  $('[data-return-to-impact]').addEventListener('click', () => setView('impact'));
  $('[data-return-to-preview]').addEventListener('click', () => setView('preview'));
  $('[data-continue-preview]').addEventListener('click', () => {
    setView('preview');
    generatePreview($('[data-generate-preview]'));
  });
  $('[data-continue-apply]').addEventListener('click', () => {
    renderApplySummary();
    setView('apply');
    updateWorkflowStep('apply');
  });

  dom.form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveDraft();
  });
  dom.form.addEventListener('input', (event) => {
    const field = event.target;
    if (field.dataset.field) setAtPath(state.formRecord, field.dataset.field, field.value);
    if (field.dataset.revisionField) {
      const revision = latestRevision();
      if (revision) revision[field.dataset.revisionField] = field.value;
    }
    if (field.dataset.responsibleField) synchronizeRevisionResponsible();
    if (field.name === 'change-class') {
      state.changeClass = field.value;
      setText('[data-summary-change-class]', changeClassLabels[state.changeClass]);
    }
    if (field.matches('[data-list-item-input]')) {
      const item = field.closest('.repeatable-item');
      const name = item.dataset.listName;
      const index = Number(item.dataset.listIndex);
      state.formRecord[name][index] = field.value;
    }
    if (field.matches('[data-objection-field]')) {
      const card = field.closest('.objection-editor-card');
      const index = Number(card.dataset.objectionIndex);
      state.formRecord.objections[index][field.dataset.objectionField] = field.value;
    }
    if (field.matches('[data-public-identity-authorization]')) {
      state.publicIdentityAuthorization = field.checked;
      field.setCustomValidity('');
    }
    if (field.matches('[aria-invalid="true"]')) {
      field.removeAttribute('aria-invalid');
      field.setCustomValidity('');
      connectVisibleFieldError(field, '');
    }
    setDirty(true);
  });

  dom.form.addEventListener('click', (event) => {
    const addList = event.target.closest('[data-add-list-item]');
    if (addList) {
      const name = addList.dataset.addListItem;
      if (!Array.isArray(state.formRecord[name])) state.formRecord[name] = [];
      state.formRecord[name].push('');
      renderStringList(name, state.formRecord[name].length - 1);
      setDirty(true);
      return;
    }
    const listAction = event.target.closest('[data-list-action]');
    if (listAction) {
      handleListAction(listAction);
      return;
    }
    if (event.target.closest('[data-add-objection]')) {
      state.formRecord.objections.push({
        id: '',
        response: '',
        status: 'aberta',
        title: '',
      });
      renderObjections(state.formRecord.objections.length - 1);
      setDirty(true);
      return;
    }
    const objectionAction = event.target.closest('[data-objection-action]');
    if (objectionAction) handleObjectionAction(objectionAction);
  });

  $('[data-discard-form]').addEventListener('click', () => {
    state.formRecord = clone(state.lastSavedRecord);
    renderEditor();
    showToast('O formulário voltou ao último rascunho salvo.', 'info');
  });
  $('[data-run-validation]').addEventListener('click', (event) => validateWorkspace(event.currentTarget));
  $('[data-run-impact]').addEventListener('click', (event) => runImpact(event.currentTarget));
  $('[data-rerun-impact]').addEventListener('click', (event) => runImpact(event.currentTarget));

  $$('[data-impact-tab]').forEach((tab) => {
    tab.addEventListener('click', () => selectImpactTab(tab.dataset.impactTab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const tabs = $$('[data-impact-tab]');
      const index = tabs.indexOf(tab);
      let next = index;
      if (event.key === 'ArrowLeft') next = Math.max(0, index - 1);
      if (event.key === 'ArrowRight') next = Math.min(tabs.length - 1, index + 1);
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      event.preventDefault();
      selectImpactTab(tabs[next].dataset.impactTab);
    });
  });
  $('[data-toggle-technical-diff]').addEventListener('click', (event) => {
    const list = $('[data-diff-list]');
    const expanded = !list.classList.contains('show-technical-paths');
    list.classList.toggle('show-technical-paths', expanded);
    event.currentTarget.setAttribute('aria-expanded', String(expanded));
    event.currentTarget.textContent = expanded ? 'Ocultar caminhos técnicos' : 'Mostrar caminhos técnicos';
  });

  $('[data-relation-decision-list]').addEventListener('change', (event) => {
    const radio = event.target.closest('[data-relation-decision]');
    if (!radio) return;
    const card = radio.closest('.relation-decision-card');
    $('[data-relation-revision-fields]', card).hidden = radio.value !== 'revise';
    $('[data-save-relation-decision]', card).disabled = false;
  });
  $('[data-relation-decision-list]').addEventListener('click', (event) => {
    const button = event.target.closest('[data-save-relation-decision]');
    if (button) saveRelationDecision(button.closest('.relation-decision-card'), button);
  });

  $('[data-generate-preview]').addEventListener('click', (event) => generatePreview(event.currentTarget));
  $$('[data-preview-viewport]').forEach((button) => {
    button.addEventListener('click', () => {
      $$('[data-preview-viewport]').forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle('is-active', active);
        candidate.setAttribute('aria-pressed', String(active));
      });
      $('[data-preview-frame-shell]').dataset.previewFrameShell = button.dataset.previewViewport;
    });
  });

  dom.applyReviewed.addEventListener('change', updateApplyButton);
  dom.applyConfirmationInput.addEventListener('input', updateApplyButton);
  $('[data-open-apply-dialog]').addEventListener('click', () => {
    renderApplySummary();
    dom.applyDialog.showModal();
    $('[data-cancel-apply]').focus();
  });
  $('[data-cancel-apply]').addEventListener('click', () => dom.applyDialog.close());
  $('[data-confirm-apply]').addEventListener('click', (event) => applyWorkspace(event.currentTarget));
  dom.applyDialog.addEventListener('click', (event) => {
    if (event.target === dom.applyDialog) dom.applyDialog.close();
  });
  dom.applyDialog.addEventListener('close', () => $('[data-open-apply-dialog]')?.focus());
}

async function initialize() {
  bindEvents();
  updateSidebarInert();
  setNavigationAvailability();
  try {
    const session = await editorialApi.session();
    state.session = session;
    const token = firstDefined(session?.csrfToken, session?.csrf, session?.token);
    if (!token) throw new Error('A sessão local não forneceu o token de proteção esperado.');
    setEditorialCsrfToken(token);
    setServerState('online', 'Processo local ativo');

    const [
      schema,
      relationTypes,
      overview,
      catalog,
      workspaces,
      references,
      parties,
    ] = await Promise.all([
      editorialApi.schema('theory'),
      editorialApi.relationTypes(),
      editorialApi.overview(),
      editorialApi.catalog('theory'),
      editorialApi.workspaces(),
      loadSuggestionCatalog('reference'),
      loadSuggestionCatalog('party'),
    ]);
    state.schema = firstDefined(schema?.schema, schema);
    renderRelationTypes(relationTypes);
    state.overview = overview;
    state.catalog = catalogItemsFromPayload(catalog);
    state.workspaces = workspaceItemsFromPayload(workspaces);
    state.references = references;
    state.parties = parties;
    renderOverview();
    renderWorkspaceList();
    renderSuggestionLists();
    renderCatalog();
    announce('Dashboard editorial pronta.');
  } catch (error) {
    setServerState('error', 'Processo local indisponível');
    dom.catalogList.setAttribute('aria-busy', 'false');
    dom.workspaceList.setAttribute('aria-busy', 'false');
    dom.catalogFeedback.textContent = messageFromError(error);
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Inicie novamente o processo local da dashboard e recarregue esta página.';
    dom.catalogList.replaceChildren(empty);
    showToast(messageFromError(error), 'error');
  }
}

initialize();
