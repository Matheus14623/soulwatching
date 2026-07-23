const searchState = {
  entries: null,
  entriesPromise: null,
  loadError: null,
  trigger: null,
  dialog: null,
  input: null,
  results: null,
  count: null,
  returnFocus: null,
};

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function ensureStylesheet() {
  if (document.querySelector('[data-global-search-styles]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('../css/global-search.css?v=global-search-v1', import.meta.url).href;
  link.dataset.globalSearchStyles = '';
  document.head.append(link);
}

function textFrom(items) {
  return items.filter(Boolean).join(' ');
}

async function loadEntries() {
  if (searchState.entries) return searchState.entries;
  if (searchState.entriesPromise) return searchState.entriesPromise;
  searchState.loadError = null;
  searchState.entriesPromise = (async () => {
    const [theoryModule, figureModule, constellationModule, experimentModule, routeModule, contributionModule] = await Promise.all([
      import('../data/theories.js'),
      import('../data/notable-figures.js'),
      import('../data/constellations.js'),
      import('../data/experiments.js'),
      import('../data/learning-paths.js'),
      import('../data/contributions.js'),
    ]);

    const entries = [
      ...theoryModule.THEORIES.map((theory) => ({
        id: `theory:${theory.id}`,
        type: 'theory',
        category: 'Teorias',
        title: theory.title,
        summary: theory.summary,
        href: `/Teorias/teorias.html?teoria=${encodeURIComponent(theory.slug)}`,
        searchText: textFrom([
          theory.title,
          theory.subtitle,
          theory.summary,
          theory.proposal,
          theory.centralQuestion,
          theory.category,
          ...(theory.concepts || []),
          ...(theory.questions || []),
          ...(theory.objections || []).flatMap((objection) => [objection.title, objection.response]),
        ]),
      })),
      ...figureModule.NOTABLE_FIGURES.map((figure) => ({
        id: `figure:${figure.id}`,
        type: 'figure',
        category: 'Grandes nomes',
        title: figure.name,
        summary: figure.summary,
        href: `/GrandesNomes/grandes-nomes.html?perfil=${encodeURIComponent(figure.slug)}#galeria`,
        searchText: textFrom([figure.name, figure.role, figure.summary, figure.impact, ...(figure.milestones || [])]),
      })),
      ...constellationModule.CONSTELLATIONS.map((constellation) => ({
        id: `constellation:${constellation.id}`,
        type: 'constellation',
        category: 'Atlas celeste',
        title: constellation.name,
        summary: constellation.signature,
        href: `/Constelacoes/constelacoes.html?constelacao=${encodeURIComponent(constellation.slug)}#atlas`,
        searchText: textFrom([constellation.name, constellation.latinName, constellation.abbreviation, constellation.signature, constellation.recognition, ...constellation.stars.map((star) => star.name)]),
      })),
      ...experimentModule.EXPERIMENTS.map((experiment) => ({
        id: `experiment:${experiment.id}`,
        type: 'experiment',
        category: 'Laboratório',
        title: experiment.title,
        summary: experiment.summary,
        href: experiment.href,
        searchText: textFrom([experiment.title, experiment.shortTitle, experiment.summary, experiment.question, experiment.technology]),
      })),
      ...routeModule.LEARNING_PATHS.map((route) => ({
        id: `route:${route.id}`,
        type: 'route',
        category: 'Rotas guiadas',
        title: route.title,
        summary: route.summary,
        href: `/Rotas/rotas.html?rota=${encodeURIComponent(route.slug)}#percurso`,
        searchText: textFrom([route.title, route.summary, route.audience, ...route.steps.map((step) => step.reason)]),
      })),
      ...contributionModule.CONTRIBUTIONS.map((contribution) => ({
        id: `contribution:${contribution.id}`,
        type: 'contribution',
        category: 'Contribuições',
        title: contribution.title,
        summary: contribution.summary,
        href: `/Contribuicoes/contribuicoes.html#${encodeURIComponent(contribution.slug)}`,
        searchText: textFrom([contribution.title, contribution.summary, ...contribution.authors.map((author) => author.creditName)]),
      })),
    ].map((entry) => Object.freeze({
      ...entry,
      normalizedTitle: normalize(entry.title),
      normalizedText: normalize(entry.searchText),
    }));
    searchState.entries = Object.freeze(entries);
    return searchState.entries;
  })();

  try {
    return await searchState.entriesPromise;
  } catch (error) {
    searchState.entriesPromise = null;
    searchState.loadError = error;
    throw error;
  }
}

function resultScore(entry, query, terms) {
  let score = 0;
  if (entry.normalizedTitle === query) score += 120;
  if (entry.normalizedTitle.startsWith(query)) score += 70;
  if (entry.normalizedTitle.includes(query)) score += 40;
  terms.forEach((term) => {
    if (entry.normalizedTitle.includes(term)) score += 16;
    if (entry.normalizedText.includes(term)) score += 5;
  });
  return score;
}

function findResults(query) {
  const entries = searchState.entries || [];
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    const preferredTypes = ['route', 'experiment'];
    return entries
      .filter((entry) => preferredTypes.includes(entry.type))
      .sort((a, b) => preferredTypes.indexOf(a.type) - preferredTypes.indexOf(b.type))
      .slice(0, 8);
  }
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return entries
    .map((entry) => ({ entry, score: resultScore(entry, normalizedQuery, terms) }))
    .filter(({ score, entry }) => score > 0 && terms.every((term) => entry.normalizedText.includes(term)))
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, 'pt-BR'))
    .slice(0, 12)
    .map(({ entry }) => entry);
}

function createResult(entry) {
  const link = createElement('a', 'global-search-result');
  link.href = entry.href;
  link.dataset.searchResult = '';
  const meta = createElement('span', 'global-search-result-meta', entry.category);
  const title = createElement('strong', '', entry.title);
  const summary = createElement('span', 'global-search-result-summary', entry.summary);
  const arrow = createElement('span', 'global-search-result-arrow', '↗');
  arrow.setAttribute('aria-hidden', 'true');
  link.append(meta, title, summary, arrow);
  return link;
}

function renderResults(query = '') {
  if (!searchState.entries) {
    searchState.results.replaceChildren();
    searchState.count.textContent = searchState.loadError
      ? 'Não foi possível carregar o índice de busca.'
      : 'Carregando índice…';
    return;
  }
  const results = findResults(query);
  searchState.results.replaceChildren(...results.map(createResult));
  const emptyQuery = !normalize(query);
  searchState.count.textContent = results.length
    ? emptyQuery
      ? 'Sugestões para começar'
      : `${results.length} ${results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`
    : 'Nenhum resultado encontrado. Tente outra palavra ou conceito.';
}

function isUsableFocusCandidate(candidate) {
  if (!(candidate instanceof HTMLElement) || !candidate.isConnected || candidate === document.body) return false;
  if (candidate.closest('[inert], [hidden], [aria-hidden="true"]')) return false;
  if (candidate.matches(':disabled')) return false;
  let current = candidate;
  while (current instanceof HTMLElement) {
    const style = window.getComputedStyle(current);
    if (style.display === 'none'
      || style.visibility === 'hidden'
      || style.visibility === 'collapse'
      || Number.parseFloat(style.opacity || '1') <= 0) return false;
    current = current.parentElement;
  }
  return candidate.getClientRects().length > 0;
}

function createDialog() {
  const dialog = createElement('dialog', 'global-search-dialog');
  dialog.setAttribute('aria-labelledby', 'global-search-title');
  const shell = createElement('div', 'global-search-shell');
  const header = createElement('header', 'global-search-header');
  const heading = createElement('div');
  heading.append(
    createElement('span', 'global-search-overline', 'BUSCA GLOBAL'),
    createElement('h2', '', 'Encontre uma ideia, pessoa ou experimento.'),
  );
  heading.querySelector('h2').id = 'global-search-title';
  const close = createElement('button', 'global-search-close', 'Fechar');
  close.type = 'button';
  close.setAttribute('aria-label', 'Fechar busca');
  close.addEventListener('click', () => dialog.close());
  header.append(heading, close);

  const search = createElement('div', 'global-search-field');
  search.setAttribute('role', 'search');
  const label = createElement('label', 'sr-only', 'Buscar em todo o Observatório');
  label.htmlFor = 'global-search-input';
  const input = createElement('input');
  input.id = 'global-search-input';
  input.type = 'search';
  input.autocomplete = 'off';
  input.placeholder = 'Ex.: causalidade, Leavitt, Órion, recorrência…';
  input.setAttribute('aria-describedby', 'global-search-count');
  search.append(label, input);

  const count = createElement('p', 'global-search-count');
  count.id = 'global-search-count';
  count.setAttribute('aria-live', 'polite');
  const results = createElement('div', 'global-search-results');
  const footer = createElement('footer', 'global-search-footer');
  footer.append(
    createElement('span', '', '↑ ↓ para navegar'),
    createElement('span', '', 'Esc para fechar'),
    createElement('a', '', 'Propor uma contribuição →'),
  );
  footer.querySelector('a').href = '/Contribuicoes/contribuicoes.html#propor';
  shell.append(header, search, count, results, footer);
  dialog.append(shell);
  document.body.append(dialog);
  searchState.dialog = dialog;
  searchState.input = input;
  searchState.results = results;
  searchState.count = count;

  input.addEventListener('input', () => renderResults(input.value));
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown') return;
    const first = results.querySelector('[data-search-result]');
    if (!first) return;
    event.preventDefault();
    first.focus();
  });
  results.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const links = Array.from(results.querySelectorAll('[data-search-result]'));
    const current = links.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'ArrowDown'
      ? Math.min(links.length - 1, current + 1)
      : Math.max(0, current - 1);
    links[next].focus();
  });
  results.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const brand = document.querySelector('.brand');
    const desktop = window.matchMedia('(min-width: 1081px)').matches;
    const candidates = desktop
      ? [searchState.trigger, searchState.returnFocus, menuToggle, brand]
      : [searchState.returnFocus, menuToggle, searchState.trigger, brand];
    candidates.find(isUsableFocusCandidate)?.focus({ preventScroll: true });
    searchState.returnFocus = null;
  });
  return dialog;
}

async function openSearch() {
  const dialog = searchState.dialog || createDialog();
  searchState.returnFocus = document.activeElement;
  const menuToggle = document.querySelector('[data-menu-toggle][aria-expanded="true"]');
  if (menuToggle instanceof HTMLButtonElement) menuToggle.click();
  searchState.count.textContent = 'Carregando índice…';
  searchState.results.replaceChildren();
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  searchState.input.focus();
  try {
    await loadEntries();
    renderResults(searchState.input.value);
  } catch (error) {
    searchState.count.textContent = 'Não foi possível carregar o índice de busca.';
    console.error(error);
  }
}

function createTrigger(nav) {
  const trigger = createElement('button', 'global-search-trigger');
  trigger.type = 'button';
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.setAttribute('aria-label', 'Abrir busca global. Atalho Control K ou Command K.');
  trigger.append(
    createElement('span', 'global-search-trigger-icon', '⌕'),
    createElement('span', 'global-search-trigger-label', 'Buscar'),
    createElement('kbd', '', '⌘K'),
  );
  trigger.addEventListener('click', openSearch);
  nav.append(trigger);
  searchState.trigger = trigger;
}

export function initGlobalSearch() {
  if (document.querySelector('[data-global-search-ready]')) return;
  const nav = document.querySelector('[data-primary-nav]');
  if (!nav) return;
  document.documentElement.dataset.globalSearchReady = '';
  ensureStylesheet();
  createTrigger(nav);
  document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() !== 'k' || (!event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    if (searchState.dialog?.open) searchState.dialog.close();
    else openSearch();
  });
}
