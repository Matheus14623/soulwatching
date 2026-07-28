import {
  PUBLICATIONS,
  PUBLICATION_TYPES,
} from '../assets/data/generated/runtime/publications.js';
import {
  createPublicationView,
  publicationHref,
} from '../assets/js/publication-model.js';
import { initNavigation } from '../assets/js/navigation.js';

const typeById = new Map(PUBLICATION_TYPES.map((type) => [type.id, type]));

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatDate(value) {
  if (!value) return 'data não informada';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`));
}

function createPublicationCard(source) {
  const publication = createPublicationView(source);
  const article = createElement('article', 'publication-card');
  const heading = createElement('h3', '', publication.title);
  const link = createElement('a', 'publication-card-link', 'Ler publicação');
  link.href = publicationHref(publication.slug);
  link.setAttribute('aria-label', `Ler ${publication.title}`);

  const meta = createElement('p', 'publication-card-meta');
  meta.append(
    createElement('span', '', publication.typeLabel),
    document.createTextNode(' · '),
    createElement('span', '', publication.availabilityLabel),
    document.createTextNode(' · '),
    createElement('time', '', formatDate(publication.latestRevision?.publishedAt)),
  );
  meta.querySelector('time')?.setAttribute('datetime', publication.latestRevision?.publishedAt || '');

  const authors = publication.authors.map(({ displayName }) => displayName).join(', ');
  article.append(
    meta,
    heading,
    createElement('p', 'publication-card-authors', `Autoria: ${authors}`),
    createElement('p', 'publication-card-summary', publication.summary),
    link,
  );

  if (publication.publicNotice) {
    const notice = createElement(
      'p',
      'publication-card-notice',
      `Aviso editorial: ${publication.publicNotice.reason}`,
    );
    notice.setAttribute('role', 'note');
    article.insertBefore(notice, link);
  }
  return article;
}

function updateCounts() {
  document.querySelectorAll('[data-publication-count]').forEach((element) => {
    element.textContent = String(PUBLICATIONS.length);
  });
  document.querySelectorAll('[data-publication-count-label]').forEach((element) => {
    element.textContent = PUBLICATIONS.length === 1
      ? '1 publicação revisada'
      : `${PUBLICATIONS.length} publicações revisadas`;
  });

  const byType = new Map(PUBLICATION_TYPES.map((type) => [type.id, 0]));
  PUBLICATIONS.forEach((publication) => {
    byType.set(publication.publicationType, (byType.get(publication.publicationType) || 0) + 1);
  });
  document.querySelectorAll('[data-publication-type-count]').forEach((element) => {
    const typeId = element.dataset.publicationTypeCount;
    const count = byType.get(typeId) || 0;
    const label = typeById.get(typeId)?.label.toLocaleLowerCase('pt-BR') || 'publicação';
    element.textContent = count
      ? `${count} ${count === 1 ? label : 'publicações'}`
      : 'nenhuma publicada';
  });
}

function renderPublications() {
  const section = document.querySelector('[data-publication-section]');
  const list = document.querySelector('[data-publication-list]');
  const empty = document.querySelector('[data-publication-empty]');
  if (!section || !list || !empty) return;

  if (!PUBLICATIONS.length) {
    section.hidden = true;
    empty.hidden = false;
    list.replaceChildren();
    return;
  }

  list.replaceChildren(...PUBLICATIONS.map(createPublicationCard));
  section.hidden = false;
  empty.hidden = true;
}

function boot() {
  initNavigation();
  updateCounts();
  renderPublications();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
