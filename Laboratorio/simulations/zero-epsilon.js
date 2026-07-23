import {
  bindRangeUpdates,
  clamp,
  createElement,
  createRangeField,
  createReading,
  formatDecimal,
} from './simulation-ui.js';

export function calculateEpsilonScore({
  chance,
  benefit,
  cost,
  downside,
  learning,
  reversibility,
  costLimit = Number.POSITIVE_INFINITY,
  residualDownsideLimit = Number.POSITIVE_INFINITY,
}) {
  const probability = clamp(chance, 0, 1);
  const reversibleShare = clamp(reversibility, 0, 1);
  const residualDownside = downside * (1 - reversibleShare);
  const score = (probability * benefit) - ((1 - probability) * residualDownside) - cost + learning;
  const normalizedCostLimit = Number.isFinite(costLimit)
    ? Math.max(0, costLimit)
    : Number.POSITIVE_INFINITY;
  const normalizedResidualDownsideLimit = Number.isFinite(residualDownsideLimit)
    ? Math.max(0, residualDownsideLimit)
    : Number.POSITIVE_INFINITY;
  const stopReasons = [];
  if (cost > normalizedCostLimit) stopReasons.push('cost');
  if (residualDownside > normalizedResidualDownsideLimit) stopReasons.push('residual-downside');
  return Object.freeze({
    score,
    residualDownside,
    costLimit: normalizedCostLimit,
    residualDownsideLimit: normalizedResidualDownsideLimit,
    stopTriggered: stopReasons.length > 0,
    stopReasons: Object.freeze(stopReasons),
  });
}

export function mountSimulation(root, { announce }) {
  const layout = createElement('div', 'simulation-layout');
  const controls = createElement('div', 'simulation-controls');
  controls.append(
    createElement('p', 'simulation-overline', 'HEURÍSTICA DE TESTE LIMITADO'),
    createElement('h3', '', 'Descreva o pequeno experimento'),
    createElement('p', '', 'Os pontos abaixo são uma escala comparativa criada por você. Eles não medem valor objetivo nem substituem decisão profissional.'),
  );
  const decisionFields = [
    createRangeField({ id: 'epsilon-chance', label: 'Chance de resultado favorável', min: 0, max: 100, step: 1, value: 45, format: (value) => `${value}%` }),
    createRangeField({ id: 'epsilon-benefit', label: 'Benefício se funcionar', min: 0, max: 100, step: 1, value: 65, format: (value) => `${value} pts` }),
    createRangeField({ id: 'epsilon-cost', label: 'Custo certo do teste', min: 0, max: 100, step: 1, value: 18, format: (value) => `${value} pts` }),
    createRangeField({ id: 'epsilon-downside', label: 'Dano se não funcionar', min: 0, max: 100, step: 1, value: 28, format: (value) => `${value} pts` }),
    createRangeField({ id: 'epsilon-learning', label: 'Valor da informação obtida', min: 0, max: 100, step: 1, value: 35, format: (value) => `${value} pts` }),
    createRangeField({ id: 'epsilon-reversible', label: 'Reversibilidade e limite de perda', min: 0, max: 100, step: 1, value: 80, format: (value) => `${value}%` }),
  ];
  const limitFields = [
    createRangeField({
      id: 'epsilon-cost-limit',
      label: 'Teto de custo antes da parada',
      min: 0,
      max: 100,
      step: 1,
      value: 30,
      format: (value) => `${value} pts`,
      help: 'Se o custo estimado ou observado ultrapassar este teto, o modelo marca o teste para interrupção.',
    }),
    createRangeField({
      id: 'epsilon-loss-limit',
      label: 'Teto de dano residual antes da parada',
      min: 0,
      max: 100,
      step: 1,
      value: 15,
      format: (value) => `${value} pts`,
      help: 'Se o dano após o desconto de reversibilidade ultrapassar este teto, o modelo marca o teste para interrupção.',
    }),
  ];
  const fields = [...decisionFields, ...limitFields];
  controls.append(
    ...decisionFields.map((field) => field.field),
    createElement('p', 'simulation-overline', 'CRITÉRIOS DE PARADA'),
    createElement('p', '', 'Os tetos são restrições independentes do saldo. Ultrapassar qualquer um deles interrompe a leitura favorável, mesmo quando o saldo calculado permanece positivo.'),
    ...limitFields.map((field) => field.field),
  );

  const main = createElement('div', 'simulation-main');
  const visual = createElement('div', 'simulation-visual');
  visual.setAttribute('aria-hidden', 'true');
  const scale = createElement('div', 'decision-scale');
  const zero = createElement('span', 'decision-zero');
  const marker = createElement('span', 'decision-marker', 'ε');
  const loss = createElement('span', 'decision-label', 'saldo negativo');
  const gain = createElement('span', 'decision-label', 'saldo positivo');
  scale.append(zero, marker, loss, gain);
  visual.append(scale);
  const results = createElement('div', 'simulation-result-panel');
  const expected = createReading('Saldo heurístico do epsilon');
  const exposure = createReading('Exposição residual ao dano');
  const stopStatus = createReading('Critérios de parada');
  const signal = createReading('Sinal para investigação');
  const explanation = createReading('Como o cálculo foi feito');
  signal.reading.classList.add('simulation-result-wide');
  explanation.reading.classList.add('simulation-result-wide');
  results.append(
    expected.reading,
    exposure.reading,
    stopStatus.reading,
    signal.reading,
    explanation.reading,
  );
  main.append(visual, results);
  layout.append(controls, main);
  root.replaceChildren(layout);

  function update({ shouldAnnounce = false } = {}) {
    fields.forEach((field) => field.refresh());
    const [
      chanceField,
      benefitField,
      costField,
      downsideField,
      learningField,
      reversibleField,
      costLimitField,
      residualDownsideLimitField,
    ] = fields;
    const chance = Number(chanceField.input.value) / 100;
    const benefit = Number(benefitField.input.value);
    const cost = Number(costField.input.value);
    const downside = Number(downsideField.input.value);
    const learning = Number(learningField.input.value);
    const reversible = Number(reversibleField.input.value) / 100;
    const costLimit = Number(costLimitField.input.value);
    const residualDownsideLimit = Number(residualDownsideLimitField.input.value);
    const {
      score,
      residualDownside,
      stopTriggered,
      stopReasons,
    } = calculateEpsilonScore({
      chance,
      benefit,
      cost,
      downside,
      learning,
      reversibility: reversible,
      costLimit,
      residualDownsideLimit,
    });
    const normalized = clamp(score, -200, 200);
    marker.style.left = `${50 + ((normalized / 200) * 38)}%`;
    marker.textContent = score >= 0 ? '+ε' : '−ε';
    expected.value.textContent = `${score >= 0 ? '+' : ''}${formatDecimal(score, 1)} pts`;
    expected.description.textContent = 'A escolha Zero permanece como referência de saldo 0.';
    exposure.value.textContent = `${formatDecimal(residualDownside, 1)} pts`;
    exposure.description.textContent = 'Dano informado após o desconto de reversibilidade.';
    const stopLabels = [];
    if (stopReasons.includes('cost')) stopLabels.push(`custo acima de ${formatDecimal(costLimit, 1)} pts`);
    if (stopReasons.includes('residual-downside')) stopLabels.push(`dano residual acima de ${formatDecimal(residualDownsideLimit, 1)} pts`);
    stopStatus.value.textContent = stopTriggered ? 'parada acionada' : 'dentro dos dois tetos';
    stopStatus.description.textContent = stopTriggered
      ? `Restrição excedida: ${stopLabels.join(' e ')}.`
      : `Custo até ${formatDecimal(costLimit, 1)} pts e dano residual até ${formatDecimal(residualDownsideLimit, 1)} pts.`;
    const label = stopTriggered
      ? 'restrição de parada tem prioridade'
      : score > 0
        ? 'saldo heurístico positivo dentro dos limites'
        : score < 0
          ? 'saldo heurístico negativo dentro dos limites'
          : 'saldo heurístico neutro dentro dos limites';
    signal.value.textContent = label;
    signal.description.textContent = stopTriggered
      ? 'O modelo marca interrupção porque uma restrição escolhida foi ultrapassada. O saldo permanece visível apenas para auditoria.'
      : score > 0
        ? 'Neste conjunto de pontos, o pequeno teste supera a referência Zero. Isso não transforma o indicador em recomendação.'
        : score < 0
          ? 'Neste conjunto de pontos, a referência Zero tem saldo maior. Revise estimativas, alternativas e vieses.'
          : 'As parcelas informadas se compensam exatamente nesta escala.';
    explanation.value.textContent = 'p×benefício − (1−p)×dano residual − custo + aprendizado';
    explanation.description.textContent = 'Os termos estão em uma escala comum escolhida pelo visitante; misturar unidades incompatíveis torna o saldo sem sentido. Os tetos não alteram a fórmula: funcionam como restrições de parada.';
    if (shouldAnnounce) {
      announce(`Saldo heurístico ${formatDecimal(score, 1)} pontos. ${stopTriggered ? `Parada acionada por ${stopLabels.join(' e ')}.` : `${label}.`}`);
    }
  }

  const inputs = fields.map((field) => field.input);
  update();
  return bindRangeUpdates(inputs, update);
}
