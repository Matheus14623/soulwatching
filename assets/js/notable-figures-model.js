import {
  NOTABLE_FIGURE_AREAS,
  NOTABLE_FIGURE_TRAILS,
  NOTABLE_FIGURE_RELATION_TYPES,
  NOTABLE_FIGURES,
  NOTABLE_METHOD_TIMELINE,
  NOTABLE_METHOD_TIMELINE_CATEGORIES,
} from '../data/generated/runtime/notable-figures.js';
import { getNotableFigureReferences } from './reference-model.js';
import { findTheory } from './theory-model.js';
import { getRelationReviewPresentation } from './relation-review.js';

const areaById = new Map(NOTABLE_FIGURE_AREAS.map((area) => [area.id, area]));
const relationTypeById = new Map(
  NOTABLE_FIGURE_RELATION_TYPES.map((relationType) => [relationType.id, relationType]),
);
const trailById = new Map(NOTABLE_FIGURE_TRAILS.map((trail) => [trail.id, trail]));
const timelineCategoryById = new Map(
  NOTABLE_METHOD_TIMELINE_CATEGORIES.map((category) => [category.id, category]),
);

export function normalizeNotableFigureText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function findNotableFigure(id, fallback = null) {
  return NOTABLE_FIGURES.find((figure) => (
    figure.id === id
    || figure.slug === id
    || figure.aliases?.includes(id)
  )) || fallback;
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
        const review = getRelationReviewPresentation(link);
        return Object.freeze({
          ...link,
          relationLabel: relationType.label,
          reviewLabel: review.label,
          reviewDisclosure: review.disclosure,
          reviewPending: review.pending,
          theory,
        });
      })
      .filter(Boolean)),
  });
}

export function getNotableFigureTrails() {
  return NOTABLE_FIGURE_TRAILS.map(resolveNotableFigureTrail).filter(Boolean);
}

export function findNotableFigureTrail(id, fallback = null) {
  return trailById.get(id) || fallback;
}

export function resolveNotableFigureTrail(trailOrId) {
  const trail = typeof trailOrId === 'string' ? findNotableFigureTrail(trailOrId) : trailOrId;
  if (!trail) return null;

  return Object.freeze({
    ...trail,
    steps: Object.freeze(trail.steps
      .map((step) => {
        const figure = resolveNotableFigure(step.figureId);
        if (!figure) return null;
        return Object.freeze({ ...step, figure });
      })
      .filter(Boolean)),
  });
}

export function getNotableMethodTimelineCategories() {
  return NOTABLE_METHOD_TIMELINE_CATEGORIES;
}

export function getNotableMethodTimeline(category = 'todas') {
  const selectedCategory = timelineCategoryById.has(category) ? category : 'todas';

  return NOTABLE_METHOD_TIMELINE
    .filter((event) => selectedCategory === 'todas' || event.category === selectedCategory)
    .map((event) => Object.freeze({
      ...event,
      categoryLabel: timelineCategoryById.get(event.category)?.label || event.category,
      figures: Object.freeze(event.figureIds.map((figureId) => resolveNotableFigure(figureId)).filter(Boolean)),
    }));
}

export function compareNotableFigures(leftOrId, rightOrId) {
  const left = resolveNotableFigure(leftOrId);
  const right = resolveNotableFigure(rightOrId);
  if (!left || !right) return null;

  const rightLinksByTheoryId = new Map(right.theoryLinks.map((link) => [link.theory.id, link]));
  const sharedTheoryLinks = left.theoryLinks
    .map((leftLink) => {
      const rightLink = rightLinksByTheoryId.get(leftLink.theory.id);
      if (!rightLink) return null;
      return Object.freeze({ theory: leftLink.theory, leftLink, rightLink });
    })
    .filter(Boolean);

  return Object.freeze({
    left,
    right,
    sharedTheoryLinks: Object.freeze(sharedTheoryLinks),
  });
}
