import {
  getFeaturedNotableFigures,
  getNotableFigureCount,
  resolveNotableFigure,
} from './notable-figures-model.js?v=great-minds-v2';

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createPreviewCard(figure) {
  const resolved = resolveNotableFigure(figure);
  const link = createElement('a', `notable-preview-card notable-preview-card--${figure.area}`);
  link.href = `GrandesNomes/grandes-nomes.html?perfil=${encodeURIComponent(figure.slug)}#galeria`;
  link.setAttribute('aria-label', `Conhecer ${figure.name} na área Grandes Nomes`);

  const media = createElement('span', 'notable-preview-media');
  const image = document.createElement('img');
  image.src = figure.portrait.src;
  image.width = figure.portrait.width;
  image.height = figure.portrait.height;
  image.alt = figure.portrait.alt;
  image.loading = 'lazy';
  image.decoding = 'async';
  media.append(image, createElement('span', 'notable-preview-orbit'));

  const body = createElement('span', 'notable-preview-body');
  const meta = createElement('span', 'notable-preview-meta', resolved.areaLabel);
  const title = createElement('strong', 'notable-preview-name', figure.name);
  const summary = createElement('span', 'notable-preview-summary', figure.summary);
  const action = createElement('span', 'notable-preview-action');
  action.append('Abrir perfil ', createElement('span', '', '↗'));
  action.lastElementChild?.setAttribute('aria-hidden', 'true');
  body.append(meta, title, summary, action);

  link.append(media, body);
  return link;
}

export function initNotableFiguresPreview() {
  const target = document.querySelector('[data-notable-figures-preview]');
  if (!target || target.dataset.initialized === 'true') return;

  const total = getNotableFigureCount();
  document.querySelectorAll('[data-notable-profile-count]').forEach((element) => {
    element.textContent = element.dataset.notableProfileCount === 'action'
      ? `Explorar os ${total} perfis`
      : `${total} perfis documentados`;
  });

  target.dataset.initialized = 'true';
  target.replaceChildren(...getFeaturedNotableFigures().map(createPreviewCard));
}
