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
  getTheoryPublicProposal,
  getTheoryPublicSummary,
  getRelatedTheories,
  getTheoryRelationBetween,
  getTheoryRelations,
  theoryMatchesCategory,
} from '../assets/js/theory-model.js';
import { getNotableFigureConnections } from '../assets/js/theory-figure-model.js';
import {
  THEORIES,
  THEORY_FILTERS,
  THEORY_REVIEW_STATES,
  THEORY_TYPES,
} from '../assets/data/generated/runtime/theories.js';
import { RESEARCH_TRACKS } from '../assets/data/generated/runtime/research-tracks.js';
import { getTheoryReferences } from '../assets/js/reference-model.js';
import { getPublicRelationJustification } from '../assets/js/relation-review.js';

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' });
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const inlineDetailLayout = window.matchMedia('(max-width: 960px)');

function getInitialTheoryId() {
  const requested = new URL(window.location.href).searchParams.get('teoria');
  return findTheory(requested)?.id || THEORIES[0]?.id || '';
}

function getInitialComparisonIds() {
  const requested = new URL(window.location.href).searchParams.get('comparar') || '';
  return [...new Set(requested
    .split(',')
    .map((value) => findTheory(value.trim())?.id)
    .filter(Boolean))].slice(0, 2);
}

const initialComparisonIds = getInitialComparisonIds();

const state = {
  query: '',
  category: 'todas',
  kind: 'todos',
  reviewState: 'todos',
  concept: 'todos',
  activeId: getInitialTheoryId(),
  compareFirstId: initialComparisonIds[0] || '',
  compareSecondId: initialComparisonIds[1] || '',
};

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort(collator.compare);
}

function getFilterLabel(id) {
  return THEORY_FILTERS.find((filter) => filter.id === id)?.label || 'Todas';
}

function searchableText(theory) {
  const relations = getTheoryRelations(theory);
  const relatedTitles = relations.flatMap((item) => [
    item.theory.code,
    item.theory.title,
    item.theory.shortTitle,
    item.relationLabel,
    getPublicRelationJustification(item),
  ]);
  const references = getTheoryReferences(theory.referenceIds).flatMap((item) => [item.title, item.authors]);
  const figures = getNotableFigureConnections(theory).flatMap((item) => [
    item.figure.name,
    item.label,
    getPublicRelationJustification(item),
  ]);

  return normalizeText([
    theory.code,
    theory.slug,
    theory.title,
    theory.shortTitle,
    theory.subtitle,
    getTheoryPublicSummary(theory),
    getTheoryPublicProposal(theory),
    theory.centralQuestion,
    theory.typeLabel,
    theory.reviewStateLabel,
    theory.review.known,
    theory.review.focus,
    theory.review.limit,
    theory.review.test,
    theory.category,
    theory.filters.join(' '),
    theory.concepts.join(' '),
    theory.questions.join(' '),
    theory.claims.flatMap((claim) => [claim.label, claim.text]).join(' '),
    theory.objections.flatMap((objection) => [
      objection.title,
      objection.statusLabel,
      objection.status === 'aberta' ? '' : objection.response,
    ]).join(' '),
    theory.rubric.flatMap((criterion) => [criterion.label, criterion.question]).join(' '),
    theory.decisionBoundary.revise,
    theory.decisionBoundary.abandon,
    relatedTitles.join(' '),
    references.join(' '),
    figures.join(' '),
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
  const relations = getTheoryRelations(theory);
  if (!relations.length) return '<span class="muted-line">Nenhuma relação listada.</span>';

  return relations.map((relation) => {
    const justification = getPublicRelationJustification(relation);
    return `
    <button class="related-relation" type="button" data-related-id="${escapeHtml(relation.theory.id)}">
      <span class="related-relation-title">
        <strong>${escapeHtml(relation.theory.code)} · ${escapeHtml(relation.theory.shortTitle || relation.theory.title)}</strong>
        <small>${escapeHtml(relation.relationLabel)}</small>
      </span>
      ${justification ? `<span class="related-relation-note">${escapeHtml(justification)}</span>` : ''}
      <span class="relation-review-state${relation.reviewPending ? ' is-pending' : ''}">${escapeHtml(relation.reviewLabel)}</span>
      <span class="relation-review-disclosure">${escapeHtml(relation.reviewDisclosure)}</span>
    </button>
  `;
  }).join('');
}

function claimReferencesMarkup(theory) {
  if (!theory.claims.length) {
    return '<p class="reference-empty">Não há fontes vinculadas a afirmações específicas nesta versão.</p>';
  }

  return `
    <ul class="claim-reference-list">
      ${theory.claims.map((claim) => {
        const references = getTheoryReferences(claim.referenceIds);
        return `
          <li>
            <span class="claim-label">${escapeHtml(claim.label)}</span>
            <p>${escapeHtml(claim.text)}</p>
            <div class="claim-source-links" aria-label="Fontes ligadas a esta afirmação">
              ${references.map((reference) => `
                <a href="${escapeHtml(reference.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(reference.authors)} · ${escapeHtml(reference.year)}</a>
              `).join('')}
            </div>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

function objectionsMarkup(theory) {
  return `
    <ul class="objection-list">
      ${theory.objections.map((objection) => `
        <li>
          <div class="objection-heading">
            <strong>${escapeHtml(objection.title)}</strong>
            <span class="objection-state" data-objection-state="${escapeHtml(objection.status)}">${escapeHtml(objection.statusLabel)}</span>
          </div>
          ${objection.status === 'aberta' ? '' : `<p>${escapeHtml(objection.response)}</p>`}
        </li>
      `).join('')}
    </ul>
  `;
}

function rubricMarkup(theory) {
  return `
    <ol class="rubric-list">
      ${theory.rubric.map((criterion) => `
        <li>
          <span>${escapeHtml(criterion.label)}</span>
          <p>${escapeHtml(criterion.question)}</p>
        </li>
      `).join('')}
    </ol>
  `;
}

function decisionBoundaryMarkup(theory) {
  return `
    <div class="decision-boundary-grid">
      <article>
        <span>Revisar quando</span>
        <p>${escapeHtml(theory.decisionBoundary.revise)}</p>
      </article>
      <article>
        <span>Abandonar ou encerrar quando</span>
        <p>${escapeHtml(theory.decisionBoundary.abandon)}</p>
      </article>
    </div>
  `;
}

function notableFiguresMarkup(theory) {
  const connections = getNotableFigureConnections(theory);
  if (!connections.length) {
    return '<p class="reference-empty">Não há perfis históricos relacionados a esta linha.</p>';
  }

  return `
    <ul class="theory-figure-list">
      ${connections.map((connection) => {
        const justification = getPublicRelationJustification(connection);
        return `
        <li>
          <a href="../GrandesNomes/grandes-nomes.html?perfil=${encodeURIComponent(connection.figure.slug)}">
            <strong>${escapeHtml(connection.figure.name)}</strong>
            <span>${escapeHtml(connection.relationLabel)} · ${escapeHtml(connection.label)}</span>
            ${justification ? `<small>${escapeHtml(justification)}</small>` : ''}
            <small class="relation-review-state${connection.reviewPending ? ' is-pending' : ''}">${escapeHtml(connection.reviewLabel)}</small>
            <small class="relation-review-disclosure">${escapeHtml(connection.reviewDisclosure)}</small>
          </a>
        </li>
      `;
      }).join('')}
    </ul>
  `;
}

function revisionMarkup(theory) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return `
    <section class="revision-history" aria-label="Histórico de revisão de ${escapeHtml(theory.title)}">
      <span class="revision-history-label">Histórico individual</span>
      <ol>
        ${[...theory.revisionHistory].reverse().map((revision) => `
          <li class="revision-record">
            <div>
              <strong>Versão ${escapeHtml(revision.version)} · ${escapeHtml(formatter.format(new Date(`${revision.reviewedAt}T00:00:00Z`)))}</strong>
            </div>
          </li>
        `).join('')}
      </ol>
    </section>
  `;
}

function versionNoticeMarkup(theory) {
  const url = new URL(window.location.href);
  const requestedTheory = findTheory(url.searchParams.get('teoria'));
  const requestedVersion = url.searchParams.get('versao');
  if (!requestedVersion || requestedTheory?.id !== theory.id) return '';

  if (requestedVersion === theory.revision.version) {
    return `<p class="version-link-notice" role="status">Este endereço identifica a versão ${escapeHtml(theory.revision.version)}, atualmente publicada.</p>`;
  }

  return `<p class="version-link-notice is-outdated" role="status">O endereço aponta para a versão ${escapeHtml(requestedVersion)}, que não está preservada nesta página. Exibindo a versão atual ${escapeHtml(theory.revision.version)}.</p>`;
}

function referencesMarkup(theory) {
  const references = getTheoryReferences(theory.referenceIds);
  if (!references.length) {
    return '<p class="reference-empty">Não há referências bibliográficas listadas para esta linha.</p>';
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
      <p>Esta linha deriva de ${escapeHtml(parent.code)}.</p>
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
      <h4>${theory.independent === false ? 'Recorte em investigação' : 'Proposição'}</h4>
      <p>${escapeHtml(getTheoryPublicProposal(theory))}</p>
    </div>
    <details class="mobile-detail-disclosure">
      <summary>Leitura crítica completa</summary>
      ${reviewGridMarkup(theory, true)}
    </details>
    <details class="mobile-detail-disclosure">
      <summary>Perguntas e conceitos</summary>
      <div class="mobile-detail-section">
        <h4>Perguntas abertas</h4>
        <ul>${listMarkup(theory.questions)}</ul>
      </div>
      <div class="mobile-detail-section">
        <h4>Conceitos conectados</h4>
        <div class="tag-list">${tagsMarkup(theory.concepts)}</div>
      </div>
    </details>
    <details class="mobile-detail-disclosure">
      <summary>Objeções e condição de saída</summary>
      ${objectionsMarkup(theory)}
      ${decisionBoundaryMarkup(theory)}
    </details>
    <details class="mobile-detail-disclosure">
      <summary>Critérios de investigação</summary>
      ${rubricMarkup(theory)}
    </details>
    <details class="mobile-detail-disclosure">
      <summary>Afirmações, fontes e relações históricas</summary>
      ${claimReferencesMarkup(theory)}
      <div class="mobile-detail-section">
        <h4>Bibliografia completa</h4>
        ${referencesMarkup(theory)}
      </div>
      <div class="mobile-detail-section">
        <h4>Grandes nomes relacionados</h4>
        ${notableFiguresMarkup(theory)}
      </div>
    </details>
    <details class="mobile-detail-disclosure">
      <summary>Relações entre linhas</summary>
      <div class="mobile-detail-section">
        <h4>Linhas relacionadas</h4>
        <div class="related-chip-list">${relatedMarkup(theory)}</div>
      </div>
    </details>
    ${revisionMarkup(theory)}
    ${versionNoticeMarkup(theory)}
    <div class="mobile-detail-actions">
      <button class="theory-permalink" type="button" data-copy-version-link="${escapeHtml(theory.id)}">Copiar link da versão</button>
      <a class="theory-map-link" href="../Mapa/mapa.html?teoria=${encodeURIComponent(theory.slug)}">Ver no mapa</a>
    </div>
    <p class="copy-status" aria-live="polite" data-copy-status="${escapeHtml(theory.id)}"></p>
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
    <article class="archive-theory-card${active ? ' is-active' : ''}${theory.independent === false ? ' is-derived' : ''}" data-theory-card="${escapeHtml(theory.id)}">
      <button class="archive-card-trigger" type="button" data-theory-id="${escapeHtml(theory.id)}" aria-label="Abrir ${escapeHtml(theory.code)}: ${escapeHtml(theory.title)}"${expansionAttributes}>
        <span class="archive-card-meta-line">
          <span class="theory-code">${escapeHtml(theory.code)}</span>
          <span class="status-badge">${escapeHtml(theory.typeShortLabel)}</span>
        </span>
        <span class="archive-card-title">${escapeHtml(theory.title)}</span>
        <span class="archive-card-subtitle">${escapeHtml(theory.subtitle)}</span>
        <span class="archive-card-summary">${escapeHtml(getTheoryPublicSummary(theory))}</span>
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
  theories.forEach((theory) => {
    const card = grid.querySelector(`[data-theory-card="${theory.id}"]`);
    card?.style.setProperty('--accent', theory.color);
    card?.style.setProperty('--accent-glow', theory.glow);
  });
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

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const field = document.createElement('textarea');
  field.className = 'clipboard-fallback';
  field.value = value;
  field.setAttribute('readonly', '');
  document.body.append(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('copy-failed');
}

function comparisonOptionMarkup(selectedId, unavailableId = '') {
  return [
    '<option value="">Escolha uma linha</option>',
    ...THEORIES.map((theory) => `
      <option value="${escapeHtml(theory.id)}"${theory.id === selectedId ? ' selected' : ''}${theory.id === unavailableId ? ' disabled' : ''}>
        ${escapeHtml(theory.code)} · ${escapeHtml(theory.shortTitle || theory.title)}
      </option>
    `),
  ].join('');
}

function renderComparisonControls() {
  const first = $('[data-compare-first]');
  const second = $('[data-compare-second]');
  if (first) first.innerHTML = comparisonOptionMarkup(state.compareFirstId, state.compareSecondId);
  if (second) second.innerHTML = comparisonOptionMarkup(state.compareSecondId, state.compareFirstId);
}

function comparisonHeaderMarkup(theory) {
  return `
    <button type="button" data-comparison-open="${escapeHtml(theory.id)}">
      <span>${escapeHtml(theory.code)}</span>
      <strong>${escapeHtml(theory.title)}</strong>
      <small>Abrir dossiê</small>
    </button>
  `;
}

function comparisonFigureNames(theory) {
  const figures = getNotableFigureConnections(theory);
  return figures.length
    ? figures.map((connection) => connection.figure.name).join(', ')
    : 'Nenhum perfil histórico relacionado nesta versão.';
}

function renderComparison() {
  const output = $('[data-comparison-output]');
  const copyButton = $('[data-copy-comparison]');
  if (!output) return;

  const first = findTheory(state.compareFirstId);
  const second = findTheory(state.compareSecondId);
  const complete = Boolean(first && second && first.id !== second.id);
  if (copyButton) copyButton.disabled = !complete;

  if (!complete) {
    output.innerHTML = `
      <div class="comparison-empty" role="status">
        <strong>${first || second ? 'Escolha a segunda linha.' : 'Escolha duas linhas para comparar.'}</strong>
      </div>
    `;
    return;
  }

  const relation = getTheoryRelationBetween(first, second);
  const rows = [
    ['Natureza e estado', `${first.typeLabel} · ${first.reviewStateLabel}`, `${second.typeLabel} · ${second.reviewStateLabel}`],
    ['Pergunta central', first.centralQuestion, second.centralQuestion],
    [first.independent === false || second.independent === false ? 'Recorte em investigação' : 'Proposição', getTheoryPublicProposal(first), getTheoryPublicProposal(second)],
    ['Limite atual', first.review.limit, second.review.limit],
    ['Caminho verificável', first.review.test, second.review.test],
    ['Revisar quando', first.decisionBoundary.revise, second.decisionBoundary.revise],
    ['Abandonar ou encerrar quando', first.decisionBoundary.abandon, second.decisionBoundary.abandon],
    ['Grandes nomes relacionados', comparisonFigureNames(first), comparisonFigureNames(second)],
    ['Revisão atual', `v${first.revision.version} · ${first.revision.reviewedAt}`, `v${second.revision.version} · ${second.revision.reviewedAt}`],
  ];

  output.innerHTML = `
    ${relation ? `
      <div class="comparison-relation" role="note">
        <span>${escapeHtml(relation.relationLabel)}</span>
        ${getPublicRelationJustification(relation) ? `<p>${escapeHtml(getPublicRelationJustification(relation))}</p>` : ''}
        <small class="relation-review-state${relation.reviewPending ? ' is-pending' : ''}">${escapeHtml(relation.reviewLabel)}</small>
        <small class="relation-review-disclosure">${escapeHtml(relation.reviewDisclosure)}</small>
      </div>
    ` : '<p class="comparison-no-relation">Não há relação direta listada entre estas linhas.</p>'}
    <div class="comparison-table-scroll" tabindex="0" role="region" aria-label="Tabela comparativa das linhas selecionadas">
      <table class="comparison-table">
        <caption class="sr-only">Comparação crítica entre ${escapeHtml(first.title)} e ${escapeHtml(second.title)}</caption>
        <thead>
          <tr>
            <th scope="col">Critério</th>
            <th scope="col">${comparisonHeaderMarkup(first)}</th>
            <th scope="col">${comparisonHeaderMarkup(second)}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(([label, firstValue, secondValue]) => `
            <tr>
              <th scope="row">${escapeHtml(label)}</th>
              <td>${escapeHtml(firstValue)}</td>
              <td>${escapeHtml(secondValue)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function syncComparisonUrl() {
  const url = new URL(window.location.href);
  const first = findTheory(state.compareFirstId);
  const second = findTheory(state.compareSecondId);
  if (first && second && first.id !== second.id) {
    url.searchParams.set('comparar', `${first.slug},${second.slug}`);
  } else {
    url.searchParams.delete('comparar');
  }
  window.history.replaceState({
    theory: findTheory(state.activeId)?.slug || '',
    comparison: first && second ? [first.slug, second.slug] : [],
  }, '', url);
}

function setComparison(slot, id, options = {}) {
  const theory = findTheory(id);
  const key = slot === 'second' ? 'compareSecondId' : 'compareFirstId';
  const otherKey = slot === 'second' ? 'compareFirstId' : 'compareSecondId';
  state[key] = theory && theory.id !== state[otherKey] ? theory.id : '';
  renderComparisonControls();
  renderComparison();
  if (state.compareFirstId && state.compareSecondId) {
    const comparisonTool = document.getElementById('comparar');
    if (comparisonTool instanceof HTMLDetailsElement) comparisonTool.open = true;
  }
  if (options.syncUrl !== false) syncComparisonUrl();
}

function syncComparisonDisclosure() {
  const comparisonTool = document.getElementById('comparar');
  if (!(comparisonTool instanceof HTMLDetailsElement)) return;
  if ((state.compareFirstId && state.compareSecondId) || window.location.hash === '#comparar') {
    comparisonTool.open = true;
  }
  safeSetText(
    $('[data-comparison-disclosure-label]'),
    comparisonTool.open ? 'Fechar ferramenta' : 'Abrir ferramenta',
  );
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

    ${linkageMarkup(theory)}

    <div class="dossier-section">
      <h4>Ideia central</h4>
      <p>${escapeHtml(getTheoryPublicSummary(theory))}</p>
    </div>

    <div class="dossier-section dossier-central-question">
      <h4>Pergunta central</h4>
      <p>${escapeHtml(theory.centralQuestion)}</p>
    </div>

    <div class="dossier-section">
      <h4>${theory.independent === false ? 'Recorte em investigação' : 'Proposição'}</h4>
      <p>${escapeHtml(getTheoryPublicProposal(theory))}</p>
    </div>

    <section class="dossier-critical-review" aria-labelledby="${escapeHtml(theory.id)}-review-title">
      <div class="dossier-section-heading">
        <span>leitura em quatro camadas</span>
        <h4 id="${escapeHtml(theory.id)}-review-title">Contexto, proposta, limite e teste</h4>
      </div>
      ${reviewGridMarkup(theory)}
    </section>

    ${disclosure('Objeções registradas', objectionsMarkup(theory), true)}
    ${disclosure('Condição de revisão ou abandono', decisionBoundaryMarkup(theory), true)}
    ${disclosure('Critérios de investigação', rubricMarkup(theory))}
    ${disclosure('Perguntas abertas', `<ul>${listMarkup(theory.questions)}</ul>`)}
    ${disclosure('Conceitos relacionados', `<div class="tag-list">${tagsMarkup(theory.concepts)}</div>`)}
    ${disclosure('Afirmações ligadas às fontes', claimReferencesMarkup(theory))}
    ${disclosure('Referências de contexto', referencesMarkup(theory))}
    ${disclosure('Grandes nomes relacionados', notableFiguresMarkup(theory))}
    ${disclosure('Relações tipadas entre linhas', `<div class="related-chip-list">${relatedMarkup(theory)}</div>`)}

    ${revisionMarkup(theory)}
    ${versionNoticeMarkup(theory)}

    <div class="dossier-actions">
      <button class="theory-permalink" type="button" data-copy-version-link="${escapeHtml(theory.id)}">Copiar link da versão</button>
      <a class="theory-map-link" href="../Mapa/mapa.html?teoria=${encodeURIComponent(theory.slug)}">Ver no mapa</a>
    </div>
    <p class="copy-status" aria-live="polite" data-copy-status="${escapeHtml(theory.id)}"></p>
  `;
  dossier.scrollTop = 0;
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

function syncUrl(theory, options = {}) {
  const url = new URL(window.location.href);
  url.searchParams.set('teoria', theory.slug);
  if (!options.preserveVersion) url.searchParams.delete('versao');
  window.history.replaceState({
    theory: theory.slug,
    comparison: [state.compareFirstId, state.compareSecondId]
      .map((id) => findTheory(id)?.slug)
      .filter(Boolean),
  }, '', url);
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
  if (options.syncUrl !== false) syncUrl(theory);
  renderDossier(getFilteredTheories());

  if (options.scrollCard) {
    const card = document.querySelector(`[data-theory-card="${CSS.escape(theory.id)}"]`);
    card?.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
    requestAnimationFrame(() => card?.querySelector('[data-theory-id]')?.focus({ preventScroll: true }));
  }
}

function render() {
  const theories = getFilteredTheories();
  let activeChanged = false;
  if (theories.length && !theories.some((theory) => theory.id === state.activeId)) {
    state.activeId = theories[0].id;
    activeChanged = true;
  }

  renderCategoryFilters();
  renderAdvancedFilters();
  renderTypeLegend();
  renderCards(theories);
  renderDossier(theories);
  updateSummary(theories);
  syncActiveStates();
  if (activeChanged) syncUrl(theories[0]);
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

function setCopyStatus(theoryId, message) {
  document.querySelectorAll(`[data-copy-status="${CSS.escape(theoryId)}"]`)
    .forEach((element) => safeSetText(element, message));
}

async function copyVersionLink(theoryId) {
  const theory = findTheory(theoryId);
  if (!theory) return;
  const url = new URL(window.location.href);
  url.searchParams.set('teoria', theory.slug);
  url.searchParams.set('versao', theory.revision.version);
  url.hash = 'teorias';

  try {
    await copyText(url.toString());
    setCopyStatus(theory.id, `Link da versão ${theory.revision.version} copiado.`);
  } catch {
    setCopyStatus(theory.id, 'Não foi possível copiar automaticamente. Use o endereço do navegador.');
  }
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
  const compareFirst = $('[data-compare-first]');
  const compareSecond = $('[data-compare-second]');
  const comparisonOutput = $('[data-comparison-output]');
  const copyComparison = $('[data-copy-comparison]');
  const clearComparison = $('[data-clear-comparison]');
  const comparisonTool = document.getElementById('comparar');

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
    const versionLink = closestFromEvent(event, '[data-copy-version-link]');
    if (versionLink) {
      copyVersionLink(versionLink.dataset.copyVersionLink);
      return;
    }

    const related = closestFromEvent(event, '[data-related-id]');
    if (related) {
      setActiveTheory(related.dataset.relatedId, { scrollCard: true });
      return;
    }

    const button = closestFromEvent(event, '[data-theory-id]');
    if (button) setActiveTheory(button.dataset.theoryId);
  });

  dossier?.addEventListener('click', (event) => {
    const versionLink = closestFromEvent(event, '[data-copy-version-link]');
    if (versionLink) {
      copyVersionLink(versionLink.dataset.copyVersionLink);
      return;
    }

    const related = closestFromEvent(event, '[data-related-id]');
    if (related) setActiveTheory(related.dataset.relatedId, { scrollCard: true });
  });

  compareFirst?.addEventListener('change', () => setComparison('first', compareFirst.value));
  compareSecond?.addEventListener('change', () => setComparison('second', compareSecond.value));

  comparisonOutput?.addEventListener('click', (event) => {
    const button = closestFromEvent(event, '[data-comparison-open]');
    if (!button) return;
    setActiveTheory(button.dataset.comparisonOpen, { scrollCard: true });
  });

  clearComparison?.addEventListener('click', () => {
    state.compareFirstId = '';
    state.compareSecondId = '';
    renderComparisonControls();
    renderComparison();
    syncComparisonUrl();
    compareFirst?.focus();
  });

  comparisonTool?.addEventListener('toggle', syncComparisonDisclosure);
  window.addEventListener('hashchange', syncComparisonDisclosure);

  copyComparison?.addEventListener('click', async () => {
    const status = $('[data-comparison-status]');
    try {
      syncComparisonUrl();
      await copyText(window.location.href);
      safeSetText(status, 'Link da comparação copiado.');
    } catch {
      safeSetText(status, 'Não foi possível copiar automaticamente. Use o endereço do navegador.');
    }
  });

  reset?.addEventListener('click', () => resetFilters());

  window.addEventListener('popstate', () => {
    const url = new URL(window.location.href);
    const requested = url.searchParams.get('teoria');
    const theory = findTheory(requested);
    if (theory) setActiveTheory(theory.id, { syncUrl: false, scrollCard: true });
    const comparisonIds = [...new Set((url.searchParams.get('comparar') || '')
      .split(',')
      .map((value) => findTheory(value.trim())?.id)
      .filter(Boolean))].slice(0, 2);
    state.compareFirstId = comparisonIds[0] || '';
    state.compareSecondId = comparisonIds[1] || '';
    renderComparisonControls();
    renderComparison();
    syncComparisonDisclosure();
  });

  const syncInlineLayout = () => syncActiveStates();
  if (inlineDetailLayout.addEventListener) inlineDetailLayout.addEventListener('change', syncInlineLayout);
  else inlineDetailLayout.addListener?.(syncInlineLayout);
}

function boot() {
  initNavigation();
  renderResearchTracks();
  bindEvents();
  renderComparisonControls();
  renderComparison();
  syncComparisonDisclosure();
  render();
  const active = findTheory(state.activeId);
  const url = new URL(window.location.href);
  const requested = url.searchParams.get('teoria');
  if (active && requested !== active.slug) syncUrl(active, { preserveVersion: true });
  const requestedComparison = url.searchParams.get('comparar');
  const canonicalComparison = [state.compareFirstId, state.compareSecondId]
    .map((id) => findTheory(id)?.slug)
    .filter(Boolean)
    .join(',');
  if (requestedComparison !== null && requestedComparison !== canonicalComparison) {
    syncComparisonUrl();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
