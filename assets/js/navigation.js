import { $, $$ } from './utils.js';

export function initNavigation() {
  const header = $('[data-header]');
  const toggle = $('[data-menu-toggle]');
  const nav = $('[data-primary-nav]');
  const backToTop = $('[data-back-to-top]');
  const links = $$('a[href^="#"]', nav || document);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sections = links
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  const closeMenu = (options = {}) => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    $('.sr-only', toggle).textContent = 'Abrir menu';
    if (options.returnFocus) toggle.focus();
  };

  toggle?.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    nav?.classList.toggle('is-open', !isOpen);
    $('.sr-only', toggle).textContent = isOpen ? 'Abrir menu' : 'Fechar menu';
    if (!isOpen) $('a', nav)?.focus();
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
    header?.classList.toggle('is-scrolled', scrolled);
    backToTop?.classList.toggle('is-visible', window.scrollY > 620);
  };

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
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
