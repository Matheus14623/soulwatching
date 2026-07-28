import './check-node-version.cjs';
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PUBLIC_BUILD_FILES,
  PUBLIC_BUILD_PATHS,
  PUBLIC_REQUIRED_FILES,
  PUBLIC_ROUTES,
  validatePublicManifestPath,
} from './public-manifest.mjs';
import {
  finalizePublicMetadata,
  publicOriginIsRequired,
} from './public-metadata.mjs';
import { generatePublicationPages } from './publication-pages.mjs';
import {
  createPublicContentMetricContext,
  synchronizePublicContentMetrics,
} from './public-content-metrics.mjs';
import { acquireFileLock } from './content/file-lock.mjs';
import {
  CONTENT_TRANSACTION_LOCK_PATH,
  PUBLIC_BUILD_LOCK_PATH,
  RUNTIME_LOCK_PATH,
} from './content/paths.mjs';
import { runPublicBuildTransaction } from './public-build-transaction.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const finalOutput = resolve(root, 'dist');
const output = resolve(root, '.dist-next');
const previousOutput = resolve(root, '.dist-previous');

if (
  dirname(finalOutput) !== root
  || basename(finalOutput) !== 'dist'
  || dirname(output) !== root
  || basename(output) !== '.dist-next'
  || dirname(previousOutput) !== root
  || basename(previousOutput) !== '.dist-previous'
) {
  throw new Error('Diretório de saída inválido.');
}

const releaseBuildLock = await acquireFileLock(PUBLIC_BUILD_LOCK_PATH, {
  label: 'o build público',
  waitMs: 6 * 60 * 1000,
});
let releaseContentLock = null;
let releaseRuntimeLock = null;

async function preparePublicBuild() {
const verification = spawnSync(process.execPath, [join(root, 'scripts', 'verify.mjs')], {
  cwd: root,
  stdio: 'inherit',
});

if (verification.status !== 0) {
  throw new Error(`A verificação pública falhou com código ${verification.status || 1}.`);
}

releaseContentLock = await acquireFileLock(CONTENT_TRANSACTION_LOCK_PATH, {
  label: 'a fonte pública durante o build',
  waitMs: 2 * 60 * 1000,
});
releaseRuntimeLock = await acquireFileLock(RUNTIME_LOCK_PATH, {
  label: 'o snapshot do runtime durante o build',
  waitMs: 2 * 60 * 1000,
});

async function copyPath(source, destination) {
  const sourceStats = await lstat(source);
  if (sourceStats.isSymbolicLink()) {
    throw new Error(`Link simbólico não permitido no build público: ${relative(root, source)}`);
  }
  if (!sourceStats.isDirectory()) {
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
    return;
  }

  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  await Promise.all(entries.map((entry) => (
    copyPath(join(source, entry.name), join(destination, entry.name))
  )));
}

function normalizePublicPath(path) {
  return validatePublicManifestPath(path.replaceAll('\\', '/'));
}

async function listSourceFiles(directory) {
  const entries = await readdir(directory);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    const info = await lstat(path);
    if (info.isSymbolicLink()) {
      throw new Error(`Link simbólico não permitido no build público: ${relative(root, path)}`);
    }
    if (info.isDirectory()) files.push(...await listSourceFiles(path));
    else files.push(path);
  }
  return files;
}

const { NOTABLE_FIGURES } = await import('../assets/data/generated/runtime/notable-figures.js');
const portraitFiles = NOTABLE_FIGURES.map(({ portrait }) => (
  normalizePublicPath(portrait.src.split(/[?#]/, 1)[0])
));
const publicBuildPaths = [...new Set([...PUBLIC_BUILD_PATHS, ...portraitFiles])];
const allowedSourceFiles = new Set([
  ...PUBLIC_BUILD_FILES,
  ...PUBLIC_REQUIRED_FILES,
  ...portraitFiles,
].map(normalizePublicPath));
const recursiveSourceFiles = (
  await Promise.all(publicBuildPaths.map(async (entry) => {
    const source = resolve(root, entry);
    const info = await lstat(source);
    if (info.isSymbolicLink()) {
      throw new Error(`Link simbólico não permitido no build público: ${entry}`);
    }
    return info.isDirectory() ? listSourceFiles(source) : [source];
  }))
).flat();
const unregisteredSourceFiles = recursiveSourceFiles
  .map((file) => normalizePublicPath(relative(root, file)))
  .filter((file) => !allowedSourceFiles.has(file));
if (unregisteredSourceFiles.length) {
  throw new Error(`Arquivo não registrado no manifesto público: ${unregisteredSourceFiles.join(', ')}`);
}

for (const entry of publicBuildPaths) {
  const source = resolve(root, entry);
  const destination = resolve(output, entry);
  await copyPath(source, destination);
}

const [
  {
    PUBLICATIONS,
    PUBLICATION_CREDIT_ROLES,
    PUBLICATION_TYPES,
  },
  { CONTENT_SNAPSHOT },
  { CONTENT_METRICS },
  {
    THEORIES,
    THEORY_FILTERS,
    THEORY_TYPES,
  },
] = await Promise.all([
  import('../assets/data/generated/runtime/publications.js'),
  import('../assets/data/generated/runtime/content-snapshot.js'),
  import('../assets/data/generated/content-metrics.js'),
  import('../assets/data/generated/runtime/theories.js'),
]);
const publicationRoutes = await generatePublicationPages(output, PUBLICATIONS, {
  creditRoles: PUBLICATION_CREDIT_ROLES,
  publicationTypes: PUBLICATION_TYPES,
  snapshot: CONTENT_SNAPSHOT,
});

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat();
}

const outputFiles = await listFiles(output);
const publicContentMetricContext = createPublicContentMetricContext({
  metrics: CONTENT_METRICS,
  publications: PUBLICATIONS,
  publicationTypes: PUBLICATION_TYPES,
  theories: THEORIES,
  theoryFilters: THEORY_FILTERS,
  theoryTypes: THEORY_TYPES,
});
await Promise.all(outputFiles
  .filter((file) => /\.html$/i.test(file))
  .map(async (file) => {
    const source = await readFile(file, 'utf8');
    const synchronized = synchronizePublicContentMetrics(source, publicContentMetricContext, {
      publicPath: relative(output, file).replaceAll('\\', '/'),
    });
    if (synchronized !== source) await writeFile(file, synchronized, 'utf8');
  }));
const forbiddenExtensions = /\.(?:bak|cjs|docx|json|md|pdf|py)$/i;
const forbiddenDirectories = /(?:^|[\\/])(?:ai|content|docs|ia|scripts|submissions|private-attachments|\.content-drafts|\.content-reports)(?:[\\/]|$)/i;
const privateCanary = 'CONTENT_PRIVATE_CANARY_DO_NOT_PUBLISH';
const forbiddenGeneratedField = /["'](?:address|consentEvidence|email|permissionProof|phone|privateContactData|privateDecisionNotes|privateReviewNotes|reviewerEmail|secret|submission|submissionId|telephone|token)["']\s*:/i;
const extensionPolicies = Object.freeze([
  Object.freeze({ prefix: 'assets/css/', pattern: /\.css$/i }),
  Object.freeze({ prefix: 'assets/js/', pattern: /\.js$/i }),
  Object.freeze({ prefix: 'assets/data/generated/', pattern: /\.js$/i }),
  Object.freeze({ prefix: 'assets/icons/', pattern: /\.svg$/i }),
  Object.freeze({ prefix: 'assets/images/', pattern: /\.(?:avif|gif|jpe?g|png|svg|webp)$/i }),
  ...['Arquivo', 'Constelacoes', 'Contribuicoes', 'GrandesNomes', 'Laboratorio', 'Mapa', 'Rotas', 'Teorias']
    .map((directory) => Object.freeze({
      prefix: `${directory}/`,
      pattern: /\.(?:css|html|js)$/i,
    })),
]);

async function validatePublicOutput(files) {
  for (const file of files) {
    const publicPath = relative(output, file);
    const normalizedPublicPath = publicPath.replaceAll('\\', '/');
    if (
      forbiddenExtensions.test(publicPath)
      || forbiddenDirectories.test(publicPath)
      || (/\.txt$/i.test(publicPath) && publicPath.replaceAll('\\', '/') !== 'robots.txt')
    ) {
      throw new Error(`Arquivo interno encontrado no artefato público: ${publicPath}`);
    }
    const extensionPolicy = extensionPolicies.find(({ prefix }) => normalizedPublicPath.startsWith(prefix));
    if (extensionPolicy && !extensionPolicy.pattern.test(normalizedPublicPath)) {
      throw new Error(`Extensão não autorizada no diretório público: ${publicPath}`);
    }

    if (/\.(?:css|html|js|svg|txt|xml)$/i.test(publicPath)) {
      const source = await readFile(file, 'utf8');
      if (source.includes(privateCanary)) {
        throw new Error(`Canary privado encontrado no artefato público: ${publicPath}`);
      }
      if (
        normalizedPublicPath.startsWith('assets/data/generated/')
        && forbiddenGeneratedField.test(source)
      ) {
        throw new Error(`Campo privado encontrado em DTO público gerado: ${publicPath}`);
      }
    }
  }

  const searchableFiles = files.filter((file) => /\.(?:css|html|js)$/i.test(file));
  const searchableSources = await Promise.all(searchableFiles.map((file) => readFile(file, 'utf8')));
  const publicSource = searchableSources.join('\n');
  for (const file of files.filter((candidate) => /[\\/]assets[\\/]images[\\/].+\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(candidate))) {
    const assetPath = relative(output, file).replaceAll('\\', '/');
    if (!publicSource.includes(assetPath)) {
      throw new Error(`Asset público sem consumidor declarado: ${assetPath}`);
    }
  }
}

await validatePublicOutput(outputFiles);
const metadata = await finalizePublicMetadata(output, {
  routes: [...PUBLIC_ROUTES, ...publicationRoutes],
});
if (!metadata.applied) {
  if (publicOriginIsRequired()) {
    throw new Error(
      'A origem pública é obrigatória no deploy. Configure PUBLIC_SITE_ORIGIN '
      + 'ou VERCEL_PROJECT_PRODUCTION_URL com uma origem HTTPS válida.',
    );
  }
  console.warn(
    'Aviso: canonical absoluto, sitemap e og:url não foram finalizados porque a origem pública '
    + 'não está definida. Configure PUBLIC_SITE_ORIGIN no deploy.',
  );
}
const finalOutputFiles = metadata.applied ? await listFiles(output) : outputFiles;
if (metadata.applied) await validatePublicOutput(finalOutputFiles);
return finalOutputFiles;
}

try {
const finalOutputFiles = await runPublicBuildTransaction({
  finalOutput,
  previousOutput,
  stagingOutput: output,
  prepare: preparePublicBuild,
});

console.log(`Build público concluído: ${finalOutputFiles.length} arquivos permitidos em dist.`);
} finally {
  try {
    if (releaseRuntimeLock) await releaseRuntimeLock();
  } finally {
    try {
      if (releaseContentLock) await releaseContentLock();
    } finally {
      await releaseBuildLock();
    }
  }
}
