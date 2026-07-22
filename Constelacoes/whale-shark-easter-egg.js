import { prefersReducedMotion } from '../assets/js/utils.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const BODY_GUIDES = [
  'M151 151 C207 115 291 98 382 103 C452 107 510 119 543 139 C558 148 566 156 566 165 C566 178 554 190 534 201 C488 225 419 231 344 227 C273 223 213 207 154 186',
  'M302 101 C310 78 325 57 340 48 C344 65 341 84 337 101',
  'M205 121 C212 106 221 96 230 92 C232 104 229 113 225 118',
  'M534 166 C546 163 558 163 566 165 C557 172 546 177 532 178',
  'M459 143 C389 130 302 131 205 151',
  'M463 163 C376 150 286 153 192 170',
  'M448 182 C365 174 284 179 205 193',
  'M506 156 Q501 170 507 182',
  'M497 154 Q491 170 499 187',
  'M488 153 Q481 170 489 190',
  'M478 152 Q470 169 480 192',
  'M468 152 Q459 168 470 192',
  'M251 126 Q245 156 254 188',
  'M302 112 Q296 151 307 183',
  'M353 106 Q347 151 357 184',
  'M404 109 Q399 154 409 190',
  'M455 119 Q451 158 461 198',
];

const TAIL_GUIDES = [
  'M151 151 C144 157 139 163 135 169 C142 177 148 182 154 186',
  'M135 169 C111 143 91 104 78 61 C74 47 82 40 91 51 C119 84 139 120 151 151',
  'M135 169 C118 188 104 216 96 250 C92 264 101 268 111 257 C134 232 148 208 154 186',
];

const FIN_GUIDES = [
  'M452 202 C438 232 410 260 369 275 C371 246 386 222 408 213',
  'M303 222 C290 239 273 250 254 254 C259 238 268 227 278 220',
];

const BODY_STARS = [
  [151, 151], [205, 121], [258, 108], [315, 102], [382, 103],
  [439, 108], [486, 117], [526, 129], [550, 144], [566, 165],
  [554, 186], [534, 201], [488, 218], [431, 228], [372, 229],
  [313, 225], [257, 216], [209, 204], [154, 186], [521, 148],
  [302, 101], [340, 48], [337, 101], [205, 121], [230, 92], [225, 118],
];

const TAIL_STARS = [
  [135, 169], [138, 121], [121, 90], [102, 62], [87, 45],
  [93, 106], [112, 145], [118, 194], [104, 226], [98, 259], [135, 220],
];

const FIN_STARS = [
  [452, 202], [408, 213], [369, 275], [303, 222], [278, 220], [254, 254],
];

const BODY_SPOTS = [
  [212, 137], [246, 128], [281, 120], [317, 115], [353, 113],
  [389, 115], [425, 120], [459, 127], [489, 136], [516, 145],
  [225, 154], [259, 146], [294, 139], [329, 136], [365, 137],
  [401, 140], [436, 146], [468, 154], [499, 162], [526, 170],
  [211, 174], [247, 168], [282, 162], [318, 158], [354, 159],
  [390, 163], [425, 169], [458, 176], [490, 183], [518, 189],
  [227, 192], [264, 187], [300, 183], [337, 183], [374, 187],
  [411, 192], [447, 198], [480, 202], [316, 91], [325, 75], [336, 59],
];

const TAIL_SPOTS = [
  [102, 84], [116, 112], [127, 139], [103, 238],
];

const FIN_SPOTS = [
  [405, 228], [392, 244], [381, 260],
];

const HIT_AREAS = [
  'M151 151 C207 115 291 98 382 103 C452 107 510 119 543 139 C558 148 566 156 566 165 C566 178 554 190 534 201 C488 225 419 231 344 227 C273 223 213 207 154 186 C147 177 146 160 151 151 Z',
  'M135 169 C111 143 91 104 78 61 C74 47 82 40 91 51 C119 84 139 120 151 151 C144 157 139 163 135 169 Z',
  'M135 169 C118 188 104 216 96 250 C92 264 101 268 111 257 C134 232 148 208 154 186 C148 182 142 177 135 169 Z',
  'M302 101 C310 78 325 57 340 48 C344 65 341 84 337 101 Z',
  'M205 121 C212 106 221 96 230 92 C232 104 229 113 225 118 Z',
  'M452 202 C438 232 410 260 369 275 C371 246 386 222 408 213 Z',
  'M303 222 C290 239 273 250 254 254 C259 238 268 227 278 220 Z',
];

function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NAMESPACE, tag);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
  return element;
}

function createGuideLayer(paths, className) {
  const group = createSvgElement('g', { class: className });
  paths.forEach((pathData) => {
    group.append(createSvgElement('path', {
      class: 'whale-shark-constellation__line',
      d: pathData,
      pathLength: 1,
    }));
  });
  return group;
}

function createStarLayer(points, className, kind) {
  const group = createSvgElement('g', { class: className });
  points.forEach(([x, y], index) => {
    const radius = kind === 'spot'
      ? 0.9 + ((index * 7) % 5) * 0.18
      : 1.35 + ((index * 3) % 4) * 0.18;
    group.append(createSvgElement('circle', {
      class: `whale-shark-constellation__star whale-shark-constellation__star--${kind}`,
      cx: x,
      cy: y,
      r: radius,
    }));
  });
  return group;
}

function createHitAreas() {
  const group = createSvgElement('g', { class: 'whale-shark-constellation__hit-areas' });
  HIT_AREAS.forEach((pathData) => {
    group.append(createSvgElement('path', {
      class: 'whale-shark-constellation__hit-area',
      d: pathData,
    }));
  });
  return group;
}

function createWhaleSharkConstellation() {
  const svg = createSvgElement('svg', {
    class: 'whale-shark-constellation',
    viewBox: '0 0 640 320',
    preserveAspectRatio: 'xMidYMid meet',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  const form = createSvgElement('g', { class: 'whale-shark-constellation__form' });
  const body = createSvgElement('g', { class: 'whale-shark-constellation__body' });
  const tail = createSvgElement('g', { class: 'whale-shark-constellation__tail' });
  const fins = createSvgElement('g', { class: 'whale-shark-constellation__fins' });

  body.append(
    createGuideLayer(BODY_GUIDES, 'whale-shark-constellation__guides'),
    createStarLayer(BODY_SPOTS, 'whale-shark-constellation__spots', 'spot'),
    createStarLayer(BODY_STARS, 'whale-shark-constellation__structural-stars', 'structure'),
  );
  tail.append(
    createGuideLayer(TAIL_GUIDES, 'whale-shark-constellation__guides'),
    createStarLayer(TAIL_SPOTS, 'whale-shark-constellation__spots', 'spot'),
    createStarLayer(TAIL_STARS, 'whale-shark-constellation__structural-stars', 'structure'),
  );
  fins.append(
    createGuideLayer(FIN_GUIDES, 'whale-shark-constellation__guides'),
    createStarLayer(FIN_SPOTS, 'whale-shark-constellation__spots', 'spot'),
    createStarLayer(FIN_STARS, 'whale-shark-constellation__structural-stars', 'structure'),
  );
  form.append(body, tail, fins);
  svg.append(form, createHitAreas());
  return svg;
}

export function initWhaleSharkEasterEgg(root = document) {
  const button = root.querySelector('[data-whale-shark]');
  if (!button || button.dataset.whaleSharkReady === 'true') return;

  button.replaceChildren(createWhaleSharkConstellation());
  button.dataset.whaleSharkReady = 'true';
  const form = button.querySelector('.whale-shark-constellation__form');

  const activate = () => {
    if (button.classList.contains('is-awake')) return;
    button.dataset.whaleMotion = prefersReducedMotion() ? 'reduced' : 'full';
    button.classList.add('is-awake');
  };

  button.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch') activate();
  });
  button.addEventListener('focus', activate);
  button.addEventListener('click', (event) => {
    activate();
    if (event.detail > 0) button.blur();
  });
  button.addEventListener('animationend', (event) => {
    if (event.target === form) button.classList.remove('is-awake');
  });
  button.addEventListener('animationcancel', (event) => {
    if (event.target === form) button.classList.remove('is-awake');
  });
}
