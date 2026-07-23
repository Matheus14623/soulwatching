import { LEARNING_PATHS, findLearningPath } from '../assets/data/learning-paths.js';
import { getResolvedLearningPaths, resolveLearningPath } from '../assets/js/learning-paths-model.js';
import { initNavigation } from '../assets/js/navigation.js';
import { prefersReducedMotion } from '../assets/js/utils.js';

const palette = Object.freeze({
  cyan: '#72ecff',
  purple: '#ad8cff',
  gold: '#f1cf73',
  green: '#87e5b0',
});

const dom = {};
const state = {
  path: null,
  stepIndex: 0,
};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function cacheElements() {
  Object.assign(dom, {
    catalog: document.querySelector('[data-routes-catalog]'),
    section: document.querySelector('[data-route-player-section]'),
    player: document.querySelector('[data-route-player]'),
    position: document.querySelector('[data-route-position]'),
    title: document.querySelector('[data-route-title]'),
    summary: document.querySelector('[data-route-summary]'),
    progressLabel: document.querySelector('[data-route-progress-label]'),
    progressBar: document.querySelector('[data-route-progress-bar]'),
    index: document.querySelector('[data-route-step-index]'),
    card: document.querySelector('[data-route-step-card]'),
    type: document.querySelector('[data-route-step-type]'),
    stepTitle: document.querySelector('[data-route-step-title]'),
    reason: document.querySelector('[data-route-step-reason]'),
    stepSummary: document.querySelector('[data-route-step-summary]'),
    link: document.querySelector('[data-route-step-link]'),
    previous: document.querySelector('[data-route-previous]'),
    next: document.querySelector('[data-route-next]'),
    announcement: document.querySelector('[data-route-announcement]'),
  });
  return Object.values(dom).every(Boolean);
}

function syncUrl() {
  if (!state.path) return;
  const url = new URL(window.location.href);
  url.searchParams.set('rota', state.path.slug);
  url.searchParams.set('etapa', String(state.stepIndex + 1));
  window.history.replaceState({ route: state.path.slug, step: state.stepIndex + 1 }, '', url);
}

function announce(message) {
  dom.announcement.textContent = '';
  requestAnimationFrame(() => {
    dom.announcement.textContent = message;
  });
}

function createCatalogCard(path, number) {
  const button = createElement('button', 'route-catalog-card');
  button.type = 'button';
  button.dataset.routeId = path.id;
  button.setAttribute('aria-controls', 'percurso');
  button.setAttribute('aria-pressed', 'false');
  button.style.setProperty('--route-accent', palette[path.accent] || palette.cyan);
  const title = createElement('span', 'route-catalog-title', path.title);
  const summary = createElement('span', 'route-catalog-summary', path.summary);
  title.id = `route-catalog-title-${path.id}`;
  summary.id = `route-catalog-summary-${path.id}`;
  button.setAttribute('aria-labelledby', title.id);
  button.setAttribute('aria-describedby', summary.id);
  button.append(
    createElement('span', 'route-catalog-kicker', `ROTA ${String(number + 1).padStart(2, '0')} · ${path.audience}`),
    title,
    summary,
  );
  const meta = createElement('span', 'route-catalog-meta');
  meta.append(
    createElement('span', '', `${path.steps.length} etapas`),
    createElement('span', '', `cerca de ${path.durationMinutes} min`),
  );
  button.append(meta);
  return button;
}

function renderCatalog() {
  dom.catalog.replaceChildren(...getResolvedLearningPaths().map(createCatalogCard));
}

function createStepButton(step, index) {
  const button = createElement('button');
  button.type = 'button';
  button.dataset.routeStep = String(index);
  button.setAttribute('aria-current', index === state.stepIndex ? 'step' : 'false');
  button.append(
    createElement('span', '', String(index + 1).padStart(2, '0')),
    createElement('strong', '', step.title),
  );
  return button;
}

function renderStep({ updateUrl = true, focusCard = false, shouldAnnounce = true } = {}) {
  const step = state.path?.steps[state.stepIndex];
  if (!step) return;
  const total = state.path.steps.length;
  const progress = ((state.stepIndex + 1) / total) * 100;

  dom.position.textContent = `Etapa ${state.stepIndex + 1} de ${total}`;
  dom.title.textContent = state.path.title;
  dom.summary.textContent = state.path.summary;
  dom.progressLabel.textContent = `${state.stepIndex + 1} de ${total} etapas`;
  dom.progressBar.style.width = `${progress}%`;
  dom.card.dataset.stepNumber = String(state.stepIndex + 1).padStart(2, '0');
  dom.type.textContent = step.typeLabel;
  dom.stepTitle.textContent = step.title;
  dom.reason.textContent = step.reason;
  dom.stepSummary.textContent = step.summary;
  dom.link.href = step.href;
  dom.link.textContent = step.type === 'experiment' ? 'Abrir experimento' : 'Abrir conteúdo completo';
  dom.previous.disabled = state.stepIndex === 0;
  dom.next.disabled = state.stepIndex === total - 1;
  dom.next.textContent = state.stepIndex === total - 1 ? 'Rota concluída' : 'Próxima etapa';
  dom.index.querySelectorAll('[data-route-step]').forEach((button, index) => {
    button.setAttribute('aria-current', index === state.stepIndex ? 'step' : 'false');
  });
  if (updateUrl) syncUrl();
  if (shouldAnnounce) announce(`Etapa ${state.stepIndex + 1}: ${step.title}.`);
  if (focusCard) dom.card.setAttribute('tabindex', '-1');
  if (focusCard) dom.card.focus({ preventScroll: true });
}

function selectPath(pathId, {
  stepIndex = 0,
  scroll = true,
  updateUrl = true,
  focusPlayer = false,
} = {}) {
  const rawPath = findLearningPath(pathId, LEARNING_PATHS[0]);
  state.path = resolveLearningPath(rawPath);
  const safeStepIndex = Number.isInteger(stepIndex) ? stepIndex : 0;
  state.stepIndex = Math.min(Math.max(0, safeStepIndex), state.path.steps.length - 1);
  dom.section.hidden = false;
  dom.player.style.setProperty('--route-accent', palette[state.path.accent] || palette.cyan);
  dom.catalog.querySelectorAll('[data-route-id]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.routeId === state.path.id));
  });
  dom.index.replaceChildren(...state.path.steps.map(createStepButton));
  renderStep({ updateUrl, shouldAnnounce: false });
  announce(`Rota ${state.path.title} aberta na etapa ${state.stepIndex + 1}.`);
  if (scroll) {
    dom.section.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }
  if (focusPlayer) {
    requestAnimationFrame(() => dom.title.focus({ preventScroll: true }));
  }
}

function bindEvents() {
  dom.catalog.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-route-id]') : null;
    if (button) selectPath(button.dataset.routeId, { focusPlayer: true });
  });
  dom.index.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-route-step]') : null;
    if (!button) return;
    state.stepIndex = Number(button.dataset.routeStep);
    renderStep();
  });
  dom.previous.addEventListener('click', () => {
    if (state.stepIndex === 0) return;
    state.stepIndex -= 1;
    renderStep();
  });
  dom.next.addEventListener('click', () => {
    if (!state.path || state.stepIndex >= state.path.steps.length - 1) return;
    state.stepIndex += 1;
    renderStep();
  });
  window.addEventListener('popstate', () => {
    const url = new URL(window.location.href);
    const path = findLearningPath(url.searchParams.get('rota'));
    if (!path) return;
    const stepIndex = Number.parseInt(url.searchParams.get('etapa') || '1', 10) - 1;
    selectPath(path.id, { stepIndex, scroll: false, updateUrl: false });
  });
}

function boot() {
  initNavigation();
  if (!cacheElements()) return;
  renderCatalog();
  bindEvents();
  const url = new URL(window.location.href);
  const requestedPath = findLearningPath(url.searchParams.get('rota'));
  if (requestedPath) {
    const stepIndex = Number.parseInt(url.searchParams.get('etapa') || '1', 10) - 1;
    selectPath(requestedPath.id, { stepIndex, scroll: false, updateUrl: false });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
