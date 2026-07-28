const METRIC_ATTRIBUTE = 'data-content-metric';
const FORMAT_ATTRIBUTE = 'data-content-format';

function freezeContracts(contracts) {
  return Object.freeze(Object.fromEntries(
    Object.entries(contracts).map(([path, entries]) => [
      path,
      Object.freeze(entries.map((entry) => Object.freeze({ ...entry }))),
    ]),
  ));
}

export const PUBLIC_CONTENT_METRIC_CONTRACTS = freezeContracts({
  'index.html': [
    { selectorAttribute: 'data-site-route-count-label', metric: 'paths', format: 'guided-routes' },
    { selectorAttribute: 'data-theory-total', metric: 'theories', occurrences: 2 },
    { selectorAttribute: 'data-relation-total', metric: 'theoryRelations' },
    { selectorAttribute: 'data-site-experiment-count-label', metric: 'activeExperiments', format: 'navigable-fields' },
    {
      selectorAttribute: 'data-notable-profile-count',
      selectorValue: 'summary',
      metric: 'figures',
      format: 'documented-profiles',
    },
    {
      selectorAttribute: 'data-notable-profile-count',
      selectorValue: 'action',
      metric: 'figures',
      format: 'explore-profiles',
    },
    { selectorAttribute: 'data-constellation-count', metric: 'constellations' },
    { selectorAttribute: 'data-filter-total', metric: 'theoryAxes' },
  ],
  'Teorias/teorias.html': [
    { selectorAttribute: 'data-theories-total', metric: 'theories' },
    { selectorAttribute: 'data-type-total', metric: 'theoryTypes' },
    { selectorAttribute: 'data-independent-total', metric: 'independentTheories' },
  ],
  'Mapa/mapa.html': [
    { selectorAttribute: 'data-map-theory-total', metric: 'theories' },
    { selectorAttribute: 'data-map-relation-total', metric: 'theoryRelations' },
    { selectorAttribute: 'data-map-filter-total', metric: 'theoryAxes' },
  ],
  'GrandesNomes/grandes-nomes.html': [
    { selectorAttribute: 'data-notable-total', metric: 'figures' },
    {
      selectorAttribute: 'data-notable-result-count',
      metric: 'figures',
      format: 'available-profiles',
    },
  ],
  'Constelacoes/constelacoes.html': [
    {
      tagName: 'meta',
      selectorAttribute: 'name',
      selectorValue: 'description',
      metric: 'constellations',
      format: 'constellation-meta-description',
    },
    {
      tagName: 'meta',
      selectorAttribute: 'property',
      selectorValue: 'og:description',
      metric: 'constellations',
      format: 'constellation-og-description',
    },
  ],
  'Arquivo/arquivo.html': [
    {
      selectorAttribute: 'data-publication-count-label',
      metric: 'publications',
      format: 'reviewed-publications',
      occurrences: 2,
    },
    { selectorAttribute: 'data-site-theory-count', metric: 'theories' },
    {
      selectorAttribute: 'data-publication-type-count',
      selectorValue: 'ensaio',
      metric: 'publicationType:ensaio',
      format: 'published-publication-type',
    },
    {
      selectorAttribute: 'data-publication-type-count',
      selectorValue: 'nota-tecnica',
      metric: 'publicationType:nota-tecnica',
      format: 'published-publication-type',
    },
    {
      selectorAttribute: 'data-site-experiment-count-label',
      metric: 'activeExperiments',
      format: 'navigable-fields',
    },
  ],
  'Laboratorio/laboratorio.html': [
    {
      selectorAttribute: 'data-experiment-count-label',
      metric: 'activeExperiments',
      format: 'active-fields',
    },
    {
      selectorAttribute: 'data-experiment-count',
      metric: 'activeExperiments',
      format: 'navigable-experiences',
    },
  ],
  'Rotas/rotas.html': [
    {
      selectorAttribute: 'data-site-route-count-label',
      metric: 'paths',
      format: 'guided-routes',
    },
  ],
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readAttribute(tag, name) {
  const attribute = new RegExp(
    `\\s${escapeRegExp(name)}(?![\\w:-])(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+)))?`,
    'i',
  ).exec(tag);
  if (!attribute) return null;
  return attribute[1] ?? attribute[2] ?? attribute[3] ?? '';
}

function replaceAttribute(tag, name, value) {
  const attribute = new RegExp(
    `(\\s${escapeRegExp(name)}(?![\\w:-])\\s*=\\s*)(?:"[^"]*"|'[^']*'|[^\\s"'=<>]+)`,
    'i',
  );
  if (!attribute.test(tag)) {
    throw new Error(`Atributo ${name} ausente em marcador de métrica pública.`);
  }
  return tag.replace(attribute, `$1"${value}"`);
}

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeText(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function assertCount(name, value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Métrica pública inválida em ${name}: ${String(value)}.`);
  }
  return value;
}

function countLabel(value, singular, plural) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function constellationCountLabel(value) {
  return countLabel(value, 'constelação', 'constelações');
}

const FORMATTERS = Object.freeze({
  number: ({ value }) => String(value),
  'available-profiles': ({ value }) => countLabel(value, 'perfil disponível', 'perfis disponíveis'),
  'documented-profiles': ({ value }) => countLabel(value, 'perfil documentado', 'perfis documentados'),
  'explore-profiles': ({ value }) => (
    value === 1 ? 'Explorar 1 perfil' : `Explorar os ${value} perfis`
  ),
  'guided-routes': ({ value }) => countLabel(value, 'rota guiada', 'rotas guiadas'),
  'navigable-fields': ({ value }) => countLabel(value, 'campo navegável', 'campos navegáveis'),
  'active-fields': ({ value }) => countLabel(value, 'campo ativo', 'campos ativos'),
  'navigable-experiences': ({ value }) => countLabel(value, 'experiência navegável', 'experiências navegáveis'),
  'reviewed-publications': ({ value }) => countLabel(value, 'publicação revisada', 'publicações revisadas'),
  'published-publication-type': ({ key, value, context }) => {
    if (!value) return 'nenhuma publicada';
    const typeId = key.slice('publicationType:'.length);
    const label = context.publicationTypeLabels[typeId]?.toLocaleLowerCase('pt-BR') || 'publicação';
    return `${value} ${value === 1 ? label : 'publicações'}`;
  },
  'constellation-meta-description': ({ value }) => (
    `Atlas educativo para reconhecer ${constellationCountLabel(value)} no céu: `
    + 'explore estrelas de referência, revele linhas-guia e encontre padrões visíveis do Brasil.'
  ),
  'constellation-og-description': ({ value }) => (
    `Um atlas celeste interativo para aprender a reconhecer ${constellationCountLabel(value)} `
    + 'e suas estrelas de referência.'
  ),
});

function createMetricValues({
  metrics,
  publications,
  publicationTypes,
  theories,
  theoryFilters,
  theoryTypes,
}) {
  if (!metrics || typeof metrics !== 'object') {
    throw new Error('CONTENT_METRICS é obrigatório para sincronizar o HTML público.');
  }

  const values = Object.fromEntries(
    Object.entries(metrics).map(([name, value]) => [name, assertCount(name, value)]),
  );
  const catalogs = {
    publications: publications || [],
    publicationTypes: publicationTypes || [],
    theories: theories || [],
    theoryFilters: theoryFilters || [],
    theoryTypes: theoryTypes || [],
  };

  if (values.theories !== catalogs.theories.length) {
    throw new Error('CONTENT_METRICS.theories diverge do catálogo gerado de teorias.');
  }
  if (values.publications !== catalogs.publications.length) {
    throw new Error('CONTENT_METRICS.publications diverge do catálogo gerado de publicações.');
  }

  values.independentTheories = assertCount(
    'independentTheories',
    catalogs.theories.filter(({ independent }) => independent !== false).length,
  );
  values.theoryTypes = assertCount('theoryTypes', catalogs.theoryTypes.length);
  values.theoryAxes = assertCount(
    'theoryAxes',
    catalogs.theoryFilters.filter(({ id }) => id !== 'todas').length,
  );

  for (const type of catalogs.publicationTypes) {
    values[`publicationType:${type.id}`] = assertCount(
      `publicationType:${type.id}`,
      catalogs.publications.filter(({ publicationType }) => publicationType === type.id).length,
    );
  }

  return values;
}

export function createPublicContentMetricContext(options) {
  const values = createMetricValues(options);
  const publicationTypeLabels = Object.freeze(Object.fromEntries(
    (options.publicationTypes || []).map(({ id, label }) => [id, label]),
  ));
  return Object.freeze({
    publicationTypeLabels,
    values: Object.freeze(values),
  });
}

function renderMetric(openingTag, context) {
  const key = readAttribute(openingTag, METRIC_ATTRIBUTE);
  const format = readAttribute(openingTag, FORMAT_ATTRIBUTE) || 'number';
  if (!key) throw new Error(`Marcador ${METRIC_ATTRIBUTE} sem chave.`);
  if (!Object.hasOwn(context.values, key)) {
    throw new Error(`Métrica pública desconhecida: ${key}.`);
  }
  const formatter = FORMATTERS[format];
  if (!formatter) throw new Error(`Formato de métrica pública desconhecido: ${format}.`);
  return formatter({
    context,
    format,
    key,
    value: context.values[key],
  });
}

function openingTags(html) {
  return [...html.matchAll(/<([a-z][\w:-]*)\b[^>]*>/gi)]
    .map((match) => ({ name: match[1].toLocaleLowerCase('en-US'), source: match[0] }));
}

export function validatePublicContentMetricCoverage(html, publicPath) {
  const normalizedPath = publicPath?.replaceAll('\\', '/');
  const contracts = PUBLIC_CONTENT_METRIC_CONTRACTS[normalizedPath] || [];
  if (!contracts.length) return;
  const tags = openingTags(html);

  for (const contract of contracts) {
    const matches = tags.filter(({ name, source }) => (
      (!contract.tagName || name === contract.tagName)
      && readAttribute(source, contract.selectorAttribute) !== null
      && (
        contract.selectorValue === undefined
        || readAttribute(source, contract.selectorAttribute) === contract.selectorValue
      )
    ));
    const expectedOccurrences = contract.occurrences || 1;
    if (matches.length !== expectedOccurrences) {
      throw new Error(
        `${normalizedPath}: esperado(s) ${expectedOccurrences} marcador(es) `
        + `${contract.selectorAttribute}, encontrado(s) ${matches.length}.`,
      );
    }
    for (const { source } of matches) {
      const metric = readAttribute(source, METRIC_ATTRIBUTE);
      const format = readAttribute(source, FORMAT_ATTRIBUTE) || 'number';
      if (metric !== contract.metric || format !== (contract.format || 'number')) {
        throw new Error(
          `${normalizedPath}: ${contract.selectorAttribute} deve usar `
          + `${METRIC_ATTRIBUTE}="${contract.metric}" e formato "${contract.format || 'number'}".`,
        );
      }
    }
  }
}

export function synchronizePublicContentMetrics(html, context, { publicPath } = {}) {
  if (typeof html !== 'string') throw new TypeError('O HTML público deve ser uma string.');
  if (!context?.values) throw new TypeError('Contexto de métricas públicas inválido.');
  validatePublicContentMetricCoverage(html, publicPath);

  const markerCount = (html.match(/\sdata-content-metric\s*=/gi) || []).length;
  let processed = 0;

  let synchronized = html.replace(
    /<meta\b[^>]*\sdata-content-metric\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>/gi,
    (tag) => {
      processed += 1;
      return replaceAttribute(tag, 'content', escapeAttribute(renderMetric(tag, context)));
    },
  );

  synchronized = synchronized.replace(
    /(<([a-z][\w:-]*)\b[^>]*\sdata-content-metric\s*=\s*(?:"[^"]*"|'[^']*')[^>]*>)([^<>]*)(<\/\2\s*>)/gi,
    (element, openingTag, _tagName, _content, closingTag) => {
      processed += 1;
      return `${openingTag}${escapeText(renderMetric(openingTag, context))}${closingTag}`;
    },
  );

  if (processed !== markerCount) {
    throw new Error(
      `${publicPath || 'HTML'}: ${markerCount - processed} marcador(es) de métrica `
      + 'não puderam ser sincronizados; use apenas <meta content> ou elementos com texto simples.',
    );
  }
  return synchronized;
}
