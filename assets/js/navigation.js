import { $, $$ } from './utils.js';
import { initGlobalSearch } from './global-search.js?v=global-search-v1';
import { initSiteMetrics } from './site-metrics.js?v=site-metrics-v1';
import { initSmoothScrolling, smoothScrollTo } from './smooth-scroll.js';
import { syncSiteNavigation } from './site-navigation.js?v=site-navigation-v1';

export function initNavigation() {
  syncSiteNavigation();
  const header = $('[data-header]');
  const toggle = $('[data-menu-toggle]');
  const nav = $('[data-primary-nav]');
  const backToTop = $('[data-back-to-top]');
  const explore = $('.nav-explore', nav);
  const localNavigation = $('.local-page-navigation');
  const mobileMenu = window.matchMedia('(max-width: 1080px)');
  const navLinks = $$('a', nav || document);
  const links = [
    ...$$('a[href^="#"]', nav || document),
    ...$$('[data-local-navigation-links] a[href^="#"]'),
  ];
  const sections = links
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  initSmoothScrolling();
  initGlobalSearch();
  void initSiteMetrics();
  if (new URL(window.location.href).searchParams.has('rota')) {
    void import('./route-continuity.js?v=route-continuity-v1')
      .then(({ initRouteContinuity }) => initRouteContinuity())
      .catch((error) => console.error('Não foi possível restaurar o contexto da rota.', error));
  }

  const setMenuState = (isOpen, options = {}) => {
    if (!toggle || !nav) return;
    const openOnMobile = mobileMenu.matches && isOpen;
    toggle.setAttribute('aria-expanded', String(openOnMobile));
    nav.classList.toggle('is-open', openOnMobile);
    if (mobileMenu.matches && !openOnMobile && nav.contains(document.activeElement)) toggle.focus();
    nav.inert = mobileMenu.matches && !openOnMobile;
    if (nav.inert) nav.setAttribute('aria-hidden', 'true');
    else nav.removeAttribute('aria-hidden');
    $('.sr-only', toggle).textContent = openOnMobile ? 'Fechar menu' : 'Abrir menu';
    if (options.returnFocus && mobileMenu.matches && document.activeElement !== toggle) toggle.focus();
    if (options.focusFirst && openOnMobile) $('a', nav)?.focus();
  };

  const closeMenu = (options = {}) => {
    if (explore) explore.open = false;
    setMenuState(false, options);
  };

  const syncMenuWithViewport = () => {
    const wasOpen = toggle?.getAttribute('aria-expanded') === 'true';
    setMenuState(mobileMenu.matches && wasOpen);
  };

  syncMenuWithViewport();
  if (typeof mobileMenu.addEventListener === 'function') {
    mobileMenu.addEventListener('change', syncMenuWithViewport);
  } else {
    mobileMenu.addListener(syncMenuWithViewport);
  }

  toggle?.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    setMenuState(!isOpen, { focusFirst: !isOpen });
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (explore?.open) {
      explore.open = false;
      $('summary', explore)?.focus();
      event.preventDefault();
    } else if (toggle?.getAttribute('aria-expanded') === 'true') {
      closeMenu({ returnFocus: true });
    }
  });

  document.addEventListener('pointerdown', (event) => {
    const target = event.target instanceof Node ? event.target : null;
    if (explore?.open && target && !explore.contains(target)) explore.open = false;
    if (toggle?.getAttribute('aria-expanded') !== 'true') return;
    if (target && !nav?.contains(target) && !toggle.contains(target)) closeMenu();
  });

  explore?.addEventListener('focusout', (event) => {
    if (event.relatedTarget instanceof Node && !explore.contains(event.relatedTarget)) explore.open = false;
  });

  let navigationOffset = 0;
  let layoutFrame = 0;
  const measureNavigation = () => {
    layoutFrame = 0;
    const headerHeight = Math.ceil(header?.getBoundingClientRect().height || 0);
    const localHeight = Math.ceil(localNavigation?.getBoundingClientRect().height || 0);
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    document.documentElement.style.setProperty('--local-navigation-height', `${localHeight}px`);
    navigationOffset = headerHeight + localHeight;
    updateHeader();
  };
  const scheduleMeasurement = () => {
    if (!layoutFrame) layoutFrame = window.requestAnimationFrame(measureNavigation);
  };

  const updateHeader = () => {
    const scrolled = window.scrollY > 24;
    const showBackToTop = window.scrollY > 620;
    header?.classList.toggle('is-scrolled', scrolled);
    backToTop?.classList.toggle('is-visible', showBackToTop);
    if (backToTop) {
      backToTop.inert = !showBackToTop;
      backToTop.tabIndex = showBackToTop ? 0 : -1;
      if (showBackToTop) backToTop.removeAttribute('aria-hidden');
      else backToTop.setAttribute('aria-hidden', 'true');
    }
    const position = navigationOffset + Math.min(window.innerHeight * 0.15, 120);
    let activeSection = sections[0];
    for (const section of sections) {
      const rectangle = section.getBoundingClientRect();
      const nested = sections.some((parent) => parent !== section && parent.contains(section));
      if (rectangle.top <= position && (!nested || rectangle.bottom > navigationOffset)) activeSection = section;
    }
    links.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${activeSection?.id}`);
    });
  };

  measureNavigation();
  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      updateHeader();
    });
  }, { passive: true });
  window.addEventListener('resize', scheduleMeasurement, { passive: true });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleMeasurement);
    if (header) observer.observe(header, { box: 'border-box' });
    if (localNavigation) observer.observe(localNavigation, { box: 'border-box' });
  }
  document.fonts?.ready.then(scheduleMeasurement);

  backToTop?.addEventListener('click', () => {
    smoothScrollTo(0);
  });

}
