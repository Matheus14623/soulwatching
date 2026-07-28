import { findLearningPath, resolveLearningPath } from './learning-paths-model.js';

export const ROUTE_CONTEXT_ORIGINS = Object.freeze({
  rotas: Object.freeze({
    id: 'rotas',
    label: 'Rotas guiadas',
  }),
});

function toUrl(value, base = 'https://observatorio.local/') {
  if (value instanceof URL) return new URL(value.href);
  return new URL(value, base);
}

function outputHref(url) {
  return `${url.pathname}${url.search}${url.hash}`;
}

function routePlayerHref(path, stepIndex) {
  const url = new URL('/Rotas/rotas.html', 'https://observatorio.local/');
  url.searchParams.set('rota', path.slug);
  url.searchParams.set('etapa', String(stepIndex + 1));
  url.hash = 'percurso';
  return outputHref(url);
}

function normalizePathname(pathname) {
  if (pathname === '/' || pathname === '/index.html') return '/';
  return pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
}

function matchesDestination(currentUrl, destinationHref) {
  const expected = toUrl(destinationHref, currentUrl.origin);
  if (normalizePathname(currentUrl.pathname) !== normalizePathname(expected.pathname)) return false;
  return [...expected.searchParams].every(([name, value]) => currentUrl.searchParams.get(name) === value);
}

export function withRouteContext(href, path, stepIndex, origin = 'rotas') {
  if (!ROUTE_CONTEXT_ORIGINS[origin]) throw new Error(`Origem de rota não autorizada: ${origin}`);
  if (!path?.steps?.[stepIndex]) throw new RangeError('Etapa de rota fora do intervalo.');
  const url = toUrl(href);
  url.searchParams.set('rota', path.slug);
  url.searchParams.set('etapa', String(stepIndex + 1));
  url.searchParams.set('origem', origin);
  return outputHref(url);
}

export function resolveRouteContext(value) {
  const browserLocation = typeof window === 'undefined' ? null : window.location;
  const currentValue = value || browserLocation?.href || 'https://observatorio.local/';
  const url = toUrl(currentValue, browserLocation?.origin || 'https://observatorio.local/');
  const origin = url.searchParams.get('origem');
  if (!ROUTE_CONTEXT_ORIGINS[origin]) return null;

  const rawPath = findLearningPath(url.searchParams.get('rota'));
  if (!rawPath) return null;
  const stepNumber = Number.parseInt(url.searchParams.get('etapa') || '', 10);
  if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > rawPath.steps.length) return null;

  const path = resolveLearningPath(rawPath);
  const stepIndex = stepNumber - 1;
  const step = path.steps[stepIndex];
  if (!matchesDestination(url, step.href)) return null;
  const nextStep = path.steps[stepIndex + 1] || null;

  return Object.freeze({
    origin: ROUTE_CONTEXT_ORIGINS[origin],
    path,
    step,
    stepIndex,
    stepNumber,
    totalSteps: path.steps.length,
    resumeHref: routePlayerHref(path, stepIndex),
    nextStep,
    nextHref: nextStep ? withRouteContext(nextStep.href, path, stepIndex + 1, origin) : null,
  });
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function ensureStylesheet() {
  if (document.querySelector('[data-route-continuity-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('../css/route-continuity.css?v=route-continuity-v1', import.meta.url).href;
  link.dataset.routeContinuityStyles = '';
  document.head.append(link);
}

function createContinuityBar(context) {
  const bar = createElement('aside', 'route-continuity');
  bar.dataset.routeContinuity = '';
  bar.dataset.routeId = context.path.id;
  bar.dataset.routeStep = String(context.stepNumber);
  bar.setAttribute('aria-label', 'Continuidade da rota guiada');

  const copy = createElement('div', 'route-continuity-copy');
  copy.append(
    createElement('span', 'route-continuity-kicker', `ROTA GUIADA · ETAPA ${context.stepNumber} DE ${context.totalSteps}`),
    createElement('strong', '', context.path.title),
    createElement('span', 'route-continuity-current', `Agora: ${context.step.title}`),
  );

  const actions = createElement('nav', 'route-continuity-actions');
  actions.setAttribute('aria-label', 'Ações da rota guiada');
  const resume = createElement('a', 'route-continuity-resume', 'Retomar rota');
  resume.href = context.resumeHref;
  actions.append(resume);

  if (context.nextStep) {
    const next = createElement('a', 'route-continuity-next', `Próxima: ${context.nextStep.title}`);
    next.href = context.nextHref;
    actions.append(next);
  }

  const close = createElement('button', 'route-continuity-close', 'Fechar');
  close.type = 'button';
  close.setAttribute('aria-label', 'Ocultar contexto da rota nesta página');
  close.addEventListener('click', () => {
    const focusTarget = document.querySelector('main h1, main');
    const temporaryTabIndex = focusTarget && !focusTarget.hasAttribute('tabindex');
    if (temporaryTabIndex) focusTarget.setAttribute('tabindex', '-1');
    bar.remove();
    focusTarget?.focus({ preventScroll: true });
    if (temporaryTabIndex) {
      focusTarget.addEventListener('blur', () => {
        focusTarget.removeAttribute('tabindex');
      }, { once: true });
    }
  });
  bar.append(copy, actions, close);
  return bar;
}

export function initRouteContinuity() {
  if (document.querySelector('[data-route-continuity]')) return;
  const context = resolveRouteContext();
  if (!context) return;
  ensureStylesheet();
  const bar = createContinuityBar(context);
  const header = document.querySelector('[data-header]');
  if (header) header.after(bar);
  else document.body.prepend(bar);
}
