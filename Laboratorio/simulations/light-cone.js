import {
  bindRangeUpdates,
  createElement,
  createRangeField,
  createReading,
  createSvgElement,
  formatDecimal,
} from './simulation-ui.js';

const extent = 8;
const center = 300;
const scale = 34;

function point(x, t) {
  return { x: center + (x * scale), y: center - (t * scale) };
}

function createLine(x1, t1, x2, t2, className) {
  const start = point(x1, t1);
  const end = point(x2, t2);
  return createSvgElement('line', {
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
    class: className,
  });
}

function createDiagram() {
  const svg = createSvgElement('svg', {
    viewBox: '0 0 600 600',
    role: 'img',
    'aria-labelledby': 'light-cone-svg-title light-cone-svg-description',
  });
  const title = createSvgElement('title', { id: 'light-cone-svg-title' });
  title.textContent = 'Diagrama de espaço-tempo em uma dimensão espacial';
  const description = createSvgElement('desc', { id: 'light-cone-svg-description' });
  description.textContent = 'O cone de luz permanece fixo enquanto os eixos do referencial em movimento mudam com a velocidade escolhida.';
  const grid = createSvgElement('g', { class: 'spacetime-grid', 'aria-hidden': 'true' });
  for (let value = -extent; value <= extent; value += 2) {
    grid.append(createLine(value, -extent, value, extent, ''));
    grid.append(createLine(-extent, value, extent, value, ''));
  }

  const upperZone = createSvgElement('path', {
    d: `M ${point(0, 0).x} ${point(0, 0).y} L ${point(-extent, extent).x} ${point(-extent, extent).y} L ${point(extent, extent).x} ${point(extent, extent).y} Z`,
    class: 'spacetime-zone',
    'aria-hidden': 'true',
  });
  const lowerZone = createSvgElement('path', {
    d: `M ${point(0, 0).x} ${point(0, 0).y} L ${point(-extent, -extent).x} ${point(-extent, -extent).y} L ${point(extent, -extent).x} ${point(extent, -extent).y} Z`,
    class: 'spacetime-zone',
    'aria-hidden': 'true',
  });

  const timePrime = createLine(0, -extent, 0, extent, 'spacetime-prime-axis');
  const spacePrime = createLine(-extent, 0, extent, 0, 'spacetime-prime-axis');
  const event = createSvgElement('circle', { r: 7, class: 'spacetime-event' });
  const origin = createSvgElement('circle', { cx: center, cy: center, r: 4, class: 'spacetime-origin' });
  const timeLabel = createSvgElement('text', { x: 310, y: 24, class: 'spacetime-label' });
  timeLabel.textContent = 'ct';
  const spaceLabel = createSvgElement('text', { x: 570, y: 290, class: 'spacetime-label' });
  spaceLabel.textContent = 'x';
  const primeLabel = createSvgElement('text', { x: 320, y: 48, class: 'spacetime-label' });
  primeLabel.textContent = "eixos x′, ct′";

  svg.append(
    title,
    description,
    upperZone,
    lowerZone,
    grid,
    createLine(-extent, 0, extent, 0, 'spacetime-axis'),
    createLine(0, -extent, 0, extent, 'spacetime-axis'),
    createLine(-extent, -extent, extent, extent, 'spacetime-light'),
    createLine(-extent, extent, extent, -extent, 'spacetime-light'),
    timePrime,
    spacePrime,
    origin,
    event,
    timeLabel,
    spaceLabel,
    primeLabel,
  );
  return { svg, event, timePrime, spacePrime };
}

function separationLabel(interval) {
  if (Math.abs(interval) < 0.05) return 'tipo luz';
  return interval > 0 ? 'tipo tempo' : 'tipo espaço';
}

export function calculateLorentzEvent({ velocity, x, t }) {
  if (!Number.isFinite(velocity) || Math.abs(velocity) >= 1) {
    throw new RangeError('A velocidade relativa deve satisfazer |v| < 1.');
  }
  const gamma = 1 / Math.sqrt(1 - (velocity ** 2));
  const primeT = gamma * (t - (velocity * x));
  const primeX = gamma * (x - (velocity * t));
  const interval = (t ** 2) - (x ** 2);
  const primeInterval = (primeT ** 2) - (primeX ** 2);
  return Object.freeze({ gamma, primeT, primeX, interval, primeInterval });
}

export function mountSimulation(root, { announce }) {
  const layout = createElement('div', 'simulation-layout');
  const controls = createElement('div', 'simulation-controls');
  controls.append(
    createElement('p', 'simulation-overline', 'REFERENCIAL S′ EM MOVIMENTO'),
    createElement('h3', '', 'Coordenadas e velocidade'),
    createElement('p', '', 'Use unidades em que a velocidade da luz c vale 1. O evento A permanece na origem; você move o evento B.'),
  );

  const velocity = createRangeField({
    id: 'light-cone-velocity',
    label: 'Velocidade relativa v',
    min: -0.8,
    max: 0.8,
    step: 0.05,
    value: 0.45,
    format: (value) => `${formatDecimal(value, 2)} c`,
    help: 'A transformação aceita apenas |v| < c.',
  });
  const eventX = createRangeField({
    id: 'light-cone-x',
    label: 'Posição do evento B',
    min: -7,
    max: 7,
    step: 0.25,
    value: 3,
    format: (value) => `x = ${formatDecimal(value, 2)}`,
  });
  const eventT = createRangeField({
    id: 'light-cone-t',
    label: 'Tempo do evento B',
    min: -7,
    max: 7,
    step: 0.25,
    value: 5,
    format: (value) => `ct = ${formatDecimal(value, 2)}`,
  });
  controls.append(velocity.field, eventX.field, eventT.field);

  const main = createElement('div', 'simulation-main');
  const visual = createElement('div', 'simulation-visual');
  const diagram = createDiagram();
  visual.append(diagram.svg);
  const results = createElement('div', 'simulation-result-panel');
  const gammaReading = createReading('Fator de Lorentz γ');
  const transformedReading = createReading('Evento B em S′');
  const intervalReading = createReading('Intervalo s² = t² − x²');
  const interpretation = createReading('Leitura causal');
  interpretation.reading.classList.add('simulation-result-wide');
  results.append(
    gammaReading.reading,
    transformedReading.reading,
    intervalReading.reading,
    interpretation.reading,
  );
  main.append(visual, results);
  layout.append(controls, main);
  root.replaceChildren(layout);

  function update({ shouldAnnounce = false } = {}) {
    [velocity, eventX, eventT].forEach((field) => field.refresh());
    const v = Number(velocity.input.value);
    const x = Number(eventX.input.value);
    const t = Number(eventT.input.value);
    const { gamma, primeT, primeX, interval } = calculateLorentzEvent({ velocity: v, x, t });
    const label = separationLabel(interval);
    const eventPoint = point(x, t);
    diagram.event.setAttribute('cx', String(eventPoint.x));
    diagram.event.setAttribute('cy', String(eventPoint.y));
    const timeStart = point(-v * extent, -extent);
    const timeEnd = point(v * extent, extent);
    diagram.timePrime.setAttribute('x1', String(timeStart.x));
    diagram.timePrime.setAttribute('y1', String(timeStart.y));
    diagram.timePrime.setAttribute('x2', String(timeEnd.x));
    diagram.timePrime.setAttribute('y2', String(timeEnd.y));
    const spaceStart = point(-extent, -v * extent);
    const spaceEnd = point(extent, v * extent);
    diagram.spacePrime.setAttribute('x1', String(spaceStart.x));
    diagram.spacePrime.setAttribute('y1', String(spaceStart.y));
    diagram.spacePrime.setAttribute('x2', String(spaceEnd.x));
    diagram.spacePrime.setAttribute('y2', String(spaceEnd.y));

    gammaReading.value.textContent = formatDecimal(gamma, 3);
    gammaReading.description.textContent = `Para v = ${formatDecimal(v, 2)} c.`;
    transformedReading.value.textContent = `x′ ${formatDecimal(primeX, 2)} · ct′ ${formatDecimal(primeT, 2)}`;
    transformedReading.description.textContent = 'As duas coordenadas mudam juntas.';
    intervalReading.value.textContent = formatDecimal(interval, 2);
    intervalReading.description.textContent = `${label}; o mesmo valor resulta em S e S′.`;
    interpretation.value.textContent = label;
    if (label === 'tipo tempo') {
      interpretation.description.textContent = 'Os eventos podem ter ligação causal subluminal e sua ordem temporal é preservada entre referenciais inerciais.';
    } else if (label === 'tipo luz') {
      interpretation.description.textContent = 'Os eventos podem ser ligados por luz; a borda do cone é preservada pela transformação.';
    } else {
      interpretation.description.textContent = 'Nenhum sinal à velocidade da luz ou abaixo dela conecta os eventos; sua ordem temporal pode variar entre referenciais.';
    }
    if (shouldAnnounce) announce(`Separação ${label}. Intervalo ${formatDecimal(interval, 2)}.`);
  }

  const inputs = [velocity.input, eventX.input, eventT.input];
  update();
  return bindRangeUpdates(inputs, update);
}
