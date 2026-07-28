const publicIdentifierPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertPublicIdentifier(slug) {
  const value = String(slug || '');
  if (!publicIdentifierPattern.test(value)) {
    throw new TypeError('Slug de publicação inválido.');
  }
  return value;
}

export function publicationHref(slug) {
  return `/Arquivo/publicacoes/${encodeURIComponent(assertPublicIdentifier(slug))}.html`;
}

export function publicationCanonicalHref(slug) {
  return `/Arquivo/publicacoes/${encodeURIComponent(assertPublicIdentifier(slug))}`;
}

export function publicationRobots(availabilityState) {
  return availabilityState === 'withdrawn'
    ? 'noindex, follow'
    : 'index, follow';
}

export function isPublicPublicationIdentifier(value) {
  return publicIdentifierPattern.test(String(value || ''));
}
