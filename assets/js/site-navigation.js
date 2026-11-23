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
  const disclosure = document.createElement('details');
  disclosure.className = 'nav-explore';
  const summary = document.createElement('summary');
  summary.textContent = 'Explorar';
  const destinations = document.createElement('div');
  destinations.className = 'nav-explore-links';
  disclosure.append(summary, destinations);
  for (const item of PRIMARY_NAVIGATION) {
    const link = createInternalLink(item, pathname, currentPageId);
    if (item.group === 'Explorar') {
      if (!items.includes(disclosure)) items.push(disclosure);
      destinations.append(link);
      if (link.hasAttribute('aria-current')) summary.classList.add('is-current');
    } else {
      items.push(link);
    }
  }
  return items;
}

function createFooterGroup(label, links) {
  const group = document.createElement('div');
  group.className = 'footer-link-group';
  const heading = document.createElement('strong');
  heading.textContent = label;
  group.append(heading, ...links);
  return group;
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
      createFooterGroup('Explorar', FOOTER_NAVIGATION
        .filter((item) => item.group === 'Explorar')
        .map((item) => createInternalLink(item, pathname, currentPageId, { footer: true }))),
      createFooterGroup('Observatório', FOOTER_NAVIGATION
        .filter((item) => item.group !== 'Explorar')
        .map((item) => createInternalLink(item, pathname, currentPageId, { footer: true }))),
      createFooterGroup('Conectar', FOOTER_EXTERNAL_LINKS.map(createExternalLink)),
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

  document.querySelectorAll('[data-site-status-label]').forEach((element) => {
    element.textContent = SITE_STATUS.displayLabel;
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
