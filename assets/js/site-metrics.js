function fill(root, selector, value) {
  root.querySelectorAll(selector).forEach((element) => {
    element.textContent = String(value);
  });
}

export async function initSiteMetrics(root = document) {
  const jobs = [];
  if (root.querySelector('[data-site-experiment-count], [data-site-experiment-count-label]')) {
    jobs.push(import('../data/experiments.js').then(({ getActiveExperiments }) => {
      const count = getActiveExperiments().length;
      fill(root, '[data-site-experiment-count]', count);
      fill(root, '[data-site-experiment-count-label]', `${count} campos navegáveis`);
    }));
  }
  if (root.querySelector('[data-site-theory-count], [data-site-theory-count-label]')) {
    jobs.push(import('../data/theories.js').then(({ THEORIES }) => {
      fill(root, '[data-site-theory-count]', THEORIES.length);
      fill(root, '[data-site-theory-count-label]', `${THEORIES.length} linhas catalogadas`);
    }));
  }
  if (root.querySelector('[data-site-route-count], [data-site-route-count-label]')) {
    jobs.push(import('../data/learning-paths.js').then(({ LEARNING_PATHS }) => {
      fill(root, '[data-site-route-count]', LEARNING_PATHS.length);
      fill(root, '[data-site-route-count-label]', `${LEARNING_PATHS.length} rotas guiadas`);
    }));
  }
  await Promise.all(jobs);
}
