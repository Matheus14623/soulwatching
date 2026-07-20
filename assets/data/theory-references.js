export const THEORY_REFERENCES = Object.freeze({
  'hogg-distance': Object.freeze({
    title: 'Distance measures in cosmology',
    authors: 'David W. Hogg',
    year: '1999',
    url: 'https://arxiv.org/abs/astro-ph/9905116',
    kind: 'Artigo de referência',
  }),
  'refsdal-lensing': Object.freeze({
    title: 'On the possibility of determining Hubble’s parameter from gravitational lensing',
    authors: 'Sjur Refsdal',
    year: '1964',
    url: 'https://academic.oup.com/mnras/article/128/4/295/2601704',
    kind: 'Artigo científico',
  }),
  'suyu-time-delay': Object.freeze({
    title: 'Two accurate time-delay distances from strong lensing',
    authors: 'S. H. Suyu et al.',
    year: '2013',
    url: 'https://arxiv.org/abs/1208.6010',
    kind: 'Artigo científico',
  }),
  'coleman-deluccia': Object.freeze({
    title: 'Gravitational effects on and of vacuum decay',
    authors: 'Sidney Coleman e Frank De Luccia',
    year: '1980',
    url: 'https://doi.org/10.1103/PhysRevD.21.3305',
    kind: 'Artigo científico',
  }),
  'hiller-vacuum': Object.freeze({
    title: 'Vacuum Stability in the Standard Model and Beyond',
    authors: 'Gudrun Hiller et al.',
    year: '2024',
    url: 'https://arxiv.org/abs/2401.08811',
    kind: 'Revisão científica',
  }),
  'ashtekar-singh-lqc': Object.freeze({
    title: 'Loop Quantum Cosmology: a status report',
    authors: 'Abhay Ashtekar e Parampreet Singh',
    year: '2011',
    url: 'https://arxiv.org/abs/1108.0893',
    kind: 'Revisão científica',
  }),
  'steinhardt-turok': Object.freeze({
    title: 'A cyclic model of the universe',
    authors: 'Paul J. Steinhardt e Neil Turok',
    year: '2002',
    url: 'https://doi.org/10.1126/science.1070462',
    kind: 'Artigo científico',
  }),
  'assani-presser': Object.freeze({
    title: 'A survey of the return times theorem',
    authors: 'Idris Assani e Kamil Presser',
    year: '2012',
    url: 'https://arxiv.org/abs/1209.0856',
    kind: 'Revisão matemática',
  }),
  'dyson-kleban-susskind': Object.freeze({
    title: 'Disturbing implications of a cosmological constant',
    authors: 'Lisa Dyson, Matthew Kleban e Leonard Susskind',
    year: '2002',
    url: 'https://arxiv.org/abs/hep-th/0208013',
    kind: 'Artigo científico',
  }),
  'seifert-timescape': Object.freeze({
    title: 'Supernovae evidence for foundational change to cosmological models',
    authors: 'M. Seifert et al.',
    year: '2024',
    url: 'https://doi.org/10.1093/mnrasl/slae112',
    kind: 'Artigo científico',
  }),
  'poplawski-black-hole': Object.freeze({
    title: 'Universe in a black hole with spin and torsion',
    authors: 'Nikodem J. Popławski',
    year: '2020',
    url: 'https://arxiv.org/abs/2007.11556',
    kind: 'Artigo teórico',
  }),
  'maldacena-susskind': Object.freeze({
    title: 'Cool horizons for entangled black holes',
    authors: 'Juan Maldacena e Leonard Susskind',
    year: '2013',
    url: 'https://arxiv.org/abs/1306.0533',
    kind: 'Artigo teórico',
  }),
  'gao-jafferis-wall': Object.freeze({
    title: 'Traversable Wormholes via a Double Trace Deformation',
    authors: 'Ping Gao, Daniel L. Jafferis e Aron C. Wall',
    year: '2016',
    url: 'https://arxiv.org/abs/1608.05687',
    kind: 'Artigo teórico',
  }),
  'information-causality': Object.freeze({
    title: 'Information causality as a physical principle',
    authors: 'Marcin Pawłowski et al.',
    year: '2009',
    url: 'https://doi.org/10.1038/nature08400',
    kind: 'Artigo científico',
  }),
  'nasa-exoplanet-archive': Object.freeze({
    title: 'NASA Exoplanet Archive',
    authors: 'NASA Exoplanet Science Institute',
    year: 'acesso contínuo',
    url: 'https://exoplanetarchive.ipac.caltech.edu/',
    kind: 'Catálogo científico',
  }),
  'nasa-drake': Object.freeze({
    title: 'Are We Alone in the Universe? Revisiting the Drake Equation',
    authors: 'NASA Science',
    year: '2024',
    url: 'https://science.nasa.gov/universe/exoplanets/are-we-alone-in-the-universe-revisiting-the-drake-equation/',
    kind: 'Material institucional',
  }),
});

export function getTheoryReferences(ids = []) {
  return ids
    .map((id) => ({ id, ...THEORY_REFERENCES[id] }))
    .filter((reference) => reference.title);
}
