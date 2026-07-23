import { LEARNING_PATHS } from '../data/learning-paths.js';

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createRouteCard(route, index) {
  const link = createElement('a', 'route-preview-card');
  link.href = `Rotas/rotas.html?rota=${encodeURIComponent(route.slug)}#percurso`;
  link.append(
    createElement('span', '', `ROTA ${String(index + 1).padStart(2, '0')} · ${route.steps.length} ETAPAS`),
    createElement('h3', '', route.title),
    createElement('p', '', route.summary),
    createElement('strong', '', `Começar percurso · cerca de ${route.durationMinutes} min →`),
  );
  return link;
}

export function initLearningPathsPreview() {
  const container = document.querySelector('[data-learning-paths-preview]');
  if (!container) return;
  container.replaceChildren(...LEARNING_PATHS.map(createRouteCard));
}
