import {
  $,
  $$,
  debounce,
  escapeHtml,
  normalizeText,
  safeSetText,
} from './utils.js';
import { smoothScrollToElement } from './smooth-scroll.js';
import {
  findTheory,
  getRelatedTheoryIds,
  getUniqueTheoryRelations,
  theoryMatchesCategory,
} from './theory-model.js';
import { THEORIES, THEORY_FILTERS } from '../data/generated/runtime/theories.js';

const state = {
  activeFilter: 'todas',
  query: '',
  activeTheoryId: THEORIES[0]?.id || '',
};

function matchesFilter(theory) {
  return theoryMatchesCategory(theory, state.activeFilter);
}

function matchesQuery(theory) {
  if (!state.query) return true;
  const haystack = normalizeText([
    theory.title,
    theory.subtitle,
    theory.summary,
    theory.proposal,
    theory.typeLabel,
    theory.reviewStateLabel,
    theory.review.assessment,
    theory.review.known,
    theory.review.focus,
    theory.review.limit,
    theory.review.test,
    theory.concepts.join(' '),
    theory.questions.join(' '),
    theory.nextSteps.join(' '),
  ].join(' '));
  return haystack.includes(normalizeText(state.query));
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

function renderFilters(options = {}) {
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
      renderAll({ restoreFilterId: state.activeFilter });
    });
  });

  if (options.restoreFilterId) {
    const restoredFilter = $(`[data-theory-filter="${options.restoreFilterId}"]`, filters);
    restoredFilter?.focus({ preventScroll: true });
  }
}

function getVisibleTheories(theories, grid) {
  const limit = Number(grid?.dataset.theoryLimit || 0);
  if (!Number.isFinite(limit) || limit <= 0) return theories;
  return theories.slice(0, limit);
}

function renderCards(theories) {
  const grid = $('[data-theory-grid]');
  const empty = $('[data-theory-empty]');
  const count = $('[data-theory-count]');
  if (!grid) return [];

  const visibleTheories = getVisibleTheories(theories, grid);
  const hasLimit = visibleTheories.length !== theories.length;
  const countText = hasLimit
    ? `${visibleTheories.length} de ${theories.length} entradas no recorte da home · ${THEORIES.length} no arquivo`
    : `${theories.length} ${theories.length === 1 ? 'entrada visível' : 'entradas visíveis'} · ${THEORIES.length} no arquivo`;

  safeSetText(count, countText);
  if (empty) empty.hidden = theories.length > 0;

  grid.innerHTML = visibleTheories.map((theory) => `
    <article class="theory-card${theory.id === state.activeTheoryId ? ' is-active' : ''}" tabindex="0" role="button" aria-pressed="${theory.id === state.activeTheoryId}" data-theory-id="${theory.id}">
      <div class="theory-card-top">
        <span class="theory-code">${escapeHtml(theory.code)}</span>
        <span class="status-badge">${escapeHtml(theory.typeShortLabel)}</span>
      </div>
      <h3>${escapeHtml(theory.title)}</h3>
      <p class="theory-card-subtitle">${escapeHtml(theory.subtitle)}</p>
      <p class="theory-card-summary">${escapeHtml(theory.summary)}</p>
      <div class="theory-card-meta" aria-label="Resumo da entrada">
        <span>${escapeHtml(theory.reviewStateLabel)}</span>
        <span>${theory.questions.length} perguntas</span>
        <span>${getRelatedTheoryIds(theory).length} relações</span>
      </div>
      <p class="theory-card-assessment">${escapeHtml(theory.review.assessment)}</p>
      <div class="tag-list">${tagMarkup(theory.concepts)}</div>
    </article>
  `).join('');

  $$('[data-theory-id]', grid).forEach((card) => {
    const theory = findTheory(card.dataset.theoryId);
    if (theory) {
      card.style.setProperty('--accent', theory.color);
      card.style.setProperty('--accent-glow', theory.glow);
      card.style.setProperty('--status-color', theory.color);
    }
    const activate = () => setActiveTheory(card.dataset.theoryId, { scroll: false });
    card.addEventListener('click', activate);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });

  return visibleTheories;
}

function renderDetail(visibleTheories = getVisibleTheories(filteredTheories(), $('[data-theory-grid]'))) {
  const detail = $('[data-theory-detail]');
  if (!detail) return;

  if (!visibleTheories.length) {
    detail.removeAttribute('style');
    detail.innerHTML = '<p class="detail-empty">Nenhuma entrada selecionada neste recorte.</p>';
    return;
  }

  const theory = findTheory(state.activeTheoryId, THEORIES[0]);
  detail.style.setProperty('--accent', theory.color);
  detail.style.setProperty('--accent-glow', theory.glow);
  detail.innerHTML = `
    <p class="detail-kicker">${escapeHtml(theory.code)} · ${escapeHtml(theory.typeLabel)}</p>
    <h3>${escapeHtml(theory.title)}</h3>
    <p>${escapeHtml(theory.subtitle)}</p>

    <div class="detail-meta" aria-label="Metadados da entrada">
      <span>${escapeHtml(theory.reviewStateLabel)}</span>
      <span>${escapeHtml(theory.review.assessment)}</span>
      <span>${theory.questions.length} perguntas abertas</span>
      <span>${theory.nextSteps.length} próximos passos</span>
    </div>

    <div class="detail-section">
      <h4>Pergunta central</h4>
      <p>${escapeHtml(theory.centralQuestion)}</p>
    </div>

    <div class="detail-section">
      <h4>Proposição</h4>
      <p>${escapeHtml(theory.proposal)}</p>
    </div>

    <div class="detail-section">
      <h4>Contexto conhecido</h4>
      <p>${escapeHtml(theory.review.known)}</p>
    </div>

    <div class="detail-section">
      <h4>Limite atual</h4>
      <p>${escapeHtml(theory.review.limit)}</p>
    </div>

    <div class="detail-section">
      <h4>Caminho verificável</h4>
      <p>${escapeHtml(theory.review.test)}</p>
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
      <h4>Próximos passos</h4>
      <ul>${listMarkup(theory.nextSteps)}</ul>
    </div>

    <div class="detail-section">
      <h4>Revisão</h4>
      <p>${escapeHtml(theory.revision.label)} · versão ${escapeHtml(theory.revision.version)}</p>
    </div>
  `;
}

function updateArchiveStats() {
  const relationCount = getUniqueTheoryRelations().length;

  $$('[data-theory-total]').forEach((element) => safeSetText(element, String(THEORIES.length)));
  $$('[data-filter-total]').forEach((element) => safeSetText(element, String(Math.max(THEORY_FILTERS.length - 1, 0))));
  $$('[data-relation-total]').forEach((element) => safeSetText(element, String(relationCount)));
}

function setActiveTheory(id, options = {}) {
  const theory = findTheory(id, THEORIES[0]);
  state.activeTheoryId = theory.id;
  renderDetail();

  $$('[data-theory-id]').forEach((card) => {
    card.classList.toggle('is-active', card.dataset.theoryId === theory.id);
    card.setAttribute('aria-pressed', String(card.dataset.theoryId === theory.id));
  });

  $$('[data-map-node]').forEach((node) => {
    node.classList.toggle('is-active', node.dataset.mapNode === theory.id);
  });

  const caption = $('[data-map-caption]');
  safeSetText(caption, `${theory.code} · ${theory.shortTitle}: ${theory.summary}`);

  if (options.scroll) {
    smoothScrollToElement(document.getElementById('teorias'));
  }
}

function renderMap() {
  const lines = $('[data-map-lines]');
  const nodes = $('[data-map-nodes]');
  if (!lines || !nodes) return;

  lines.innerHTML = getUniqueTheoryRelations()
    .map(([source, target]) => `<line x1="${source.position.x}" y1="${source.position.y}" x2="${target.position.x}" y2="${target.position.y}"></line>`)
    .join('');
  nodes.innerHTML = THEORIES.map((theory) => `
    <button class="map-node${theory.id === state.activeTheoryId ? ' is-active' : ''}" type="button" data-map-node="${theory.id}" aria-label="Abrir entrada ${escapeHtml(theory.title)}">
      <span>${escapeHtml(theory.code)} · ${escapeHtml(theory.typeShortLabel)}</span>
      <strong>${escapeHtml(theory.shortTitle)}</strong>
    </button>
  `).join('');

  $$('[data-map-node]', nodes).forEach((node) => {
    const theory = findTheory(node.dataset.mapNode);
    if (theory) {
      node.style.setProperty('--x', `${theory.position.x}%`);
      node.style.setProperty('--y', `${theory.position.y}%`);
      node.style.setProperty('--accent', theory.color);
      node.style.setProperty('--accent-glow', theory.glow);
    }
    node.addEventListener('click', () => setActiveTheory(node.dataset.mapNode, { scroll: true }));
  });
}

function renderAll(options = {}) {
  updateArchiveStats();
  renderFilters(options);
  const theories = filteredTheories();
  const grid = $('[data-theory-grid]');
  const visibleTheories = getVisibleTheories(theories, grid);
  if (!visibleTheories.some((theory) => theory.id === state.activeTheoryId) && visibleTheories[0]) {
    state.activeTheoryId = visibleTheories[0].id;
  }
  renderCards(theories);
  renderDetail(visibleTheories);
  renderMap();
  setActiveTheory(state.activeTheoryId, { scroll: false });
}

export function initTheoryLab() {
  if (!$('[data-theory-grid]')) return;

  const search = $('[data-theory-search]');
  search?.addEventListener('input', debounce(() => {
    state.query = search.value.trim();
    renderAll();
  }, 140));

  renderAll();
}
