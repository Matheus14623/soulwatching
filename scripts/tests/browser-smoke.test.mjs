import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  cp,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  projectRoot,
  readResponse,
  startServer,
  stopServer,
} from './test-server.mjs';
import {
  generatePublicationPages,
} from '../publication-pages.mjs';
import {
  finalizePublicMetadata,
} from '../public-metadata.mjs';
import {
  PUBLICATION_FIXTURE_ALIAS,
  PUBLICATION_FIXTURE_ID,
  PUBLICATION_FIXTURE_REVISION,
  PUBLICATION_FIXTURE_SLUG,
  publicationContextFixture,
  publicationFixture,
} from './fixtures/publication.mjs';
import {
  PUBLICATIONS as ACTUAL_PUBLICATIONS,
} from '../../assets/data/generated/runtime/publications.js';

function findBrowser() {
  const candidates = [
    process.env.BROWSER_BIN,
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);

  return candidates.find((candidate) => (
    (candidate.includes('\\') && existsSync(candidate))
    || spawnSync(candidate, ['--version'], { stdio: 'ignore', windowsHide: true }).status === 0
  )) || null;
}

export function extractBrowserConsoleMessages(diagnostic) {
  return String(diagnostic || '')
    .split(/\r?\n/)
    .filter((line) => (
      /:CONSOLE(?::\d+|\(\d+\))\]/.test(line)
      && !/source:\s*chrome-extension:\/\//i.test(line)
    ));
}

function dumpDom(browser, url, profileDirectory, {
  extraArguments = [],
  height = 844,
  virtualTimeBudget = 2500,
  width = 390,
} = {}) {
  return new Promise((resolveDump, reject) => {
    const child = spawn(browser, [
      '--headless=new',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-features=CalculateNativeWinOcclusion,UseDCompPresenter,msSmartScreenProtection',
      '--disable-sync',
      '--enable-logging=stderr',
      '--log-level=0',
      '--metrics-recording-only',
      '--no-first-run',
      '--no-default-browser-check',
      `--window-size=${width},${height}`,
      `--user-data-dir=${profileDirectory}`,
      `--virtual-time-budget=${virtualTimeBudget}`,
      ...extraArguments,
      '--dump-dom',
      url,
    ], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });

    const stdout = [];
    const stderr = [];
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`O navegador excedeu o tempo ao abrir ${url}.`));
    }, 45000);

    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timeout);
      const output = Buffer.concat(stdout).toString('utf8');
      const diagnostic = Buffer.concat(stderr).toString('utf8');
      if (code === 0 && output) {
        const consoleMessages = extractBrowserConsoleMessages(diagnostic);
        if (consoleMessages.length) {
          reject(new Error(
            `O navegador registrou mensagem de console em ${url}: ${consoleMessages.join(' | ')}`,
          ));
          return;
        }
        resolveDump(output);
        return;
      }
      const detail = diagnostic.slice(-1200);
      reject(new Error(`Navegador terminou com código ${code}. ${detail}`));
    });
  });
}

function parseJourney(dom) {
  const serialized = dom.match(
    /<output\b[^>]*data-browser-journey=""[^>]*data-state="(?:complete|failed)"[^>]*>([\s\S]*?)<\/output>/,
  )?.[1];
  const progress = dom.match(/<output\b[^>]*data-progress="([^"]+)"/)?.[1] || 'não informado';
  assert.ok(
    serialized,
    `O harness não concluiu a jornada no tempo disponível. Último marco: ${progress}.`,
  );
  const decoded = serialized
    .replaceAll('&quot;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
  const result = JSON.parse(decoded);
  assert.equal(result.ok, true, `${result.journey}: ${result.message || 'falha desconhecida'}`);
  return result.result;
}

async function runJourney(browser, origin, profileDirectory, journey, target, options = {}) {
  const url = new URL('/__browser-journey.html', origin);
  url.searchParams.set('journey', journey);
  url.searchParams.set('target', target);
  return parseJourney(await dumpDom(
    browser,
    url.href,
    profileDirectory,
    {
      virtualTimeBudget: 8000,
      ...options,
    },
  ));
}

function fixtureRuntimeModule(fixture, context) {
  const source = (name, value) => (
    `export const ${name} = deepFreeze(${JSON.stringify(value, null, 2)});\n`
  );
  return [
    'function deepFreeze(value) {',
    "  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;",
    '  Object.values(value).forEach(deepFreeze);',
    '  return Object.freeze(value);',
    '}',
    '',
    source('PUBLICATION_TYPES', context.publicationTypes),
    source('PUBLICATION_CREDIT_ROLES', context.creditRoles),
    source('PUBLICATIONS', [fixture]),
    source('EXTERNAL_CONTRIBUTIONS', [fixture]),
    source('INTERNAL_PUBLICATIONS', []),
    source('PUBLICATION_PARTIES', []),
  ].join('\n');
}

function fixtureSnapshotModule(fixture, context) {
  const referenceIndex = {
    byEntity: {
      [`publication:${fixture.id}`]: [...fixture.referenceIds],
    },
    byReference: Object.fromEntries(
      fixture.referenceIds.map((id) => [id, [`publication:${fixture.id}`]]),
    ),
  };
  const snapshot = {
    schemaVersion: 1,
    fingerprint: 'publication-e2e-fixture',
    ...context.snapshot,
    entities: {
      ...context.snapshot.entities,
      publication: [fixture],
    },
    referenceIndex,
    relationIndex: null,
    searchIndex: [],
    metrics: {},
    taxonomies: {},
    collections: {},
  };
  return `export const CONTENT_SNAPSHOT = Object.freeze(${JSON.stringify(snapshot, null, 2)});\n`;
}

async function preparePublicationFixtureOutput(baseDirectory) {
  const outputDirectory = join(baseDirectory, 'site');
  await cp(join(projectRoot, 'dist'), outputDirectory, { recursive: true });
  const fixture = publicationFixture({ availabilityState: 'withdrawn' });
  const context = publicationContextFixture();
  context.snapshot.entities.publication = [fixture];
  const runtimeDirectory = join(outputDirectory, 'assets', 'data', 'generated', 'runtime');
  await Promise.all([
    writeFile(
      join(runtimeDirectory, 'publications.js'),
      fixtureRuntimeModule(fixture, context),
      'utf8',
    ),
    writeFile(
      join(runtimeDirectory, 'content-snapshot.js'),
      fixtureSnapshotModule(fixture, context),
      'utf8',
    ),
  ]);
  const routes = await generatePublicationPages(outputDirectory, [fixture], context);
  await finalizePublicMetadata(outputDirectory, {
    environment: { PUBLIC_SITE_ORIGIN: 'https://publication-fixture.example' },
    routes,
  });
  return {
    fixture,
    outputDirectory,
    routes,
  };
}

const browser = findBrowser();
const browserIsRequired = process.env.CI === 'true' || process.env.REQUIRE_BROWSER_SMOKE === '1';

test('captura formatos de console emitidos por Chrome e Edge', () => {
  assert.equal(extractBrowserConsoleMessages(
    [
      '[123:INFO:CONSOLE:1] "erro Edge", source: http://localhost/app.js (1)',
      '[123:INFO:CONSOLE(2)] "erro Chrome", source: http://localhost/app.js (2)',
      '[123:INFO:CONSOLE:3] "extensão", source: chrome-extension://abc/app.js (3)',
    ].join('\n'),
  ).length, 2);
});

test('um navegador real inicializa as superfícies dinâmicas principais', {
  skip: browser || browserIsRequired
    ? false
    : 'Chrome, Chromium ou Edge não disponível neste ambiente.',
}, async () => {
  assert.ok(
    browser,
    'Browser smoke obrigatório, mas Chrome, Chromium ou Edge não foi encontrado. Defina BROWSER_BIN.',
  );
  const harnessPath = join(projectRoot, 'dist', '__browser-journey.html');
  await copyFile(join(projectRoot, 'scripts', 'tests', 'browser-harness.html'), harnessPath);
  const { child, origin } = await startServer('--dist');
  const profileDirectory = await mkdtemp(join(tmpdir(), 'observatorio-browser-smoke-'));
  try {
    const home = await dumpDom(browser, `${origin}/`, profileDirectory);
    assert.match(home, /data-theory-grid[^>]*>[\s\S]*?class="theory-card/);
    assert.match(home, /data-notable-figures-preview[^>]*>[\s\S]*?notable-preview-card/);
    assert.match(home, /data-learning-paths-preview[^>]*>[\s\S]*?route-preview-card/);
    assert.match(home, /data-string-key="5"/);
    assert.match(home, /class="global-search-trigger"/);
    const mobileNavigation = home.match(/<nav\b[^>]*data-primary-nav[^>]*>/)?.[0] || '';
    assert.match(mobileNavigation, /\sinert(?:="")?(?:\s|>)/);
    assert.match(mobileNavigation, /aria-hidden="true"/);
    const backToTop = home.match(/<button\b[^>]*data-back-to-top[^>]*>/)?.[0] || '';
    assert.match(backToTop, /aria-hidden="true"/);
    assert.match(backToTop, /tabindex="-1"/);

    const routes = await dumpDom(browser, `${origin}/Rotas/rotas.html`, profileDirectory);
    assert.match(routes, /data-routes-catalog[^>]*>[\s\S]*?route-catalog-card/);
    const routeCards = [...routes.matchAll(/<button[^>]*class="route-catalog-card"[\s\S]*?<\/button>/g)];
    assert.ok(routeCards.length > 0);
    routeCards.forEach(([card]) => assert.doesNotMatch(card, /<(?:div|h[1-6]|p)\b/i));

    const contributions = await dumpDom(browser, `${origin}/Contribuicoes/contribuicoes.html`, profileDirectory);
    assert.match(contributions, /data-contribution-types[^>]*>[\s\S]*?<article/);

    for (const slug of ['cone-de-luz', 'zero-epsilon', 'recorrencia-finita', 'astrobiologia-probabilistica']) {
      const experiment = await dumpDom(
        browser,
        `${origin}/Laboratorio/experimento.html?experimento=${slug}`,
        profileDirectory,
      );
      assert.doesNotMatch(experiment, /Carregando experimento…/, slug);
      assert.doesNotMatch(experiment, /class="experiment-error"/, slug);
      assert.match(experiment, /data-simulation-root[^>]+aria-busy="false"/, slug);
      assert.match(experiment, /class="simulation-layout"/, slug);
    }

    const training = await dumpDom(
      browser,
      `${origin}/Constelacoes/constelacoes.html?modo=treino`,
      profileDirectory,
    );
    assert.match(training, /data-sky-atlas[^>]+data-training-active="true"/);
    assert.match(training, /data-atlas-training-answers[^>]*>[\s\S]*?data-training-answer/);
    assert.match(training, /data-training-revealed="false"/);

    const layoutMatrix = await runJourney(
      browser,
      origin,
      profileDirectory,
      'layout-matrix',
      '/',
      {
        height: 1000,
        virtualTimeBudget: 20000,
        width: 1440,
      },
    );
    const responsiveSurfaceMatrix = await runJourney(
      browser,
      origin,
      profileDirectory,
      'responsive-surface-matrix',
      '/',
      {
        height: 1000,
        virtualTimeBudget: 20000,
        width: 1440,
      },
    );
    for (const layout of [
      ...layoutMatrix.layouts,
      ...responsiveSurfaceMatrix.layouts,
    ]) {
      const context = `${layout.path} em ${layout.width}px`;
      assert.equal(layout.viewportWidth, layout.width, `viewport divergente em ${context}`);
      assert.equal(layout.overflow, false, `overflow horizontal em ${context}`);
      assert.equal(layout.missingImageAlt, 0, `imagem sem alt em ${context}`);
      assert.equal(layout.skipLink, true, `skip link ausente em ${context}`);
      assert.equal(layout.h1Count, 1, `hierarquia H1 inesperada em ${context}`);
    }

    const responsiveSurfacePaths = [
      '/Teorias/teorias.html',
      '/GrandesNomes/grandes-nomes.html#galeria',
      '/Constelacoes/constelacoes.html',
      '/Laboratorio/experimento.html?experimento=cone-de-luz',
      '/Contribuicoes/contribuicoes.html',
    ];
    for (const path of responsiveSurfacePaths) {
      for (const width of [1440, 768, 390]) {
        assert.ok(
          responsiveSurfaceMatrix.layouts.some((layout) => (
            layout.path === path && layout.width === width
          )),
          `matriz responsiva não cobriu ${path} em ${width}px`,
        );
      }
    }

    for (const reflow of layoutMatrix.reflows) {
      assert.deepEqual(reflow, {
        h1Visible: true,
        overflow: false,
        path: reflow.path,
        viewportWidth: 320,
      }, reflow.path);
    }

    const reducedMotion = await runJourney(
      browser,
      origin,
      profileDirectory,
      'layout',
      '/',
      {
        extraArguments: ['--force-prefers-reduced-motion'],
        height: 844,
        width: 390,
      },
    );
    assert.equal(reducedMotion.reducedMotion, true);

    const reducedMotionGallery = await runJourney(
      browser,
      origin,
      profileDirectory,
      'reduced-motion-gallery',
      '/GrandesNomes/grandes-nomes.html#galeria',
      {
        extraArguments: ['--force-prefers-reduced-motion'],
        height: 900,
        width: 1440,
      },
    );
    assert.equal(reducedMotionGallery.reducedMotion, true);
    assert.equal(reducedMotionGallery.activeProfileStable, true);
    assert.equal(reducedMotionGallery.autoplayControlDisabled, true);
    assert.equal(reducedMotionGallery.autoplayRunning, false);
    assert.equal(reducedMotionGallery.effect, 'slide');
    assert.equal(reducedMotionGallery.progressAnimationName, 'none');
    assert.equal(reducedMotionGallery.speed, 0);
    assert.equal(reducedMotionGallery.unavailable, true);
    assert.match(reducedMotionGallery.statusLabel, /rotação desativada/i);

    const mobileMenu = await runJourney(
      browser,
      origin,
      profileDirectory,
      'mobile-navigation',
      '/',
      { height: 844, width: 390 },
    );
    assert.deepEqual(mobileMenu, {
      closed: true,
      focusReturned: true,
      opened: true,
    });

    const search = await runJourney(
      browser,
      origin,
      profileDirectory,
      'search',
      '/',
      { height: 900, width: 1440 },
    );
    assert.equal(search.focusReturned, true);
    assert.match(search.resultHref, /experimento=cone-de-luz/);
    assert.match(search.resultText, /Cone de luz/i);

    const contribution = await runJourney(
      browser,
      origin,
      profileDirectory,
      'contribution',
      '/Contribuicoes/contribuicoes.html#propor',
      { height: 900, width: 1024 },
    );
    assert.equal(contribution.focusMoved, true);
    assert.equal(contribution.previewContainsTitle, true);
    assert.equal(contribution.rightsPersisted, false);
    assert.match(contribution.status, /rascunho|salv/i);

    const route = await runJourney(
      browser,
      origin,
      profileDirectory,
      'route',
      '/Rotas/rotas.html?rota=tempo-gravidade-causalidade#percurso',
      { height: 900, width: 1024 },
    );
    assert.equal(route.resumeLink, true);
    assert.equal(route.closeFocusReturned, true);
    assert.ok(route.routeId);
    assert.equal(route.step, '1');

    const constellation = await runJourney(
      browser,
      origin,
      profileDirectory,
      'constellation-preview',
      '/Constelacoes/constelacoes.html',
      { height: 900, width: 1440 },
    );
    assert.deepEqual(constellation, {
      previewCleared: true,
      previewed: true,
      selectedChanged: true,
    });

    const desktopGallery = await runJourney(
      browser,
      origin,
      profileDirectory,
      'desktop-gallery',
      '/GrandesNomes/grandes-nomes.html#galeria',
      { height: 900, width: 1440 },
    );
    assert.equal(desktopGallery.changed, true);
    assert.equal(desktopGallery.dragStateCleared, true);
    assert.equal(desktopGallery.dragStateStarted, true);
    assert.equal(desktopGallery.domPointerSequence, true);
    assert.equal(desktopGallery.interactionEnabled, true);
    assert.equal(desktopGallery.mouseProfile, true);
    assert.equal(desktopGallery.profileConsistent, true);
  } finally {
    await stopServer(child);
    await rm(harnessPath, { force: true });
    try {
      await rm(profileDirectory, {
        force: true,
        maxRetries: 12,
        recursive: true,
        retryDelay: 180,
      });
    } catch (error) {
      if (error.code !== 'EBUSY') throw error;
    }
  }
});

test('fixture E2E de publicação atravessa prerender, servidor, CSP e navegador sem contaminar o catálogo real', {
  skip: browser || browserIsRequired
    ? false
    : 'Chrome, Chromium ou Edge não disponível neste ambiente.',
}, async () => {
  assert.ok(browser);
  assert.equal(
    ACTUAL_PUBLICATIONS.some(({ id }) => id === PUBLICATION_FIXTURE_ID),
    false,
    'a fixture E2E não pode integrar o catálogo público real',
  );

  const fixtureDirectory = await mkdtemp(join(tmpdir(), 'observatorio-publication-e2e-'));
  const profileDirectory = await mkdtemp(join(tmpdir(), 'observatorio-publication-browser-'));
  const noJavaScriptProfile = await mkdtemp(
    join(tmpdir(), 'observatorio-publication-no-js-'),
  );
  let activeServer = null;
  try {
    await mkdir(join(noJavaScriptProfile, 'Default'), { recursive: true });
    await writeFile(
      join(noJavaScriptProfile, 'Default', 'Preferences'),
      JSON.stringify({
        profile: {
          default_content_setting_values: {
            javascript: 2,
          },
        },
      }),
      'utf8',
    );
    const {
      outputDirectory,
      routes,
    } = await preparePublicationFixtureOutput(fixtureDirectory);
    const canonicalPath = `/Arquivo/publicacoes/${PUBLICATION_FIXTURE_SLUG}`;
    const aliasPath = `/Arquivo/publicacoes/${PUBLICATION_FIXTURE_ALIAS}`;
    const revisionFragment = `#revisao-${PUBLICATION_FIXTURE_REVISION}`;
    const canonicalRoute = routes.find(({ cleanUrl }) => cleanUrl === canonicalPath);
    const aliasRoute = routes.find(({ cleanUrl }) => cleanUrl === aliasPath);
    assert.ok(canonicalRoute);
    assert.ok(aliasRoute);
    assert.equal(aliasRoute.canonicalCleanUrl, canonicalPath);
    assert.equal(aliasRoute.sitemap, false);

    const sitemap = await readFile(join(outputDirectory, 'sitemap.xml'), 'utf8');
    assert.match(sitemap, new RegExp(`${PUBLICATION_FIXTURE_SLUG}<\\/loc>`));
    assert.doesNotMatch(sitemap, new RegExp(`${PUBLICATION_FIXTURE_ALIAS}<\\/loc>`));

    activeServer = await startServer('--dist', {
      environment: {
        OBSERVATORIO_DEPLOY_HEADERS: '1',
        OBSERVATORIO_DIST_ROOT: outputDirectory,
      },
    });
    const canonical = await readResponse(`${activeServer.origin}${canonicalPath}`);
    const alias = await readResponse(`${activeServer.origin}${aliasPath}`);
    const canonicalHtml = await readResponse(
      `${activeServer.origin}${canonicalPath}.html`,
    );

    assert.equal(canonical.status, 200);
    assert.equal(canonicalHtml.status, 200);
    assert.equal(alias.status, 200);
    assert.match(
      canonical.headers['content-security-policy'] || '',
      /script-src 'self'/,
    );
    assert.match(
      canonical.headers['content-security-policy'] || '',
      /frame-ancestors 'none'/,
    );
    assert.match(
      canonical.body,
      /rel="canonical" href="https:\/\/publication-fixture\.example\/Arquivo\/publicacoes\/ensaio-de-teste"/,
    );
    assert.match(canonical.body, /name="robots" content="noindex, follow"/);
    assert.match(canonical.body, /<h1 data-publication-title>Ensaio de teste<\/h1>/);
    assert.match(canonical.body, /Texto público com &lt;caracteres&gt;/);
    assert.match(canonical.body, /Fonte de teste/);
    assert.match(canonical.body, /Creative Commons Atribuição 4\.0/);
    assert.match(canonical.body, /Licença: CC-BY-4\.0/);
    assert.match(canonical.body, /A autoria solicitou a retirada/);
    assert.match(canonical.body, /Abrir canal de contestação/);
    assert.match(canonical.body, /"@type":"Article"/);
    const canonicalArticle = canonical.body.match(
      /<article\b[^>]*data-publication-document[^>]*>/i,
    )?.[0] || '';
    assert.ok(canonicalArticle);
    assert.doesNotMatch(canonicalArticle, /\bhidden\b/);

    assert.match(alias.body, /name="robots" content="noindex, follow"/);
    assert.match(
      alias.body,
      /rel="canonical" href="https:\/\/publication-fixture\.example\/Arquivo\/publicacoes\/ensaio-de-teste"/,
    );

    const noJavaScript = await dumpDom(
      browser,
      `${activeServer.origin}${canonicalPath}${revisionFragment}`,
      noJavaScriptProfile,
      {
        height: 900,
        virtualTimeBudget: 5000,
        width: 1024,
      },
    );
    const noJavaScriptArticle = noJavaScript.match(
      /<article\b[^>]*data-publication-document[^>]*>/i,
    )?.[0] || '';
    assert.ok(noJavaScriptArticle);
    assert.doesNotMatch(noJavaScriptArticle, /\bhidden\b/);
    assert.match(noJavaScript, /Ensaio de teste/);
    assert.match(noJavaScript, /Fonte de teste/);
    assert.match(noJavaScript, /Creative Commons Atribuição 4\.0/);
    assert.match(noJavaScript, /A autoria solicitou a retirada/);
    assert.equal(
      noJavaScript.match(/<link rel="canonical" href="([^"]+)"/i)?.[1],
      `https://publication-fixture.example${canonicalPath}`,
      'sem JavaScript, o navegador deve preservar o canonical absoluto do prerender',
    );

    const aliasBrowser = await dumpDom(
      browser,
      `${activeServer.origin}${aliasPath}${revisionFragment}`,
      profileDirectory,
      {
        height: 900,
        virtualTimeBudget: 6000,
        width: 1024,
      },
    );
    assert.doesNotMatch(aliasBrowser, /Publicação não encontrada/);
    assert.match(aliasBrowser, /Fonte de teste/);
    assert.match(aliasBrowser, /Creative Commons Atribuição 4\.0/);
    assert.match(aliasBrowser, /A autoria solicitou a retirada/);
    assert.equal(
      aliasBrowser.match(/<link rel="canonical" href="([^"]+)"/i)?.[1],
      `${activeServer.origin}${canonicalPath}`,
      'com JavaScript, o alias deve ser normalizado para o canonical da origem ativa',
    );

    await stopServer(activeServer.child);
    activeServer = null;
    await copyFile(
      join(projectRoot, 'scripts', 'tests', 'browser-harness.html'),
      join(outputDirectory, '__browser-journey.html'),
    );
    activeServer = await startServer('--dist', {
      environment: { OBSERVATORIO_DIST_ROOT: outputDirectory },
    });
    const journey = await runJourney(
      browser,
      activeServer.origin,
      profileDirectory,
      'publication-e2e',
      `${canonicalPath}${revisionFragment}`,
      {
        height: 900,
        virtualTimeBudget: 10000,
        width: 1024,
      },
    );
    assert.equal(journey.articleVisible, true);
    assert.equal(journey.canonicalPath, canonicalPath);
    assert.equal(journey.deepFragmentResolved, true);
    assert.equal(journey.exceptionalNoticeVisible, true);
    assert.equal(journey.relatedTheoryActive, true);
    assert.equal(journey.relatedTheorySlug, 'zero-epsilon');
    assert.match(journey.relationHref, /teoria=zero-epsilon/);
    assert.equal(journey.sourceHref, 'https://example.com/fonte');
    assert.equal(
      journey.licenseHref,
      'https://creativecommons.org/licenses/by/4.0/',
    );
    assert.equal(journey.title, 'Ensaio de teste');
  } finally {
    if (activeServer) await stopServer(activeServer.child);
    await Promise.all([
      rm(fixtureDirectory, {
        force: true,
        maxRetries: 12,
        recursive: true,
        retryDelay: 180,
      }),
      rm(profileDirectory, {
        force: true,
        maxRetries: 12,
        recursive: true,
        retryDelay: 180,
      }),
      rm(noJavaScriptProfile, {
        force: true,
        maxRetries: 12,
        recursive: true,
        retryDelay: 180,
      }),
    ]);
  }
});

test('CSP de deploy preserva módulos, estilos e metadados em navegação real', {
  skip: browser || browserIsRequired
    ? false
    : 'Chrome, Chromium ou Edge não disponível neste ambiente.',
}, async () => {
  assert.ok(browser);
  const { child, origin } = await startServer('--dist', {
    environment: { OBSERVATORIO_DEPLOY_HEADERS: '1' },
  });
  const profileDirectory = await mkdtemp(join(tmpdir(), 'observatorio-csp-smoke-'));
  try {
    const response = await fetch(`${origin}/`);
    assert.match(response.headers.get('content-security-policy') || '', /script-src 'self'/);
    const home = await dumpDom(browser, `${origin}/`, profileDirectory, {
      height: 900,
      virtualTimeBudget: 5000,
      width: 1440,
    });
    assert.match(home, /data-theory-grid[^>]*>[\s\S]*?class="theory-card/);
    assert.match(home, /class="global-search-trigger"/);
    assert.match(home, /class="theory-card[^"]*"[^>]*style="[^"]*--accent:/);

    const theories = await dumpDom(
      browser,
      `${origin}/Teorias/teorias.html`,
      profileDirectory,
      { height: 900, virtualTimeBudget: 5000, width: 1024 },
    );
    assert.match(theories, /data-theory-card="[^"]+"[^>]*style="[^"]*--accent:/);

    const map = await dumpDom(
      browser,
      `${origin}/Mapa/mapa.html`,
      profileDirectory,
      { height: 900, virtualTimeBudget: 5000, width: 1024 },
    );
    assert.match(map, /data-map-node="[^"]+"[^>]*style="[^"]*--x:/);

    const publication = await dumpDom(
      browser,
      `${origin}/Arquivo/publicacao.html`,
      profileDirectory,
      {
        height: 844,
        virtualTimeBudget: 5000,
        width: 390,
      },
    );
    assert.match(publication, /Escolha uma publicação no Arquivo/);
    assert.match(publication, /type="application\/ld\+json"/);
  } finally {
    await stopServer(child);
    try {
      await rm(profileDirectory, {
        force: true,
        maxRetries: 12,
        recursive: true,
        retryDelay: 180,
      });
    } catch (error) {
      if (error.code !== 'EBUSY') throw error;
    }
  }
});
