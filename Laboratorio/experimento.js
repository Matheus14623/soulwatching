import { findExperiment, getExperimentKind } from '../assets/data/experiments.js';
import { findTheory } from '../assets/js/theory-model.js';
import { initNavigation } from '../assets/js/navigation.js';

const moduleLoaders = Object.freeze({
  'light-cone': () => import('./simulations/light-cone.js'),
  'zero-epsilon': () => import('./simulations/zero-epsilon.js'),
  'finite-recurrence': () => import('./simulations/finite-recurrence.js'),
  astrobiology: () => import('./simulations/astrobiology.js'),
});

let cleanupSimulation = null;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function announce(message) {
  const region = document.querySelector('[data-simulation-announcement]');
  if (!region) return;
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

function renderExperimentMeta(experiment) {
  const kind = getExperimentKind(experiment.kind);
  document.title = `${experiment.title} | Laboratório do Observatório`;
  document.querySelector('[data-experiment-kind]').textContent = `${kind?.label || 'Experimento'} · ${experiment.technology}`;
  document.querySelector('[data-experiment-title]').textContent = experiment.title;
  document.querySelector('[data-experiment-summary]').textContent = experiment.summary;
  document.querySelector('[data-experiment-question]').textContent = experiment.question;
  document.querySelector('[data-experiment-state]').textContent = 'ativo e exploratório';
  document.querySelector('[data-experiment-technology]').textContent = experiment.technology;
  document.querySelector('[data-experiment-inputs]').textContent = 'controladas pelo visitante';
  document.querySelector('[data-experiment-output]').textContent = 'recalculada localmente';
  document.querySelector('[data-experiment-boundary]').textContent = experiment.boundary;

  const links = createElement('div', 'experiment-theory-links');
  experiment.theoryIds
    .map((id) => findTheory(id))
    .filter(Boolean)
    .forEach((theory) => {
      const link = createElement('a', '', `Abrir ${theory.title}`);
      link.href = `../Teorias/teorias.html?teoria=${encodeURIComponent(theory.slug)}`;
      links.append(link);
    });
  const target = document.querySelector('[data-experiment-theories]');
  target.replaceChildren();
  if (links.childElementCount) {
    target.append(createElement('span', 'simulation-overline', 'Linhas autorais relacionadas'), links);
  }
}

function renderError(root, message) {
  document.title = 'Experimento indisponível | Laboratório do Observatório';
  document.querySelector('[data-experiment-kind]').textContent = 'LABORATÓRIO · INDISPONÍVEL';
  document.querySelector('[data-experiment-title]').textContent = 'Experimento indisponível.';
  document.querySelector('[data-experiment-summary]').textContent = 'Este modelo não está disponível neste endereço ou não pôde ser iniciado.';
  document.querySelector('[data-experiment-question]').textContent = 'Escolha outro experimento no catálogo para continuar.';
  document.querySelector('[data-experiment-state]').textContent = 'indisponível';
  document.querySelector('[data-experiment-technology]').textContent = 'nenhum modelo carregado';
  document.querySelector('[data-experiment-inputs]').textContent = 'nenhuma entrada ativa';
  document.querySelector('[data-experiment-output]').textContent = 'nenhum cálculo realizado';
  document.querySelector('[data-experiment-boundary]').textContent = 'Nenhum resultado foi calculado nesta página.';
  document.querySelector('[data-experiment-theories]').replaceChildren();
  const controlLink = document.querySelector('a[href="#simulador"]');
  if (controlLink) {
    controlLink.href = './laboratorio.html';
    controlLink.textContent = 'Escolher experimento';
  }
  const error = createElement('div', 'experiment-error');
  error.setAttribute('role', 'alert');
  const content = createElement('div');
  content.append(
    createElement('p', 'simulation-overline', 'EXPERIMENTO INDISPONÍVEL'),
    createElement('h2', '', message),
  );
  const link = createElement('a', 'button button-primary', 'Voltar ao Laboratório');
  link.href = './laboratorio.html';
  content.append(link);
  error.append(content);
  root.replaceChildren(error);
  root.setAttribute('aria-busy', 'false');
}

async function boot() {
  initNavigation();
  const root = document.querySelector('[data-simulation-root]');
  const slug = new URL(window.location.href).searchParams.get('experimento');
  const experiment = findExperiment(slug);
  if (
    !root
    || experiment?.status !== 'active'
    || !experiment.moduleKey
    || !moduleLoaders[experiment.moduleKey]
  ) {
    if (root) renderError(root, 'Escolha um dos modelos interativos disponíveis.');
    return;
  }

  renderExperimentMeta(experiment);
  try {
    const module = await moduleLoaders[experiment.moduleKey]();
    cleanupSimulation = module.mountSimulation(root, { experiment, announce });
    root.setAttribute('aria-busy', 'false');
  } catch (error) {
    renderError(root, 'Não foi possível iniciar este modelo.');
    console.error(error);
  }
}

window.addEventListener('pagehide', (event) => {
  if (!event.persisted) cleanupSimulation?.();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
