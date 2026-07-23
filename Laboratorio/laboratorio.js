import { getActiveExperiments, getExperimentKind } from '../assets/data/experiments.js';
import { initNavigation } from '../assets/js/navigation.js';

const visualMarkerCounts = Object.freeze({
  stars: 4,
  strings: 6,
  nodes: 5,
  constellations: 7,
  'light-cone': 1,
  epsilon: 1,
  cycle: 7,
  quiz: 7,
  biosphere: 7,
});

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatCount(count) {
  return count === 1 ? '1 campo ativo' : `${count} campos ativos`;
}

function createVisual(experiment) {
  const visual = createElement('div', `experiment-visual experiment-visual--${experiment.visual}`);
  visual.setAttribute('aria-hidden', 'true');
  const markerTag = experiment.visual === 'nodes' ? 'i' : 'span';
  const markerCount = visualMarkerCounts[experiment.visual] || 0;
  for (let index = 0; index < markerCount; index += 1) visual.append(createElement(markerTag));
  return visual;
}

function createExperimentCard(experiment) {
  const kind = getExperimentKind(experiment.kind);
  const link = createElement('a', `experiment-card experiment-card--${experiment.kind}`);
  link.href = experiment.href;
  link.append(createVisual(experiment));
  const copy = createElement('div', 'experiment-copy');
  const action = experiment.kind === 'simulador'
    ? 'Abrir simulador'
    : experiment.kind === 'treino'
      ? 'Iniciar treino'
      : 'Explorar experiência';
  const strong = createElement('strong', '', `${action} `);
  const arrow = createElement('span', '', '↗');
  arrow.setAttribute('aria-hidden', 'true');
  strong.append(arrow);
  copy.append(
    createElement('span', '', `ativo · ${kind?.label || experiment.kind} · ${experiment.technology}`),
    createElement('h3', '', experiment.shortTitle),
    createElement('p', '', experiment.summary),
    strong,
  );
  link.append(copy);
  return link;
}

function boot() {
  initNavigation();
  const grid = document.querySelector('[data-experiment-grid]');
  const activeExperiments = getActiveExperiments();
  const count = activeExperiments.length;
  const countLabel = document.querySelector('[data-experiment-count-label]');
  const countDetail = document.querySelector('[data-experiment-count]');
  if (countLabel) countLabel.textContent = formatCount(count);
  if (countDetail) countDetail.textContent = `${count} experiências navegáveis`;
  if (grid) grid.replaceChildren(...activeExperiments.map(createExperimentCard));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
