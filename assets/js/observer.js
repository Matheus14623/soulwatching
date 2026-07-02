import { $, $$, clamp, debounce, prefersReducedMotion, safeSetText, setPressed } from './utils.js';

class FlowParticle {
  constructor(width, height, fadeIn = false) {
    this.width = width;
    this.height = height;
    this.reset(fadeIn);
  }

  reset(fadeIn = false) {
    this.x = Math.random() * this.width;
    this.y = Math.random() * this.height;
    this.vx = (Math.random() - 0.5) * 0.18;
    this.vy = (Math.random() - 0.5) * 0.18;
    this.size = Math.random() * 1.6 + 0.45;
    this.life = Math.random() * 280 + 150;
    this.maxLife = this.life;
    this.alpha = fadeIn ? 0 : Math.random() * 0.65 + 0.35;
    this.hue = Math.random() > 0.45 ? 190 + Math.random() * 35 : 255 + Math.random() * 38;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.x = clamp(this.x, 0, width);
    this.y = clamp(this.y, 0, height);
  }

  update() {
    const angle = (Math.cos(this.x * 0.0022) + Math.sin(this.y * 0.002)) * Math.PI * 1.42;
    this.vx += Math.cos(angle) * 0.0042;
    this.vy += Math.sin(angle) * 0.0031;
    this.vx *= 0.985;
    this.vy *= 0.985;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;

    if (this.life > this.maxLife - 75) this.alpha = clamp(this.alpha + 0.018, 0, 0.9);
    if (this.life < 55) this.alpha = clamp(this.alpha - 0.018, 0, 0.9);

    if (this.x < -60) this.x = this.width + 60;
    if (this.x > this.width + 60) this.x = -60;
    if (this.y < -60) this.y = this.height + 60;
    if (this.y > this.height + 60) this.y = -60;
    if (this.life <= 0 || !Number.isFinite(this.x) || !Number.isFinite(this.y)) this.reset(true);
  }

  draw(ctx) {
    ctx.fillStyle = `hsla(${this.hue}, 90%, 68%, ${this.alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

class FlowField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d', { alpha: true });
    this.width = 0;
    this.height = 0;
    this.particles = [];
    this.frame = 0;
    this.isActive = false;
    this.tick = this.tick.bind(this);
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const desiredCount = clamp(Math.round((this.width * this.height) / 8200), 70, 240);
    if (this.particles.length === 0) {
      this.particles = Array.from({ length: desiredCount }, () => new FlowParticle(this.width, this.height));
      return;
    }

    this.particles.forEach((particle) => particle.resize(this.width, this.height));
    while (this.particles.length < desiredCount) this.particles.push(new FlowParticle(this.width, this.height, true));
    while (this.particles.length > desiredCount) this.particles.pop();
  }

  setActive(nextActive) {
    const active = Boolean(nextActive && this.canvas && this.ctx);
    if (active === this.isActive) return;
    this.isActive = active;
    if (active) {
      this.resize();
      this.frame = requestAnimationFrame(this.tick);
    } else {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.clear();
    }
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  tick() {
    if (!this.isActive || !this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = 'lighter';

    const maxDistance = clamp(Math.min(this.width, this.height) * 0.17, 80, 132);
    const maxDistanceSq = maxDistance * maxDistance;

    for (let i = 0; i < this.particles.length; i += 1) {
      const p1 = this.particles[i];
      p1.update();
      p1.draw(ctx);

      for (let j = i + 1; j < this.particles.length; j += 1) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= maxDistanceSq) continue;

        const dist = Math.sqrt(distSq);
        const alpha = (1 - dist / maxDistance) * Math.min(p1.alpha, p2.alpha) * 0.32;
        ctx.strokeStyle = `rgba(138, 92, 246, ${alpha})`;
        ctx.lineWidth = 0.35;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    this.frame = requestAnimationFrame(this.tick);
  }
}

export function initObserverMode() {
  const body = document.body;
  const buttons = $$('[data-observer-toggle]');
  const statusText = $('[data-status-text]');
  const canvas = $('[data-flow-canvas]');
  const flow = new FlowField(canvas);
  let isObserverMode = false;
  let isHeroVisible = true;

  const sync = () => {
    body.dataset.mode = isObserverMode ? 'observer' : 'normal';
    buttons.forEach((button) => {
      setPressed(button, isObserverMode);
      const label = $('[data-toggle-label]', button);
      safeSetText(label, isObserverMode ? 'Desativar visão estrutural' : 'Ativar visão estrutural');
    });
    safeSetText(statusText, isObserverMode ? 'Análise estrutural' : 'Rotina biológica');
    flow.setActive(isObserverMode && isHeroVisible && !prefersReducedMotion());
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      isObserverMode = !isObserverMode;
      sync();
    });
  });

  if ('IntersectionObserver' in window && canvas) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isHeroVisible = Boolean(entry?.isIntersecting);
        sync();
      },
      { threshold: 0.1 },
    );
    observer.observe(canvas);
  }

  window.addEventListener('resize', debounce(() => {
    flow.resize();
  }, 140));

  sync();
}
