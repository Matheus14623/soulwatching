import { initNavigation } from '../assets/js/navigation.js';
import { $, escapeHtml, safeSetText } from '../assets/js/utils.js';
import { smoothScrollToElement } from '../assets/js/smooth-scroll.js';
import {
  findTheory,
  getTheoryPublicSummary,
  getTheoryRelations,
  getUniqueTheoryRelations,
  theoryMatchesCategory,
} from '../assets/js/theory-model.js';
import { THEORIES, THEORY_FILTERS } from '../assets/data/generated/runtime/theories.js';
import { getPublicRelationJustification } from '../assets/js/relation-review.js';

const axisDescriptions = {
  cosmologia: 'Escala do universo, ciclos, origem, expansão e horizontes.',
  tempo: 'Latência, causalidade, recorrência e emergência temporal.',
  vazio: 'Vácuo, flutuação, repouso extremo e transições possíveis.',
  informacao: 'Observação, sensores, correlações e limites de leitura.',
  topologia: 'Fronteiras, contentores, geometrias e relações espaciais.',
  existencial: 'Ação, finitude, risco e presença diante da escala cósmica.',
  metodo: 'Linguagem de sistemas, critérios e organização do pensamento.',
};

function initialTheoryId() {
  const requested = new URL(window.location.href).searchParams.get('teoria');
  return findTheory(requested)?.id || THEORIES[0]?.id || '';
}

const state = {
  category: 'todas',
  activeId: initialTheoryId(),
};

function matchesCategory(theory) {
  return theoryMatchesCategory(theory, state.category);
}

function renderStats() {
  safeSetText($('[data-map-theory-total]'), String(THEORIES.length));
  safeSetText($('[data-map-relation-total]'), String(getUniqueTheoryRelations().length));
  safeSetText($('[data-map-filter-total]'), String(Math.max(THEORY_FILTERS.length - 1, 0)));
}

function renderFilters() {
  const rail = $('[data-map-filters]');
  if (!rail) return;

  rail.innerHTML = THEORY_FILTERS.map((filter) => {
    const count = filter.id === 'todas'
      ? THEORIES.length
      : THEORIES.filter((theory) => theoryMatchesCategory(theory, filter.id)).length;
    const active = filter.id === state.category;
    return `
      <button class="map-filter-button${active ? ' is-active' : ''}" type="button" data-map-filter="${escapeHtml(filter.id)}" aria-pressed="${active}">
        ${escapeHtml(filter.label)} <span>${count}</span>
      </button>
    `;
  }).join('');
}

function renderMap() {
  const lines = $('[data-map-lines]');
  const nodes = $('[data-map-nodes]');
  if (!lines || !nodes) return;

  lines.innerHTML = getUniqueTheoryRelations().map(([source, target]) => {
    const active = source.id === state.activeId || target.id === state.activeId;
    const muted = !matchesCategory(source) || !matchesCategory(target);
    return `<line class="${active ? 'is-active ' : ''}${muted ? 'is-muted' : ''}" x1="${source.position.x}" y1="${source.position.y}" x2="${target.position.x}" y2="${target.position.y}"></line>`;
  }).join('');

  nodes.innerHTML = THEORIES.map((theory) => {
    const active = theory.id === state.activeId;
    const muted = !matchesCategory(theory);
    return `
      <button class="idea-map-node${active ? ' is-active' : ''}${muted ? ' is-muted' : ''}" type="button" data-map-node="${escapeHtml(theory.id)}" aria-pressed="${active}" aria-label="Selecionar ${escapeHtml(theory.code)}: ${escapeHtml(theory.title)}"${muted ? ' disabled' : ''}>
        <span>${escapeHtml(theory.code)} · ${escapeHtml(theory.typeShortLabel)}</span>
        <strong>${escapeHtml(theory.shortTitle)}</strong>
      </button>
    `;
  }).join('');
  THEORIES.forEach((theory) => {
    const node = nodes.querySelector(`[data-map-node="${theory.id}"]`);
    node?.style.setProperty('--x', `${theory.position.x}%`);
    node?.style.setProperty('--y', `${theory.position.y}%`);
    node?.style.setProperty('--accent', theory.color);
    node?.style.setProperty('--accent-glow', theory.glow);
  });
}

function relatedMarkup(theory) {
  const relations = getTheoryRelations(theory);
  if (!relations.length) return '<p>Nenhuma relação listada.</p>';
  return relations.map((relation) => {
    const justification = getPublicRelationJustification(relation);
    return `
    <button class="map-related-button" type="button" data-related-theory="${escapeHtml(relation.theory.id)}">
      <span class="map-related-code">${escapeHtml(relation.theory.code)}</span>
      <strong>${escapeHtml(relation.theory.shortTitle)}</strong>
      <span class="map-related-type">${escapeHtml(relation.relationLabel)}</span>
      ${justification ? `<span class="map-related-justification">${escapeHtml(justification)}</span>` : ''}
      <span class="map-related-review${relation.reviewPending ? ' is-pending' : ''}">${escapeHtml(relation.reviewLabel)}</span>
      <span class="map-related-disclosure">${escapeHtml(relation.reviewDisclosure)}</span>
    </button>
  `;
  }).join('');
}

function renderDetail() {
  const panel = $('[data-map-detail]');
  const theory = findTheory(state.activeId);
  if (!panel || !theory) return;
  const relatedCount = getTheoryRelations(theory).length;

  panel.style.setProperty('--accent', theory.color);
  panel.style.setProperty('--accent-glow', theory.glow);
  panel.innerHTML = `
    <p class="map-detail-kicker">${escapeHtml(theory.code)} · ${escapeHtml(theory.typeLabel)}</p>
    <h3>${escapeHtml(theory.title)}</h3>
    <p>${escapeHtml(getTheoryPublicSummary(theory))}</p>

    <div class="map-detail-section">
      <h4>Pergunta central</h4>
      <p>${escapeHtml(theory.centralQuestion)}</p>
    </div>

    <div class="map-detail-section">
      <h4>Limite atual</h4>
      <p>${escapeHtml(theory.review.limit)}</p>
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
    `${theory.code} · ${theory.shortTitle}: ${relatedCount} ${relatedCount === 1 ? 'conexão direta' : 'conexões diretas'}.`,
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
        <span>${theories.length} ${theories.length === 1 ? 'entrada' : 'entradas'}</span>
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

function setActive(id, sync = true, focusDetail = false) {
  const theory = findTheory(id);
  if (!theory) return;
  state.activeId = theory.id;
  renderMap();
  renderDetail();
  if (sync) syncUrl(theory);
  if (focusDetail && window.innerWidth <= 1080) {
    const panel = $('[data-map-detail]');
    smoothScrollToElement(panel);
  }
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
    const selected = findTheory(state.activeId);
    if (selected) syncUrl(selected);
    const filterId = state.category;
    requestAnimationFrame(() => document.querySelector(`[data-map-filter="${CSS.escape(filterId)}"]`)?.focus());
  });

  $('[data-map-nodes]')?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-map-node]') : null;
    if (button) setActive(button.dataset.mapNode, true, true);
  });

  $('[data-map-detail]')?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest('[data-related-theory]') : null;
    if (!button) return;
    state.category = 'todas';
    renderFilters();
    setActive(button.dataset.relatedTheory, true, true);
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
