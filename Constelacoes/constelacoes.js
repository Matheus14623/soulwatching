import { CONSTELLATIONS } from '../assets/data/generated/runtime/constellations.js';
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
import { initWhaleSharkEasterEgg } from './whale-shark-easter-egg.js?v=whale-shark-v1';

const pageUrl = new URL(window.location.href);
const requestedConstellation = pageUrl.searchParams.get('constelacao');
const requestedTraining = pageUrl.searchParams.get('modo') === 'treino';
const requestedMatch = findConstellation(requestedConstellation);
const initialConstellation = requestedMatch || CONSTELLATIONS[0];
const trainingRoundCount = 8;

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
  training: false,
  trainingRound: 0,
  trainingScore: 0,
  trainingTargetId: '',
  trainingRevealed: false,
  trainingComplete: false,
  preTrainingSelectedId: initialConstellation?.id || '',
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
  dom.chart.replaceChildren(createConstellationChart(constellation, {
    showLabels: !state.training || state.trainingRevealed,
  }));
  dom.fieldCode.textContent = state.training && !state.trainingRevealed
    ? 'CAMPO DE TREINO'
    : `CAMPO ${formatFieldNumber(constellation)} · ${constellation.abbreviation}`;
  dom.stage.dataset.preview = String(!state.training && preview);
  dom.stage.dataset.guidePinned = String(!state.training && state.guidePinned && !preview);
  dom.stage.dataset.trainingRevealed = String(state.trainingRevealed);
  dom.stage.setAttribute(
    'aria-label',
    state.training
      ? state.trainingRevealed
        ? `Campo de treino revelado: ${constellation.name}, com linhas-guia e nomes de estrelas.`
        : 'Campo de treino com apenas as estrelas visíveis. Escolha uma resposta antes de revelar o padrão.'
      : `Campo esquemático de ${constellation.name}. Passe o mouse, use o foco ou fixe a linha-guia para revelar o padrão.`,
  );
  if (!state.training) renderDetail(constellation);
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
  if (state.training) {
    dom.guideCue.textContent = state.trainingRevealed
      ? 'Padrão e nomes revelados'
      : 'Escolha uma resposta para revelar';
    return;
  }
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

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function syncTrainingUrl(active) {
  const url = new URL(window.location.href);
  if (active) url.searchParams.set('modo', 'treino');
  else url.searchParams.delete('modo');
  window.history.replaceState({ training: active }, '', url);
}

function createTrainingAnswer(constellation) {
  const button = createElement('button', 'sky-atlas-training-answer', constellation.name);
  button.type = 'button';
  button.dataset.trainingAnswer = constellation.id;
  return button;
}

function renderTrainingRound({ focusAnswer = false } = {}) {
  const target = findConstellation(state.trainingTargetId);
  if (!target) return;
  const distractors = shuffled(CONSTELLATIONS.filter((item) => item.id !== target.id)).slice(0, 3);
  const options = shuffled([target, ...distractors]);
  dom.trainingProgress.textContent = `RODADA ${String(state.trainingRound).padStart(2, '0')} / ${String(trainingRoundCount).padStart(2, '0')} · ${state.trainingScore} ${state.trainingScore === 1 ? 'ACERTO' : 'ACERTOS'}`;
  dom.trainingQuestion.textContent = 'Qual constelação corresponde a este campo?';
  dom.trainingAnswers.hidden = false;
  dom.trainingAnswers.replaceChildren(...options.map(createTrainingAnswer));
  dom.trainingFeedback.textContent = '';
  dom.announcement.textContent = '';
  dom.trainingNext.hidden = true;
  state.trainingRevealed = false;
  state.trainingComplete = false;
  state.selectedId = target.id;
  state.guidePinned = false;
  dom.position.textContent = `${String(state.trainingRound).padStart(2, '0')} / ${String(trainingRoundCount).padStart(2, '0')}`;
  renderStage(target);
  if (focusAnswer) {
    requestAnimationFrame(() => dom.trainingAnswers.querySelector('[data-training-answer]')?.focus({ preventScroll: true }));
  }
}

function selectTrainingTarget(options = {}) {
  const candidates = CONSTELLATIONS.filter((item) => item.id !== state.trainingTargetId);
  const target = candidates[Math.floor(Math.random() * candidates.length)] || CONSTELLATIONS[0];
  state.trainingTargetId = target.id;
  renderTrainingRound(options);
}

function finishTraining() {
  state.trainingComplete = true;
  dom.trainingAnswers.hidden = true;
  dom.trainingQuestion.textContent = 'Rodada concluída.';
  dom.trainingProgress.textContent = `${state.trainingScore} DE ${trainingRoundCount} RESPOSTAS CORRETAS`;
  dom.trainingFeedback.textContent = state.trainingScore === trainingRoundCount
    ? 'Você reconheceu todos os padrões desta rodada.'
    : 'Use as respostas reveladas para comparar os padrões e tente novamente quando quiser.';
  dom.trainingNext.textContent = 'Treinar novamente';
  dom.trainingNext.hidden = false;
  announce(`Treino concluído com ${state.trainingScore} acertos em ${trainingRoundCount}.`);
}

function advanceTraining() {
  if (state.trainingComplete) {
    state.trainingRound = 1;
    state.trainingScore = 0;
    selectTrainingTarget({ focusAnswer: true });
    return;
  }
  if (state.trainingRound >= trainingRoundCount) {
    finishTraining();
    return;
  }
  state.trainingRound += 1;
  selectTrainingTarget({ focusAnswer: true });
}

function answerTraining(answerId) {
  if (!state.training || state.trainingRevealed) return;
  const target = findConstellation(state.trainingTargetId);
  if (!target) return;
  const correct = answerId === target.id;
  if (correct) state.trainingScore += 1;
  state.trainingRevealed = true;
  dom.trainingAnswers.querySelectorAll('[data-training-answer]').forEach((button) => {
    const isCorrect = button.dataset.trainingAnswer === target.id;
    button.disabled = true;
    button.dataset.correct = String(isCorrect);
    button.dataset.selected = String(button.dataset.trainingAnswer === answerId);
  });
  dom.trainingProgress.textContent = `RODADA ${String(state.trainingRound).padStart(2, '0')} / ${String(trainingRoundCount).padStart(2, '0')} · ${state.trainingScore} ${state.trainingScore === 1 ? 'ACERTO' : 'ACERTOS'}`;
  dom.trainingFeedback.textContent = correct
    ? `Correto: ${target.name}. As linhas-guia agora estão visíveis.`
    : `Era ${target.name}. Compare o desenho revelado com o padrão que você imaginou.`;
  dom.trainingNext.textContent = state.trainingRound >= trainingRoundCount ? 'Encerrar rodada' : 'Próximo campo';
  dom.trainingNext.hidden = false;
  renderStage(target);
  announce(dom.trainingFeedback.textContent);
  dom.trainingNext.focus({ preventScroll: true });
}

function startTraining({ updateUrl = true, scroll = true } = {}) {
  state.preTrainingSelectedId = state.selectedId;
  state.training = true;
  state.trainingRound = 1;
  state.trainingScore = 0;
  state.trainingTargetId = '';
  state.trainingRevealed = false;
  state.trainingComplete = false;
  dom.atlas.dataset.trainingActive = 'true';
  dom.training.hidden = false;
  dom.trainingToggle.setAttribute('aria-pressed', 'true');
  dom.trainingLabel.textContent = 'Sair do treino';
  dom.readoutLabel.textContent = 'RODADA ATIVA';
  if (updateUrl) syncTrainingUrl(true);
  selectTrainingTarget();
  if (scroll) dom.training.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
  announce('Modo treino iniciado. Observe o campo e escolha uma das quatro respostas.');
}

function stopTraining({ updateUrl = true, restoreSelection = true } = {}) {
  const previousSelection = findConstellation(state.preTrainingSelectedId, CONSTELLATIONS[0]);
  state.training = false;
  state.trainingRevealed = false;
  state.trainingComplete = false;
  dom.atlas.dataset.trainingActive = 'false';
  dom.training.hidden = true;
  dom.trainingToggle.setAttribute('aria-pressed', 'false');
  dom.trainingLabel.textContent = 'Modo treino';
  dom.readoutLabel.textContent = 'CAMPO ATIVO';
  if (updateUrl) syncTrainingUrl(false);
  clearPreviewSources();
  state.guidePinned = false;
  if (restoreSelection) {
    selectConstellation(previousSelection.id, {
      announce: false,
      pinGuide: false,
      scroll: false,
      syncUrl: updateUrl,
    });
  } else {
    syncSelectionVisuals();
    renderSelected();
  }
  announce('Modo treino encerrado. Atlas livre restaurado.');
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
    : state.visibleConstellations[state.visibleConstellations.length - 1];
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

  dom.trainingToggle.addEventListener('click', () => {
    if (state.training) stopTraining();
    else startTraining();
  });

  dom.trainingAnswers.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-training-answer]')
      : null;
    if (button) answerTraining(button.dataset.trainingAnswer);
  });

  dom.trainingNext.addEventListener('click', advanceTraining);

  dom.stage.addEventListener('pointerup', (event) => {
    if (state.training || !['touch', 'pen'].includes(event.pointerType) || state.guidePinned) return;
    setGuidePinned(true);
  });

  dom.stage.addEventListener('keydown', (event) => {
    if (state.training) return;
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
    const currentUrl = new URL(window.location.href);
    const shouldTrain = currentUrl.searchParams.get('modo') === 'treino';
    if (shouldTrain && !state.training) startTraining({ updateUrl: false, scroll: false });
    if (!shouldTrain && state.training) stopTraining({ updateUrl: false, restoreSelection: false });
    if (shouldTrain) return;
    const requested = currentUrl.searchParams.get('constelacao');
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
    atlas: document.querySelector('[data-sky-atlas]'),
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
    readoutLabel: document.querySelector('[data-atlas-readout-label]'),
    training: document.querySelector('[data-atlas-training]'),
    trainingToggle: document.querySelector('[data-atlas-training-toggle]'),
    trainingLabel: document.querySelector('[data-atlas-training-label]'),
    trainingProgress: document.querySelector('[data-atlas-training-progress]'),
    trainingQuestion: document.querySelector('[data-atlas-training-question]'),
    trainingAnswers: document.querySelector('[data-atlas-training-answers]'),
    trainingFeedback: document.querySelector('[data-atlas-training-feedback]'),
    trainingNext: document.querySelector('[data-atlas-training-next]'),
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
  dom.atlas.dataset.trainingActive = 'false';
  if (requestedTraining) startTraining({ updateUrl: false, scroll: false });
}

function boot() {
  initNavigation();
  initWhaleSharkEasterEgg();
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
