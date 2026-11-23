import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  publicationCanonicalHref,
  publicationRobots,
} from '../assets/js/publication-routing.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function replaceMarkedContent(html, marker, content) {
  const pattern = new RegExp(
    `(<([a-z][\\w-]*)\\b(?=[^>]*\\b${marker}(?=[\\s=>]))[^>]*>)[\\s\\S]*?(<\\/\\2>)`,
    'i',
  );
  return html.replace(pattern, `$1${content}$3`);
}

function replaceMetaContent(html, marker, content) {
  const pattern = new RegExp(
    `<meta\\b(?=[^>]*\\b${marker}(?=[\\s=>]))[^>]*>`,
    'i',
  );
  return html.replace(pattern, (tag) => tag.replace(
    /\bcontent=(["'])[\s\S]*?\1/i,
    `content="${escapeHtml(content)}"`,
  ));
}

const availabilityLabels = Object.freeze({
  published: 'Publicada',
  superseded: 'Substituída',
  withdrawn: 'Retirada',
  retracted: 'Retratada',
  archived: 'Arquivada',
});

const revisionLabels = Object.freeze({
  'initial-publication': 'Publicação inicial',
  update: 'Atualização',
  correction: 'Correção',
  'metadata-fix': 'Ajuste de metadados',
});

const claimRoleLabels = Object.freeze({
  supports: 'Sustenta esta afirmação',
  contextualizes: 'Contextualiza esta afirmação',
  contrasts: 'Contrasta com esta afirmação',
});

function contextIndex(context, collection) {
  return new Map((context[collection] || []).map((item) => [item.id, item]));
}

function publicationPresentation(publication, context) {
  const typeById = contextIndex(context, 'publicationTypes');
  const roleById = contextIndex(context, 'creditRoles');
  const credits = publication.credits
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((credit) => ({
      ...credit,
      roleLabels: credit.roles.map((role) => roleById.get(role)?.label || role),
    }));
  const revisions = publication.revisions
    .slice()
    .sort((left, right) => left.ordinal - right.ordinal);
  return {
    ...publication,
    typeLabel: typeById.get(publication.publicationType)?.label || publication.publicationType,
    originLabel: publication.authorshipOrigin === 'external'
      ? 'Contribuição externa'
      : 'Publicação do Observatório',
    availabilityLabel: availabilityLabels[publication.availabilityState]
      || publication.availabilityState,
    credits,
    revisions,
    latestRevision: revisions.at(-1) || null,
  };
}

function referenceById(context, referenceId) {
  return (context.snapshot?.references || []).find(({ id }) => id === referenceId) || null;
}

function renderClaimLinks(publication, block, context) {
  const sources = (publication.claimLinks || [])
    .filter((claim) => claim.contentBlockId === block.id)
    .flatMap((claim) => claim.sources)
    .map((source) => ({ ...source, reference: referenceById(context, source.referenceId) }))
    .filter(({ reference }) => reference);
  if (!sources.length) return '';
  return [
    '<ul class="publication-claim-links">',
    ...sources.map(({ locator, reference, role }) => [
      '<li>',
      `${escapeHtml(claimRoleLabels[role] || role)}: `,
      `<a href="${escapeHtml(reference.url)}" target="_blank" rel="noopener noreferrer">`,
      `${escapeHtml(reference.title)}</a>`,
      locator ? ` · ${escapeHtml(locator)}` : '',
      '</li>',
    ].join('')),
    '</ul>',
  ].join('');
}

function renderBody(publication, context) {
  return publication.body.map((block) => [
    `<section id="${escapeHtml(block.id)}">`,
    `<h2>${escapeHtml(block.heading)}</h2>`,
    ...block.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    renderClaimLinks(publication, block, context),
    '</section>',
  ].join('')).join('');
}

function renderCredits(publication) {
  return publication.credits
    .map((credit) => [
      '<li>',
      `<strong>${escapeHtml(credit.displayName)}</strong>`,
      `<span>${escapeHtml(credit.roleLabels.join(' · '))}</span>`,
      credit.declaredAffiliation
        ? `<span>${escapeHtml(credit.declaredAffiliation)}</span>`
        : '',
      credit.authorizedLinks?.length
        ? [
          '<div class="publication-credit-links">',
          ...credit.authorizedLinks.map((url, index) => (
            `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">`
            + `Link público ${index + 1}</a>`
          )),
          '</div>',
        ].join('')
        : '',
      '</li>',
    ].join(''))
    .join('');
}

function renderHistory(publication) {
  return publication.revisions
    .map((revision) => {
      const eventLabel = revisionLabels[revision.revisionEventType]
        || revision.revisionEventType
        || '';
      return [
        `<li id="revisao-${escapeHtml(revision.revisionId)}">`,
        `<strong>Versão ${revision.ordinal}${eventLabel ? ` · ${escapeHtml(eventLabel)}` : ''}</strong>`,
        `<time datetime="${escapeHtml(revision.publishedAt)}">${escapeHtml(revision.publishedAt)}</time>`,
        `<p>${escapeHtml(revision.changeSummary)}</p>`,
        revision.publicSnapshot
          ? [
            '<details>',
            '<summary>Ler o texto desta versão</summary>',
            '<div class="publication-snapshot">',
            `<h3>${escapeHtml(revision.publicSnapshot.title)}</h3>`,
            `<p>${escapeHtml(revision.publicSnapshot.summary)}</p>`,
            ...revision.publicSnapshot.body.flatMap((block) => [
              `<h4>${escapeHtml(block.heading)}</h4>`,
              ...block.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
            ]),
            `<a href="#revisao-${escapeHtml(revision.revisionId)}">Link para citar esta revisão</a>`,
            '</div>',
            '</details>',
          ].join('')
          : '',
        '</li>',
      ].join('');
    })
    .join('');
}

function renderTransparency(publication) {
  const review = publication.publicDeclarations?.editorialReview;
  const conflict = publication.publicDeclarations?.conflictOfInterest;
  const license = publication.textLicense;
  if (!review || !conflict || !license) return '';
  return [
    `<p class="publication-transparency-line">${escapeHtml(review.description)}</p>`,
    '<p class="publication-transparency-line">',
    review.peerReview
      ? 'Revisão por pares declarada.'
      : 'Não passou por revisão por pares; revisão editorial não equivale a validação científica.',
    '</p>',
    '<p class="publication-transparency-line">',
    conflict.state === 'declared'
      ? `Conflito de interesse declarado: ${escapeHtml(conflict.statement)}`
      : 'Nenhum conflito de interesse declarado.',
    '</p>',
    '<p class="publication-transparency-line">Licença: ',
    `<a href="${escapeHtml(license.url)}" target="_blank" rel="noopener noreferrer">`,
    `${escapeHtml(license.label)}</a></p>`,
    `<p class="publication-transparency-line">Titular dos direitos: ${escapeHtml(license.rightsHolder)}.</p>`,
  ].join('');
}

function referenceDetails(reference) {
  return [
    reference.authors || reference.creators?.map(({ name }) => name).join(', '),
    reference.institution,
    reference.publisher,
    reference.publishedAt || reference.year,
    reference.availability,
  ].filter(Boolean).join(' · ');
}

function renderReferences(publication, context) {
  return (publication.referenceIds || [])
    .map((id) => referenceById(context, id))
    .filter(Boolean)
    .map((reference) => [
      '<li>',
      `<a href="${escapeHtml(reference.url)}" target="_blank" rel="noopener noreferrer">`,
      `${escapeHtml(reference.title)}</a>`,
      referenceDetails(reference) ? `<p>${escapeHtml(referenceDetails(reference))}</p>` : '',
      reference.doi
        ? `<a href="https://doi.org/${escapeHtml(reference.doi)}" target="_blank" rel="noopener noreferrer">`
          + `DOI: ${escapeHtml(reference.doi)}</a>`
        : '',
      reference.notes ? `<p>${escapeHtml(reference.notes)}</p>` : '',
      '</li>',
    ].join(''))
    .join('');
}

function entityFromSnapshot(snapshot, ref) {
  return snapshot?.entities?.[ref.type]?.find(({ id }) => id === ref.id) || null;
}

function counterpartHref(type, entity) {
  if (!entity) return '';
  if (type === 'theory') {
    return `/Teorias/teorias.html?teoria=${encodeURIComponent(entity.slug)}`;
  }
  if (type === 'figure') {
    return `/GrandesNomes/grandes-nomes.html?perfil=${encodeURIComponent(entity.slug)}#galeria`;
  }
  if (type === 'publication') return publicationCanonicalHref(entity.slug);
  return entity.href || '';
}

function renderRelations(publication, context) {
  const snapshot = context.snapshot;
  const typeByKey = new Map((snapshot?.relationTypes || []).map((type) => [
    `${type.sourceType}:${type.targetType}:${type.id}`,
    type,
  ]));
  return (snapshot?.relations || [])
    .filter((relation) => (
      (relation.source.type === 'publication' && relation.source.id === publication.id)
      || (relation.target.type === 'publication' && relation.target.id === publication.id)
    ))
    .map((relation) => {
      const outbound = relation.source.type === 'publication'
        && relation.source.id === publication.id;
      const counterpartRef = outbound ? relation.target : relation.source;
      const counterpart = entityFromSnapshot(snapshot, counterpartRef);
      const type = typeByKey.get(
        `${relation.source.type}:${relation.target.type}:${relation.type}`,
      );
      const label = outbound ? type?.label : type?.inverseLabel;
      const title = counterpart?.title || counterpart?.name || counterpartRef.id;
      const href = counterpartHref(counterpartRef.type, counterpart);
      return [
        '<li>',
        `<strong>${escapeHtml(label || relation.label)}</strong> · `,
        href
          ? `<a href="${escapeHtml(href)}">${escapeHtml(title)}</a>`
          : escapeHtml(title),
        `<p>${escapeHtml(relation.justification)}</p>`,
        '</li>',
      ].join('');
    })
    .join('');
}

function renderAssets(publication) {
  return (publication.assetRights || []).map((asset) => [
    '<figure class="publication-asset">',
    asset.kind === 'image' || asset.kind === 'graphic'
      ? `<img src="${escapeHtml(asset.publicPath)}" alt="${escapeHtml(asset.credit)}" loading="lazy" decoding="async" />`
      : `<a href="${escapeHtml(asset.publicPath)}">Abrir ${escapeHtml(asset.kind)}</a>`,
    '<figcaption>',
    escapeHtml([
      asset.credit,
      `Base de uso: ${asset.rightsBasis}`,
      asset.licenseIdentifier ? `Licença: ${asset.licenseIdentifier}` : '',
    ].filter(Boolean).join(' · ')),
    '</figcaption>',
    '</figure>',
  ].join('')).join('');
}

function revealMarkedElement(html, marker) {
  const pattern = new RegExp(
    `(<[a-z][\\w-]*\\b(?=[^>]*\\b${marker}(?=[\\s=>]))[^>]*)\\s+hidden([^>]*>)`,
    'i',
  );
  return html.replace(pattern, '$1$2');
}

const decisionAuthorityLabels = Object.freeze({
  'author-request': 'solicitação da autoria',
  'editorial-decision': 'decisão editorial',
  'joint-decision': 'decisão conjunta',
  'legal-requirement': 'exigência legal',
});

function renderNotice(publication) {
  const notice = publication.publicNotice;
  if (!notice) return '';
  return [
    `<strong>Aviso editorial · ${escapeHtml(publication.availabilityLabel)}</strong>`,
    `<p>${escapeHtml(notice.reason)}</p>`,
    '<p>',
    `Vigente desde ${escapeHtml(notice.effectiveAt)}; revisão afetada: `,
    `${escapeHtml(notice.affectedRevisionId)}; autoridade: `,
    `${escapeHtml(decisionAuthorityLabels[notice.decisionAuthority] || notice.decisionAuthority)}.`,
    '</p>',
    '<p>',
    `${escapeHtml(notice.contest.instructions)} `,
    `Prazo editorial de resposta: até ${escapeHtml(notice.contest.responseWindowDays)} dias. `,
    `<a href="${escapeHtml(notice.contest.channelPath)}">Abrir canal de contestação</a>`,
    '</p>',
  ].join('');
}

function publicationAuthors(publication) {
  return publication.credits
    .filter((credit) => credit.roles.includes('author') || credit.roles.includes('coauthor'))
    .sort((left, right) => left.order - right.order);
}

function publicationAuthorMetadata(authors) {
  return authors.map(({ displayName }) => displayName).join(', ');
}

export function renderPublicationPage(template, source, { alias = false, ...context } = {}) {
  const publication = publicationPresentation(source, context);
  const authors = publicationAuthors(publication);
  const byline = authors.map(({ displayName }) => displayName).join(', ');
  const latestRevision = publication.latestRevision;
  const title = `${publication.title} | Observatório de Ideias`;
  let html = template
    .replace(
      '</head>',
      `    <link rel="canonical" href="${publicationCanonicalHref(publication.slug)}" />\n  </head>`,
    )
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    .replace(
      '<body class="observatory-page-body publication-page-body" data-mode="normal">',
      `<body class="observatory-page-body publication-page-body" data-mode="normal" data-publication-slug="${escapeHtml(publication.slug)}">`,
    )
    .replace(
      /(<section\b[^>]*\bdata-publication-state\b)([^>]*>)/i,
      '$1 hidden$2',
    )
    .replace(
      /(<article\b[^>]*\bdata-publication-document\b)[^>]*\bhidden\b([^>]*>)/i,
      '$1$2',
    );

  html = replaceMetaContent(
    html,
    'data-publication-robots',
    alias ? 'noindex, follow' : publicationRobots(publication.availabilityState),
  );
  html = replaceMetaContent(
    html,
    'data-publication-author',
    publicationAuthorMetadata(authors),
  );
  html = replaceMetaContent(html, 'data-publication-og-title', title);
  html = replaceMetaContent(html, 'data-publication-og-description', publication.summary);
  html = replaceMarkedContent(
    html,
    'data-publication-kicker',
    `${escapeHtml(publication.typeLabel)} · ${escapeHtml(publication.originLabel)}`,
  );
  html = replaceMarkedContent(html, 'data-publication-title', escapeHtml(publication.title));
  html = replaceMarkedContent(html, 'data-publication-summary', escapeHtml(publication.summary));
  html = replaceMarkedContent(html, 'data-publication-byline', `Autoria: ${escapeHtml(byline)}`);
  html = replaceMarkedContent(html, 'data-publication-status', escapeHtml(publication.availabilityLabel));
  html = replaceMarkedContent(html, 'data-publication-body', renderBody(publication, context));
  html = replaceMarkedContent(html, 'data-publication-credits', renderCredits(publication));
  html = replaceMarkedContent(
    html,
    'data-publication-transparency',
    renderTransparency(publication),
  );
  const references = renderReferences(publication, context);
  html = replaceMarkedContent(html, 'data-publication-references', references);
  if (references) html = revealMarkedElement(html, 'data-publication-references-section');
  const relations = renderRelations(publication, context);
  html = replaceMarkedContent(html, 'data-publication-relations', relations);
  if (relations) html = revealMarkedElement(html, 'data-publication-relations-section');
  const assets = renderAssets(publication);
  html = replaceMarkedContent(html, 'data-publication-assets', assets);
  if (assets) html = revealMarkedElement(html, 'data-publication-assets-section');
  html = replaceMarkedContent(html, 'data-publication-history', renderHistory(publication));
  if (publication.publicNotice) {
    html = replaceMarkedContent(html, 'data-publication-notice', renderNotice(publication));
    html = html.replace(
      /(<aside\b[^>]*\bdata-publication-notice\b[^>]*)\s+hidden([^>]*>)/i,
      '$1$2',
    );
  }

  if (latestRevision) {
    html = html.replace(
      '<dl class="page-status-list" data-publication-metadata></dl>',
      [
        '<dl class="page-status-list" data-publication-metadata>',
        `<div><dt>Formato</dt><dd>${escapeHtml(publication.typeLabel)}</dd></div>`,
        `<div><dt>Origem</dt><dd>${escapeHtml(publication.originLabel)}</dd></div>`,
        `<div><dt>Versão atual</dt><dd>${latestRevision.ordinal}</dd></div>`,
        `<div><dt>Publicada em</dt><dd>${escapeHtml(latestRevision.publishedAt)}</dd></div>`,
        '</dl>',
      ].join(''),
    );
  }
  return html;
}

function articleStructuredData(publication) {
  const revisions = publication.revisions
    .slice()
    .sort((left, right) => left.ordinal - right.ordinal);
  const authors = publicationAuthors(publication);
  const firstRevision = revisions[0];
  const latestRevision = revisions[revisions.length - 1];
  return Object.freeze({
    '@type': 'Article',
    headline: publication.title,
    description: publication.summary,
    datePublished: firstRevision?.publishedAt,
    dateModified: latestRevision?.publishedAt,
    author: Object.freeze(authors.map((author) => Object.freeze({
      '@type': author.partyType === 'organization' ? 'Organization' : 'Person',
      name: author.displayName,
      ...(author.authorizedLinks?.[0] ? { url: author.authorizedLinks[0] } : {}),
    }))),
  });
}

export function publicationRoute(publication) {
  return Object.freeze({
    id: `publication:${publication.id}`,
    url: `/Arquivo/publicacoes/${publication.slug}.html`,
    cleanUrl: `/Arquivo/publicacoes/${publication.slug}`,
    file: `Arquivo/publicacoes/${publication.slug}.html`,
    structuredData: articleStructuredData(publication),
  });
}

export function publicationAliasRoute(publication, alias) {
  const canonical = publicationRoute(publication);
  return Object.freeze({
    id: `publication-alias:${publication.id}:${alias}`,
    url: `/Arquivo/publicacoes/${alias}.html`,
    cleanUrl: `/Arquivo/publicacoes/${alias}`,
    canonicalCleanUrl: canonical.cleanUrl,
    file: `Arquivo/publicacoes/${alias}.html`,
    sitemap: false,
    structuredData: canonical.structuredData,
  });
}

export async function generatePublicationPages(outputDirectory, publications, context = {}) {
  const templatePath = join(outputDirectory, 'Arquivo', 'publicacao.html');
  const targetDirectory = join(outputDirectory, 'Arquivo', 'publicacoes');
  const template = await readFile(templatePath, 'utf8');
  await mkdir(targetDirectory, { recursive: true });
  const routes = [];

  for (const publication of publications) {
    const route = publicationRoute(publication);
    await writeFile(
      join(outputDirectory, route.file),
      renderPublicationPage(template, publication, context),
      'utf8',
    );
    routes.push(route);
    const safeAliases = [...new Set(publication.aliases)]
      .filter((alias) => alias !== publication.id && alias !== publication.slug);
    for (const alias of safeAliases) {
      const aliasRoute = publicationAliasRoute(publication, alias);
      await writeFile(
        join(outputDirectory, aliasRoute.file),
        renderPublicationPage(template, publication, { ...context, alias: true }),
        'utf8',
      );
      routes.push(aliasRoute);
    }
  }
  return Object.freeze(routes);
}
