function fill(root, selector, value) {
  root.querySelectorAll(selector).forEach((element) => {
    element.textContent = String(value);
  });
}

export async function initSiteMetrics(root = document) {
  const needsMetrics = root.querySelector(
    '[data-site-experiment-count], [data-site-experiment-count-label], '
    + '[data-site-theory-count], [data-site-theory-count-label], '
    + '[data-site-route-count], [data-site-route-count-label]',
  );
  if (!needsMetrics) return;
  const { CONTENT_METRICS } = await import('../data/generated/content-metrics.js');

  if (root.querySelector('[data-site-experiment-count], [data-site-experiment-count-label]')) {
    fill(root, '[data-site-experiment-count]', CONTENT_METRICS.activeExperiments);
    fill(
      root,
      '[data-site-experiment-count-label]',
      `${CONTENT_METRICS.activeExperiments} campos navegáveis`,
    );
  }
  if (root.querySelector('[data-site-theory-count], [data-site-theory-count-label]')) {
    fill(root, '[data-site-theory-count]', CONTENT_METRICS.theories);
    fill(root, '[data-site-theory-count-label]', `${CONTENT_METRICS.theories} linhas catalogadas`);
  }
  if (root.querySelector('[data-site-route-count], [data-site-route-count-label]')) {
    fill(root, '[data-site-route-count]', CONTENT_METRICS.paths);
    fill(root, '[data-site-route-count-label]', `${CONTENT_METRICS.paths} rotas guiadas`);
  }
}
