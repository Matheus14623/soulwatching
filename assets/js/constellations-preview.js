import { createConstellationChart } from './constellation-chart.js?v=constellation-atlas-v2';
import * as constellationModel from './constellation-model.js?v=constellation-atlas-v2';

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createPreviewCard(constellation) {
  const link = createElement('a', 'sky-guide-preview-card');
  link.href = `Constelacoes/constelacoes.html?constelacao=${encodeURIComponent(constellation.slug)}#atlas`;
  link.setAttribute('aria-label', `Abrir ${constellation.name} no atlas de constelações`);

  const chart = createElement('span', 'sky-guide-preview-chart');
  chart.append(createConstellationChart(constellation, { compact: true, showLabels: false }));

  const copy = createElement('span', 'sky-guide-preview-copy');
  const meta = createElement('span', 'sky-guide-preview-meta', `${constellation.abbreviation} · ${constellation.season}`);
  const title = createElement('strong', 'sky-guide-preview-name', constellation.name);
  const cue = createElement('span', 'sky-guide-preview-cue', constellation.recognition);
  const action = createElement('span', 'sky-guide-preview-action', 'Explorar no atlas →');
  copy.append(meta, title, cue, action);
  link.append(chart, copy);
  return link;
}

export function initConstellationsPreview() {
  const target = document.querySelector('[data-constellations-preview]');
  if (!target || target.dataset.initialized === 'true') return;
  target.dataset.initialized = 'true';

  const catalogCount = constellationModel.getConstellationCount?.();
  if (Number.isInteger(catalogCount) && catalogCount > 0) {
    document.querySelectorAll('[data-constellation-count]').forEach((element) => {
      element.textContent = String(catalogCount);
    });
  }

  target.replaceChildren(...constellationModel.getFeaturedConstellations().map(createPreviewCard));
}
