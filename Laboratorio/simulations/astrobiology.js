import {
  bindRangeUpdates,
  createElement,
  createRangeField,
  createReading,
  formatDecimal,
  formatScientific,
} from './simulation-ui.js';

const compactFormatter = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 2 });

function formatCount(value) {
  if (!Number.isFinite(value)) return 'fora da escala';
  if (value === 0) return '0';
  if (value < 0.01 || value >= 1e12) return formatScientific(value, 2);
  return compactFormatter.format(value);
}

function formatProbability(value) {
  if (value >= 0.0001) return `${formatDecimal(value * 100, value < 0.01 ? 3 : 1)}%`;
  return `${formatScientific(value * 100, 2)}%`;
}

export function calculateAstrobiologyScenario(worldCount, probabilities) {
  const validWorldCount = Math.max(0, Number(worldCount));
  const validProbabilities = probabilities.map((probability) => Math.min(1, Math.max(0, Number(probability))));
  const combinedProbability = validProbabilities.reduce((product, probability) => product * probability, 1);
  const expectedCount = validWorldCount * combinedProbability;
  const atLeastOneProbability = combinedProbability >= 1
    ? validWorldCount > 0 ? 1 : 0
    : -Math.expm1(validWorldCount * Math.log1p(-combinedProbability));
  return Object.freeze({ combinedProbability, expectedCount, atLeastOneProbability });
}

export function mountSimulation(root, { announce }) {
  const layout = createElement('div', 'simulation-layout');
  const controls = createElement('div', 'simulation-controls');
  controls.append(
    createElement('p', 'simulation-overline', 'CENÁRIO PROBABILÍSTICO'),
    createElement('h3', '', 'Escolha as probabilidades'),
    createElement('p', '', 'Os controles usam potências de dez porque as frequências reais podem atravessar muitas ordens de grandeza e ainda são profundamente incertas. As cinco etapas são condicionais: cada chance pressupõe que a etapa anterior ocorreu, e o produto segue a regra da cadeia.'),
  );
  const worlds = createRangeField({ id: 'astro-worlds', label: 'Mundos candidatos', min: 3, max: 12, step: 1, value: 8, format: (value) => `10^${value}` });
  const abiogenesis = createRangeField({ id: 'astro-life', label: 'Vida surgir, dado um mundo candidato', min: -12, max: 0, step: 1, value: -4, format: (value) => `10^${value}` });
  const complexity = createRangeField({ id: 'astro-complex', label: 'Vida complexa surgir, dado que há vida', min: -8, max: 0, step: 1, value: -2, format: (value) => `10^${value}` });
  const intelligence = createRangeField({ id: 'astro-intelligence', label: 'Tecnologia surgir, dada vida complexa', min: -8, max: 0, step: 1, value: -3, format: (value) => `10^${value}` });
  const detectable = createRangeField({ id: 'astro-detectable', label: 'Sinal ser detectável, dada tecnologia', min: -6, max: 0, step: 1, value: -2, format: (value) => `10^${value}` });
  const overlap = createRangeField({ id: 'astro-overlap', label: 'Coincidir conosco, dado um sinal detectável', min: -6, max: 0, step: 1, value: -2, format: (value) => `10^${value}` });
  const fields = [worlds, abiogenesis, complexity, intelligence, detectable, overlap];
  controls.append(...fields.map((field) => field.field));

  const main = createElement('div', 'simulation-main');
  const visual = createElement('div', 'simulation-visual');
  const cascade = createElement('div', 'astro-cascade');
  visual.append(cascade);
  const results = createElement('div', 'simulation-result-panel');
  const expected = createReading('Número esperado de sinais');
  const atLeastOne = createReading('Chance de ao menos um');
  const combined = createReading('Probabilidade combinada por mundo');
  const interpretation = createReading('Como interpretar');
  interpretation.reading.classList.add('simulation-result-wide');
  results.append(expected.reading, atLeastOne.reading, combined.reading, interpretation.reading);
  main.append(visual, results);
  layout.append(controls, main);
  root.replaceChildren(layout);

  function update({ shouldAnnounce = false } = {}) {
    fields.forEach((field) => field.refresh());
    const worldCount = 10 ** Number(worlds.input.value);
    const probabilities = fields.slice(1).map((field) => 10 ** Number(field.input.value));
    const labels = ['Mundos candidatos', 'Com vida', 'Com vida complexa', 'Com tecnologia', 'Com sinal detectável', 'Coincidentes no tempo'];
    const stages = [worldCount];
    probabilities.forEach((probability) => stages.push(stages[stages.length - 1] * probability));
    const {
      combinedProbability,
      expectedCount: lambda,
      atLeastOneProbability: chance,
    } = calculateAstrobiologyScenario(worldCount, probabilities);
    const maxLog = Math.max(1, Math.log10(worldCount + 1));
    cascade.replaceChildren(...stages.map((count, index) => {
      const row = createElement('div', 'astro-stage');
      const track = createElement('div', 'astro-stage-track');
      const bar = createElement('i');
      const width = Math.max(0.4, (Math.log10(count + 1) / maxLog) * 100);
      bar.style.width = `${width}%`;
      track.append(bar);
      row.append(createElement('span', '', labels[index]), track, createElement('strong', '', formatCount(count)));
      return row;
    }));
    expected.value.textContent = formatCount(lambda);
    expected.description.textContent = 'É uma média do cenário, não a contagem que necessariamente seria observada.';
    atLeastOne.value.textContent = formatProbability(chance);
    atLeastOne.description.textContent = 'Calculada supondo mundos independentes e probabilidades iguais.';
    combined.value.textContent = formatScientific(combinedProbability, 2);
    combined.description.textContent = 'Produto das cinco probabilidades condicionais pela regra da cadeia para um único mundo candidato.';
    interpretation.value.textContent = lambda >= 1 ? 'expectativa de ao menos um sinal' : 'expectativa abaixo de um sinal';
    interpretation.description.textContent = 'Mover uma etapa por uma ordem de grandeza multiplica ou divide a expectativa por dez. Isso revela sensibilidade às premissas, não quais premissas são verdadeiras.';
    if (shouldAnnounce) announce(`Número esperado ${formatCount(lambda)}. Chance de ao menos um ${formatProbability(chance)}.`);
  }

  const inputs = fields.map((field) => field.input);
  update();
  return bindRangeUpdates(inputs, update);
}
