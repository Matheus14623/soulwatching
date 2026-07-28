import {
  findSitePageByPath,
  FOOTER_EXTERNAL_LINKS,
  FOOTER_NAVIGATION,
  getSitePage,
  PRIMARY_NAVIGATION,
  PUBLIC_GLOSSARY,
  resolveManifestHref,
  SITE_STATUS,
} from './site-manifest.js';

function createInternalLink(item, pathname, currentPageId, { footer = false } = {}) {
  const page = getSitePage(item.pageId);
  const link = document.createElement('a');
  link.href = resolveManifestHref(item.pageId, pathname);
  link.textContent = item.label;
  link.dataset.navigationId = item.pageId;
  if (!footer) {
    link.dataset.navGroup = item.group;
    if (page?.functionalLabel && page.functionalLabel !== item.label) {
      link.title = page.functionalLabel;
      link.setAttribute('aria-label', `${item.label}: ${page.functionalLabel}`);
    }
  }

  const activePageId = currentPageId === 'experiment' ? 'laboratory' : currentPageId;
  if (item.pageId === activePageId) link.setAttribute('aria-current', 'page');
  if (item.pageId === 'about' && currentPageId === 'home' && window.location.hash === '#sobre') {
    link.setAttribute('aria-current', 'location');
  }
  return link;
}

function createExternalLink(item) {
  const link = document.createElement('a');
  link.href = item.href;
  link.textContent = item.label;
  link.dataset.navigationId = item.id;
  if (item.external) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  return link;
}

function createPrimaryNavigationItems(pathname, currentPageId) {
  const items = [];
  let previousGroup = '';
  for (const item of PRIMARY_NAVIGATION) {
    if (item.group !== previousGroup) {
      const label = document.createElement('span');
      label.className = 'primary-nav-group-label';
      label.textContent = item.group;
      label.setAttribute('aria-hidden', 'true');
      items.push(label);
      previousGroup = item.group;
    }
    items.push(createInternalLink(item, pathname, currentPageId));
  }
  return items;
}

export function syncSiteNavigation() {
  const pathname = window.location.pathname || '/';
  const currentPageId = findSitePageByPath(pathname)?.id || null;
  const primaryNavigation = document.querySelector('[data-primary-nav]');
  if (primaryNavigation) {
    primaryNavigation.dataset.siteNavigation = '';
    primaryNavigation.replaceChildren(
      ...createPrimaryNavigationItems(pathname, currentPageId),
    );
  }

  document.querySelectorAll('[data-footer-nav]').forEach((footerNavigation) => {
    footerNavigation.replaceChildren(
      ...FOOTER_NAVIGATION.map((item) => createInternalLink(item, pathname, currentPageId, { footer: true })),
      ...FOOTER_EXTERNAL_LINKS.map(createExternalLink),
    );
  });

  document.querySelectorAll('[data-local-navigation-links]').forEach((localNavigation) => {
    const page = findSitePageByPath(pathname);
    if (!page) return;
    localNavigation.replaceChildren(...page.sections.map((section) => {
      const link = document.createElement('a');
      link.href = `#${section.id}`;
      link.textContent = section.label;
      link.dataset.localNavigationId = section.id;
      return link;
    }));
  });

  document.querySelectorAll('.beta-badge').forEach((badge) => {
    badge.textContent = SITE_STATUS.label;
    badge.dataset.siteStatus = SITE_STATUS.id;
    badge.setAttribute('aria-label', SITE_STATUS.description);
    badge.title = SITE_STATUS.description;
  });

  document.querySelectorAll('[data-site-status-label]').forEach((element) => {
    element.textContent = SITE_STATUS.displayLabel;
  });
  document.querySelectorAll('[data-site-status-description]').forEach((element) => {
    element.textContent = SITE_STATUS.description.replace(/^Beta editorial:\s*/i, '');
  });
  document.querySelectorAll('[data-site-status-summary]').forEach((summary) => {
    const heading = document.createElement('h3');
    heading.textContent = SITE_STATUS.displayLabel;
    const scope = document.createElement('p');
    scope.textContent = SITE_STATUS.scope;
    const criteriaLabel = document.createElement('p');
    criteriaLabel.textContent = 'O selo sai quando estes critérios forem atendidos:';
    const criteria = document.createElement('ul');
    criteria.append(...SITE_STATUS.exitCriteria.map((criterion) => {
      const item = document.createElement('li');
      item.textContent = criterion;
      return item;
    }));
    summary.replaceChildren(heading, scope, criteriaLabel, criteria);
  });

  document.querySelectorAll('[data-public-glossary]').forEach((glossary) => {
    glossary.replaceChildren(...PUBLIC_GLOSSARY.map((entry) => {
      const item = document.createElement('div');
      const term = document.createElement('dt');
      const link = document.createElement('a');
      link.href = resolveManifestHref(entry.pageId, pathname);
      link.textContent = entry.term;
      const functionalTerm = document.createElement('span');
      functionalTerm.textContent = entry.functionalTerm;
      term.append(link, functionalTerm);
      const definition = document.createElement('dd');
      definition.textContent = entry.definition;
      item.append(term, definition);
      return item;
    }));
  });

  return primaryNavigation;
}
