import { $, $$, safeSetText } from './utils.js';

const PHILOSOPHY_DATA = Object.freeze({
  traffic: {
    title: 'Estoicismo',
    subtitle: 'Ferramenta: controle interno',
    quote: '“Serenidade para diferenciar o que pode ser controlado do que só pode ser observado.”',
    analysis: 'A âncora do cotidiano: separar input interno de output externo, sem transformar o caos alheio em ruído permanente.',
    image: 'assets/images/stoic-rock.webp',
    alt: 'Rocha escura resistindo a ondas intensas',
    accent: 'cyan',
  },
  dread: {
    title: 'Niilismo otimista',
    subtitle: 'Ferramenta: escala cósmica',
    quote: '“Se nada importa em escala universal, o medo de errar perde parte da sua força lógica.”',
    analysis: 'A escala cósmica não deprime: ela resfria a mente. A insignificância vira liberdade pragmática para tentar de novo.',
    image: 'assets/images/cosmic-scale.webp',
    alt: 'Planeta azul pequeno diante de galáxias e estrelas',
    accent: 'purple',
  },
  chaos: {
    title: 'Absurdismo',
    subtitle: 'Ferramenta: o sorriso',
    quote: '“Empurrar a pedra não como castigo, mas como a dança material da vida.”',
    analysis: 'Quando o universo não responde, o gesto continua. A resposta é aceitar a contradição e agir mesmo assim.',
    image: 'assets/images/sisyphus-absurdism.webp',
    alt: 'Figura geométrica empurrando uma pedra em uma montanha',
    accent: 'yellow',
  },
});

export function initPhilosophyCompass() {
  const buttons = $$('[data-philosophy]');
  const panel = $('#philosophy-panel');
  const image = $('[data-philosophy-image]');
  const title = $('[data-philosophy-title]');
  const subtitle = $('[data-philosophy-subtitle]');
  const quote = $('[data-philosophy-quote]');
  const analysis = $('[data-philosophy-analysis]');

  if (!buttons.length || !panel) return;

  const applyPhilosophy = (key) => {
    const data = PHILOSOPHY_DATA[key];
    if (!data) return;

    buttons.forEach((button) => {
      const isActive = button.dataset.philosophy === key;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    panel.classList.add('is-changing');
    window.setTimeout(() => {
      safeSetText(title, data.title);
      safeSetText(subtitle, data.subtitle);
      safeSetText(quote, data.quote);
      safeSetText(analysis, data.analysis);
      if (image) {
        image.src = data.image;
        image.alt = data.alt;
      }
      panel.dataset.accent = data.accent;
      panel.classList.remove('is-changing');
    }, 180);
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => applyPhilosophy(button.dataset.philosophy));
    button.addEventListener('keydown', (event) => {
      const currentIndex = buttons.indexOf(button);
      const lastIndex = buttons.length - 1;
      let nextIndex = currentIndex;

      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = lastIndex;

      if (nextIndex !== currentIndex) {
        event.preventDefault();
        buttons[nextIndex].focus();
        applyPhilosophy(buttons[nextIndex].dataset.philosophy);
      }
    });
  });

  applyPhilosophy('traffic');
}
