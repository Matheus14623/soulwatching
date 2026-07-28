import {
  PUBLICATION_CREDIT_ROLES,
  PUBLICATION_TYPES,
} from '../data/generated/runtime/publications.js';
import {
  isPublicPublicationIdentifier,
  publicationCanonicalHref,
  publicationHref,
  publicationRobots,
} from './publication-routing.js';

export {
  publicationCanonicalHref,
  publicationHref,
  publicationRobots,
} from './publication-routing.js';

export const PUBLICATION_AVAILABILITY = Object.freeze([
  Object.freeze({ id: 'published', label: 'Publicada' }),
  Object.freeze({ id: 'superseded', label: 'Substituída' }),
  Object.freeze({ id: 'withdrawn', label: 'Retirada' }),
  Object.freeze({ id: 'retracted', label: 'Retratada' }),
  Object.freeze({ id: 'archived', label: 'Arquivada' }),
]);

const typeById = new Map(PUBLICATION_TYPES.map((type) => [type.id, type]));
const roleById = new Map(PUBLICATION_CREDIT_ROLES.map((role) => [role.id, role]));
const availabilityById = new Map(PUBLICATION_AVAILABILITY.map((state) => [state.id, state]));
export function resolvePublication(publications, slugOrAlias) {
  const candidate = String(slugOrAlias || '').trim().toLowerCase();
  if (!isPublicPublicationIdentifier(candidate)) return null;
  return publications.find((publication) => (
    publication.slug === candidate || publication.aliases.includes(candidate)
  )) || null;
}

export function createPublicationView(publication) {
  if (!publication || typeof publication !== 'object') {
    throw new TypeError('Publicação ausente ou inválida.');
  }
  const credits = [...publication.credits].sort((left, right) => left.order - right.order);
  const authors = credits.filter((credit) => (
    credit.roles.includes('author') || credit.roles.includes('coauthor')
  ));
  const revisions = [...publication.revisions].sort((left, right) => left.ordinal - right.ordinal);
  const latestRevision = revisions[revisions.length - 1] || null;

  return Object.freeze({
    ...publication,
    href: publicationHref(publication.slug),
    typeLabel: typeById.get(publication.publicationType)?.label || publication.publicationType,
    availabilityLabel: availabilityById.get(publication.availabilityState)?.label
      || publication.availabilityState,
    originLabel: publication.authorshipOrigin === 'external'
      ? 'Contribuição externa'
      : 'Publicação do Observatório',
    credits: Object.freeze(credits.map((credit) => Object.freeze({
      ...credit,
      roleLabels: Object.freeze(credit.roles.map((role) => roleById.get(role)?.label || role)),
    }))),
    authors: Object.freeze(authors),
    revisions: Object.freeze(revisions),
    latestRevision,
  });
}
