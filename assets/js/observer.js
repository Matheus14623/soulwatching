import { $, $$, clamp, debounce, safeSetText, setPressed } from './utils.js';

const TAU = Math.PI * 2;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function quadraticPoint(a, c, b, t) {
  const inv = 1 - t;
  return {
    x: inv * inv * a.x + 2 * inv * t * c.x + t * t * b.x,
    y: inv * inv * a.y + 2 * inv * t * c.y + t * t * b.y,
  };
}

function createStructuralCanvas(sourceCanvas) {
  const hero = sourceCanvas?.closest('.hero') || $('.hero');
  if (!hero) return sourceCanvas;

  const existingCanvas = $('[data-structural-flow-canvas]', hero);
  if (existingCanvas) return existingCanvas;

  const canvas = document.createElement('canvas');
  canvas.className = 'structural-flow-canvas';
  canvas.setAttribute('data-structural-flow-canvas', '');
  canvas.setAttribute('aria-hidden', 'true');
  hero.appendChild(canvas);
  return canvas;
}

class WebNode {
  constructor(x, y, mass = 1) {
    this.x = x;
    this.y = y;
    this.mass = mass;
    this.radius = randomBetween(1.5, 4.3) * mass;
    this.hue = Math.random() > 0.62 ? randomBetween(42, 52) : randomBetween(188, 224);
    this.phase = Math.random() * TAU;
  }

  resize(scaleX, scaleY) {
    this.x *= scaleX;
    this.y *= scaleY;
  }
}

class CosmicWeb {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d', { alpha: true });
    this.width = 0;
    this.height = 0;
    this.nodes = [];
    this.edges = [];
    this.signals = [];
    this.frame = 0;
    this.startTime = 0;
    this.isActive = false;
    this.hasStaticFrame = false;
    this.tick = this.tick.bind(this);
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, rect.width);
    const nextHeight = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const oldWidth = this.width || nextWidth;
    const oldHeight = this.height || nextHeight;
    this.width = nextWidth;
    this.height = nextHeight;
    this.canvas.width = Math.round(nextWidth * dpr);
    this.canvas.height = Math.round(nextHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (!this.nodes.length || Math.abs(nextWidth - oldWidth) > 120 || Math.abs(nextHeight - oldHeight) > 120) {
      this.buildWeb();
      return;
    }

    const scaleX = nextWidth / oldWidth;
    const scaleY = nextHeight / oldHeight;
    this.nodes.forEach((node) => node.resize(scaleX, scaleY));
    this.buildEdges();
    this.seedSignals();
  }

  buildWeb() {
    if (!this.width || !this.height) return;

    const anchors = [
      [0.08, 0.66, 1.32],
      [0.2, 0.32, 1.14],
      [0.36, 0.58, 1.5],
      [0.52, 0.26, 1.18],
      [0.66, 0.67, 1.42],
      [0.82, 0.42, 1.26],
      [0.94, 0.72, 1.08],
    ];

    const nodeCount = clamp(Math.round((this.width * this.height) / 20500), 42, 86);
    const nodes = anchors.map(([x, y, mass]) => new WebNode(x * this.width, y * this.height, mass));

    while (nodes.length < nodeCount) {
      const [ax, ay] = anchors[Math.floor(Math.random() * anchors.length)];
      const spreadX = this.width * randomBetween(0.06, 0.19);
      const spreadY = this.height * randomBetween(0.06, 0.19);
      const x = clamp(ax * this.width + randomBetween(-spreadX, spreadX), -50, this.width + 50);
      const y = clamp(ay * this.height + randomBetween(-spreadY, spreadY), -50, this.height + 50);
      nodes.push(new WebNode(x, y, randomBetween(0.68, 1.18)));
    }

    this.nodes = nodes;
    this.buildEdges();
    this.seedSignals();
  }

  buildEdges() {
    const nextEdges = [];
    const seen = new Set();
    const maxLink = Math.max(this.width, this.height) * 0.34;
    const maxLinkSq = maxLink * maxLink;

    this.nodes.forEach((node, index) => {
      const nearest = this.nodes
        .map((candidate, candidateIndex) => ({ candidate, candidateIndex, dist: distanceSq(node, candidate) }))
        .filter((entry) => entry.candidateIndex !== index && entry.dist < maxLinkSq)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, node.mass > 1.2 ? 5 : 4);

      nearest.forEach(({ candidate, candidateIndex, dist }) => {
        const a = Math.min(index, candidateIndex);
        const b = Math.max(index, candidateIndex);
        const key = `${a}:${b}`;
        if (seen.has(key)) return;
        seen.add(key);

        const distance = Math.sqrt(dist);
        const midX = (node.x + candidate.x) / 2;
        const midY = (node.y + candidate.y) / 2;
        const angle = Math.atan2(candidate.y - node.y, candidate.x - node.x);
        const bend = Math.sin((index + candidateIndex) * 1.7) * clamp(distance * 0.2, 14, 82);
        const control = {
          x: midX + Math.cos(angle + Math.PI / 2) * bend,
          y: midY + Math.sin(angle + Math.PI / 2) * bend,
        };

        nextEdges.push({
          a: node,
          b: candidate,
          control,
          distance,
          alpha: clamp(1 - distance / maxLink, 0.1, 0.84),
          phase: Math.random() * TAU,
        });
      });
    });

    this.edges = nextEdges;
  }

  seedSignals() {
    const total = clamp(Math.round(this.edges.length * 0.27), 14, 32);
    this.signals = Array.from({ length: total }, () => this.createSignal());
  }

  createSignal() {
    const edge = this.edges[Math.floor(Math.random() * Math.max(1, this.edges.length))];
    return {
      edge,
      progress: Math.random(),
      speed: randomBetween(0.00065, 0.0019),
      size: randomBetween(1.2, 2.8),
      hue: Math.random() > 0.72 ? 48 : randomBetween(188, 215),
    };
  }

  setActive(nextActive) {
    const active = Boolean(nextActive && this.canvas && this.ctx);
    if (active === this.isActive) return;
    this.isActive = active;

    if (active) {
      this.resize();
      this.hasStaticFrame = false;
      this.startTime = performance.now();
      this.frame = requestAnimationFrame(this.tick);
      return;
    }

    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.clear();
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawVoidContours(ctx, elapsed) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = 'rgba(114, 236, 255, 0.16)';
    ctx.lineWidth = 0.9;
    ctx.setLineDash([3, 14]);

    const rings = [
      [0.25, 0.44, 0.2, 0.08],
      [0.6, 0.45, 0.26, 0.12],
      [0.52, 0.77, 0.21, 0.1],
      [0.82, 0.56, 0.14, 0.07],
    ];

    rings.forEach(([x, y, rx, ry], index) => {
      ctx.beginPath();
      ctx.ellipse(
        x * this.width,
        y * this.height,
        rx * this.width * (1 + Math.sin(elapsed * 0.00025 + index) * 0.025),
        ry * this.height,
        Math.sin(index + 0.5) * 0.4,
        0,
        TAU,
      );
      ctx.stroke();
    });

    ctx.restore();
  }

  drawFilaments(ctx, elapsed) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    this.edges.forEach((edge) => {
      const pulse = 0.7 + Math.sin(elapsed * 0.00115 + edge.phase) * 0.3;
      const alpha = edge.alpha * pulse;
      const gradient = ctx.createLinearGradient(edge.a.x, edge.a.y, edge.b.x, edge.b.y);
      gradient.addColorStop(0, `rgba(114, 236, 255, ${alpha * 0.12})`);
      gradient.addColorStop(0.48, `rgba(173, 140, 255, ${alpha * 0.48})`);
      gradient.addColorStop(1, `rgba(104, 240, 203, ${alpha * 0.14})`);

      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(114, 236, 255, 0.22)';
      ctx.strokeStyle = gradient;
      ctx.lineWidth = clamp(edge.alpha * 3.7, 0.55, 2.2);
      ctx.beginPath();
      ctx.moveTo(edge.a.x, edge.a.y);
      ctx.quadraticCurveTo(edge.control.x, edge.control.y, edge.b.x, edge.b.y);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(232, 251, 255, ${alpha * 0.11})`;
      ctx.lineWidth = 0.52;
      ctx.beginPath();
      ctx.moveTo(edge.a.x, edge.a.y);
      ctx.quadraticCurveTo(edge.control.x, edge.control.y, edge.b.x, edge.b.y);
      ctx.stroke();
    });

    ctx.restore();
  }

  drawNodes(ctx, elapsed) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    this.nodes.forEach((node) => {
      const pulse = 1 + Math.sin(elapsed * 0.0018 + node.phase) * 0.24;
      const radius = node.radius * pulse;
      const glow = radius * 9.5;
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glow);
      gradient.addColorStop(0, `hsla(${node.hue}, 100%, 90%, 0.95)`);
      gradient.addColorStop(0.18, `hsla(${node.hue}, 100%, 64%, 0.62)`);
      gradient.addColorStop(0.58, `hsla(${node.hue}, 100%, 58%, 0.18)`);
      gradient.addColorStop(1, `hsla(${node.hue}, 100%, 58%, 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glow, 0, TAU);
      ctx.fill();

      ctx.fillStyle = `hsla(${node.hue}, 100%, 90%, 0.95)`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, Math.max(1.2, radius), 0, TAU);
      ctx.fill();
    });

    ctx.restore();
  }

  drawSignals(ctx) {
    if (!this.edges.length) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    this.signals.forEach((signal, index) => {
      if (!signal.edge) {
        this.signals[index] = this.createSignal();
        return;
      }

      signal.progress += signal.speed;
      if (signal.progress > 1) {
        this.signals[index] = this.createSignal();
        this.signals[index].progress = 0;
        return;
      }

      const point = quadraticPoint(signal.edge.a, signal.edge.control, signal.edge.b, signal.progress);
      const previous = quadraticPoint(signal.edge.a, signal.edge.control, signal.edge.b, clamp(signal.progress - 0.04, 0, 1));

      ctx.strokeStyle = `hsla(${signal.hue}, 100%, 72%, 0.48)`;
      ctx.lineWidth = signal.size * 0.8;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsla(${signal.hue}, 100%, 72%, 0.54)`;
      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();

      ctx.fillStyle = `hsla(${signal.hue}, 100%, 82%, 0.96)`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, signal.size, 0, TAU);
      ctx.fill();
    });

    ctx.restore();
  }

  tick(time) {
    if (!this.isActive || !this.ctx) return;
    const elapsed = time - this.startTime;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, this.width, this.height);
    this.drawVoidContours(ctx, elapsed);
    this.drawFilaments(ctx, elapsed);
    this.drawSignals(ctx);
    this.drawNodes(ctx, elapsed);

    this.frame = requestAnimationFrame(this.tick);
  }
}

export function initObserverMode() {
  const body = document.body;
  const buttons = $$('[data-observer-toggle]');
  const statusText = $('[data-status-text]');
  const sourceCanvas = $('[data-flow-canvas]');
  const canvas = createStructuralCanvas(sourceCanvas);
  const flow = new CosmicWeb(canvas);
  let isObserverMode = false;
  let isHeroVisible = true;
  let pulseTimer = 0;

  const sync = () => {
    body.dataset.mode = isObserverMode ? 'observer' : 'normal';
    body.classList.toggle('is-structural-vision', isObserverMode);

    buttons.forEach((button) => {
      setPressed(button, isObserverMode);
      const label = $('[data-toggle-label]', button);
      safeSetText(label, isObserverMode ? 'Desativar visão estrutural' : 'Ativar visão estrutural');
    });

    safeSetText(statusText, isObserverMode ? 'Teia cósmica estrutural' : 'Campo de ideias');
    flow.setActive(isObserverMode && isHeroVisible);
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      isObserverMode = !isObserverMode;
      body.classList.add('structural-pulse');
      window.clearTimeout(pulseTimer);
      pulseTimer = window.setTimeout(() => body.classList.remove('structural-pulse'), 700);
      sync();
    });
  });

  if ('IntersectionObserver' in window && canvas) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isHeroVisible = Boolean(entry?.isIntersecting);
        sync();
      },
      { threshold: 0.08 },
    );
    observer.observe(canvas);
  }

  window.addEventListener('resize', debounce(() => {
    flow.resize();
  }, 140));

  sync();
}
