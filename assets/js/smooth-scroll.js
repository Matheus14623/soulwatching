import { clamp, prefersReducedMotion } from './utils.js';

let smoothScrollFrame = 0;
let smoothScrollRun = 0;

export function cancelSmoothScroll() {
  smoothScrollRun += 1;
  if (smoothScrollFrame) window.cancelAnimationFrame(smoothScrollFrame);
  smoothScrollFrame = 0;
  document.documentElement.classList.remove('is-programmatic-scroll');
}

export function smoothScrollTo(top, options = {}) {
  cancelSmoothScroll();

  const start = window.scrollY;
  const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const target = clamp(Number(top) || 0, 0, maximum);
  const distance = target - start;
  const onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;

  if (prefersReducedMotion() || Math.abs(distance) < 2) {
    document.documentElement.classList.add('is-programmatic-scroll');
    window.scrollTo({ top: target, left: 0, behavior: 'auto' });
    document.documentElement.classList.remove('is-programmatic-scroll');
    onComplete?.();
    return;
  }

  const duration = options.duration || clamp(380 + Math.abs(distance) * 0.055, 420, 700);
  const startedAt = window.performance.now();
  const run = smoothScrollRun;
  document.documentElement.classList.add('is-programmatic-scroll');

  const step = (now) => {
    if (run !== smoothScrollRun) return;
    const progress = clamp((now - startedAt) / duration, 0, 1);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    window.scrollTo({
      top: Math.round(start + distance * eased),
      left: 0,
      behavior: 'auto',
    });

    if (progress < 1) {
      smoothScrollFrame = window.requestAnimationFrame(step);
      return;
    }

    smoothScrollFrame = 0;
    document.documentElement.classList.remove('is-programmatic-scroll');
    onComplete?.();
  };

  smoothScrollFrame = window.requestAnimationFrame(step);
}

export function smoothScrollToElement(element, options = {}) {
  if (!(element instanceof Element)) return;
  const scrollPadding = Number.parseFloat(
    window.getComputedStyle(document.documentElement).scrollPaddingTop,
  ) || 0;
  const offset = Number.isFinite(options.offset) ? options.offset : scrollPadding;
  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  smoothScrollTo(top, options);
}

export function initSmoothScrolling() {
  const root = document.documentElement;
  if (root.dataset.smoothScrollInitialized === 'true') return;
  root.dataset.smoothScrollInitialized = 'true';

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const origin = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!origin || origin.hasAttribute('download') || origin.target === '_blank') return;

    const hash = origin.getAttribute('href');
    if (!hash) return;

    let id = '';
    try {
      id = decodeURIComponent(hash.slice(1));
    } catch {
      return;
    }

    const target = id ? document.getElementById(id) : document.documentElement;
    if (!target) return;

    event.preventDefault();
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);

    smoothScrollToElement(target, {
      onComplete: origin.classList.contains('skip-link')
        ? () => {
          const hadTabindex = target.hasAttribute('tabindex');
          if (!hadTabindex) target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          if (!hadTabindex) {
            target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
          }
        }
        : null,
    });
  });

  window.addEventListener('wheel', cancelSmoothScroll, { passive: true });
  window.addEventListener('touchstart', cancelSmoothScroll, { passive: true });
  window.addEventListener('pointerdown', cancelSmoothScroll, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
      cancelSmoothScroll();
    }
  });
}
