import {
  bindRangeUpdates,
  createElement,
  createRangeField,
  createReading,
  createSvgElement,
} from './simulation-ui.js';

export function simulateFiniteRecurrence(size, multiplier, increment, start) {
  if (!Number.isInteger(size) || size < 1) throw new RangeError('O espaço de estados deve ser finito e positivo.');
  const seen = new Map();
  const sequence = [];
  let state = start;
  while (!seen.has(state)) {
    seen.set(state, sequence.length);
    sequence.push(state);
    state = ((multiplier * state) + increment) % size;
  }
  const cycleStart = seen.get(state);
  return {
    sequence,
    repeatedState: state,
    cycleStart,
    transient: sequence.slice(0, cycleStart),
    cycle: sequence.slice(cycleStart),
  };
}

function createStateDiagram(size, result) {
  const visitedLabel = result.sequence.length === 1 ? '1 estado foi visitado' : `${result.sequence.length} estados foram visitados`;
  const cycleLabel = result.cycle.length === 1 ? '1 estado' : `${result.cycle.length} estados`;
  const svg = createSvgElement('svg', {
    viewBox: '0 0 600 600',
    class: 'recurrence-svg',
    role: 'img',
    'aria-label': `Diagrama de ${size} estados. ${visitedLabel} e o ciclo tem ${cycleLabel}.`,
  });
  const defs = createSvgElement('defs');
  const marker = createSvgElement('marker', {
    id: 'recurrence-arrowhead',
    markerWidth: 8,
    markerHeight: 8,
    refX: 6,
    refY: 3,
    orient: 'auto',
    markerUnits: 'strokeWidth',
  });
  marker.append(createSvgElement('path', { d: 'M0,0 L0,6 L7,3 z', fill: 'rgba(114,236,255,0.55)' }));
  defs.append(marker);
  svg.append(defs);
  const radius = 225;
  const nodes = Array.from({ length: size }, (_, index) => {
    const angle = ((Math.PI * 2 * index) / size) - (Math.PI / 2);
    return {
      id: index,
      x: 300 + (Math.cos(angle) * radius),
      y: 300 + (Math.sin(angle) * radius),
    };
  });
  const cycleSet = new Set(result.cycle);
  const transitions = result.sequence.map((state, index) => ({
    from: state,
    to: index === result.sequence.length - 1 ? result.repeatedState : result.sequence[index + 1],
  }));
  transitions.forEach(({ from, to }) => {
    const start = nodes[from];
    const end = nodes[to];
    if (from === to) {
      svg.append(createSvgElement('path', {
        d: `M ${start.x - 8} ${start.y - 11} C ${start.x - 34} ${start.y - 54}, ${start.x + 34} ${start.y - 54}, ${start.x + 8} ${start.y - 11}`,
        class: 'recurrence-arrow',
        'marker-end': 'url(#recurrence-arrowhead)',
      }));
      return;
    }
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy) || 1;
    const inset = Math.min(18, 9 + (100 / size));
    svg.append(createSvgElement('line', {
      x1: start.x + ((dx / distance) * inset),
      y1: start.y + ((dy / distance) * inset),
      x2: end.x - ((dx / distance) * inset),
      y2: end.y - ((dy / distance) * inset),
      class: 'recurrence-arrow',
      'marker-end': 'url(#recurrence-arrowhead)',
    }));
  });
  const visitedSet = new Set(result.sequence);
  nodes.forEach((node) => {
    const circle = createSvgElement('circle', {
      cx: node.x,
      cy: node.y,
      r: Math.max(8, 15 - (size * 0.25)),
      class: 'recurrence-node',
      'data-visited': String(visitedSet.has(node.id)),
      'data-cycle': String(cycleSet.has(node.id)),
    });
    svg.append(circle);
    if (size <= 16) {
      const label = createSvgElement('text', {
        x: node.x,
        y: node.y + 4,
        'text-anchor': 'middle',
        class: 'recurrence-label',
      });
      label.textContent = String(node.id);
      svg.append(label);
    }
  });
  return svg;
}

export function mountSimulation(root, { announce }) {
  const layout = createElement('div', 'simulation-layout');
  const controls = createElement('div', 'simulation-controls');
  controls.append(
    createElement('p', 'simulation-overline', 'SISTEMA FINITO DETERMINÍSTICO'),
    createElement('h3', '', 'Defina a regra de transição'),
    createElement('p', '', 'A cada passo, o próximo estado é (a × estado + b) módulo N. Mesma entrada e mesma regra sempre produzem a mesma saída.'),
  );
  const size = createRangeField({ id: 'recurrence-size', label: 'Número de estados N', min: 4, max: 24, step: 1, value: 12, format: (value) => `${value} estados` });
  const multiplier = createRangeField({ id: 'recurrence-a', label: 'Multiplicador a', min: 0, max: 11, step: 1, value: 5, format: (value) => String(value) });
  const increment = createRangeField({ id: 'recurrence-b', label: 'Incremento b', min: 0, max: 11, step: 1, value: 1, format: (value) => String(value) });
  const start = createRangeField({ id: 'recurrence-start', label: 'Estado inicial', min: 0, max: 11, step: 1, value: 0, format: (value) => String(value) });
  const fields = [size, multiplier, increment, start];
  controls.append(...fields.map((field) => field.field));

  const main = createElement('div', 'simulation-main');
  const visual = createElement('div', 'simulation-visual');
  const results = createElement('div', 'simulation-result-panel');
  const visited = createReading('Estados visitados');
  const transient = createReading('Transiente');
  const cycle = createReading('Ciclo');
  const sequenceReading = createReading('Sequência até a repetição');
  sequenceReading.reading.classList.add('simulation-result-wide');
  const sequence = createElement('div', 'recurrence-sequence');
  sequenceReading.reading.insertBefore(sequence, sequenceReading.description);
  results.append(visited.reading, transient.reading, cycle.reading, sequenceReading.reading);
  main.append(visual, results);
  layout.append(controls, main);
  root.replaceChildren(layout);

  function updateLimits() {
    const maximum = Number(size.input.value) - 1;
    [multiplier, increment, start].forEach((field) => {
      field.input.max = String(maximum);
      if (Number(field.input.value) > maximum) field.input.value = String(maximum);
    });
  }

  function update({ shouldAnnounce = false } = {}) {
    updateLimits();
    fields.forEach((field) => field.refresh());
    const result = simulateFiniteRecurrence(
      Number(size.input.value),
      Number(multiplier.input.value),
      Number(increment.input.value),
      Number(start.input.value),
    );
    visual.replaceChildren(createStateDiagram(Number(size.input.value), result));
    visited.value.textContent = `${result.sequence.length} de ${size.input.value}`;
    visited.description.textContent = result.sequence.length === Number(size.input.value)
      ? 'A trajetória visitou todo o espaço antes de repetir.'
      : 'Alguns estados ficaram fora desta trajetória.';
    transient.value.textContent = `${result.transient.length} passo${result.transient.length === 1 ? '' : 's'}`;
    transient.description.textContent = result.transient.length ? 'Trecho anterior à entrada no ciclo.' : 'O estado inicial já pertence ao ciclo.';
    cycle.value.textContent = `${result.cycle.length} estado${result.cycle.length === 1 ? '' : 's'}`;
    cycle.description.textContent = `A repetição recomeça no estado ${result.repeatedState}.`;
    const sequenceItems = [];
    const cycleSet = new Set(result.cycle);
    [...result.sequence, result.repeatedState].forEach((stateValue, index) => {
      const item = createElement('span', 'recurrence-state', `${index ? '→ ' : ''}${stateValue}`);
      item.dataset.cycle = String(cycleSet.has(stateValue));
      sequenceItems.push(item);
    });
    sequenceReading.value.textContent = `${result.sequence.length + 1} posições registradas`;
    sequence.replaceChildren(...sequenceItems);
    sequenceReading.description.textContent = 'A última ocorrência repete um estado anterior; daí em diante a evolução fica presa no mesmo ciclo.';
    if (shouldAnnounce) {
      const cycleCount = `${result.cycle.length} estado${result.cycle.length === 1 ? '' : 's'}`;
      const transientCount = `${result.transient.length} passo${result.transient.length === 1 ? '' : 's'} transitório${result.transient.length === 1 ? '' : 's'}`;
      announce(`Ciclo encontrado com ${cycleCount} após ${transientCount}.`);
    }
  }

  const inputs = fields.map((field) => field.input);
  update();
  return bindRangeUpdates(inputs, update);
}
