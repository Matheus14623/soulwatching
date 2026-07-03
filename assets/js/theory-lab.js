import { $, $$, safeSetText } from './utils.js';
import { THEORIES, THEORY_FILTERS } from './theories.js';

const state = {
  activeFilter: 'todas',
  query: '',
  activeTheoryId: THEORIES[0]?.id || '',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalize(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getTheory(id) {
  return THEORIES.find((theory) => theory.id === id) || THEORIES[0];
}

function getStatusColor(theory) {
  if (theory.status.includes('fronteira')) return '#ff9ef2';
  if (theory.status.includes('rascunho')) return '#ad8cff';
  if (theory.status.includes('inicial')) return '#68f0cb';
  return '#72ecff';
}

function matchesFilter(theory) {
  return state.activeFilter === 'todas' || theory.filters.includes(state.activeFilter) || theory.category === state.activeFilter;
}

function matchesQuery(theory) {
  if (!state.query) return true;
  const haystack = normalize([
    theory.title,
    theory.subtitle,
    theory.summary,
    theory.hypothesis,
    theory.status,
    theory.stage,
    theory.concepts.join(' '),
    theory.questions.join(' '),
    theory.needs.join(' '),
  ].join(' '));
  return haystack.includes(normalize(state.query));
}

function filteredTheories() {
  return THEORIES.filter((theory) => matchesFilter(theory) && matchesQuery(theory));
}

function tagMarkup(tags) {
  return tags.slice(0, 5).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
}

function listMarkup(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function renderFilters() {
  const filters = $('[data-theory-filters]');
  if (!filters) return;

  filters.innerHTML = THEORY_FILTERS.map((filter) => `
    <button class="filter-button${filter.id === state.activeFilter ? ' is-active' : ''}" type="button" data-theory-filter="${filter.id}" aria-pressed="${filter.id === state.activeFilter}">
      ${escapeHtml(filter.label)}
    </button>
  `).join('');

  $$('[data-theory-filter]', filters).forEach((button) => {
    button.addEventListener('click', () => {
      state.activeFilter = button.dataset.theoryFilter || 'todas';
      renderAll();
    });
  });
}

function renderCards(theories) {
  const grid = $('[data-theory-grid]');
  const empty = $('[data-theory-empty]');
  const count = $('[data-theory-count]');
  if (!grid) return;

  safeSetText(count, `${theories.length} ${theories.length === 1 ? 'teoria visível' : 'teorias visíveis'} · ${THEORIES.length} no arquivo`);
  if (empty) empty.hidden = theories.length > 0;

  grid.innerHTML = theories.map((theory) => `
    <article class="theory-card${theory.id === state.activeTheoryId ? ' is-active' : ''}" tabindex="0" role="button" data-theory-id="${theory.id}" style="--accent:${theory.color}; --accent-glow:${theory.glow}; --status-color:${getStatusColor(theory)};">
      <div class="theory-card-top">
        <span class="theory-code">${escapeHtml(theory.code)}</span>
        <span class="status-badge">${escapeHtml(theory.status)}</span>
      </div>
      <h3>${escapeHtml(theory.title)}</h3>
      <p>${escapeHtml(theory.summary)}</p>
      <div class="tag-list">${tagMarkup(theory.concepts)}</div>
      <div class="progress-block" aria-label="Maturidade conceitual inferida: ${theory.progress}%">
        <div class="progress-label"><span>Maturidade</span><strong>${theory.progress}%</strong></div>
        <div class="progress-track"><span style="--progress:${theory.progress}%"></span></div>
      </div>
    </article>
  `).join('');

  $$('[data-theory-id]', grid).forEach((card) => {
    const activate = () => setActiveTheory(card.dataset.theoryId, { scroll: false });
    card.addEventListener('click', activate);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });
}

function renderDetail() {
  const detail = $('[data-theory-detail]');
  if (!detail) return;

  const theory = getTheory(state.activeTheoryId);
  detail.style.setProperty('--accent', theory.color);
  detail.style.setProperty('--accent-glow', theory.glow);
  detail.innerHTML = `
    <p class="detail-kicker">${escapeHtml(theory.code)} · ${escapeHtml(theory.status)}</p>
    <h3>${escapeHtml(theory.title)}</h3>
    <p>${escapeHtml(theory.subtitle)}</p>

    <div class="progress-block" aria-label="Maturidade conceitual inferida: ${theory.progress}%">
      <div class="progress-label"><span>Estado de maturação</span><strong>${theory.progress}%</strong></div>
      <div class="progress-track"><span style="--progress:${theory.progress}%"></span></div>
    </div>

    <div class="detail-section">
      <h4>Hipótese central</h4>
      <p>${escapeHtml(theory.hypothesis)}</p>
    </div>

    <div class="detail-section">
      <h4>Perguntas abertas</h4>
      <ul>${listMarkup(theory.questions)}</ul>
    </div>

    <div class="detail-section">
      <h4>Conceitos conectados</h4>
      <div class="tag-list">${tagMarkup(theory.concepts)}</div>
    </div>

    <div class="detail-section">
      <h4>O que ainda precisa amadurecer</h4>
      <ul>${listMarkup(theory.needs)}</ul>
    </div>

    <div class="detail-section">
      <h4>Estágio</h4>
      <p>${escapeHtml(theory.stage)}</p>
    </div>
  `;
}

function setActiveTheory(id, options = {}) {
  const theory = getTheory(id);
  state.activeTheoryId = theory.id;
  renderDetail();

  $$('[data-theory-id]').forEach((card) => {
    card.classList.toggle('is-active', card.dataset.theoryId === theory.id);
  });

  $$('[data-map-node]').forEach((node) => {
    node.classList.toggle('is-active', node.dataset.mapNode === theory.id);
  });

  const caption = $('[data-map-caption]');
  safeSetText(caption, `${theory.code} · ${theory.shortTitle}: ${theory.summary}`);

  if (options.scroll) {
    document.getElementById('teorias')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderMap() {
  const lines = $('[data-map-lines]');
  const nodes = $('[data-map-nodes]');
  if (!lines || !nodes) return;

  const byId = new Map(THEORIES.map((theory) => [theory.id, theory]));
  const drawn = new Set();
  const lineMarkup = [];

  THEORIES.forEach((theory) => {
    theory.connections.forEach((targetId) => {
      const target = byId.get(targetId);
      if (!target) return;
      const key = [theory.id, targetId].sort().join('::');
      if (drawn.has(key)) return;
      drawn.add(key);
      lineMarkup.push(`<line x1="${theory.position.x}" y1="${theory.position.y}" x2="${target.position.x}" y2="${target.position.y}"></line>`);
    });
  });

  lines.innerHTML = lineMarkup.join('');
  nodes.innerHTML = THEORIES.map((theory) => `
    <button class="map-node${theory.id === state.activeTheoryId ? ' is-active' : ''}" type="button" data-map-node="${theory.id}" style="--x:${theory.position.x}%; --y:${theory.position.y}%; --accent:${theory.color}; --accent-glow:${theory.glow};" aria-label="Abrir teoria ${escapeHtml(theory.title)}">
      <span>${escapeHtml(theory.code)}</span>
      <strong>${escapeHtml(theory.shortTitle)}</strong>
    </button>
  `).join('');

  $$('[data-map-node]', nodes).forEach((node) => {
    node.addEventListener('click', () => setActiveTheory(node.dataset.mapNode, { scroll: true }));
  });
}

function renderAll() {
  renderFilters();
  const theories = filteredTheories();
  if (!theories.some((theory) => theory.id === state.activeTheoryId) && theories[0]) {
    state.activeTheoryId = theories[0].id;
  }
  renderCards(theories);
  renderDetail();
  renderMap();
  setActiveTheory(state.activeTheoryId, { scroll: false });
}

export function initTheoryLab() {
  if (!$('[data-theory-grid]')) return;

  const search = $('[data-theory-search]');
  search?.addEventListener('input', () => {
    state.query = search.value.trim();
    renderAll();
  });

  renderAll();
}
