import { $, $$, clamp, debounce, safeSetText, setPressed } from './utils.js';

const STRUCTURAL_YEARS = 450000;
const LOW_POWER_WIDTH = 760;
const TABLET_WIDTH = 1040;

const numberFormatter = new Intl.NumberFormat('pt-BR');

function formatYears(years) {
  return `+${numberFormatter.format(Math.round(years))} anos`;
}

function createStructuralOverlay() {
  const existing = $('[data-structural-overlay]');
  if (existing) return existing;

  const overlay = document.createElement('div');
  overlay.className = 'structural-overlay stellar-drift-overlay';
  overlay.setAttribute('data-structural-overlay', '');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <canvas class="stellar-drift-canvas" data-stellar-canvas></canvas>
    <div class="structural-time-indicator" data-structural-time-indicator>
      <span>deriva estelar simulada</span>
      <strong data-structural-years>${formatYears(0)}</strong>
      <i aria-hidden="true"><b data-structural-progress></b></i>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

function getQuality(width, height, reducedMotion) {
  const compact = width <= LOW_POWER_WIDTH;
  const tablet = width <= TABLET_WIDTH;
  const cores = navigator.hardwareConcurrency || 4;
  const area = width * height;
  const base = compact ? area / 20800 : tablet ? area / 10000 : area / 12600;
  const hardwareFactor = cores <= 4 ? 0.78 : 1;
  const count = reducedMotion
    ? clamp(Math.round(base * 0.12), compact ? 126 : 142, compact ? 142 : 174)
    : clamp(Math.round(base * hardwareFactor), compact ? 138 : tablet ? 1178 : 11118, compact ? 78 : tablet ? 1128 : 1220);

  return {
    compact,
    tablet,
    count,
    maxDpr: compact ? 1.25 : tablet ? 1.5 : 1.75,
    trails: reducedMotion ? false : !compact,
    relationLines: reducedMotion ? false : !compact,
    speedFactor: compact ? 0.72 : tablet ? 0.86 : 1,
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function wrap(value, max) {
  return ((value % max) + max) % max;
}

class StellarDriftRenderer {
  constructor(overlay, reduceMotionQuery) {
    this.overlay = overlay;
    this.canvas = $('[data-stellar-canvas]', overlay);
    this.ctx = this.canvas?.getContext('2d', { alpha: true });
    this.yearsNode = $('[data-structural-years]', overlay);
    this.progressNode = $('[data-structural-progress]', overlay);
    this.reduceMotionQuery = reduceMotionQuery;

    this.active = false;
    this.raf = 0;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.time = 0;
    this.lastFrame = 0;
    this.lastDomUpdate = 0;
    this.stars = [];
    this.anchorIndexes = [];
    this.quality = getQuality(window.innerWidth, window.innerHeight, this.isReducedMotion());

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.handleResize = debounce(this.resize, 140);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  isReducedMotion() {
    return Boolean(this.reduceMotionQuery?.matches);
  }

  setQuality() {
    const nextQuality = getQuality(window.innerWidth, window.innerHeight, this.isReducedMotion());
    const qualityChanged =
      nextQuality.count !== this.quality.count ||
      nextQuality.maxDpr !== this.quality.maxDpr ||
      nextQuality.trails !== this.quality.trails ||
      nextQuality.relationLines !== this.quality.relationLines;

    this.quality = nextQuality;
    this.overlay.classList.toggle('is-low-power', nextQuality.compact || this.isReducedMotion());
    this.overlay.classList.toggle('is-reduced-motion', this.isReducedMotion());

    if (qualityChanged || !this.stars.length) this.createStars();
  }

  start() {
    if (!this.canvas || !this.ctx) return;
    if (this.active) return;

    this.active = true;
    this.time = 0;
    this.lastFrame = performance.now();
    this.lastDomUpdate = 0;
    this.overlay.classList.add('is-running');

    this.setQuality();
    this.resize();
    this.updateTimeIndicator(0, true);

    window.addEventListener('resize', this.handleResize, { passive: true });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.isReducedMotion()) {
      this.drawStaticField();
      return;
    }

    this.raf = window.requestAnimationFrame(this.frame);
  }

  stop() {
    if (!this.active) return;

    this.active = false;
    this.overlay.classList.remove('is-running');
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.cancelFrame();
  }

  refreshMotionPreference() {
    this.setQuality();

    if (!this.active) return;

    this.cancelFrame();
    this.resize();

    if (this.isReducedMotion()) {
      this.time = 0;
      this.updateTimeIndicator(0, true);
      this.drawStaticField();
    } else if (!document.hidden) {
      this.lastFrame = performance.now();
      this.raf = window.requestAnimationFrame(this.frame);
    }
  }

  cancelFrame() {
    if (!this.raf) return;
    window.cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  handleVisibilityChange() {
    if (!this.active || this.isReducedMotion()) return;

    if (document.hidden) {
      this.cancelFrame();
      return;
    }

    this.lastFrame = performance.now();
    if (!this.raf) this.raf = window.requestAnimationFrame(this.frame);
  }

  resize() {
    if (!this.canvas || !this.ctx) return;

    this.setQuality();

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.quality.maxDpr);
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));

    const changed = this.width !== width || this.height !== height || this.dpr !== dpr;
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    if (this.canvas.width !== pixelWidth) this.canvas.width = pixelWidth;
    if (this.canvas.height !== pixelHeight) this.canvas.height = pixelHeight;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (changed) this.createStars();
    if (this.active && this.isReducedMotion()) this.drawStaticField();
  }

  createStars() {
    const width = this.width || window.innerWidth;
    const height = this.height || window.innerHeight;
    const count = this.quality.count;
    const stars = [];
    const palette = [
      [232, 251, 255],
      [147, 219, 255],
      [184, 170, 255],
      [246, 213, 109],
      [206, 242, 255],
    ];

    for (let index = 0; index < count; index += 1) {
      const bright = Math.random() > 0.87;
      const deep = randomBetween(0.45, 1.35);
      const angle = randomBetween(-Math.PI, Math.PI);
      const speed = randomBetween(bright ? 5.2 : 2.8, bright ? 17 : 11.5) * deep * this.quality.speedFactor;
      const color = palette[Math.floor(Math.random() * palette.length)];

      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: bright ? randomBetween(1.05, 1.85) : randomBetween(0.35, 1.05),
        alpha: bright ? randomBetween(0.58, 0.96) : randomBetween(0.18, 0.54),
        trail: bright ? randomBetween(18, 34) : randomBetween(7, 18),
        phase: randomBetween(0, Math.PI * 2),
        twinkle: randomBetween(0.25, 0.8),
        color,
        bright,
      });
    }

    this.stars = stars;
    this.anchorIndexes = stars
      .map((star, index) => ({ star, index }))
      .filter(({ star }) => star.bright)
      .slice(0, this.quality.compact ? 0 : this.quality.tablet ? 8 : 12)
      .map(({ index }) => index);
  }

  getPosition(star, offset = 0) {
    const margin = 96;
    const domainX = this.width + margin * 2;
    const domainY = this.height + margin * 2;
    const t = this.time + offset;

    return {
      x: wrap(star.x + star.vx * t + margin, domainX) - margin,
      y: wrap(star.y + star.vy * t + margin, domainY) - margin,
    };
  }

  drawAtmosphere(ctx) {
    const gradient = ctx.createRadialGradient(
      this.width * 0.48,
      this.height * 0.42,
      0,
      this.width * 0.48,
      this.height * 0.42,
      Math.max(this.width, this.height) * 0.72,
    );

    gradient.addColorStop(0, 'rgba(114, 236, 255, 0.045)');
    gradient.addColorStop(0.38, 'rgba(173, 140, 255, 0.025)');
    gradient.addColorStop(1, 'rgba(5, 7, 18, 0)');

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();
  }

  drawRelationLines(ctx) {
    if (!this.quality.relationLines || this.anchorIndexes.length < 3) return;

    ctx.save();
    ctx.lineWidth = 0.7;
    ctx.globalCompositeOperation = 'screen';

    for (let index = 0; index < this.anchorIndexes.length - 1; index += 1) {
      const current = this.stars[this.anchorIndexes[index]];
      const next = this.stars[this.anchorIndexes[index + 1]];
      if (!current || !next) continue;

      const a = this.getPosition(current);
      const b = this.getPosition(next);
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const limit = Math.min(this.width, this.height) * 0.48;
      if (distance > limit) continue;

      const alpha = (1 - distance / limit) * 0.1;
      ctx.strokeStyle = `rgba(114, 236, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  render(now) {
    if (!this.active || this.isReducedMotion() || document.hidden) {
      this.raf = 0;
      return;
    }

    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    this.time += dt;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawAtmosphere(ctx);
    this.drawRelationLines(ctx);
    this.drawStars(ctx);
    this.updateTimeIndicator(now);

    this.raf = window.requestAnimationFrame(this.frame);
  }

  frame(now) {
    this.render(now);
  }

  drawStars(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';

    for (const star of this.stars) {
      const position = this.getPosition(star);
      const trail = this.quality.trails ? star.trail : star.trail * 0.32;
      const previous = {
        x: position.x - star.vx * trail * 0.04,
        y: position.y - star.vy * trail * 0.04,
      };
      const flicker = 0.76 + Math.sin(this.time * star.twinkle + star.phase) * 0.24;
      const alpha = clamp(star.alpha * flicker, 0.08, 1);
      const [r, g, b] = star.color;

      if (this.quality.trails) {
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.22})`;
        ctx.lineWidth = Math.max(0.45, star.radius * 0.52);
        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(position.x, position.y);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(position.x, position.y, star.radius, 0, Math.PI * 2);
      ctx.fill();

      if (star.bright && !this.quality.compact) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`;
        ctx.beginPath();
        ctx.arc(position.x, position.y, star.radius * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawStaticField() {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawAtmosphere(ctx);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const star of this.stars) {
      const [r, g, b] = star.color;
      const position = this.getPosition(star);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.alpha * 0.72})`;
      ctx.beginPath();
      ctx.arc(position.x, position.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  updateTimeIndicator(now, force = false) {
    if (!this.yearsNode || !this.progressNode) return;
    if (!force && now - this.lastDomUpdate < 180) return;

    this.lastDomUpdate = now;
    const cycleSeconds = this.quality.compact ? 96 : 118;
    const progress = (this.time % cycleSeconds) / cycleSeconds;
    const years = progress * STRUCTURAL_YEARS;

    safeSetText(this.yearsNode, formatYears(years));
    this.progressNode.style.transform = `scaleX(${Math.max(progress, 0.025)})`;
  }
}

export function initObserverMode() {
  const body = document.body;
  if (body.dataset.observerInitialized === 'true') return;
  body.dataset.observerInitialized = 'true';

  const hero = $('.hero');
  const buttons = $$('[data-observer-toggle]');
  if (!hero || !buttons.length) return;

  const overlay = createStructuralOverlay();
  const statusText = $('[data-status-text]');
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new StellarDriftRenderer(overlay, reduceMotionQuery);

  let isObserverMode = true;
  let pulseTimer = 0;

  const sync = () => {
    body.dataset.mode = isObserverMode ? 'observer' : 'normal';
    body.classList.toggle('is-structural-vision', isObserverMode);
    overlay.classList.toggle('is-visible', isObserverMode);

    if (isObserverMode) renderer.start();
    else renderer.stop();

    buttons.forEach((button) => {
      setPressed(button, isObserverMode);
      const label = $('[data-toggle-label]', button);
      safeSetText(label, isObserverMode ? 'Desativar visão estelar' : 'Ativar visão estelar');
    });

    safeSetText(statusText, isObserverMode ? 'Deriva estelar simulada' : 'Campo de ideias');
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

  const handleMediaChange = () => renderer.refreshMotionPreference();
  if (reduceMotionQuery.addEventListener) reduceMotionQuery.addEventListener('change', handleMediaChange);
  else reduceMotionQuery.addListener?.(handleMediaChange);

  renderer.refreshMotionPreference();
  sync();
}
