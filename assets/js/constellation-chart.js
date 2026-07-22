const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NAMESPACE, tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
  return element;
}

function starRadius(magnitude) {
  return Math.max(1.25, Math.min(3.8, 3.45 - Number(magnitude) * 0.48));
}

function createLineGroup(constellation, starById, className = 'constellation-chart-lines') {
  const group = createSvgElement('g', { class: className });
  constellation.lines.forEach(([sourceId, targetId]) => {
    const source = starById.get(sourceId);
    const target = starById.get(targetId);
    if (!source || !target) return;
    group.append(createSvgElement('line', {
      x1: source.x,
      y1: source.y,
      x2: target.x,
      y2: target.y,
    }));
  });
  return group;
}

function createStarGroup(star, showLabels) {
  const group = createSvgElement('g', {
    class: `constellation-chart-star constellation-chart-star--${star.tone || 'white'} constellation-chart-star--${star.role || 'guide'}`,
    transform: `translate(${star.x} ${star.y})`,
  });
  const radius = starRadius(star.magnitude);
  group.append(
    createSvgElement('circle', { class: 'constellation-chart-star-halo', r: radius * 3.2 }),
    createSvgElement('circle', { class: 'constellation-chart-star-core', r: radius }),
  );

  if (showLabels && star.label) {
    const inferredAnchor = star.x > 68 ? 'end' : 'start';
    const label = createSvgElement('text', {
      class: 'constellation-chart-star-label',
      x: star.labelDx ?? (inferredAnchor === 'end' ? -4.5 : 4.5),
      y: star.labelDy ?? (star.y > 77 ? -4.5 : 5.5),
      'text-anchor': star.labelAnchor || inferredAnchor,
    });
    label.textContent = star.chartLabel || star.name;
    group.append(label);
  }

  const title = createSvgElement('title');
  const magnitudeLabel = star.combined ? 'magnitude combinada' : 'magnitude aparente';
  title.textContent = `${star.name}, ${star.designation}, ${magnitudeLabel} aproximada ${star.magnitude}${star.variable ? ', estrela variável' : ''}`;
  group.append(title);
  return group;
}

export function createConstellationChart(constellation, options = {}) {
  const showLabels = options.showLabels !== false;
  const svg = createSvgElement('svg', {
    class: `constellation-chart${options.compact ? ' constellation-chart--compact' : ''}`,
    viewBox: '-15 -10 130 130',
    preserveAspectRatio: 'xMidYMid meet',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  const starById = new Map(constellation.stars.map((star) => [star.id, star]));
  const starGroup = createSvgElement('g', { class: 'constellation-chart-stars' });
  constellation.stars.forEach((star) => starGroup.append(createStarGroup(star, showLabels)));
  svg.append(
    createLineGroup(constellation, starById, 'constellation-chart-lines constellation-chart-lines--glow'),
    createLineGroup(constellation, starById),
    starGroup,
  );
  return svg;
}
