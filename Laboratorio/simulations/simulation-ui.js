export function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
  return element;
}

export function createRangeField({ id, label, min, max, step, value, format, help = '' }) {
  const field = createElement('div', 'simulation-field');
  const heading = createElement('div', 'simulation-field-heading');
  const labelElement = createElement('label', '', label);
  labelElement.htmlFor = id;
  const output = createElement('output');
  output.htmlFor = id;
  output.id = `${id}-value`;
  const input = createElement('input');
  input.type = 'range';
  input.id = id;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  const refresh = () => {
    output.value = format ? format(Number(input.value)) : input.value;
    output.textContent = output.value;
    input.setAttribute('aria-valuetext', output.value);
  };
  refresh();
  heading.append(labelElement, output);
  field.append(heading, input);
  if (help) {
    const helpElement = createElement('small', '', help);
    helpElement.id = `${id}-help`;
    input.setAttribute('aria-describedby', helpElement.id);
    field.append(helpElement);
  }
  return { field, input, output, refresh };
}

export function bindRangeUpdates(inputs, update) {
  const controller = new AbortController();
  inputs.forEach((input) => {
    input.addEventListener('input', () => update(), { signal: controller.signal });
    input.addEventListener('change', () => update({ shouldAnnounce: true }), { signal: controller.signal });
  });
  return () => controller.abort();
}

export function createReading(label) {
  const reading = createElement('div', 'simulation-reading');
  const value = createElement('strong');
  const description = createElement('p');
  reading.append(createElement('span', '', label), value, description);
  return { reading, value, description };
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function formatDecimal(value, digits = 2) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: Math.min(1, digits),
  }).format(value);
}

export function formatScientific(value, digits = 2) {
  if (value === 0) return '0';
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const coefficient = value / (10 ** exponent);
  return `${formatDecimal(coefficient, digits)} × 10^${exponent}`;
}
