import { CONSTELLATIONS } from '../assets/data/constellations.js?v=constellation-atlas-v2';
import { createConstellationChart } from '../assets/js/constellation-chart.js?v=constellation-atlas-v2';
import {
  CONSTELLATION_SEASONS,
  filterConstellations,
  findConstellation,
  getAdjacentConstellation,
  getBrightestStar,
  getConstellationSources,
} from '../assets/js/constellation-model.js?v=constellation-atlas-v2';
import { initNavigation } from '../assets/js/navigation.js';
import { prefersReducedMotion } from '../assets/js/utils.js';

const pageUrl = new URL(window.location.href);
const requestedConstellation = pageUrl.searchParams.get('constelacao');
const requestedMatch = findConstellation(requestedConstellation);
const initialConstellation = requestedMatch || CONSTELLATIONS[0];

const state = {
  selectedId: initialConstellation?.id || '',
  hoveredOptionId: '',
  focusedOptionId: '',
  previewId: '',
  lastPointerType: '',
  guidePinned: false,
  query: '',
  seasonId: 'all',
  visibleConstellations: [...CONSTELLATIONS],
};

const dom = {};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatFieldNumber(constellation) {
  return String(CONSTELLATIONS.indexOf(constellation) + 1).padStart(2, '0');
}

function getVisibleOption(id) {
  return Array.from(dom.index?.querySelectorAll('[data-constellation-option]') || [])
    .find((button) => button.dataset.constellationOption === id && !button.hidden);
}

function createIndexButton(constellation) {
  const button = createElement('button', 'sky-atlas-index-button');
  button.type = 'button';
  button.dataset.constellationOption = constellation.id;
  button.setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-label', `Selecionar ${constellation.name}. ${constellation.signature}. ${constellation.season}.`);

  const chart = createElement('span', 'sky-atlas-index-chart');
  chart.append(createConstellationChart(constellation, { compact: true, showLabels: false }));

  const copy = createElement('span', 'sky-atlas-index-copy');
  copy.append(
    createElement('span', 'sky-atlas-index-number', `CAMPO ${formatFieldNumber(constellation)} · ${constellation.abbreviation}`),
    createElement('strong', 'sky-atlas-index-name', constellation.name),
    createElement('span', 'sky-atlas-index-meta', constellation.signature),
  );

  button.append(chart, copy);
  return button;
}

function createFilterButton(season) {
  const button = createElement('button', 'sky-atlas-filter-button', season.label);
  button.type = 'button';
  button.dataset.atlasSeason = season.id;
  button.setAttribute('aria-pressed', String(season.id === state.seasonId));
  return button;
}

function createSourceLink(source) {
  const link = createElement('a', 'sky-atlas-source-link', `${source.title} ↗`);
  link.href = source.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${source.title}, ${source.institution}, abrir fonte em nova aba`);
  return link;
}

function createDetailSection(title, ...paragraphs) {
  const section = createElement('section', 'sky-atlas-detail-section');
  section.append(createElement('h3', '', title), ...paragraphs);
  return section;
}

function renderDetail(constellation) {
  if (!dom.detail || !constellation) return;

  const brightestStar = getBrightestStar(constellation);
  const heading = createElement('div', 'sky-atlas-detail-heading');
  const badges = createElement('div', 'sky-atlas-detail-badges');
  badges.append(
    createElement('span', 'sky-atlas-detail-badge', constellation.signature),
    createElement('span', 'sky-atlas-detail-badge', `${constellation.stars.length} estrelas no guia`),
  );
  if (brightestStar) {
    badges.append(createElement('span', 'sky-atlas-detail-badge', `${brightestStar.name} · mag. ${brightestStar.magnitude}`));
  }
  heading.append(
    createElement('p', 'sky-atlas-detail-code', `${constellation.abbreviation} · ${constellation.latinName}`),
    createElement('h2', '', constellation.name),
    createElement('p', 'sky-atlas-detail-season', constellation.season),
    badges,
  );

  const keyStars = constellation.stars
    .filter((star) => star.label)
    .map((star) => star.name)
    .join(' · ');

  const recognition = createDetailSection(
    'Como reconhecer',
    createElement('p', '', constellation.recognition),
  );
  const stars = createDetailSection(
    'Estrelas de referência',
    createElement('p', 'sky-atlas-key-stars', keyStars),
  );
  const context = createDetailSection(
    'O que observar',
    createElement('p', '', constellation.fact),
    createElement('p', 'sky-atlas-guide-note', constellation.guideNote),
  );

  const relatedConstellations = constellation.relatedConstellationIds
    .map((id) => findConstellation(id))
    .filter(Boolean);
  const related = createElement('div', 'sky-atlas-related');
  if (relatedConstellations.length) {
    related.append(createElement('span', 'sky-atlas-detail-code', 'Campos relacionados'));
    relatedConstellations.forEach((item) => {
      const button = createElement('button', '', `${item.name} →`);
      button.type = 'button';
      button.dataset.relatedConstellation = item.id;
      related.append(button);
    });
  }

  const sources = createElement('div', 'sky-atlas-detail-sources');
  sources.append(
    createElement('span', '', 'Fontes científicas'),
    ...getConstellationSources(constellation).map(createSourceLink),
  );

  dom.detail.replaceChildren(
    heading,
    recognition,
    stars,
    context,
    ...(relatedConstellations.length ? [related] : []),
    sources,
  );
}

function renderStage(constellation, { preview = false } = {}) {
  if (!constellation || !dom.stage || !dom.chart) return;
  dom.chart.replaceChildren(createConstellationChart(constellation));
  dom.fieldCode.textContent = `CAMPO ${formatFieldNumber(constellation)} · ${constellation.abbreviation}`;
  dom.stage.dataset.preview = String(preview);
  dom.stage.dataset.guidePinned = String(state.guidePinned && !preview);
  dom.stage.setAttribute(
    'aria-label',
    `Campo esquemático de ${constellation.name}. Passe o mouse, use o foco ou fixe a linha-guia para revelar o padrão.`,
  );
  renderDetail(constellation);
  syncGuideControl();
}

function renderSelected() {
  const constellation = findConstellation(state.selectedId, CONSTELLATIONS[0]);
  state.previewId = '';
  renderStage(constellation);
}

function clearPreviewSources() {
  state.hoveredOptionId = '';
  state.focusedOptionId = '';
  state.previewId = '';
}

function syncOptionPreview() {
  const previewId = state.hoveredOptionId || state.focusedOptionId;
  const constellation = findConstellation(previewId);
  if (!constellation) {
    renderSelected();
    return;
  }
  state.previewId = constellation.id;
  renderStage(constellation, { preview: true });
}

function setOptionPreview(source, id) {
  state[source] = id;
  syncOptionPreview();
}

function clearOptionPreview(source, id) {
  if (state[source] !== id) return;
  state[source] = '';
  syncOptionPreview();
}

function syncGuideControl() {
  if (!dom.guideToggle || !dom.guideLabel || !dom.guideCue) return;
  dom.guideToggle.setAttribute('aria-pressed', String(state.guidePinned));
  dom.guideLabel.textContent = state.guidePinned ? 'Soltar linha-guia' : 'Fixar linha-guia';
  dom.guideCue.textContent = state.guidePinned
    ? 'Linha-guia fixada'
    : state.previewId
      ? 'Prévia do campo'
      : 'Passe o mouse ou use o foco para revelar';
}

function setGuidePinned(pinned) {
  clearPreviewSources();
  state.guidePinned = pinned;
  renderSelected();
  announce(state.guidePinned ? 'Linha-guia fixada.' : 'Linha-guia liberada.');
}

function syncSelectionVisuals() {
  const selectedIndex = CONSTELLATIONS.findIndex((item) => item.id === state.selectedId);
  dom.position.textContent = `${String(selectedIndex + 1).padStart(2, '0')} / ${String(CONSTELLATIONS.length).padStart(2, '0')}`;

  dom.index.querySelectorAll('[data-constellation-option]').forEach((button) => {
    const selected = button.dataset.constellationOption === state.selectedId;
    button.setAttribute('aria-pressed', String(selected));
    button.tabIndex = selected && !button.hidden ? 0 : -1;
  });
}

function syncUrl(constellation) {
  const url = new URL(window.location.href);
  url.searchParams.set('constelacao', constellation.slug);
  window.history.replaceState({ constellation: constellation.slug }, '', url);
}

function normalizeInvalidInitialUrl() {
  if (!requestedConstellation || requestedMatch) return;
  const url = new URL(window.location.href);
  url.searchParams.delete('constelacao');
  window.history.replaceState({}, '', url);
}

function scrollOptionIntoView(constellation, behavior) {
  const option = getVisibleOption(constellation.id);
  if (!option || !dom.index || dom.index.scrollWidth <= dom.index.clientWidth + 2) return;
  const maximumLeft = dom.index.scrollWidth - dom.index.clientWidth;
  const centeredLeft = option.offsetLeft - (dom.index.clientWidth - option.offsetWidth) / 2;
  dom.index.scrollTo({
    left: Math.min(maximumLeft, Math.max(0, centeredLeft)),
    behavior: behavior || (prefersReducedMotion() ? 'auto' : 'smooth'),
  });
}

function announce(message) {
  dom.announcement.textContent = '';
  requestAnimationFrame(() => {
    dom.announcement.textContent = message;
  });
}

function resetFilters() {
  state.query = '';
  state.seasonId = 'all';
  dom.search.value = '';
  dom.filters.querySelectorAll('[data-atlas-season]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.atlasSeason === 'all'));
  });
  applyFilters({ selectFallback: false });
}

function selectConstellation(id, options = {}) {
  const constellation = findConstellation(id);
  if (!constellation) return;

  if (!state.visibleConstellations.some((item) => item.id === constellation.id)) resetFilters();

  if (options.clearPreview !== false) clearPreviewSources();
  state.selectedId = constellation.id;
  if (typeof options.pinGuide === 'boolean') state.guidePinned = options.pinGuide;
  syncSelectionVisuals();
  renderStage(constellation);
  if (options.syncUrl !== false) syncUrl(constellation);
  if (options.scroll !== false) scrollOptionIntoView(constellation, options.behavior);
  if (options.announce !== false) {
    announce(`${constellation.name} selecionada. Campo e informações atualizados.`);
  }
}

function formatResultCount(count) {
  return count === 1 ? '1 constelação disponível' : `${count} constelações disponíveis`;
}

function applyFilters({ selectFallback = true } = {}) {
  state.visibleConstellations = filterConstellations({
    query: state.query,
    seasonId: state.seasonId,
  });
  const visibleIds = new Set(state.visibleConstellations.map((constellation) => constellation.id));
  let previewChanged = false;

  ['hoveredOptionId', 'focusedOptionId'].forEach((source) => {
    if (state[source] && !visibleIds.has(state[source])) {
      state[source] = '';
      previewChanged = true;
    }
  });

  dom.index.querySelectorAll('[data-constellation-option]').forEach((button) => {
    button.hidden = !visibleIds.has(button.dataset.constellationOption);
  });
  dom.resultCount.textContent = formatResultCount(state.visibleConstellations.length);
  dom.empty.hidden = state.visibleConstellations.length !== 0;
  dom.previous.disabled = state.visibleConstellations.length < 2;
  dom.next.disabled = state.visibleConstellations.length < 2;

  if (selectFallback && state.visibleConstellations.length && !visibleIds.has(state.selectedId)) {
    selectConstellation(state.visibleConstellations[0].id, {
      pinGuide: false,
      scroll: false,
      announce: false,
    });
  } else {
    syncSelectionVisuals();
    if (previewChanged) syncOptionPreview();
  }
}

function moveSelection(direction, { focus = false } = {}) {
  const constellation = getAdjacentConstellation(
    state.selectedId,
    direction,
    state.visibleConstellations,
  );
  if (!constellation) return;
  selectConstellation(constellation.id);
  if (focus) getVisibleOption(constellation.id)?.focus({ preventScroll: true });
}

function moveToBoundary(position) {
  if (!state.visibleConstellations.length) return;
  const constellation = position === 'start'
    ? state.visibleConstellations[0]
    : state.visibleConstellations.at(-1);
  selectConstellation(constellation.id);
  getVisibleOption(constellation.id)?.focus({ preventScroll: true });
}

function bindCatalogEvents() {
  dom.index.addEventListener('pointerdown', (event) => {
    state.lastPointerType = event.pointerType;
  });

  dom.index.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-constellation-option]')
      : null;
    if (!button) return;
    const pointerType = event.detail === 0 ? 'keyboard' : event.pointerType || state.lastPointerType;
    const touchLike = ['touch', 'pen'].includes(pointerType);
    if (pointerType === 'keyboard') state.hoveredOptionId = '';
    if (pointerType === 'mouse') state.focusedOptionId = '';
    selectConstellation(button.dataset.constellationOption, {
      clearPreview: touchLike,
      pinGuide: touchLike ? true : undefined,
    });
    if (!touchLike) syncOptionPreview();
  });

  dom.index.addEventListener('pointerover', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-constellation-option]')
      : null;
    if (!button || button.contains(event.relatedTarget) || ['touch', 'pen'].includes(event.pointerType)) return;
    setOptionPreview('hoveredOptionId', button.dataset.constellationOption);
  });

  dom.index.addEventListener('pointerout', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-constellation-option]')
      : null;
    if (!button || button.contains(event.relatedTarget) || ['touch', 'pen'].includes(event.pointerType)) return;
    clearOptionPreview('hoveredOptionId', button.dataset.constellationOption);
  });

  dom.index.addEventListener('focusin', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-constellation-option]')
      : null;
    if (button?.matches(':focus-visible')) {
      state.hoveredOptionId = '';
      setOptionPreview('focusedOptionId', button.dataset.constellationOption);
    }
  });

  dom.index.addEventListener('focusout', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-constellation-option]')
      : null;
    if (!button || button.contains(event.relatedTarget)) return;
    clearOptionPreview('focusedOptionId', button.dataset.constellationOption);
  });

  dom.index.addEventListener('keydown', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-constellation-option]')
      : null;
    if (!button) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveSelection(event.key === 'ArrowRight' ? 1 : -1, { focus: true });
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      moveToBoundary(event.key === 'Home' ? 'start' : 'end');
    }
  });
}

function bindControls() {
  dom.previous.addEventListener('click', () => moveSelection(-1));
  dom.next.addEventListener('click', () => moveSelection(1));

  dom.guideToggle.addEventListener('click', () => setGuidePinned(!state.guidePinned));

  dom.stage.addEventListener('pointerup', (event) => {
    if (!['touch', 'pen'].includes(event.pointerType) || state.guidePinned) return;
    setGuidePinned(true);
  });

  dom.stage.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveSelection(event.key === 'ArrowRight' ? 1 : -1);
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      moveToBoundary(event.key === 'Home' ? 'start' : 'end');
      dom.stage.focus({ preventScroll: true });
    }
  });

  dom.search.addEventListener('input', () => {
    state.query = dom.search.value;
    applyFilters();
  });

  dom.filters.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-atlas-season]')
      : null;
    if (!button) return;
    state.seasonId = button.dataset.atlasSeason;
    dom.filters.querySelectorAll('[data-atlas-season]').forEach((filterButton) => {
      filterButton.setAttribute('aria-pressed', String(filterButton === button));
    });
    applyFilters();
  });

  dom.detail.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-related-constellation]')
      : null;
    if (button) selectConstellation(button.dataset.relatedConstellation);
  });

  window.addEventListener('popstate', () => {
    const requested = new URL(window.location.href).searchParams.get('constelacao');
    const constellation = findConstellation(requested, CONSTELLATIONS[0]);
    selectConstellation(constellation.id, {
      syncUrl: false,
      announce: false,
      pinGuide: false,
    });
  });
}

function cacheElements() {
  Object.assign(dom, {
    stage: document.querySelector('[data-atlas-stage]'),
    chart: document.querySelector('[data-atlas-chart]'),
    fieldCode: document.querySelector('[data-atlas-field-code]'),
    guideCue: document.querySelector('[data-atlas-guide-cue]'),
    guideToggle: document.querySelector('[data-atlas-guide-toggle]'),
    guideLabel: document.querySelector('[data-atlas-guide-label]'),
    position: document.querySelector('[data-atlas-position]'),
    detail: document.querySelector('[data-atlas-detail]'),
    index: document.querySelector('[data-atlas-index]'),
    search: document.querySelector('[data-atlas-search]'),
    filters: document.querySelector('[data-atlas-filters]'),
    resultCount: document.querySelector('[data-atlas-result-count]'),
    empty: document.querySelector('[data-atlas-empty]'),
    previous: document.querySelector('[data-atlas-previous]'),
    next: document.querySelector('[data-atlas-next]'),
    announcement: document.querySelector('[data-atlas-announcement]'),
  });
  return Object.values(dom).every(Boolean);
}

function renderAtlas() {
  const usedSeasonIds = new Set(CONSTELLATIONS.map((constellation) => constellation.seasonId));
  const seasons = CONSTELLATION_SEASONS.filter((season) => (
    season.id === 'all' || usedSeasonIds.has(season.id)
  ));
  dom.filters.replaceChildren(...seasons.map(createFilterButton));
  dom.index.replaceChildren(...CONSTELLATIONS.map(createIndexButton));
  applyFilters({ selectFallback: false });
  syncSelectionVisuals();
  renderSelected();
}

function boot() {
  initNavigation();
  if (!cacheElements()) return;
  normalizeInvalidInitialUrl();
  renderAtlas();
  bindCatalogEvents();
  bindControls();
  if (requestedMatch) {
    requestAnimationFrame(() => scrollOptionIntoView(requestedMatch, 'auto'));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
