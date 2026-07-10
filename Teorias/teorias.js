import { initNavigation } from '../assets/js/navigation.js';
import { $, $$, safeSetText } from '../assets/js/utils.js';
import { THEORIES, THEORY_FILTERS } from '../assets/data/theories.js';

const state = {
  query: '',
  filter: 'todas',
  activeId: THEORIES[0]?.id || '',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getTheory(id) {
  return THEORIES.find((theory) => theory.id === id) || THEORIES[0];
}

function getFilterLabel(id) {
  return THEORY_FILTERS.find((filter) => filter.id === id)?.label || 'Todas';
}

function searchableText(theory) {
  return normalize([
    theory.code,
    theory.title,
    theory.shortTitle,
    theory.subtitle,
    theory.summary,
    theory.hypothesis,
    theory.status,
    theory.stage,
    theory.category,
    theory.filters?.join(' '),
    theory.concepts?.join(' '),
    theory.questions?.join(' '),
    theory.needs?.join(' '),
    theory.connections?.join(' '),
  ].join(' '));
}

function matchesFilter(theory) {
  return state.filter === 'todas' || theory.category === state.filter || theory.filters.includes(state.filter);
}

function matchesQuery(theory) {
  if (!state.query) return true;
  return searchableText(theory).includes(normalize(state.query));
}

function getFilteredTheories() {
  return THEORIES.filter((theory) => matchesFilter(theory) && matchesQuery(theory));
}

function listMarkup(items = []) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function tagsMarkup(tags = []) {
  return tags.slice(0, 6).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
}

function relatedMarkup(theory) {
  const related = (theory.connections || [])
    .map((id) => getTheory(id))
    .filter(Boolean)
    .slice(0, 4);

  if (!related.length) return '<span class="muted-line">Ainda sem conexões catalogadas.</span>';

  return related.map((item) => `
    <button class="related-chip" type="button" data-related-id="${escapeHtml(item.id)}">
      <span>${escapeHtml(item.code)}</span>
      ${escapeHtml(item.shortTitle || item.title)}
    </button>
  `).join('');
}

function renderFilters() {
  const rail = $('[data-filter-rail]');
  if (!rail) return;

  rail.innerHTML = THEORY_FILTERS.map((filter) => `
    <button class="archive-filter-chip${filter.id === state.filter ? ' is-active' : ''}" type="button" role="listitem" data-filter-id="${escapeHtml(filter.id)}" aria-pressed="${filter.id === state.filter}">
      <span>${escapeHtml(filter.label)}</span>
    </button>
  `).join('');
}

function cardMarkup(theory) {
  const active = theory.id === state.activeId;
  const detailId = `${theory.id}-mobile-detail`;

  return `
    <article class="archive-theory-card${active ? ' is-active' : ''}" style="--accent:${theory.color}; --accent-glow:${theory.glow};" data-theory-card="${escapeHtml(theory.id)}">
      <button class="archive-card-trigger" type="button" data-theory-id="${escapeHtml(theory.id)}" aria-expanded="${active}" aria-controls="${detailId}">
        <span class="archive-card-meta-line">
          <span class="theory-code">${escapeHtml(theory.code)}</span>
          <span class="status-badge">${escapeHtml(theory.status)}</span>
        </span>
        <span class="archive-card-title">${escapeHtml(theory.title)}</span>
        <span class="archive-card-subtitle">${escapeHtml(theory.subtitle)}</span>
        <span class="archive-card-summary">${escapeHtml(theory.summary)}</span>
        <span class="archive-card-footer">
          <span>${escapeHtml(theory.category)}</span>
          <span>${theory.questions.length} perguntas</span>
          <span>${theory.progress}% maturação</span>
        </span>
      </button>
      <div class="mobile-theory-detail" id="${detailId}" ${active ? '' : 'hidden'}>
        ${compactDetailMarkup(theory)}
      </div>
    </article>
  `;
}

function compactDetailMarkup(theory) {
  return `
    <div class="mobile-detail-section">
      <h4>Hipótese central</h4>
      <p>${escapeHtml(theory.hypothesis)}</p>
    </div>
    <div class="mobile-detail-section">
      <h4>Conceitos conectados</h4>
      <div class="tag-list">${tagsMarkup(theory.concepts)}</div>
    </div>
    <div class="mobile-detail-section">
      <h4>Próximo refinamento</h4>
      <ul>${listMarkup((theory.needs || []).slice(0, 2))}</ul>
    </div>
  `;
}

function renderCards(theories) {
  const grid = $('[data-theory-archive-grid]');
  const empty = $('[data-empty-state]');
  if (!grid) return;

  grid.innerHTML = theories.map(cardMarkup).join('');
  if (empty) empty.hidden = theories.length > 0;
}

function renderDossier() {
  const dossier = $('[data-theory-dossier]');
  if (!dossier) return;

  const theory = getTheory(state.activeId);
  if (!theory) {
    dossier.innerHTML = '<p>Nenhuma teoria selecionada.</p>';
    return;
  }

  dossier.style.setProperty('--accent', theory.color);
  dossier.style.setProperty('--accent-glow', theory.glow);
  dossier.innerHTML = `
    <div class="dossier-header">
      <p class="detail-kicker">${escapeHtml(theory.code)} · ${escapeHtml(theory.status)}</p>
      <h3>${escapeHtml(theory.title)}</h3>
      <p>${escapeHtml(theory.subtitle)}</p>
    </div>

    <div class="dossier-metrics" aria-label="Resumo da teoria selecionada">
      <span><strong>${theory.progress}%</strong> maturação</span>
      <span><strong>${theory.questions.length}</strong> perguntas</span>
      <span><strong>${theory.concepts.length}</strong> conceitos</span>
    </div>

    <div class="dossier-section">
      <h4>Hipótese central</h4>
      <p>${escapeHtml(theory.hypothesis)}</p>
    </div>

    <div class="dossier-section">
      <h4>Perguntas abertas</h4>
      <ul>${listMarkup(theory.questions)}</ul>
    </div>

    <div class="dossier-section">
      <h4>Conceitos conectados</h4>
      <div class="tag-list">${tagsMarkup(theory.concepts)}</div>
    </div>

    <div class="dossier-section">
      <h4>O que ainda precisa amadurecer</h4>
      <ul>${listMarkup(theory.needs)}</ul>
    </div>

    <div class="dossier-section">
      <h4>Teorias relacionadas</h4>
      <div class="related-chip-list">${relatedMarkup(theory)}</div>
    </div>

    <div class="dossier-section stage-note">
      <h4>Estágio</h4>
      <p>${escapeHtml(theory.stage)}</p>
    </div>
  `;
}

function updateSummary(theories) {
  safeSetText($('[data-theories-total]'), String(THEORIES.length));
  safeSetText($('[data-category-total]'), String(Math.max(THEORY_FILTERS.length - 1, 0)));
  safeSetText(
    $('[data-result-count]'),
    `${theories.length} ${theories.length === 1 ? 'teoria encontrada' : 'teorias encontradas'} · ${THEORIES.length} no arquivo`,
  );
  safeSetText(
    $('[data-active-filter]'),
    state.query
      ? `${getFilterLabel(state.filter)} · busca: “${state.query}”`
      : `${getFilterLabel(state.filter)} · sem busca ativa`,
  );
}

function syncActiveStates() {
  $$('[data-theory-card]').forEach((card) => {
    const active = card.dataset.theoryCard === state.activeId;
    card.classList.toggle('is-active', active);
    const trigger = $('[data-theory-id]', card);
    const inline = $('.mobile-theory-detail', card);
    trigger?.setAttribute('aria-expanded', String(active));
    if (inline) inline.hidden = !active;
  });
}

function setActiveTheory(id, options = {}) {
  const theory = getTheory(id);
  if (!theory) return;

  state.activeId = theory.id;
  syncActiveStates();
  renderDossier();

  if (options.scrollDossier) {
    $('[data-theory-dossier]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function render() {
  const theories = getFilteredTheories();
  if (theories.length && !theories.some((theory) => theory.id === state.activeId)) {
    state.activeId = theories[0].id;
  }

  renderFilters();
  renderCards(theories);
  renderDossier();
  updateSummary(theories);
  syncActiveStates();
}

function closestFromEvent(event, selector) {
  const target = event.target instanceof Element ? event.target : event.target?.parentElement;
  return target?.closest(selector) || null;
}

function bindEvents() {
  const search = $('[data-theory-search]');
  const rail = $('[data-filter-rail]');
  const grid = $('[data-theory-archive-grid]');
  const reset = $('[data-reset-filters]');
  const dossier = $('[data-theory-dossier]');

  search?.addEventListener('input', () => {
    state.query = search.value.trim();
    render();
  });

  rail?.addEventListener('click', (event) => {
    const button = closestFromEvent(event, '[data-filter-id]');
    if (!button) return;
    state.filter = button.dataset.filterId || 'todas';
    render();
  });

  grid?.addEventListener('click', (event) => {
    const button = closestFromEvent(event, '[data-theory-id]');
    if (!button) return;
    setActiveTheory(button.dataset.theoryId);
  });

  grid?.addEventListener('keydown', (event) => {
    const button = closestFromEvent(event, '[data-theory-id]');
    if (!button || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    setActiveTheory(button.dataset.theoryId);
  });

  dossier?.addEventListener('click', (event) => {
    const related = closestFromEvent(event, '[data-related-id]');
    if (!related) return;
    const id = related.dataset.relatedId;
    const relatedTheory = getTheory(id);
    if (!relatedTheory) return;
    state.filter = 'todas';
    state.query = '';
    if (search) search.value = '';
    render();
    setActiveTheory(id, { scrollDossier: true });
  });

  reset?.addEventListener('click', () => {
    state.query = '';
    state.filter = 'todas';
    if (search) search.value = '';
    render();
    search?.focus();
  });
}

function boot() {
  initNavigation();
  bindEvents();
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
