import { NOTABLE_FIGURE_AREAS, NOTABLE_FIGURES } from '../assets/data/notable-figures.js?v=great-minds-v2';
import { initNavigation } from '../assets/js/navigation.js';
import {
  filterNotableFigures,
  findNotableFigure,
  getNotableFigureArea,
  resolveNotableFigure,
} from '../assets/js/notable-figures-model.js?v=great-minds-v2';
import { smoothScrollToElement } from '../assets/js/smooth-scroll.js';
import { debounce } from '../assets/js/utils.js';

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function appendExternalMarker(link) {
  const marker = createElement('span', '', '↗');
  marker.setAttribute('aria-hidden', 'true');
  link.append(' ', marker);
}

function setExternalLink(link, url, label) {
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${label} em uma nova aba`);
}

function createSlide(figure, index) {
  const slide = createElement('div', 'swiper-slide notable-slide');
  slide.dataset.figureId = figure.id;

  const card = createElement('button', 'notable-slide-card');
  card.type = 'button';
  card.dataset.figureSelect = figure.id;
  card.setAttribute('aria-label', `Selecionar ${figure.name}, ${figure.role}`);

  const image = document.createElement('img');
  image.src = `../${figure.portrait.src}`;
  image.width = figure.portrait.width;
  image.height = figure.portrait.height;
  image.alt = figure.portrait.alt;
  image.loading = index < 3 ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.draggable = false;

  const position = createElement('span', 'notable-slide-index', String(index + 1).padStart(2, '0'));
  position.setAttribute('aria-hidden', 'true');

  const copy = createElement('span', 'notable-slide-copy');
  copy.append(
    createElement('span', 'notable-slide-meta', getNotableFigureArea(figure.area).label),
    createElement('strong', 'notable-slide-name', figure.name),
    createElement('span', 'notable-slide-role', `${figure.lifespan} · ${figure.role}`),
  );

  card.append(image, position, copy);
  slide.append(card);
  return slide;
}

function createContributionCard(contribution, index) {
  const card = createElement('article', 'figure-contribution-card');
  card.append(
    createElement('span', '', String(index + 1).padStart(2, '0')),
    createElement('h4', '', contribution.title),
    createElement('p', '', contribution.description),
  );
  return card;
}

function createTheoryLink(link) {
  const anchor = createElement('a', 'figure-theory-card');
  anchor.href = `../Teorias/teorias.html?teoria=${encodeURIComponent(link.theory.slug)}`;
  anchor.setAttribute('aria-label', `Abrir ${link.theory.code}, ${link.theory.title}`);

  const code = createElement('span', 'figure-theory-code', link.theory.code);
  const copy = createElement('span', 'figure-theory-copy');
  copy.append(
    createElement('span', 'figure-theory-type', link.relationLabel),
    createElement('strong', '', link.label),
    createElement('p', '', link.note),
  );
  const arrow = createElement('span', 'figure-theory-arrow', '↗');
  arrow.setAttribute('aria-hidden', 'true');
  anchor.append(code, copy, arrow);
  return anchor;
}

function createSourceLink(reference) {
  const link = createElement('a', 'figure-source-link', reference.title);
  setExternalLink(link, reference.url, `Abrir ${reference.title}, ${reference.institution}`);
  appendExternalMarker(link);
  return link;
}

function createDossier(figure) {
  const resolved = resolveNotableFigure(figure);
  const article = createElement('article', 'figure-dossier');
  article.dataset.activeFigure = figure.id;

  const header = createElement('header', 'figure-dossier-header');
  const identity = createElement('div', 'figure-dossier-identity');
  identity.append(
    createElement('span', 'figure-dossier-meta', `${resolved.areaLabel} · ${figure.role}`),
    createElement('h3', 'figure-dossier-title', figure.name),
    createElement('p', 'figure-dossier-summary', figure.summary),
    createElement('span', 'figure-dossier-life', figure.lifespan),
  );

  const impact = createElement('div', 'figure-dossier-impact');
  impact.append(
    createElement('span', 'figure-block-label', 'Por que este nome importa'),
    createElement('h4', '', 'O que mudou depois dessa contribuição.'),
    createElement('p', '', figure.impact),
  );
  header.append(identity, impact);

  const body = createElement('div', 'figure-dossier-body');
  const contributionBlock = createElement('section', 'figure-contribution-block');
  contributionBlock.setAttribute('aria-label', `Principais contribuições de ${figure.name}`);
  contributionBlock.append(createElement('p', 'figure-block-label', 'Contribuições centrais'));
  const contributionGrid = createElement('div', 'figure-contribution-grid');
  contributionGrid.append(...figure.contributions.map(createContributionCard));
  contributionBlock.append(contributionGrid);

  const columns = createElement('div', 'figure-dossier-columns');
  const milestones = createElement('section', 'figure-milestone-block');
  milestones.append(createElement('p', 'figure-block-label', 'Obras e marcos'));
  const milestoneList = createElement('ul', 'figure-milestone-list');
  milestoneList.append(...figure.milestones.map((item) => createElement('li', '', item)));
  milestones.append(milestoneList);

  const theories = createElement('section', 'figure-theory-block');
  theories.append(createElement('p', 'figure-block-label', 'Conexões com o Observatório'));
  const theoryList = createElement('div', 'figure-theory-list');
  if (resolved.theoryLinks.length) {
    theoryList.append(...resolved.theoryLinks.map(createTheoryLink));
  } else {
    theoryList.append(createElement(
      'p',
      'figure-theory-empty',
      'Nenhuma conexão editorial direta foi estabelecida com as linhas atuais do Observatório.',
    ));
  }
  theories.append(theoryList);
  columns.append(milestones, theories);

  const sourceBlock = createElement('section', 'figure-source-block');
  const sources = createElement('div');
  sources.append(createElement('p', 'figure-block-label', 'Fontes para aprofundar'));
  const sourceList = createElement('div', 'figure-source-list');
  sourceList.append(...resolved.references.map(createSourceLink));
  sources.append(sourceList);

  const credit = createElement('div', 'figure-credit');
  const license = figure.portrait.licenseUrl
    ? createElement('a', 'figure-credit-link', `Licença: ${figure.portrait.license}`)
    : createElement('span', '', `Licença: ${figure.portrait.license}`);
  if (figure.portrait.licenseUrl) {
    setExternalLink(license, figure.portrait.licenseUrl, `Abrir a licença ${figure.portrait.license}`);
    appendExternalMarker(license);
  }
  credit.append(
    createElement('span', '', `Retrato: ${figure.portrait.credit}`),
    document.createElement('br'),
    license,
    document.createElement('br'),
    createElement('span', '', `Alterações: ${figure.portrait.modifications}`),
  );
  const creditLink = createElement('a', 'figure-credit-link', 'Ver origem da imagem');
  setExternalLink(creditLink, figure.portrait.sourceUrl, `Ver origem do retrato de ${figure.name}`);
  appendExternalMarker(creditLink);
  credit.append(document.createElement('br'), creditLink);
  sourceBlock.append(sources, credit);

  body.append(contributionBlock, columns, sourceBlock);
  article.append(header, body);
  return article;
}

function createIndexCard(figure) {
  const card = createElement('button', 'notable-index-card');
  card.type = 'button';
  card.dataset.indexFigure = figure.id;
  card.setAttribute('aria-label', `Selecionar o perfil de ${figure.name}`);
  card.append(
    createElement('span', 'notable-index-meta', getNotableFigureArea(figure.area).label),
    createElement('strong', '', figure.name),
    createElement('p', '', figure.summary),
    createElement('span', 'notable-index-action', 'Abrir perfil ↑'),
  );
  return card;
}

function initNotableFiguresGallery() {
  const gallerySection = document.querySelector('#galeria');
  const carouselShell = document.querySelector('[data-notable-carousel-shell]');
  const carousel = document.querySelector('[data-notable-carousel]');
  const slides = document.querySelector('[data-notable-slides]');
  const detail = document.querySelector('[data-notable-detail]');
  const index = document.querySelector('[data-notable-index]');
  const filters = document.querySelector('[data-notable-filters]');
  const search = document.querySelector('[data-notable-search]');
  const resultCount = document.querySelector('[data-notable-result-count]');
  const empty = document.querySelector('[data-notable-empty]');
  const reset = document.querySelector('[data-notable-reset]');
  const previous = document.querySelector('[data-notable-previous]');
  const next = document.querySelector('[data-notable-next]');
  const autoplayButton = document.querySelector('[data-notable-autoplay]');
  const autoplayLabel = document.querySelector('[data-notable-autoplay-label]');
  const pagination = document.querySelector('[data-notable-pagination]');
  const total = document.querySelector('[data-notable-total]');
  const announcement = document.querySelector('[data-notable-announcement]');

  if (!gallerySection || !carouselShell || !carousel || !slides || !detail || !index || !filters || !search) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(any-pointer: fine)');
  const requestedProfile = new URL(window.location.href).searchParams.get('perfil');
  const requestedFigure = findNotableFigure(requestedProfile);
  const initialFigure = requestedFigure || NOTABLE_FIGURES[0];
  const shouldCanonicalizeInitialProfile = Boolean(requestedProfile && !requestedFigure);
  const pauseReasons = new Set();
  let activeArea = 'todas';
  let query = '';
  let visibleFigures = [...NOTABLE_FIGURES];
  let activeFigureId = initialFigure.id;
  let swiper = null;
  let staticIndex = 0;
  let announceNextChange = false;

  if (total) total.textContent = String(NOTABLE_FIGURES.length);

  function setPauseReason(reason, paused) {
    if (paused) pauseReasons.add(reason);
    else pauseReasons.delete(reason);
    syncAutoplay();
  }

  function resetProgress() {
    carouselShell.classList.remove('is-autoplay-running');
    void carouselShell.offsetWidth;
    if (!carouselShell.classList.contains('is-autoplay-paused')) {
      carouselShell.classList.add('is-autoplay-running');
    }
  }

  function syncAutoplay() {
    if (!autoplayButton || !autoplayLabel) return;
    const unavailable = reducedMotion.matches || visibleFigures.length < 2 || !swiper?.autoplay;
    const manuallyPaused = pauseReasons.has('manual');
    const shouldPause = unavailable || pauseReasons.size > 0;

    carouselShell.classList.toggle('is-autoplay-unavailable', unavailable);
    carouselShell.classList.toggle('is-autoplay-paused', shouldPause);
    autoplayButton.disabled = unavailable;
    autoplayButton.setAttribute('aria-pressed', String(manuallyPaused));

    if (unavailable) {
      swiper?.autoplay?.stop();
      autoplayLabel.textContent = reducedMotion.matches ? 'Rotação desativada' : 'Rotação indisponível';
      carouselShell.classList.remove('is-autoplay-running');
      return;
    }

    autoplayLabel.textContent = manuallyPaused ? 'Retomar rotação' : 'Pausar rotação';
    if (shouldPause) {
      swiper.autoplay.stop();
      carouselShell.classList.remove('is-autoplay-running');
      return;
    }

    swiper.autoplay.start();
    resetProgress();
  }

  function updateUrl(figure) {
    const url = new URL(window.location.href);
    url.searchParams.set('perfil', figure.slug);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function updateActiveState(figure, options = {}) {
    if (!figure) return;
    activeFigureId = figure.id;
    detail.replaceChildren(createDossier(figure));

    document.querySelectorAll('[data-figure-select]').forEach((button) => {
      const active = button.dataset.figureSelect === figure.id;
      button.setAttribute('aria-current', active ? 'true' : 'false');
      button.tabIndex = active ? 0 : -1;
    });

    document.querySelectorAll('[data-index-figure]').forEach((button) => {
      const active = button.dataset.indexFigure === figure.id;
      button.setAttribute('aria-current', active ? 'true' : 'false');
    });

    if (options.announce && announcement) {
      announcement.textContent = `Perfil selecionado: ${figure.name}.`;
    }

    if (options.updateUrl !== false) updateUrl(figure);
    resetProgress();
  }

  function currentFigureFromSwiper(instance) {
    const slide = instance.slides?.[instance.activeIndex];
    const id = slide?.dataset.figureId;
    return findNotableFigure(id, visibleFigures[instance.realIndex] || visibleFigures[0]);
  }

  function selectFigure(figureId, options = {}) {
    const targetIndex = visibleFigures.findIndex((figure) => figure.id === figureId);
    if (targetIndex < 0) return;

    if (swiper) {
      const currentFigure = currentFigureFromSwiper(swiper);
      if (currentFigure?.id === figureId) {
        updateActiveState(visibleFigures[targetIndex], { announce: true });
      } else {
        announceNextChange = true;
        swiper.slideToLoop(targetIndex, reducedMotion.matches ? 0 : 720);
      }
    } else {
      staticIndex = targetIndex;
      const slide = slides.children[targetIndex];
      slide?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
      updateActiveState(visibleFigures[targetIndex], { announce: true });
    }

    if (options.scrollToGallery) {
      smoothScrollToElement(carouselShell, {
        onComplete: () => carousel.focus({ preventScroll: true }),
      });
    }
  }

  function destroySwiper() {
    if (!swiper) return;
    swiper.destroy(true, true);
    swiper = null;
    carousel.classList.remove('is-dragging');
  }

  function initializeStaticFallback(initialIndex) {
    carousel.classList.add('is-static');
    staticIndex = initialIndex;
    previous.disabled = visibleFigures.length < 2;
    next.disabled = visibleFigures.length < 2;
    carouselShell.classList.add('is-autoplay-unavailable');
    syncAutoplay();
  }

  function initializeSwiper(initialIndex) {
    carousel.classList.remove('is-static');
    const SwiperConstructor = window.Swiper;
    if (typeof SwiperConstructor !== 'function') {
      initializeStaticFallback(initialIndex);
      return;
    }

    const isMouseOptimized = finePointer.matches;

    swiper = new SwiperConstructor(carousel, {
      a11y: {
        enabled: true,
        containerMessage: 'Galeria de grandes nomes',
        containerRoleDescriptionMessage: 'carrossel',
        itemRoleDescriptionMessage: 'perfil',
        firstSlideMessage: 'Este é o primeiro perfil',
        lastSlideMessage: 'Este é o último perfil',
        nextSlideMessage: 'Próximo perfil',
        prevSlideMessage: 'Perfil anterior',
        paginationBulletMessage: 'Ir para o perfil {{index}}',
        slideLabelMessage: '{{index}} de {{slidesLength}}',
      },
      autoplay: reducedMotion.matches || visibleFigures.length < 2
        ? false
        : {
          delay: 10000,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
          waitForTransition: true,
        },
      centeredSlides: true,
      coverflowEffect: {
        depth: 150,
        modifier: 1.1,
        rotate: 0,
        scale: 0.88,
        slideShadows: true,
        stretch: 34,
      },
      effect: reducedMotion.matches ? 'slide' : 'coverflow',
      followFinger: true,
      grabCursor: true,
      initialSlide: initialIndex,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
        pageUpDown: false,
      },
      loop: visibleFigures.length >= 8,
      navigation: {
        nextEl: next,
        prevEl: previous,
      },
      pagination: {
        clickable: false,
        dynamicBullets: visibleFigures.length > 8,
        el: pagination,
      },
      longSwipes: true,
      longSwipesMs: isMouseOptimized ? 180 : 300,
      longSwipesRatio: isMouseOptimized ? 0.16 : 0.5,
      preventClicks: true,
      preventClicksPropagation: true,
      resistanceRatio: isMouseOptimized ? 0.86 : 0.72,
      rewind: visibleFigures.length > 1 && visibleFigures.length < 8,
      shortSwipes: true,
      simulateTouch: true,
      slideToClickedSlide: false,
      slidesPerView: 'auto',
      spaceBetween: 18,
      speed: reducedMotion.matches ? 0 : (isMouseOptimized ? 520 : 820),
      threshold: isMouseOptimized ? 2 : 5,
      touchRatio: isMouseOptimized ? 1.12 : 1,
      watchSlidesProgress: true,
      on: {
        init(instance) {
          updateActiveState(currentFigureFromSwiper(instance), { updateUrl: false });
        },
        slideChange(instance) {
          const shouldAnnounce = announceNextChange
            || pauseReasons.size > 0
            || !instance.autoplay?.running;
          announceNextChange = false;
          updateActiveState(currentFigureFromSwiper(instance), {
            announce: shouldAnnounce,
          });
        },
        touchStart() {
          carousel.classList.add('is-dragging');
          announceNextChange = true;
          setPauseReason('drag', true);
        },
        touchEnd() {
          carousel.classList.remove('is-dragging');
          setPauseReason('drag', false);
        },
        autoplayStart() {
          carouselShell.classList.add('is-autoplay-running');
        },
        autoplayStop() {
          carouselShell.classList.remove('is-autoplay-running');
        },
      },
    });

    syncAutoplay();
  }

  function renderFilters() {
    filters.replaceChildren(...NOTABLE_FIGURE_AREAS.map((area) => {
      const button = createElement('button', 'notable-filter-button', area.label);
      button.type = 'button';
      button.dataset.notableArea = area.id;
      button.setAttribute('aria-pressed', String(activeArea === area.id));
      button.addEventListener('click', () => {
        if (activeArea === area.id) return;
        activeArea = area.id;
        syncFilterState();
        applyFilters();
      });
      return button;
    }));
  }

  function syncFilterState() {
    filters.querySelectorAll('[data-notable-area]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.notableArea === activeArea));
    });
  }

  function renderIndex() {
    index.replaceChildren(...visibleFigures.map(createIndexCard));
    index.querySelectorAll('[data-index-figure]').forEach((button) => {
      button.addEventListener('click', () => selectFigure(button.dataset.indexFigure, { scrollToGallery: true }));
    });
  }

  function applyFilters() {
    visibleFigures = filterNotableFigures({ area: activeArea, query });
    const hasResults = visibleFigures.length > 0;
    const selected = visibleFigures.find((figure) => figure.id === activeFigureId) || visibleFigures[0];
    const initialIndex = selected ? visibleFigures.indexOf(selected) : 0;
    const selectionChanged = Boolean(selected && selected.id !== activeFigureId);

    destroySwiper();
    slides.replaceChildren(...visibleFigures.map(createSlide));
    renderIndex();

    carouselShell.hidden = !hasResults;
    detail.hidden = !hasResults;
    index.hidden = !hasResults;
    empty.hidden = hasResults;

    if (resultCount) {
      const suffix = visibleFigures.length === 1 ? 'perfil disponível' : 'perfis disponíveis';
      resultCount.textContent = `${visibleFigures.length} ${suffix}`;
    }

    if (!hasResults) return;

    activeFigureId = selected.id;
    slides.querySelectorAll('[data-figure-select]').forEach((button) => {
      button.addEventListener('click', () => selectFigure(button.dataset.figureSelect));
    });
    initializeSwiper(initialIndex);
    updateActiveState(selected, { updateUrl: selectionChanged, announce: selectionChanged });
  }

  renderFilters();
  applyFilters();
  if (shouldCanonicalizeInitialProfile) updateUrl(initialFigure);

  search.addEventListener('input', debounce(() => {
    query = search.value;
    applyFilters();
  }, 180));

  reset?.addEventListener('click', () => {
    activeArea = 'todas';
    query = '';
    search.value = '';
    syncFilterState();
    applyFilters();
    search.focus();
  });

  autoplayButton?.addEventListener('click', () => {
    setPauseReason('manual', !pauseReasons.has('manual'));
  });

  carouselShell.addEventListener('pointerenter', () => setPauseReason('pointer', true));
  carouselShell.addEventListener('pointerleave', () => setPauseReason('pointer', false));
  carouselShell.addEventListener('click', (event) => {
    if (event.target.closest('[data-notable-previous], [data-notable-next], [data-figure-select]')) {
      announceNextChange = true;
    }
  }, { capture: true });
  gallerySection.addEventListener('focusin', () => setPauseReason('focus', true));
  gallerySection.addEventListener('focusout', () => {
    window.setTimeout(() => setPauseReason('focus', gallerySection.contains(document.activeElement)), 0);
  });

  carousel.addEventListener('keydown', (event) => {
    if (!visibleFigures.length) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      announceNextChange = true;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      selectFigure(visibleFigures[0].id);
    }
    if (event.key === 'End') {
      event.preventDefault();
      selectFigure(visibleFigures.at(-1).id);
    }
  });

  previous?.addEventListener('click', () => {
    if (swiper || visibleFigures.length < 2) return;
    staticIndex = (staticIndex - 1 + visibleFigures.length) % visibleFigures.length;
    selectFigure(visibleFigures[staticIndex].id);
  });

  next?.addEventListener('click', () => {
    if (swiper || visibleFigures.length < 2) return;
    staticIndex = (staticIndex + 1) % visibleFigures.length;
    selectFigure(visibleFigures[staticIndex].id);
  });

  document.addEventListener('visibilitychange', () => {
    setPauseReason('hidden', document.hidden);
  });

  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.12);
      setPauseReason('out-of-view', !visible);
    }, { threshold: [0, 0.12, 0.35] });
    visibilityObserver.observe(carouselShell);
  }

  reducedMotion.addEventListener('change', () => {
    applyFilters();
  });
}

function boot() {
  initNavigation();
  initNotableFiguresGallery();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
