import { $, $$, safeSetText } from './utils.js';

const PHILOSOPHY_DATA = Object.freeze({
  traffic: {
    title: 'Estoicismo',
    subtitle: 'Ferramenta: controle interno',
    quote: '“Separar o que pode ser conduzido do que só pode ser observado.”',
    analysis: 'A rotina perde parte do ruído quando o sistema distingue input interno de output externo. A âncora não elimina o caos; ela impede que todo caos vire comando.',
    image: 'assets/images/stoic-rock.webp',
    alt: 'Rocha escura resistindo a ondas intensas',
    accent: 'cyan',
  },
  dread: {
    title: 'Niilismo libertador',
    subtitle: 'Ferramenta: escala cósmica',
    quote: '“Quando a escala aumenta, algumas urgências humanas deixam de parecer sentenças.”',
    analysis: 'A insignificância não precisa esmagar. Ela pode resfriar a cobrança, abrir espaço para tentativa e lembrar que erro humano não é catástrofe cósmica.',
    image: 'assets/images/cosmic-scale.webp',
    alt: 'Planeta azul pequeno diante de galáxias e estrelas',
    accent: 'purple',
  },
  chaos: {
    title: 'Absurdismo',
    subtitle: 'Ferramenta: gesto continuado',
    quote: '“A pedra volta. O gesto também. Entre os dois, nasce uma forma de liberdade.”',
    analysis: 'Quando o sentido não aparece como resposta externa, a ação ainda pode ser escolhida como dança material da vida.',
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
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const applyPhilosophy = (key) => {
    const data = PHILOSOPHY_DATA[key];
    if (!data) return;

    buttons.forEach((button) => {
      const isActive = button.dataset.philosophy === key;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
      if (isActive) panel.setAttribute('aria-labelledby', button.id);
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
    }, reduceMotion.matches ? 0 : 180);
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
