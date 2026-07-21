import {
  NOTABLE_FIGURE_AREAS,
  NOTABLE_FIGURE_RELATION_TYPES,
  NOTABLE_FIGURES,
} from '../data/notable-figures.js?v=great-minds-v2';
import { getNotableFigureReferences } from '../data/notable-figure-references.js?v=great-minds-v2';
import { findTheory } from './theory-model.js';

const areaById = new Map(NOTABLE_FIGURE_AREAS.map((area) => [area.id, area]));
const relationTypeById = new Map(
  NOTABLE_FIGURE_RELATION_TYPES.map((relationType) => [relationType.id, relationType]),
);

export function normalizeNotableFigureText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function findNotableFigure(id, fallback = null) {
  return NOTABLE_FIGURES.find((figure) => figure.id === id || figure.slug === id) || fallback;
}

export function getNotableFigureArea(areaId) {
  return areaById.get(areaId) || areaById.get('todas');
}

export function getFeaturedNotableFigures() {
  return NOTABLE_FIGURES
    .filter((figure) => Number.isInteger(figure.featuredRank))
    .sort((a, b) => a.featuredRank - b.featuredRank);
}

export function getNotableFigureCount() {
  return NOTABLE_FIGURES.length;
}

export function filterNotableFigures({ area = 'todas', query = '' } = {}) {
  const term = normalizeNotableFigureText(query);

  return NOTABLE_FIGURES.filter((figure) => {
    if (area !== 'todas' && figure.area !== area) return false;
    if (!term) return true;

    const searchable = normalizeNotableFigureText([
      figure.name,
      figure.role,
      figure.summary,
      figure.impact,
      ...figure.milestones,
      ...figure.contributions.flatMap((item) => [item.title, item.description]),
    ].join(' '));

    return searchable.includes(term);
  });
}

export function resolveNotableFigure(figureOrId) {
  const figure = typeof figureOrId === 'string' ? findNotableFigure(figureOrId) : figureOrId;
  if (!figure) return null;

  return Object.freeze({
    ...figure,
    areaLabel: getNotableFigureArea(figure.area).label,
    references: Object.freeze(getNotableFigureReferences(figure.sourceIds)),
    theoryLinks: Object.freeze(figure.theoryLinks
      .map((link) => {
        const theory = findTheory(link.theoryId);
        const relationType = relationTypeById.get(link.relationType);
        if (!theory || !relationType) return null;
        return Object.freeze({
          ...link,
          relationLabel: relationType.label,
          theory,
        });
      })
      .filter(Boolean)),
  });
}
