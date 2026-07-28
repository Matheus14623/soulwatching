import {
  CONSTELLATIONS,
  CONSTELLATION_REFERENCES,
} from '../data/generated/runtime/constellations.js';

export const CONSTELLATION_SEASONS = Object.freeze([
  Object.freeze({ id: 'all', label: 'Todas' }),
  Object.freeze({ id: 'verao', label: 'Verão' }),
  Object.freeze({ id: 'outono', label: 'Outono' }),
  Object.freeze({ id: 'inverno', label: 'Inverno' }),
  Object.freeze({ id: 'primavera', label: 'Primavera' }),
]);

const constellationById = new Map(
  CONSTELLATIONS.flatMap((constellation) => [
    [constellation.id, constellation],
    [constellation.slug, constellation],
    [constellation.abbreviation.toLowerCase(), constellation],
    ...(constellation.aliases || []).map((alias) => [alias.toLowerCase(), constellation]),
  ]),
);

export function normalizeConstellationSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

function constellationSearchText(constellation) {
  return normalizeConstellationSearch([
    constellation.name,
    constellation.latinName,
    constellation.abbreviation,
    constellation.signature,
    constellation.season,
    constellation.recognition,
    ...constellation.stars.flatMap((star) => [star.name, star.designation]),
  ].join(' '));
}

const searchableConstellations = new Map(
  CONSTELLATIONS.map((constellation) => [constellation.id, constellationSearchText(constellation)]),
);

export function findConstellation(id, fallback = null) {
  return constellationById.get(String(id || '').toLowerCase()) || fallback;
}

export function getConstellationCount() {
  return CONSTELLATIONS.length;
}

export function getFeaturedConstellations() {
  return CONSTELLATIONS
    .filter((constellation) => Number.isInteger(constellation.featuredRank))
    .sort((a, b) => a.featuredRank - b.featuredRank);
}

export function filterConstellations({ query = '', seasonId = 'all' } = {}) {
  const normalizedQuery = normalizeConstellationSearch(query);
  return CONSTELLATIONS.filter((constellation) => {
    const matchesSeason = seasonId === 'all' || constellation.seasonId === seasonId;
    const matchesQuery = !normalizedQuery || searchableConstellations.get(constellation.id)?.includes(normalizedQuery);
    return matchesSeason && matchesQuery;
  });
}

export function getConstellationSources(constellation) {
  return constellation.sourceIds
    .map((sourceId) => CONSTELLATION_REFERENCES[sourceId])
    .filter(Boolean);
}

export function getBrightestStar(constellation) {
  if (!constellation?.stars?.length) return null;
  return constellation.stars.reduce((brightest, star) => (
    Number(star.magnitude) < Number(brightest.magnitude) ? star : brightest
  ));
}

export function getConstellationIndex(id, collection = CONSTELLATIONS) {
  const constellation = findConstellation(id);
  return constellation ? collection.findIndex((candidate) => candidate.id === constellation.id) : -1;
}

export function getAdjacentConstellation(id, direction = 1, collection = CONSTELLATIONS) {
  const index = getConstellationIndex(id, collection);
  if (index < 0 || !collection.length) return null;
  const normalizedDirection = direction < 0 ? -1 : 1;
  const nextIndex = (index + normalizedDirection + collection.length) % collection.length;
  return collection[nextIndex];
}
