import { $, $$, safeSetText, setPressed } from './utils.js';

function createStructuralOverlay(hero) {
  if (!hero) return null;

  const existing = $('[data-structural-overlay]', hero);
  if (existing) return existing;

  const overlay = document.createElement('div');
  overlay.className = 'structural-overlay';
  overlay.setAttribute('data-structural-overlay', '');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <img src="assets/images/cosmic-web.svg" alt="" decoding="async" loading="eager" />
    <span class="structural-signal signal-a"></span>
    <span class="structural-signal signal-b"></span>
    <span class="structural-signal signal-c"></span>
    <span class="structural-signal signal-d"></span>
  `;

  hero.appendChild(overlay);
  return overlay;
}

export function initObserverMode() {
  const body = document.body;
  if (body.dataset.observerInitialized === 'true') return;
  body.dataset.observerInitialized = 'true';

  const hero = $('.hero');
  const overlay = createStructuralOverlay(hero);
  const buttons = $$('[data-observer-toggle]');
  const statusText = $('[data-status-text]');
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactQuery = window.matchMedia('(max-width: 760px)');

  let isObserverMode = false;
  let isHeroVisible = true;
  let pulseTimer = 0;

  const motionReduced = () => reduceMotionQuery.matches;

  const syncPowerMode = () => {
    overlay?.classList.toggle('is-low-power', compactQuery.matches || motionReduced());
  };

  const sync = () => {
    const shouldAnimateSignals = isObserverMode && isHeroVisible && !motionReduced();

    body.dataset.mode = isObserverMode ? 'observer' : 'normal';
    body.classList.toggle('is-structural-vision', isObserverMode);
    overlay?.classList.toggle('is-running', shouldAnimateSignals);

    buttons.forEach((button) => {
      setPressed(button, isObserverMode);
      const label = $('[data-toggle-label]', button);
      safeSetText(label, isObserverMode ? 'Desativar visão estrutural' : 'Ativar visão estrutural');
    });

    safeSetText(statusText, isObserverMode ? 'Teia cósmica estrutural' : 'Campo de ideias');
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      isObserverMode = !isObserverMode;
      body.classList.add('structural-pulse');
      window.clearTimeout(pulseTimer);
      pulseTimer = window.setTimeout(() => body.classList.remove('structural-pulse'), 520);
      sync();
    });
  });

  if ('IntersectionObserver' in window && hero) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isHeroVisible = Boolean(entry?.isIntersecting);
        sync();
      },
      { threshold: 0.08 },
    );
    observer.observe(hero);
  }

  const handleMediaChange = () => {
    syncPowerMode();
    sync();
  };

  [reduceMotionQuery, compactQuery].forEach((query) => {
    if (query.addEventListener) query.addEventListener('change', handleMediaChange);
    else query.addListener?.(handleMediaChange);
  });

  syncPowerMode();
  sync();
}
