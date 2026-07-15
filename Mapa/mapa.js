import { initNavigation } from '../assets/js/navigation.js';
import { $, safeSetText } from '../assets/js/utils.js';
import { THEORIES, THEORY_FILTERS } from '../assets/data/theories.js';

const axisDescriptions = {
  cosmologia: 'Escala do universo, ciclos, origem, expansão e horizontes.',
  tempo: 'Latência, causalidade, recorrência e emergência temporal.',
  vazio: 'Vácuo, flutuação, repouso extremo e transições possíveis.',
  informacao: 'Observação, sensores, correlações e limites de leitura.',
  topologia: 'Fronteiras, contentores, geometrias e relações espaciais.',
  existencial: 'Ação, finitude, risco e presença diante da escala cósmica.',
  metodo: 'Linguagem de sistemas, critérios e organização do pensamento.',
};

function findTheory(id) {
  return THEORIES.find((theory) => theory.id === id || theory.slug === id) || null;
}

function initialTheoryId() {
  const requested = new URL(window.location.href).searchParams.get('teoria');
  return findTheory(requested)?.id || THEORIES[0]?.id || '';
}

const state = {
  category: 'todas',
  activeId: initialTheoryId(),
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function matchesCategory(theory) {
  return state.category === 'todas'
    || theory.category === state.category
    || theory.filters.includes(state.category);
}

function uniqueRelations() {
  const relations = new Map();
  THEORIES.forEach((theory) => {
    theory.connections.forEach((targetId) => {
      const target = findTheory(targetId);
      if (!target) return;
      const key = [theory.id, target.id].sort().join('::');
      if (!relations.has(key)) relations.set(key, [theory, target]);
    });
  });
  return [...relations.values()];
}

function renderStats() {
  safeSetText($('[data-map-theory-total]'), String(THEORIES.length));
  safeSetText($('[data-map-relation-total]'), String(uniqueRelations().length));
  safeSetText($('[data-map-filter-total]'), String(Math.max(THEORY_FILTERS.length - 1, 0)));
}

function renderFilters() {
  const rail = $('[data-map-filters]');
  if (!rail) return;

  rail.innerHTML = THEORY_FILTERS.map((filter) => {
    const count = filter.id === 'todas'
      ? THEORIES.length
      : THEORIES.filter((theory) => theory.category === filter.id || theory.filters.includes(filter.id)).length;
    const active = filter.id === state.category;
    return `
      <button class="map-filter-button${active ? ' is-active' : ''}" type="button" role="listitem" data-map-filter="${escapeHtml(filter.id)}" aria-pressed="${active}">
        ${escapeHtml(filter.label)} <span>${count}</span>
      </button>
    `;
  }).join('');
}

function renderMap() {
  const lines = $('[data-map-lines]');
  const nodes = $('[data-map-nodes]');
  if (!lines || !nodes) return;

  lines.innerHTML = uniqueRelations().map(([source, target]) => {
    const active = source.id === state.activeId || target.id === state.activeId;
    const muted = !matchesCategory(source) || !matchesCategory(target);
    return `<line class="${active ? 'is-active ' : ''}${muted ? 'is-muted' : ''}" x1="${source.position.x}" y1="${source.position.y}" x2="${target.position.x}" y2="${target.position.y}"></line>`;
  }).join('');

  nodes.innerHTML = THEORIES.map((theory) => {
    const active = theory.id === state.activeId;
    const muted = !matchesCategory(theory);
    return `
      <button class="idea-map-node${active ? ' is-active' : ''}${muted ? ' is-muted' : ''}" type="button" data-map-node="${escapeHtml(theory.id)}" style="--x:${theory.position.x}%; --y:${theory.position.y}%; --accent:${theory.color}; --accent-glow:${theory.glow};" aria-pressed="${active}" aria-label="Selecionar ${escapeHtml(theory.code)}: ${escapeHtml(theory.title)}">
        <span>${escapeHtml(theory.code)} · ${escapeHtml(theory.phase)}</span>
        <strong>${escapeHtml(theory.shortTitle)}</strong>
      </button>
    `;
  }).join('');
}

function relatedMarkup(theory) {
  const related = theory.connections.map((id) => findTheory(id)).filter(Boolean);
  if (!related.length) return '<p>Nenhuma relação catalogada neste momento.</p>';
  return related.map((item) => `
    <button class="map-related-button" type="button" data-related-theory="${escapeHtml(item.id)}">
      <span>${escapeHtml(item.code)}</span>
      ${escapeHtml(item.shortTitle)}
    </button>
  `).join('');
}

function renderDetail() {
  const panel = $('[data-map-detail]');
  const theory = findTheory(state.activeId);
  if (!panel || !theory) return;

  panel.style.setProperty('--accent', theory.color);
  panel.style.setProperty('--accent-glow', theory.glow);
  panel.innerHTML = `
    <p class="map-detail-kicker">${escapeHtml(theory.code)} · ${escapeHtml(theory.phase)}</p>
    <h3>${escapeHtml(theory.title)}</h3>
    <p>${escapeHtml(theory.centralIdea)}</p>

    <div class="map-detail-section">
      <h4>Pergunta central</h4>
      <p>${escapeHtml(theory.centralQuestion)}</p>
    </div>

    <div class="map-detail-section">
      <h4>Conexões diretas</h4>
      <div class="map-detail-relations">${relatedMarkup(theory)}</div>
    </div>

    <div class="map-detail-section">
      <h4>Eixos presentes</h4>
      <div class="tag-list">${theory.filters.map((filter) => `<span class="tag">${escapeHtml(filter)}</span>`).join('')}</div>
    </div>

    <div class="map-detail-actions">
      <a href="../Teorias/teorias.html?teoria=${encodeURIComponent(theory.slug)}">Abrir dossiê completo</a>
    </div>
  `;

  safeSetText(
    $('[data-map-caption]'),
    `${theory.code} · ${theory.shortTitle}: ${theory.connections.length} ${theory.connections.length === 1 ? 'conexão direta' : 'conexões diretas'}.`,
  );
}

function renderAxes() {
  const grid = $('[data-axis-grid]');
  if (!grid) return;

  grid.innerHTML = THEORY_FILTERS.filter((filter) => filter.id !== 'todas').map((filter) => {
    const theories = THEORIES.filter((theory) => theory.category === filter.id || theory.filters.includes(filter.id));
    const concepts = [...new Set(theories.flatMap((theory) => theory.concepts))].slice(0, 3);
    return `
      <article class="map-axis-card">
        <span>${theories.length} ${theories.length === 1 ? 'teoria' : 'teorias'}</span>
        <h3>${escapeHtml(filter.label)}</h3>
        <p>${escapeHtml(axisDescriptions[filter.id] || 'Eixo conceitual em organização.')}</p>
        <div class="tag-list">${concepts.map((concept) => `<span class="tag">${escapeHtml(concept)}</span>`).join('')}</div>
      </article>
    `;
  }).join('');
}

function syncUrl(theory) {
  const url = new URL(window.location.href);
  url.searchParams.set('teoria', theory.slug);
  window.history.replaceState({ theory: theory.slug }, '', url);
}

function setActive(id, sync = true) {
  const theory = findTheory(id);
  if (!theory) return;
  state.activeId = theory.id;
  renderMap();
  renderDetail();
  if (sync) syncUrl(theory);
}

function bindEvents() {
  $('[data-map-filters]')?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-map-filter]') : null;
    if (!button) return;
    state.category = button.dataset.mapFilter || 'todas';
    const active = findTheory(state.activeId);
    if (active && !matchesCategory(active)) {
      state.activeId = THEORIES.find(matchesCategory)?.id || THEORIES[0]?.id || '';
    }
    renderFilters();
    renderMap();
    renderDetail();
  });

  $('[data-map-nodes]')?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-map-node]') : null;
    if (button) setActive(button.dataset.mapNode);
  });

  $('[data-map-detail]')?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-related-theory]') : null;
    if (!button) return;
    state.category = 'todas';
    renderFilters();
    setActive(button.dataset.relatedTheory);
  });

  window.addEventListener('popstate', () => {
    const requested = new URL(window.location.href).searchParams.get('teoria');
    if (findTheory(requested)) setActive(requested, false);
  });
}

function boot() {
  initNavigation();
  renderStats();
  renderFilters();
  renderMap();
  renderDetail();
  renderAxes();
  bindEvents();
  const active = findTheory(state.activeId);
  if (active) syncUrl(active);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
