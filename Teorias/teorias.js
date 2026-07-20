import { initNavigation } from '../assets/js/navigation.js';
import {
  $,
  debounce,
  escapeHtml,
  normalizeText,
  safeSetText,
} from '../assets/js/utils.js';
import { smoothScrollToElement } from '../assets/js/smooth-scroll.js';
import {
  findTheory,
  getRelatedTheories,
  theoryMatchesCategory,
} from '../assets/js/theory-model.js';
import {
  THEORIES,
  THEORY_FILTERS,
  THEORY_REVIEW_STATES,
  THEORY_TYPES,
} from '../assets/data/theories.js';
import { getTheoryReferences } from '../assets/data/theory-references.js';
import { RESEARCH_TRACKS } from '../assets/data/research-tracks.js';

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const inlineDetailLayout = window.matchMedia('(max-width: 960px)');

function getInitialTheoryId() {
  const requested = new URL(window.location.href).searchParams.get('teoria');
  return findTheory(requested)?.id || THEORIES[0]?.id || '';
}

const state = {
  query: '',
  category: 'todas',
  kind: 'todos',
  reviewState: 'todos',
  concept: 'todos',
  activeId: getInitialTheoryId(),
};

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort(collator.compare);
}

function getFilterLabel(id) {
  return THEORY_FILTERS.find((filter) => filter.id === id)?.label || 'Todas';
}

function searchableText(theory) {
  const relatedTitles = getRelatedTheories(theory).flatMap((item) => [item.code, item.title, item.shortTitle]);
  const references = getTheoryReferences(theory.referenceIds).flatMap((item) => [item.title, item.authors]);

  return normalizeText([
    theory.code,
    theory.slug,
    theory.title,
    theory.shortTitle,
    theory.subtitle,
    theory.summary,
    theory.proposal,
    theory.centralQuestion,
    theory.typeLabel,
    theory.reviewStateLabel,
    theory.review.assessment,
    theory.review.known,
    theory.review.focus,
    theory.review.limit,
    theory.review.test,
    theory.category,
    theory.filters.join(' '),
    theory.concepts.join(' '),
    theory.questions.join(' '),
    theory.nextSteps.join(' '),
    relatedTitles.join(' '),
    references.join(' '),
  ].join(' '));
}

function matchesTheory(theory) {
  const categoryMatch = theoryMatchesCategory(theory, state.category);
  const kindMatch = state.kind === 'todos' || theory.kind === state.kind;
  const reviewMatch = state.reviewState === 'todos' || theory.reviewState === state.reviewState;
  const conceptMatch = state.concept === 'todos'
    || theory.concepts.some((concept) => normalizeText(concept) === normalizeText(state.concept));
  const queryMatch = !state.query || searchableText(theory).includes(normalizeText(state.query));

  return categoryMatch && kindMatch && reviewMatch && conceptMatch && queryMatch;
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

function relatedMarkup(theory) {
  const related = getRelatedTheories(theory);
  if (!related.length) return '<span class="muted-line">Ainda sem conexões catalogadas.</span>';

  return related.map((item) => `
    <button class="related-chip" type="button" data-related-id="${escapeHtml(item.id)}">
      <span>${escapeHtml(item.code)}</span>
      ${escapeHtml(item.shortTitle || item.title)}
    </button>
  `).join('');
}

function referencesMarkup(theory) {
  const references = getTheoryReferences(theory.referenceIds);
  if (!references.length) {
    return '<p class="reference-empty">Esta entrada é metodológica ou filosófica e ainda não possui uma bibliografia científica central catalogada.</p>';
  }

  return `
    <ul class="reference-list">
      ${references.map((reference) => `
        <li>
          <a href="${escapeHtml(reference.url)}" target="_blank" rel="noopener noreferrer">
            <strong>${escapeHtml(reference.title)}</strong>
            <span>${escapeHtml(reference.authors)} · ${escapeHtml(reference.year)}</span>
          </a>
        </li>
      `).join('')}
    </ul>
  `;
}

function reviewGridMarkup(theory, compact = false) {
  const items = [
    ['Contexto conhecido', theory.review.known],
    ['Recorte em investigação', theory.review.focus],
    ['Limite atual', theory.review.limit],
    ['Caminho verificável', theory.review.test],
  ];

  return `
    <div class="critical-review-grid${compact ? ' is-compact' : ''}">
      ${items.map(([label, text]) => `
        <article>
          <span>${escapeHtml(label)}</span>
          <p>${escapeHtml(text)}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function linkageMarkup(theory) {
  if (theory.independent !== false || !theory.parentId) return '';
  const parent = findTheory(theory.parentId);
  if (!parent) return '';

  return `
    <div class="theory-linkage" role="note">
      <span>Linha derivada</span>
      <p>Esta entrada permanece integrada à ${escapeHtml(parent.code)} até apresentar uma pergunta e um resultado próprios.</p>
      <button type="button" data-related-id="${escapeHtml(parent.id)}">Abrir linha principal</button>
    </div>
  `;
}

function renderCategoryFilters() {
  const rail = $('[data-filter-rail]');
  if (!rail) return;

  rail.innerHTML = THEORY_FILTERS.map((filter) => {
    const count = filter.id === 'todas'
      ? THEORIES.length
      : THEORIES.filter((theory) => theoryMatchesCategory(theory, filter.id)).length;
    const active = filter.id === state.category;

    return `
      <button class="archive-filter-chip${active ? ' is-active' : ''}" type="button" data-filter-id="${escapeHtml(filter.id)}" aria-pressed="${active}">
        <span>${escapeHtml(filter.label)}</span>
        <small>${count}</small>
      </button>
    `;
  }).join('');
}

function selectOptions(items, selected, fallbackValue, fallbackLabel) {
  return [
    `<option value="${fallbackValue}">${fallbackLabel}</option>`,
    ...items.map((item) => {
      const value = typeof item === 'string' ? item : item.id;
      const label = typeof item === 'string' ? item : item.label;
      return `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;
    }),
  ].join('');
}

function renderAdvancedFilters() {
  const kind = $('[data-kind-filter]');
  const review = $('[data-review-filter]');
  const concept = $('[data-concept-filter]');

  const usedTypes = THEORY_TYPES.filter((item) => THEORIES.some((theory) => theory.kind === item.id));
  const usedReviewStates = THEORY_REVIEW_STATES.filter((item) => THEORIES.some((theory) => theory.reviewState === item.id));

  if (kind) kind.innerHTML = selectOptions(usedTypes, state.kind, 'todos', 'Todas as naturezas');
  if (review) review.innerHTML = selectOptions(usedReviewStates, state.reviewState, 'todos', 'Todos os estados');
  if (concept) {
    concept.innerHTML = selectOptions(
      uniqueSorted(THEORIES.flatMap((theory) => theory.concepts)),
      state.concept,
      'todos',
      'Todos os conceitos',
    );
  }

  const activeCount = [
    state.kind !== 'todos',
    state.reviewState !== 'todos',
    state.concept !== 'todos',
  ].filter(Boolean).length;

  safeSetText(
    $('[data-advanced-filter-count]'),
    activeCount ? `${activeCount} ${activeCount === 1 ? 'ativo' : 'ativos'}` : 'nenhum ativo',
  );
}

function renderTypeLegend() {
  const legend = $('[data-theory-type-legend]');
  if (!legend) return;

  legend.innerHTML = THEORY_TYPES.map((type) => {
    const count = THEORIES.filter((theory) => theory.kind === type.id).length;
    const active = state.kind === type.id;
    return `
      <button class="type-legend-card${active ? ' is-active' : ''}" type="button" data-type-legend="${escapeHtml(type.id)}" aria-pressed="${active}">
        <span>${count} ${count === 1 ? 'entrada' : 'entradas'}</span>
        <strong>${escapeHtml(type.label)}</strong>
        <small>${escapeHtml(type.description)}</small>
      </button>
    `;
  }).join('');
}

function compactDetailMarkup(theory) {
  return `
    ${linkageMarkup(theory)}
    <div class="mobile-detail-section">
      <h4>Pergunta central</h4>
      <p>${escapeHtml(theory.centralQuestion)}</p>
    </div>
    <div class="mobile-detail-section">
      <h4>Proposição</h4>
      <p>${escapeHtml(theory.proposal)}</p>
    </div>
    <details class="mobile-detail-disclosure">
      <summary>Leitura crítica completa</summary>
      ${reviewGridMarkup(theory, true)}
    </details>
    <details class="mobile-detail-disclosure">
      <summary>Perguntas, próximos passos e conceitos</summary>
      <div class="mobile-detail-section">
        <h4>Perguntas abertas</h4>
        <ul>${listMarkup(theory.questions)}</ul>
      </div>
      <div class="mobile-detail-section">
        <h4>Próximos passos</h4>
        <ul>${listMarkup(theory.nextSteps)}</ul>
      </div>
      <div class="mobile-detail-section">
        <h4>Conceitos conectados</h4>
        <div class="tag-list">${tagsMarkup(theory.concepts)}</div>
      </div>
    </details>
    <details class="mobile-detail-disclosure">
      <summary>Referências e relações</summary>
      ${referencesMarkup(theory)}
      <div class="mobile-detail-section">
        <h4>Linhas relacionadas</h4>
        <div class="related-chip-list">${relatedMarkup(theory)}</div>
      </div>
    </details>
    <div class="mobile-detail-actions">
      <a class="theory-permalink" href="?teoria=${encodeURIComponent(theory.slug)}">Link direto</a>
      <a class="theory-map-link" href="../Mapa/mapa.html?teoria=${encodeURIComponent(theory.slug)}">Ver no mapa</a>
    </div>
  `;
}

function cardMarkup(theory) {
  const active = theory.id === state.activeId;
  const detailId = `${theory.id}-mobile-detail`;
  const inlineExpanded = active && inlineDetailLayout.matches;
  const expansionAttributes = inlineDetailLayout.matches
    ? ` aria-expanded="${inlineExpanded}" aria-controls="${detailId}"`
    : '';

  return `
    <article class="archive-theory-card${active ? ' is-active' : ''}${theory.independent === false ? ' is-derived' : ''}" style="--accent:${theory.color}; --accent-glow:${theory.glow};" data-theory-card="${escapeHtml(theory.id)}">
      <button class="archive-card-trigger" type="button" data-theory-id="${escapeHtml(theory.id)}" aria-label="Abrir ${escapeHtml(theory.code)}: ${escapeHtml(theory.title)}"${expansionAttributes}>
        <span class="archive-card-meta-line">
          <span class="theory-code">${escapeHtml(theory.code)}</span>
          <span class="status-badge">${escapeHtml(theory.typeShortLabel)}</span>
        </span>
        <span class="archive-card-title">${escapeHtml(theory.title)}</span>
        <span class="archive-card-subtitle">${escapeHtml(theory.subtitle)}</span>
        <span class="archive-card-summary">${escapeHtml(theory.summary)}</span>
        <span class="archive-card-assessment">${escapeHtml(theory.review.assessment)}</span>
        <span class="archive-card-footer">
          <span>${escapeHtml(theory.reviewStateLabel)}</span>
          <span>${escapeHtml(getFilterLabel(theory.category))}</span>
          <span>${theory.questions.length} perguntas</span>
        </span>
      </button>
      <div class="mobile-theory-detail" id="${detailId}" ${inlineExpanded ? '' : 'hidden'}>
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
      <summary>${escapeHtml(title)}</summary>
      <div class="dossier-disclosure-content">${content}</div>
    </details>
  `;
}

function renderDossier(theories) {
  const dossier = $('[data-theory-dossier]');
  if (!dossier) return;

  const theory = theories.find((item) => item.id === state.activeId);
  if (!theory) {
    dossier.removeAttribute('style');
    dossier.innerHTML = '<p class="dossier-empty">Ajuste os filtros para selecionar uma entrada deste recorte.</p>';
    return;
  }

  dossier.style.setProperty('--accent', theory.color);
  dossier.style.setProperty('--accent-glow', theory.glow);
  dossier.innerHTML = `
    <div class="dossier-header">
      <p class="detail-kicker">${escapeHtml(theory.code)} · ${escapeHtml(theory.typeLabel)}</p>
      <h3>${escapeHtml(theory.title)}</h3>
      <p>${escapeHtml(theory.subtitle)}</p>
    </div>

    <div class="dossier-metrics" aria-label="Resumo da entrada selecionada">
      <span><strong>${escapeHtml(theory.reviewStateLabel)}</strong> estado do trabalho</span>
      <span><strong>${theory.questions.length}</strong> perguntas</span>
      <span><strong>${getRelatedTheories(theory).length}</strong> relações</span>
    </div>

    <p class="dossier-assessment">${escapeHtml(theory.review.assessment)}</p>
    ${linkageMarkup(theory)}

    <div class="dossier-section">
      <h4>Ideia central</h4>
      <p>${escapeHtml(theory.centralIdea)}</p>
    </div>

    <div class="dossier-section dossier-central-question">
      <h4>Pergunta central</h4>
      <p>${escapeHtml(theory.centralQuestion)}</p>
    </div>

    <div class="dossier-section">
      <h4>Proposição</h4>
      <p>${escapeHtml(theory.proposal)}</p>
    </div>

    <section class="dossier-critical-review" aria-labelledby="${escapeHtml(theory.id)}-review-title">
      <div class="dossier-section-heading">
        <span>leitura em quatro camadas</span>
        <h4 id="${escapeHtml(theory.id)}-review-title">Contexto, proposta, limite e teste</h4>
      </div>
      ${reviewGridMarkup(theory)}
    </section>

    ${disclosure('Perguntas abertas', `<ul>${listMarkup(theory.questions)}</ul>`, true)}
    ${disclosure('Próximos passos', `<ul>${listMarkup(theory.nextSteps)}</ul>`)}
    ${disclosure('Conceitos relacionados', `<div class="tag-list">${tagsMarkup(theory.concepts)}</div>`)}
    ${disclosure('Referências de contexto', referencesMarkup(theory))}
    ${disclosure('Linhas relacionadas', `<div class="related-chip-list">${relatedMarkup(theory)}</div>`)}

    <div class="dossier-revision">
      <span>${escapeHtml(theory.revision.label)}</span>
      <span>versão ${escapeHtml(theory.revision.version)}</span>
    </div>

    <div class="dossier-actions">
      <a class="theory-permalink" href="?teoria=${encodeURIComponent(theory.slug)}">Link direto</a>
      <a class="theory-map-link" href="../Mapa/mapa.html?teoria=${encodeURIComponent(theory.slug)}">Ver no mapa</a>
    </div>
  `;
}

function renderResearchTracks() {
  const grid = $('[data-research-tracks]');
  if (!grid) return;

  grid.innerHTML = RESEARCH_TRACKS.map((track) => `
    <article class="research-track-card">
      <div>
        <span>${escapeHtml(track.code)}</span>
        <small>${escapeHtml(track.kind)}</small>
      </div>
      <h3>${escapeHtml(track.title)}</h3>
      <p>${escapeHtml(track.summary)}</p>
      <dl>
        <div><dt>Limite</dt><dd>${escapeHtml(track.boundary)}</dd></div>
        <div><dt>Próximo passo</dt><dd>${escapeHtml(track.nextStep)}</dd></div>
      </dl>
    </article>
  `).join('');
}

function updateSummary(theories) {
  safeSetText($('[data-theories-total]'), String(THEORIES.length));
  safeSetText($('[data-independent-total]'), String(THEORIES.filter((theory) => theory.independent !== false).length));
  safeSetText($('[data-type-total]'), String(THEORY_TYPES.length));
  safeSetText(
    $('[data-result-count]'),
    `${theories.length} ${theories.length === 1 ? 'entrada encontrada' : 'entradas encontradas'} · ${THEORIES.length} no arquivo`,
  );

  const summary = [getFilterLabel(state.category)];
  if (state.kind !== 'todos') {
    summary.push(THEORY_TYPES.find((item) => item.id === state.kind)?.label || state.kind);
  }
  if (state.reviewState !== 'todos') {
    summary.push(THEORY_REVIEW_STATES.find((item) => item.id === state.reviewState)?.label || state.reviewState);
  }
  if (state.concept !== 'todos') summary.push(state.concept);
  if (state.query) summary.push(`busca: “${state.query}”`);
  safeSetText($('[data-active-filter]'), summary.join(' · '));
}

function syncActiveStates() {
  const inlineMode = inlineDetailLayout.matches;
  document.querySelectorAll('[data-theory-card]').forEach((card) => {
    const active = card.dataset.theoryCard === state.activeId;
    card.classList.toggle('is-active', active);
    const trigger = card.querySelector('[data-theory-id]');
    const inline = card.querySelector('.mobile-theory-detail');
    if (inlineMode) {
      trigger?.setAttribute('aria-expanded', String(active));
      trigger?.setAttribute('aria-controls', inline?.id || '');
    } else {
      trigger?.removeAttribute('aria-expanded');
      trigger?.removeAttribute('aria-controls');
    }
    if (inline) inline.hidden = !inlineMode || !active;
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

  if (!matchesTheory(theory)) {
    state.category = 'todas';
    state.kind = 'todos';
    state.reviewState = 'todos';
    state.concept = 'todos';
    state.query = '';
    const search = $('[data-theory-search]');
    if (search) search.value = '';
    render();
  }

  state.activeId = theory.id;
  syncActiveStates();
  renderDossier(getFilteredTheories());
  if (options.syncUrl !== false) syncUrl(theory);

  if (options.scrollCard) {
    const card = document.querySelector(`[data-theory-card="${CSS.escape(theory.id)}"]`);
    card?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
    requestAnimationFrame(() => card?.querySelector('[data-theory-id]')?.focus({ preventScroll: true }));
  }
}

function render() {
  const theories = getFilteredTheories();
  if (theories.length && !theories.some((theory) => theory.id === state.activeId)) {
    state.activeId = theories[0].id;
  }

  renderCategoryFilters();
  renderAdvancedFilters();
  renderTypeLegend();
  renderCards(theories);
  renderDossier(theories);
  updateSummary(theories);
  syncActiveStates();
}

function closestFromEvent(event, selector) {
  const target = event.target instanceof Element ? event.target : event.target?.parentElement;
  return target?.closest(selector) || null;
}

function resetFilters(options = {}) {
  state.query = '';
  state.category = 'todas';
  state.kind = 'todos';
  state.reviewState = 'todos';
  state.concept = 'todos';
  const search = $('[data-theory-search]');
  if (search) search.value = '';
  render();
  if (options.focus !== false) search?.focus();
}

function bindEvents() {
  const search = $('[data-theory-search]');
  const rail = $('[data-filter-rail]');
  const grid = $('[data-theory-archive-grid]');
  const reset = $('[data-reset-filters]');
  const dossier = $('[data-theory-dossier]');
  const typeLegend = $('[data-theory-type-legend]');
  const kind = $('[data-kind-filter]');
  const review = $('[data-review-filter]');
  const concept = $('[data-concept-filter]');

  search?.addEventListener('input', debounce(() => {
    state.query = search.value.trim();
    render();
  }, 140));

  rail?.addEventListener('click', (event) => {
    const button = closestFromEvent(event, '[data-filter-id]');
    if (!button) return;
    const filterId = button.dataset.filterId || 'todas';
    state.category = filterId;
    render();
    requestAnimationFrame(() => document.querySelector(`[data-filter-id="${CSS.escape(filterId)}"]`)?.focus());
  });

  typeLegend?.addEventListener('click', (event) => {
    const button = closestFromEvent(event, '[data-type-legend]');
    if (!button) return;
    const selected = button.dataset.typeLegend || 'todos';
    state.kind = state.kind === selected ? 'todos' : selected;
    render();
    requestAnimationFrame(() => document.querySelector(`[data-type-legend="${CSS.escape(selected)}"]`)?.focus());
    smoothScrollToElement(document.getElementById('teorias'));
  });

  kind?.addEventListener('change', () => {
    state.kind = kind.value;
    render();
    requestAnimationFrame(() => $('[data-kind-filter]')?.focus());
  });

  review?.addEventListener('change', () => {
    state.reviewState = review.value;
    render();
    requestAnimationFrame(() => $('[data-review-filter]')?.focus());
  });

  concept?.addEventListener('change', () => {
    state.concept = concept.value;
    render();
    requestAnimationFrame(() => $('[data-concept-filter]')?.focus());
  });

  grid?.addEventListener('click', (event) => {
    const related = closestFromEvent(event, '[data-related-id]');
    if (related) {
      setActiveTheory(related.dataset.relatedId, { scrollCard: true });
      return;
    }

    const button = closestFromEvent(event, '[data-theory-id]');
    if (button) setActiveTheory(button.dataset.theoryId);
  });

  dossier?.addEventListener('click', (event) => {
    const related = closestFromEvent(event, '[data-related-id]');
    if (related) setActiveTheory(related.dataset.relatedId, { scrollCard: true });
  });

  reset?.addEventListener('click', () => resetFilters());

  window.addEventListener('popstate', () => {
    const requested = new URL(window.location.href).searchParams.get('teoria');
    const theory = findTheory(requested);
    if (theory) setActiveTheory(theory.id, { syncUrl: false, scrollCard: true });
  });

  const syncInlineLayout = () => syncActiveStates();
  if (inlineDetailLayout.addEventListener) inlineDetailLayout.addEventListener('change', syncInlineLayout);
  else inlineDetailLayout.addListener?.(syncInlineLayout);
}

function boot() {
  initNavigation();
  renderResearchTracks();
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
