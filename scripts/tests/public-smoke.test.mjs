import assert from 'node:assert/strict';
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { acquireFileLock } from '../content/file-lock.mjs';
import { runPublicBuildTransaction } from '../public-build-transaction.mjs';
import { PUBLIC_ROUTES } from '../public-manifest.mjs';
import { readResponse, startServer, stopServer } from './test-server.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function assertPathDoesNotExist(path) {
  await assert.rejects(
    stat(path),
    (error) => error.code === 'ENOENT',
  );
}

test('transação do build recupera .dist-previous antes de preparar e promove o novo dist', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'observatorio-build-recovery-'));
  const finalOutput = join(directory, 'dist');
  const previousOutput = join(directory, '.dist-previous');
  const stagingOutput = join(directory, '.dist-next');
  try {
    await mkdir(previousOutput, { recursive: true });
    await writeFile(join(previousOutput, 'marker.txt'), 'versão anterior', 'utf8');

    let recoveredMarker = null;
    const result = await runPublicBuildTransaction({
      finalOutput,
      previousOutput,
      stagingOutput,
      prepare: async (stagingDirectory) => {
        recoveredMarker = await readFile(join(finalOutput, 'marker.txt'), 'utf8');
        await writeFile(join(stagingDirectory, 'marker.txt'), 'versão nova', 'utf8');
        return { files: 1 };
      },
    });

    assert.equal(recoveredMarker, 'versão anterior');
    assert.deepEqual(result, { files: 1 });
    assert.equal(await readFile(join(finalOutput, 'marker.txt'), 'utf8'), 'versão nova');
    await assertPathDoesNotExist(previousOutput);
    await assertPathDoesNotExist(stagingOutput);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test('transação do build preserva o dist atual quando a preparação falha', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'observatorio-build-preservation-'));
  const finalOutput = join(directory, 'dist');
  const previousOutput = join(directory, '.dist-previous');
  const stagingOutput = join(directory, '.dist-next');
  try {
    await mkdir(finalOutput, { recursive: true });
    await writeFile(join(finalOutput, 'marker.txt'), 'dist estável', 'utf8');

    await assert.rejects(
      runPublicBuildTransaction({
        finalOutput,
        previousOutput,
        stagingOutput,
        prepare: async (stagingDirectory) => {
          await writeFile(join(stagingDirectory, 'marker.txt'), 'dist incompleto', 'utf8');
          throw new Error('falha controlada antes da promoção');
        },
      }),
      /falha controlada antes da promoção/,
    );

    assert.equal(await readFile(join(finalOutput, 'marker.txt'), 'utf8'), 'dist estável');
    await assertPathDoesNotExist(previousOutput);
    await assertPathDoesNotExist(stagingOutput);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test('lock do build impede duas transações públicas simultâneas e é liberado', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'observatorio-build-lock-'));
  const lockPath = join(directory, 'public-build.lock');
  let releaseFirst = null;
  let releaseAfter = null;
  try {
    const buildSource = await readFile(resolve(root, 'scripts', 'build.mjs'), 'utf8');
    assert.match(buildSource, /acquireFileLock\(PUBLIC_BUILD_LOCK_PATH/);

    releaseFirst = await acquireFileLock(lockPath, {
      label: 'o build público de teste',
      waitMs: 100,
    });
    await assert.rejects(
      acquireFileLock(lockPath, {
        label: 'outro build público de teste',
        pollMs: 1,
        staleMs: 60 * 1000,
        waitMs: 0,
      }),
      /Outra execução está realizando/,
    );

    await releaseFirst();
    releaseFirst = null;
    releaseAfter = await acquireFileLock(lockPath, {
      label: 'o build público após a liberação',
      waitMs: 100,
    });
    await releaseAfter();
    releaseAfter = null;
    await assertPathDoesNotExist(lockPath);
  } finally {
    if (releaseAfter) await releaseAfter();
    if (releaseFirst) await releaseFirst();
    await rm(directory, { force: true, recursive: true });
  }
});

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(path);
    const metadata = await stat(path);
    return [{ path, bytes: metadata.size }];
  }));
  return nested.flat();
}

test('preview de dist entrega as rotas e assets públicos', async () => {
  const { child, origin } = await startServer('--dist');
  try {
    for (const route of PUBLIC_ROUTES) {
      const response = await readResponse(`${origin}${route.url}`);
      assert.equal(response.status, 200, route.file);
      assert.match(response.headers['content-type'] || '', /^text\/html/);
      assert.match(response.body, /<!doctype html>/i);
      assert.match(response.body, /<title>[^<]+<\/title>/i);
      assert.match(response.body, /<main(?:\s|>)/i);

      const cleanResponse = await readResponse(`${origin}${route.cleanUrl}`);
      assert.equal(cleanResponse.status, 200, route.cleanUrl);
    }

    const stylesheet = await readResponse(`${origin}/assets/css/styles.css`);
    assert.equal(stylesheet.status, 200);
    assert.match(stylesheet.headers['content-type'] || '', /^text\/css/);

    const module = await readResponse(`${origin}/assets/js/main.js`);
    assert.equal(module.status, 200);
    assert.match(module.headers['content-type'] || '', /^text\/javascript/);

    const missing = await readResponse(`${origin}/pagina-inexistente`);
    assert.equal(missing.status, 404);

    const unsupported = await readResponse(`${origin}/`, { method: 'POST' });
    assert.equal(unsupported.status, 405);
  } finally {
    await stopServer(child);
  }
});

test('servidor de desenvolvimento não expõe arquivos internos', async () => {
  const { child, origin } = await startServer('--source');
  try {
    const publicPage = await readResponse(`${origin}/`);
    assert.equal(publicPage.status, 200);

    for (const privatePath of ['/ai/INDEX.md', '/docs/INTEGRACAO_TEORIAS.md', '/package.json']) {
      const response = await readResponse(`${origin}${privatePath}`);
      assert.equal(response.status, 404, privatePath);
      assert.doesNotMatch(response.body, /Base de conhecimento|Integração das teorias|matheus-observatorio-ideias/i);
    }
  } finally {
    await stopServer(child);
  }
});

test('preview serve uma cópia isolada de dist sem consultar o runtime-fonte', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'observatorio-dist-isolated-'));
  const isolatedDist = resolve(temporaryRoot, 'artifact');
  await cp(resolve(root, 'dist'), isolatedDist, { recursive: true });
  const { child, origin } = await startServer('--dist', {
    environment: { OBSERVATORIO_DIST_ROOT: isolatedDist },
  });
  try {
    const [page, snapshot] = await Promise.all([
      readResponse(`${origin}/Arquivo/publicacao.html`),
      readResponse(`${origin}/assets/data/generated/runtime/content-snapshot.js`),
    ]);
    assert.equal(page.status, 200);
    assert.equal(snapshot.status, 200);
    assert.match(snapshot.body, /CONTENT_SNAPSHOT/);
  } finally {
    await stopServer(child);
    await rm(temporaryRoot, { force: true, recursive: true });
  }
});

test('artefato público respeita budgets básicos de transferência', async () => {
  const files = await collectFiles(resolve(root, 'dist'));
  const bytesByExtension = (extension) => files
    .filter(({ path }) => path.toLowerCase().endsWith(extension))
    .reduce((total, { bytes }) => total + bytes, 0);
  const imageBytes = files
    .filter(({ path }) => /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(path))
    .reduce((total, { bytes }) => total + bytes, 0);
  const totalBytes = files.reduce((total, { bytes }) => total + bytes, 0);
  const largestRaster = files
    .filter(({ path }) => /\.(?:avif|gif|jpe?g|png|webp)$/i.test(path))
    .sort((left, right) => right.bytes - left.bytes)[0];

  assert.ok(totalBytes <= 3.5 * 1024 * 1024, `dist excedeu 3,5 MiB: ${totalBytes} bytes.`);
  assert.ok(bytesByExtension('.css') <= 320 * 1024, 'CSS público excedeu 320 KiB.');
  assert.ok(bytesByExtension('.js') <= 1024 * 1024, 'JavaScript público excedeu 1 MiB.');
  assert.ok(imageBytes <= 1.5 * 1024 * 1024, 'Imagens públicas excederam 1,5 MiB.');
  assert.ok(
    !largestRaster || largestRaster.bytes <= 256 * 1024,
    `Raster individual excedeu 256 KiB: ${largestRaster?.path}.`,
  );
  assert.equal(files.some(({ path }) => path.endsWith('.map')), false, 'Source map inesperado em dist/.');
});

test('deploy declara headers seguros e CSP sem script inline', async () => {
  const config = JSON.parse(await readFile(resolve(root, 'vercel.json'), 'utf8'));
  assert.equal(config.buildCommand, 'npm run build:deploy');
  assert.equal(config.installCommand, 'npm ci --ignore-scripts');
  const globalHeaders = config.headers
    ?.find(({ source }) => source === '/(.*)')
    ?.headers || [];
  const names = new Map(globalHeaders.map(({ key, value }) => [key.toLowerCase(), value]));

  assert.equal(names.get('x-content-type-options'), 'nosniff');
  assert.equal(names.get('x-frame-options'), 'DENY');
  assert.equal(names.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.match(names.get('permissions-policy') || '', /camera=\(\)/);
  assert.equal(names.get('strict-transport-security'), 'max-age=31536000');
  const policy = names.get('content-security-policy') || '';
  assert.match(policy, /default-src 'self'/);
  assert.match(policy, /script-src 'self'/);
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /style-src-attr 'none'/);
  assert.doesNotMatch(policy, /'unsafe-inline'/);
});

test('declara o runtime Node e a versão recomendada do gerenciador', async () => {
  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
  const nvmVersion = (await readFile(resolve(root, '.nvmrc'), 'utf8')).trim();
  assert.equal(manifest.engines.node, '22.x');
  assert.equal(lock.packages[''].engines.node, manifest.engines.node);
  assert.equal(manifest.packageManager, 'npm@10.9.3');
  assert.equal(nvmVersion, '22');
});
