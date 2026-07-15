import { initNavigation } from '../assets/js/navigation.js';
import { $, $$, debounce, safeSetText } from '../assets/js/utils.js';
import { THEORIES, THEORY_FILTERS } from '../assets/data/theories.js';

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function findTheory(id) {
  return THEORIES.find((theory) => theory.id === id || theory.slug === id) || null;
}

function getInitialTheoryId() {
  const requested = new URL(window.location.href).searchParams.get('teoria');
  return findTheory(requested)?.id || THEORIES[0]?.id || '';
}

const state = {
  query: '',
  category: 'todas',
  phase: 'todas',
  status: 'todos',
  concept: 'todos',
  activeId: getInitialTheoryId(),
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

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort(collator.compare);
}

function getFilterLabel(id) {
  return THEORY_FILTERS.find((filter) => filter.id === id)?.label || 'Todas';
}

function searchableText(theory) {
  const relatedTitles = theory.connections
    .map((id) => findTheory(id))
    .filter(Boolean)
    .flatMap((item) => [item.code, item.title, item.shortTitle]);

  return normalize([
    theory.code,
    theory.slug,
    theory.title,
    theory.shortTitle,
    theory.subtitle,
    theory.summary,
    theory.centralIdea,
    theory.centralQuestion,
    theory.hypothesis,
    theory.theoreticalTension,
    theory.status,
    theory.phase,
    theory.stage,
    theory.category,
    theory.sourceFile,
    theory.filters?.join(' '),
    theory.concepts?.join(' '),
    theory.questions?.join(' '),
    theory.developmentNotes?.join(' '),
    relatedTitles.join(' '),
  ].join(' '));
}

function matchesTheory(theory) {
  const categoryMatch = state.category === 'todas'
    || theory.category === state.category
    || theory.filters.includes(state.category);
  const phaseMatch = state.phase === 'todas' || theory.phase === state.phase;
  const statusMatch = state.status === 'todos' || theory.status === state.status;
  const conceptMatch = state.concept === 'todos'
    || theory.concepts.some((concept) => normalize(concept) === normalize(state.concept));
  const queryMatch = !state.query || searchableText(theory).includes(normalize(state.query));

  return categoryMatch && phaseMatch && statusMatch && conceptMatch && queryMatch;
}

function getFilteredTheories() {
  return THEORIES.filter(matchesTheory);
}

function listMarkup(items = []) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function tagsMarkup(tags = [], limit = 8) {
  return tags.slice(0, limit).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
}

function relatedTheories(theory) {
  return (theory.connections || []).map((id) => findTheory(id)).filter(Boolean);
}

function relatedMarkup(theory) {
  const related = relatedTheories(theory);
  if (!related.length) return '<span class="muted-line">Ainda sem conexões catalogadas.</span>';

  return related.map((item) => `
    <button class="related-chip" type="button" data-related-id="${escapeHtml(item.id)}">
      <span>${escapeHtml(item.code)}</span>
      ${escapeHtml(item.shortTitle || item.title)}
    </button>
  `).join('');
}

function renderCategoryFilters() {
  const rail = $('[data-filter-rail]');
  if (!rail) return;

  rail.innerHTML = THEORY_FILTERS.map((filter) => {
    const count = filter.id === 'todas'
      ? THEORIES.length
      : THEORIES.filter((theory) => theory.category === filter.id || theory.filters.includes(filter.id)).length;
    const active = filter.id === state.category;

    return `
      <button class="archive-filter-chip${active ? ' is-active' : ''}" type="button" role="listitem" data-filter-id="${escapeHtml(filter.id)}" aria-pressed="${active}">
        <span>${escapeHtml(filter.label)}</span>
        <small>${count}</small>
      </button>
    `;
  }).join('');
}

function selectOptions(values, selected, fallbackValue, fallbackLabel) {
  return [
    `<option value="${fallbackValue}">${fallbackLabel}</option>`,
    ...values.map((value) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value)}</option>`),
  ].join('');
}

function renderAdvancedFilters() {
  const phase = $('[data-phase-filter]');
  const status = $('[data-status-filter]');
  const concept = $('[data-concept-filter]');

  if (phase) phase.innerHTML = selectOptions(uniqueSorted(THEORIES.map((theory) => theory.phase)), state.phase, 'todas', 'Todas as fases');
  if (status) status.innerHTML = selectOptions(uniqueSorted(THEORIES.map((theory) => theory.status)), state.status, 'todos', 'Todos os status');
  if (concept) concept.innerHTML = selectOptions(uniqueSorted(THEORIES.flatMap((theory) => theory.concepts)), state.concept, 'todos', 'Todos os conceitos');

  const activeCount = [state.phase !== 'todas', state.status !== 'todos', state.concept !== 'todos'].filter(Boolean).length;
  safeSetText(
    $('[data-advanced-filter-count]'),
    activeCount ? `${activeCount} ${activeCount === 1 ? 'ativo' : 'ativos'}` : 'nenhum ativo',
  );
}

function compactDetailMarkup(theory) {
  return `
    <div class="mobile-detail-section">
      <h4>Pergunta central</h4>
      <p>${escapeHtml(theory.centralQuestion)}</p>
    </div>
    <div class="mobile-detail-section">
      <h4>Hipótese central</h4>
      <p>${escapeHtml(theory.hypothesis)}</p>
    </div>
    <details class="mobile-detail-disclosure">
      <summary>Conceitos e pontos em aberto</summary>
      <div class="mobile-detail-section">
        <h4>Conceitos conectados</h4>
        <div class="tag-list">${tagsMarkup(theory.concepts)}</div>
      </div>
      <div class="mobile-detail-section">
        <h4>Próximo refinamento</h4>
        <ul>${listMarkup(theory.developmentNotes.slice(0, 3))}</ul>
      </div>
      <div class="mobile-detail-section">
        <h4>Teorias relacionadas</h4>
        <div class="related-chip-list">${relatedMarkup(theory)}</div>
      </div>
    </details>
    <a class="theory-permalink" href="?teoria=${encodeURIComponent(theory.slug)}">Abrir link direto desta teoria</a>
  `;
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
        <h3 class="archive-card-title">${escapeHtml(theory.title)}</h3>
        <span class="archive-card-subtitle">${escapeHtml(theory.subtitle)}</span>
        <span class="archive-card-summary">${escapeHtml(theory.summary)}</span>
        <span class="archive-card-footer">
          <span>${escapeHtml(theory.phase)}</span>
          <span>${escapeHtml(getFilterLabel(theory.category))}</span>
          <span>${theory.questions.length} perguntas</span>
        </span>
      </button>
      <div class="mobile-theory-detail" id="${detailId}" ${active ? '' : 'hidden'}>
        ${compactDetailMarkup(theory)}
      </div>
    </article>
  `;
}

function renderCards(theories) {
  const grid = $('[data-theory-archive-grid]');
  const empty = $('[data-empty-state]');
  if (!grid) return;

  grid.innerHTML = theories.map(cardMarkup).join('');
  if (empty) empty.hidden = theories.length > 0;
}

function disclosure(title, content, open = false) {
  return `
    <details class="dossier-disclosure"${open ? ' open' : ''}>
      <summary>${title}</summary>
      <div class="dossier-disclosure-content">${content}</div>
    </details>
  `;
}

function renderDossier(theories) {
  const dossier = $('[data-theory-dossier]');
  if (!dossier) return;

  const theory = findTheory(state.activeId);
  if (!theory || !theories.length) {
    dossier.removeAttribute('style');
    dossier.innerHTML = '<p class="dossier-empty">Ajuste os filtros para selecionar uma teoria deste recorte.</p>';
    return;
  }

  dossier.style.setProperty('--accent', theory.color);
  dossier.style.setProperty('--accent-glow', theory.glow);
  dossier.innerHTML = `
    <div class="dossier-header">
      <p class="detail-kicker">${escapeHtml(theory.code)} · ${escapeHtml(theory.phase)}</p>
      <h3>${escapeHtml(theory.title)}</h3>
      <p>${escapeHtml(theory.subtitle)}</p>
    </div>

    <div class="dossier-metrics" aria-label="Resumo da teoria selecionada">
      <span><strong>${theory.progress}%</strong> maturação editorial</span>
      <span><strong>${theory.questions.length}</strong> perguntas</span>
      <span><strong>${relatedTheories(theory).length}</strong> relações</span>
    </div>

    <div class="dossier-section">
      <h4>O que é esta teoria?</h4>
      <p>${escapeHtml(theory.centralIdea)}</p>
    </div>

    <div class="dossier-section dossier-central-question">
      <h4>Pergunta central</h4>
      <p>${escapeHtml(theory.centralQuestion)}</p>
    </div>

    <div class="dossier-section">
      <h4>Hipótese central</h4>
      <p>${escapeHtml(theory.hypothesis)}</p>
    </div>

    ${disclosure('Perguntas abertas', `<ul>${listMarkup(theory.questions)}</ul>`, true)}
    ${disclosure('Conceitos relacionados', `<div class="tag-list">${tagsMarkup(theory.concepts)}</div>`)}
    ${disclosure('Tensão teórica e próximos passos', `
      <p>${escapeHtml(theory.theoreticalTension)}</p>
      <ul>${listMarkup(theory.developmentNotes)}</ul>
    `)}
    ${disclosure('Teorias relacionadas', `<div class="related-chip-list">${relatedMarkup(theory)}</div>`)}
    ${disclosure('Proveniência editorial', `
      <dl class="provenance-list">
        <div><dt>Fonte interna</dt><dd>${escapeHtml(theory.sourceFile)}</dd></div>
        <div><dt>Atualização</dt><dd>data não informada nos materiais</dd></div>
        <div><dt>Estágio</dt><dd>${escapeHtml(theory.stage)}</dd></div>
      </dl>
    `)}

    <div class="dossier-actions">
      <a class="theory-permalink" href="?teoria=${encodeURIComponent(theory.slug)}">Link direto desta teoria</a>
      <a class="theory-map-link" href="../Mapa/mapa.html?teoria=${encodeURIComponent(theory.slug)}">Ver no mapa</a>
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

  const summary = [getFilterLabel(state.category)];
  if (state.phase !== 'todas') summary.push(state.phase);
  if (state.status !== 'todos') summary.push(state.status);
  if (state.concept !== 'todos') summary.push(state.concept);
  if (state.query) summary.push(`busca: “${state.query}”`);
  safeSetText($('[data-active-filter]'), summary.join(' · '));
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

function syncUrl(theory) {
  const url = new URL(window.location.href);
  url.searchParams.set('teoria', theory.slug);
  window.history.replaceState({ theory: theory.slug }, '', url);
}

function setActiveTheory(id, options = {}) {
  const theory = findTheory(id);
  if (!theory) return;

  state.activeId = theory.id;
  syncActiveStates();
  renderDossier(getFilteredTheories());
  if (options.syncUrl !== false) syncUrl(theory);

  if (options.scrollCard) {
    const card = $(`[data-theory-card="${CSS.escape(theory.id)}"]`);
    card?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
  }
}

function render() {
  const theories = getFilteredTheories();
  if (theories.length && !theories.some((theory) => theory.id === state.activeId)) {
    state.activeId = theories[0].id;
  }

  renderCategoryFilters();
  renderAdvancedFilters();
  renderCards(theories);
  renderDossier(theories);
  updateSummary(theories);
  syncActiveStates();
}

function closestFromEvent(event, selector) {
  const target = event.target instanceof Element ? event.target : event.target?.parentElement;
  return target?.closest(selector) || null;
}

function resetFilters() {
  state.query = '';
  state.category = 'todas';
  state.phase = 'todas';
  state.status = 'todos';
  state.concept = 'todos';
  const search = $('[data-theory-search]');
  if (search) search.value = '';
  render();
  search?.focus();
}

function bindEvents() {
  const search = $('[data-theory-search]');
  const rail = $('[data-filter-rail]');
  const grid = $('[data-theory-archive-grid]');
  const reset = $('[data-reset-filters]');
  const dossier = $('[data-theory-dossier]');
  const phase = $('[data-phase-filter]');
  const status = $('[data-status-filter]');
  const concept = $('[data-concept-filter]');

  search?.addEventListener('input', debounce(() => {
    state.query = search.value.trim();
    render();
  }, 140));

  rail?.addEventListener('click', (event) => {
    const button = closestFromEvent(event, '[data-filter-id]');
    if (!button) return;
    state.category = button.dataset.filterId || 'todas';
    render();
  });

  phase?.addEventListener('change', () => {
    state.phase = phase.value;
    render();
  });

  status?.addEventListener('change', () => {
    state.status = status.value;
    render();
  });

  concept?.addEventListener('change', () => {
    state.concept = concept.value;
    render();
  });

  grid?.addEventListener('click', (event) => {
    const related = closestFromEvent(event, '[data-related-id]');
    if (related) {
      state.category = 'todas';
      state.phase = 'todas';
      state.status = 'todos';
      state.concept = 'todos';
      render();
      setActiveTheory(related.dataset.relatedId, { scrollCard: true });
      return;
    }

    const button = closestFromEvent(event, '[data-theory-id]');
    if (button) setActiveTheory(button.dataset.theoryId);
  });

  dossier?.addEventListener('click', (event) => {
    const related = closestFromEvent(event, '[data-related-id]');
    if (!related) return;
    state.category = 'todas';
    state.phase = 'todas';
    state.status = 'todos';
    state.concept = 'todos';
    state.query = '';
    if (search) search.value = '';
    render();
    setActiveTheory(related.dataset.relatedId, { scrollCard: true });
  });

  reset?.addEventListener('click', resetFilters);

  window.addEventListener('popstate', () => {
    const requested = new URL(window.location.href).searchParams.get('teoria');
    const theory = findTheory(requested);
    if (theory) setActiveTheory(theory.id, { syncUrl: false, scrollCard: true });
  });
}

function boot() {
  initNavigation();
  bindEvents();
  render();
  const active = findTheory(state.activeId);
  if (active) syncUrl(active);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
