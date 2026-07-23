import { $, $$ } from './utils.js';
import { initGlobalSearch } from './global-search.js?v=global-search-v1';
import { initSiteMetrics } from './site-metrics.js?v=site-metrics-v1';
import { initSmoothScrolling, smoothScrollTo } from './smooth-scroll.js';

export function initNavigation() {
  const header = $('[data-header]');
  const toggle = $('[data-menu-toggle]');
  const nav = $('[data-primary-nav]');
  const backToTop = $('[data-back-to-top]');
  const mobileMenu = window.matchMedia('(max-width: 1080px)');
  const links = $$('a[href^="#"]', nav || document);
  const sections = links
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  initSmoothScrolling();
  initGlobalSearch();
  void initSiteMetrics();

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

  links.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      closeMenu({ returnFocus: true });
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (toggle?.getAttribute('aria-expanded') !== 'true') return;
    const target = event.target instanceof Node ? event.target : null;
    if (target && !nav?.contains(target) && !toggle.contains(target)) closeMenu();
  });

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
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  backToTop?.addEventListener('click', () => {
    smoothScrollTo(0);
  });

  if ('IntersectionObserver' in window && sections.length) {
    const sectionById = new Map(sections.map((section) => [section.id, section]));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        links.forEach((link) => {
          const target = link.getAttribute('href').slice(1);
          const active = sectionById.get(target) === visible.target;
          link.classList.toggle('is-active', active);
        });
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.12, 0.28, 0.5] },
    );

    sections.forEach((section) => observer.observe(section));
  }
}
