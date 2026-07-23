import { $, debounce, prefersReducedMotion, setPressed, safeSetText } from './utils.js';

const NOTES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

class StringVoice {
  constructor(y, index) {
    this.baseY = y;
    this.index = index;
    this.amplitude = 0;
    this.phase = Math.random() * Math.PI;
    this.decay = 0.94 + index * 0.004;
  }

  resize(y) {
    this.baseY = y;
  }

  pluck(force = 1) {
    this.amplitude = Math.max(this.amplitude, 26 * force);
  }

  update() {
    this.phase += 0.44 + this.index * 0.035;
    this.amplitude *= this.decay;
    if (this.amplitude < 0.05) this.amplitude = 0;
  }

  draw(ctx, width) {
    const active = this.amplitude > 0.6;
    ctx.beginPath();
    ctx.lineWidth = active ? 1.6 : 1;
    ctx.strokeStyle = active ? 'rgba(103, 232, 249, 0.94)' : 'rgba(255, 255, 255, 0.24)';

    for (let x = 0; x <= width; x += 4) {
      const envelope = Math.sin((x / width) * Math.PI);
      const y = this.baseY + Math.sin(x * 0.045 + this.phase) * this.amplitude * envelope;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    if (active && Math.random() > 0.86) {
      ctx.fillStyle = 'rgba(103, 232, 249, 0.68)';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText(Math.random() > 0.5 ? '1' : '0', Math.random() * width, this.baseY - 18 - Math.random() * 32);
    }
  }
}

class AudioEngine {
  constructor() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.AudioContext = AudioContext;
    this.context = null;
    this.enabled = false;
  }

  async toggle() {
    if (!this.AudioContext) throw new Error('Web Audio API não está disponível neste navegador.');
    if (!this.context) this.context = new this.AudioContext();
    if (this.context.state === 'suspended') await this.context.resume();
    this.enabled = !this.enabled;
    return this.enabled;
  }

  play(index) {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(NOTES[index % NOTES.length], now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1300, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.7);
  }
}

class ResonanceCanvas {
  constructor(canvas, container, audio) {
    this.canvas = canvas;
    this.container = container;
    this.ctx = canvas?.getContext('2d', { alpha: true });
    this.audio = audio;
    this.width = 0;
    this.height = 0;
    this.strings = [];
    this.frame = 0;
    this.isVisible = true;
    this.tick = this.tick.bind(this);
  }

  init() {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    this.bind();
    this.start();
  }

  bind() {
    const handlePointer = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const y = event.clientY - rect.top;
      const x = event.clientX - rect.left;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      this.pluckNearest(y, event.type === 'pointerdown' ? 1.15 : 0.78);
    };

    this.canvas.addEventListener('pointermove', handlePointer, { passive: true });
    this.canvas.addEventListener('pointerdown', handlePointer, { passive: true });
    this.canvas.addEventListener('pointerleave', () => {
      this.strings.forEach((string) => {
        string.amplitude *= 0.72;
      });
    });

    window.addEventListener('resize', debounce(() => this.resize(), 140));

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        this.isVisible = Boolean(entry?.isIntersecting);
        if (this.isVisible) this.start();
        else this.stop();
      }, { threshold: 0.08 });
      observer.observe(this.canvas);
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height || this.container?.clientHeight || 320);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const gap = this.height / 7;
    if (!this.strings.length) {
      this.strings = Array.from({ length: 6 }, (_, index) => new StringVoice((index + 1) * gap, index));
      return;
    }

    this.strings.forEach((string, index) => string.resize((index + 1) * gap));
    this.drawStatic();
  }

  pluckNearest(y, force) {
    const nearest = this.strings.reduce((best, string) => {
      const dist = Math.abs(string.baseY - y);
      return dist < best.dist ? { string, dist } : best;
    }, { string: null, dist: Infinity });

    if (!nearest.string || nearest.dist > 24) return;
    nearest.string.pluck(force);
    this.audio.play(nearest.string.index);
  }

  pluck(index, force = 1.15) {
    const string = this.strings[index];
    if (!string) return;
    string.pluck(force);
    this.audio.play(index);
    this.start();
  }

  start() {
    if (this.frame || prefersReducedMotion()) {
      this.drawStatic();
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  drawStatic() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.strings.forEach((string) => string.draw(this.ctx, this.width));
  }

  tick() {
    if (!this.ctx || !this.isVisible) {
      this.stop();
      return;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.strings.forEach((string) => {
      string.update();
      string.draw(this.ctx, this.width);
    });

    this.frame = requestAnimationFrame(this.tick);
  }
}

export function initResonance() {
  const canvas = $('[data-string-canvas]');
  const container = $('[data-string-container]');
  const audioButton = $('[data-audio-toggle]');
  const status = $('[data-audio-status]');
  const stringButtons = document.querySelectorAll('[data-string-key]');
  const audio = new AudioEngine();
  const resonance = new ResonanceCanvas(canvas, container, audio);
  resonance.init();

  stringButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.stringKey);
      resonance.pluck(index);
      safeSetText(
        status,
        `Corda ${index + 1} acionada. ${audio.enabled ? 'Áudio ativo.' : 'Áudio desligado; resposta somente visual.'}`,
      );
    });
  });

  audioButton?.addEventListener('click', async () => {
    try {
      const enabled = await audio.toggle();
      setPressed(audioButton, enabled);
      safeSetText(audioButton, enabled ? 'Desativar áudio sutil' : 'Ativar áudio sutil');
      safeSetText(
        status,
        enabled
          ? 'Áudio ativado. Passe o cursor, toque nas cordas ou use os botões.'
          : 'Áudio desligado. As cordas visuais continuam ativas.',
      );
    } catch (error) {
      safeSetText(status, error.message);
      status?.classList.add('is-error');
    }
  });
}
