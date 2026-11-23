import { PUBLICATIONS } from '../assets/data/generated/runtime/publications.js';
import { getContentRepository } from '../assets/js/content-platform.js';
import {
  publicationCanonicalHref,
  createPublicationView,
  publicationHref,
  publicationRobots,
  resolvePublication,
} from '../assets/js/publication-model.js';
import { initNavigation } from '../assets/js/navigation.js';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  timeZone: 'UTC',
  year: 'numeric',
});

const revisionLabels = Object.freeze({
  'initial-publication': 'Publicação inicial',
  update: 'Atualização',
  correction: 'Correção',
  'metadata-fix': 'Ajuste de metadados',
});

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createTime(value) {
  const time = createElement('time', '', dateFormatter.format(new Date(`${value}T00:00:00Z`)));
  time.dateTime = value;
  return time;
}

function createDefinition(label, value) {
  const wrapper = document.createElement('div');
  wrapper.append(createElement('dt', '', label), createElement('dd', '', value));
  return wrapper;
}

function currentSlug() {
  const url = new URL(window.location.href);
  const pathSlug = url.pathname.match(/\/Arquivo\/publicacoes\/([a-z0-9-]+)(?:\.html)?\/?$/i)?.[1];
  return pathSlug || url.searchParams.get('publicacao') || document.body.dataset.publicationSlug || '';
}

function setState(title, description) {
  document.querySelector('[data-publication-state-title]').textContent = title;
  document.querySelector('[data-publication-state-description]').textContent = description;
  document.querySelector('[data-publication-state]').hidden = false;
  document.querySelector('[data-publication-document]').hidden = true;
}

function setDocumentMetadata(publication) {
  document.title = `${publication.title} | Observatório de Ideias`;
  document.querySelector('[data-publication-og-title]').content = document.title;
  document.querySelector('[data-publication-og-description]').content = publication.summary;
  document.querySelector('[data-publication-robots]').content = publicationRobots(
    publication.availabilityState,
  );
  document.querySelector('[data-publication-author]').content = publication.authors
    .map(({ displayName }) => displayName)
    .join(', ');

  const canonical = new URL(
    publicationCanonicalHref(publication.slug),
    window.location.origin,
  );
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.append(canonicalLink);
  }
  canonicalLink.href = canonical.href;
  if (currentSlug() !== publication.slug) {
    window.history.replaceState(
      window.history.state,
      '',
      `${canonical.pathname}${window.location.hash}`,
    );
  }
}

function renderMetadata(publication) {
  const metadata = document.querySelector('[data-publication-metadata]');
  metadata.replaceChildren(
    createDefinition('Formato', publication.typeLabel),
    createDefinition('Origem', publication.originLabel),
    createDefinition('Versão atual', String(publication.latestRevision?.ordinal || 1)),
    createDefinition(
      'Publicada em',
      publication.latestRevision
        ? dateFormatter.format(new Date(`${publication.latestRevision.publishedAt}T00:00:00Z`))
        : 'data não informada',
    ),
  );
}

function renderNotice(publication) {
  const notice = document.querySelector('[data-publication-notice]');
  if (!publication.publicNotice) {
    notice.hidden = true;
    notice.replaceChildren();
    return;
  }
  notice.replaceChildren(
    createElement('strong', '', `Aviso editorial · ${publication.availabilityLabel}`),
    createElement('p', '', publication.publicNotice.reason),
    createElement(
      'p',
      '',
      `Vigente desde ${dateFormatter.format(new Date(`${publication.publicNotice.effectiveAt}T00:00:00Z`))}; revisão afetada: ${publication.publicNotice.affectedRevisionId}.`,
    ),
  );
  if (publication.publicNotice.contest) {
    const contest = publication.publicNotice.contest;
    const contestLine = createElement(
      'p',
      '',
      `${contest.instructions} Prazo editorial de resposta: até ${contest.responseWindowDays} dias.`,
    );
    const contestLink = createElement('a', '', 'Abrir canal de contestação');
    contestLink.href = contest.channelPath;
    contestLine.append(document.createTextNode(' '), contestLink);
    notice.append(contestLine);
  }
  notice.hidden = false;
}

const claimRoleLabels = Object.freeze({
  supports: 'Sustenta esta afirmação',
  contextualizes: 'Contextualiza esta afirmação',
  contrasts: 'Contrasta com esta afirmação',
});

function renderBody(publication, repository) {
  const body = document.querySelector('[data-publication-body]');
  body.replaceChildren(...publication.body.map((block) => {
    const section = document.createElement('section');
    section.id = block.id;
    section.append(createElement('h2', '', block.heading));
    block.paragraphs.forEach((paragraph) => section.append(createElement('p', '', paragraph)));
    const claims = publication.claimLinks.filter((claim) => claim.contentBlockId === block.id);
    if (claims.length) {
      const claimList = createElement('ul', 'publication-claim-links');
      claims.flatMap((claim) => claim.sources).forEach((source) => {
        const reference = repository.getReference(source.referenceId);
        if (!reference) return;
        const item = document.createElement('li');
        item.append(document.createTextNode(`${claimRoleLabels[source.role] || source.role}: `));
        const link = createElement('a', '', reference.title);
        link.href = reference.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        item.append(link);
        if (source.locator) item.append(document.createTextNode(` · ${source.locator}`));
        claimList.append(item);
      });
      if (claimList.children.length) section.append(claimList);
    }
    return section;
  }));
}

function renderCredits(publication) {
  const list = document.querySelector('[data-publication-credits]');
  list.replaceChildren(...publication.credits.map((credit) => {
    const item = document.createElement('li');
    item.append(
      createElement('strong', '', credit.displayName),
      createElement('span', '', credit.roleLabels.join(' · ')),
    );
    if (credit.declaredAffiliation) {
      item.append(createElement('span', '', credit.declaredAffiliation));
    }
    if (credit.authorizedLinks.length) {
      const links = createElement('div', 'publication-credit-links');
      credit.authorizedLinks.forEach((url, index) => {
        const link = createElement('a', '', `Link público ${index + 1}`);
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        links.append(link);
      });
      item.append(links);
    }
    return item;
  }));
}

function renderTransparency(publication) {
  const container = document.querySelector('[data-publication-transparency]');
  const review = publication.publicDeclarations.editorialReview;
  const conflict = publication.publicDeclarations.conflictOfInterest;
  const license = publication.textLicense;
  const licenseLine = document.createElement('p');
  licenseLine.className = 'publication-transparency-line';
  licenseLine.append(document.createTextNode('Licença: '));
  const licenseLink = createElement('a', '', license.label);
  licenseLink.href = license.url;
  licenseLink.target = '_blank';
  licenseLink.rel = 'noopener noreferrer';
  licenseLine.append(licenseLink);

  container.replaceChildren(
    createElement('p', 'publication-transparency-line', review.description),
    createElement(
      'p',
      'publication-transparency-line',
      review.peerReview
        ? 'Revisão por pares declarada.'
        : 'Não passou por revisão por pares; revisão editorial não equivale a validação científica.',
    ),
    createElement(
      'p',
      'publication-transparency-line',
      conflict.state === 'declared'
        ? `Conflito de interesse declarado: ${conflict.statement}`
        : 'Nenhum conflito de interesse declarado.',
    ),
    licenseLine,
    createElement('p', 'publication-transparency-line', `Titular dos direitos: ${license.rightsHolder}.`),
  );
}

function renderReferences(publication, repository) {
  const section = document.querySelector('[data-publication-references-section]');
  const list = document.querySelector('[data-publication-references]');
  const references = publication.referenceIds
    .map((id) => repository.getReference(id))
    .filter(Boolean);
  if (!references.length) {
    section.hidden = true;
    list.replaceChildren();
    return;
  }
  list.replaceChildren(...references.map((reference) => {
    const item = document.createElement('li');
    const link = createElement('a', '', reference.title);
    link.href = reference.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const details = [
      reference.authors || reference.creators?.map(({ name }) => name).join(', '),
      reference.institution,
      reference.publisher,
      reference.publishedAt || reference.year,
      reference.availability,
    ].filter(Boolean).join(' · ');
    item.append(link);
    if (details) item.append(createElement('p', '', details));
    if (reference.doi) {
      const doi = createElement('a', '', `DOI: ${reference.doi}`);
      doi.href = `https://doi.org/${reference.doi}`;
      doi.target = '_blank';
      doi.rel = 'noopener noreferrer';
      item.append(doi);
    }
    if (reference.notes) item.append(createElement('p', '', reference.notes));
    return item;
  }));
  section.hidden = false;
}

function counterpartHref(type, entity) {
  if (!entity) return '';
  if (type === 'theory') {
    return `/Teorias/teorias.html?teoria=${encodeURIComponent(entity.slug)}`;
  }
  if (type === 'figure') {
    return `/GrandesNomes/grandes-nomes.html?perfil=${encodeURIComponent(entity.slug)}#galeria`;
  }
  if (type === 'publication') {
    return publicationHref(entity.slug);
  }
  return '';
}

function renderRelations(publication, repository) {
  const section = document.querySelector('[data-publication-relations-section]');
  const list = document.querySelector('[data-publication-relations]');
  const relations = repository.getRelations({ type: 'publication', id: publication.id });
  if (!relations.length) {
    section.hidden = true;
    list.replaceChildren();
    return;
  }
  list.replaceChildren(...relations.map((relation) => {
    const item = document.createElement('li');
    const href = counterpartHref(relation.counterpartRef.type, relation.counterpart);
    const title = relation.counterpart?.title || relation.counterpart?.name || relation.counterpartRef.id;
    item.append(
      createElement('strong', '', relation.displayLabel),
      document.createTextNode(' · '),
    );
    if (href) {
      const link = createElement('a', '', title);
      link.href = href;
      item.append(link);
    } else {
      item.append(document.createTextNode(title));
    }
    item.append(createElement('p', '', relation.justification));
    return item;
  }));
  section.hidden = false;
}

function renderAssets(publication) {
  const section = document.querySelector('[data-publication-assets-section]');
  const list = document.querySelector('[data-publication-assets]');
  if (!publication.assetRights.length) {
    section.hidden = true;
    list.replaceChildren();
    return;
  }
  list.replaceChildren(...publication.assetRights.map((asset) => {
    const figure = createElement('figure', 'publication-asset');
    if (asset.kind === 'image' || asset.kind === 'graphic') {
      const image = document.createElement('img');
      image.src = asset.publicPath;
      image.alt = asset.credit;
      image.loading = 'lazy';
      image.decoding = 'async';
      figure.append(image);
    } else {
      const link = createElement('a', '', `Abrir ${asset.kind}`);
      link.href = asset.publicPath;
      figure.append(link);
    }
    const rights = [
      asset.credit,
      `Base de uso: ${asset.rightsBasis}`,
      asset.licenseIdentifier ? `Licença: ${asset.licenseIdentifier}` : '',
    ].filter(Boolean).join(' · ');
    figure.append(createElement('figcaption', '', rights));
    return figure;
  }));
  section.hidden = false;
}

function renderHistory(publication) {
  const list = document.querySelector('[data-publication-history]');
  list.replaceChildren(...publication.revisions.map((revision) => {
    const item = document.createElement('li');
    item.id = `revisao-${revision.revisionId}`;
    item.append(
      createElement(
        'strong',
        '',
        `Versão ${revision.ordinal} · ${revisionLabels[revision.revisionEventType] || revision.revisionEventType}`,
      ),
      createTime(revision.publishedAt),
      createElement('p', '', revision.changeSummary),
    );
    const details = document.createElement('details');
    const summary = createElement('summary', '', 'Ler o texto desta versão');
    const snapshot = createElement('div', 'publication-snapshot');
    snapshot.append(
      createElement('h3', '', revision.publicSnapshot.title),
      createElement('p', '', revision.publicSnapshot.summary),
    );
    revision.publicSnapshot.body.forEach((block) => {
      snapshot.append(createElement('h4', '', block.heading));
      block.paragraphs.forEach((paragraph) => snapshot.append(createElement('p', '', paragraph)));
    });
    const citationLink = createElement('a', '', 'Link para citar esta revisão');
    citationLink.href = `#revisao-${revision.revisionId}`;
    snapshot.append(citationLink);
    details.append(summary, snapshot);
    item.append(details);
    return item;
  }));
}

async function renderPublication(source) {
  const publication = createPublicationView(source);
  const repository = await getContentRepository();
  setDocumentMetadata(publication);
  document.querySelector('[data-publication-kicker]').textContent = `${publication.typeLabel} · ${publication.originLabel}`;
  document.querySelector('[data-publication-title]').textContent = publication.title;
  document.querySelector('[data-publication-summary]').textContent = publication.summary;
  document.querySelector('[data-publication-byline]').textContent = `Autoria: ${publication.authors.map(({ displayName }) => displayName).join(', ')}`;
  document.querySelector('[data-publication-status]').textContent = publication.availabilityLabel;
  renderMetadata(publication);
  renderNotice(publication);
  renderBody(publication, repository);
  renderCredits(publication);
  renderTransparency(publication);
  renderReferences(publication, repository);
  renderRelations(publication, repository);
  renderAssets(publication);
  renderHistory(publication);
  document.querySelector('[data-publication-state]').hidden = true;
  document.querySelector('[data-publication-document]').hidden = false;
}

async function boot() {
  initNavigation();
  const slug = currentSlug();
  if (!slug) {
    setState(
      'Escolha uma publicação no Arquivo.',
      'Acesse o Arquivo para encontrar os textos disponíveis.',
    );
    return;
  }
  const publication = resolvePublication(PUBLICATIONS, slug);
  if (!publication) {
    setState(
      'Publicação não encontrada.',
      'Confira o endereço ou procure o texto no Arquivo.',
    );
    return;
  }
  try {
    await renderPublication(publication);
  } catch (error) {
    console.error(error);
    setState(
      'Não foi possível abrir esta publicação.',
      'Tente novamente mais tarde ou volte ao Arquivo para escolher outro texto.',
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
