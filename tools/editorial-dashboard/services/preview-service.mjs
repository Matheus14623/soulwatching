import {
  createHash,
  randomBytes,
  randomUUID,
} from 'node:crypto';
import { spawn } from 'node:child_process';
import {
  copyFile,
  createReadStream,
} from 'node:fs';
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rm,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import {
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
} from 'node:path';
import {
  CONTENT_TRANSACTION_LOCK_PATH,
} from '../../../scripts/content/paths.mjs';
import { withFileLock } from '../../../scripts/content/file-lock.mjs';
import { DashboardError } from './errors.mjs';
import {
  DASHBOARD_PROJECT_ROOT,
} from './catalog-service.mjs';
import { isLoopbackAddress } from './security.mjs';

const PREVIEW_SOURCE_FILES = Object.freeze([
  '.nvmrc',
  'index.html',
  'package-lock.json',
  'package.json',
  'robots.txt',
  'teorias.html',
  'vercel.json',
]);

const PREVIEW_SOURCE_DIRECTORIES = Object.freeze([
  'Arquivo',
  'Constelacoes',
  'Contribuicoes',
  'GrandesNomes',
  'Laboratorio',
  'Mapa',
  'Rotas',
  'Teorias',
  'assets',
  'scripts',
]);

const MIME_TYPES = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

function isInside(parent, child) {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
}

async function copyTree(source, destination, {
  exclude = () => false,
  sourceRoot = source,
} = {}) {
  const relativePath = relative(sourceRoot, source).replaceAll('\\', '/');
  if (exclude(relativePath)) return;
  const info = await lstat(source);
  if (info.isSymbolicLink()) {
    throw new DashboardError('Link simbólico recusado no workspace de preview.', {
      code: 'preview-symlink-rejected',
      status: 422,
    });
  }
  if (info.isDirectory()) {
    await mkdir(destination, { recursive: true });
    const entries = await readdir(source);
    for (const entry of entries.sort((left, right) => left.localeCompare(right, 'en'))) {
      await copyTree(resolve(source, entry), resolve(destination, entry), {
        exclude,
        sourceRoot,
      });
    }
    return;
  }
  await mkdir(dirname(destination), { recursive: true });
  await new Promise((resolveCopy, reject) => {
    copyFile(source, destination, (error) => {
      if (error) reject(error);
      else resolveCopy();
    });
  });
}

function childEnvironment() {
  const environment = {};
  for (const key of [
    'COMSPEC',
    'ComSpec',
    'NUMBER_OF_PROCESSORS',
    'PATH',
    'PATHEXT',
    'SystemRoot',
    'TEMP',
    'TMP',
    'WINDIR',
  ]) {
    if (process.env[key] !== undefined) environment[key] = process.env[key];
  }
  environment.NODE_ENV = 'development';
  return environment;
}

function runNode(args, {
  cwd,
  label,
  logger,
  signal,
  timeoutMs = 3 * 60 * 1000,
}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(process.execPath, args, {
      cwd,
      env: childEnvironment(),
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    const chunks = [];
    let captured = 0;
    let settled = false;
    let timer = null;
    const collect = (chunk) => {
      if (captured >= 1024 * 1024) return;
      const remaining = 1024 * 1024 - captured;
      chunks.push(chunk.subarray(0, remaining));
      captured += Math.min(chunk.length, remaining);
    };
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      callback(value);
    };
    const abort = () => {
      child.kill();
      finish(reject, new DashboardError(`${label} foi cancelado.`, {
        code: 'preview-cancelled',
        status: 409,
      }));
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    timer = setTimeout(() => {
      child.kill();
      finish(reject, new DashboardError(`${label} excedeu o tempo limite.`, {
        code: 'preview-timeout',
        status: 504,
      }));
    }, timeoutMs);
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener('abort', abort, { once: true });
    child.once('error', (error) => {
      if (settled) return;
      logger?.error?.(error);
      finish(reject, new DashboardError(`${label} não pôde iniciar.`, {
        code: 'preview-process-error',
        status: 500,
      }));
    });
    child.once('exit', (code) => {
      if (settled) return;
      const output = Buffer.concat(chunks).toString('utf8');
      if (code !== 0) {
        logger?.error?.(`${label} falhou (${code}).\n${output}`);
        finish(reject, new DashboardError(`${label} falhou com código ${code ?? 1}.`, {
          code: 'preview-build-failed',
          status: 422,
        }));
        return;
      }
      finish(resolveRun, output);
    });
  });
}

export function previewHeaders(deploymentHeaders = {}) {
  const headers = {
    ...deploymentHeaders,
    'cache-control': 'no-store, max-age=0',
    'cross-origin-resource-policy': 'same-site',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-robots-tag': 'noindex, nofollow, noarchive',
  };
  const allowedAncestors =
    'frame-ancestors http://localhost:* http://127.0.0.1:* http://[::1]:*';
  const directives = String(headers['content-security-policy'] || '')
    .split(';')
    .map((directive) => directive.trim())
    .filter(Boolean)
    .filter((directive) => !/^frame-ancestors(?:\s|$)/i.test(directive));
  directives.push(allowedAncestors);
  headers['content-security-policy'] = directives.join('; ');
  delete headers['x-frame-options'];
  return headers;
}

function cookieValue(source, name) {
  return String(source || '')
    .split(';')
    .map((entry) => entry.trim().split('='))
    .find(([key]) => key === name)?.[1] || '';
}

export function previewCookieName(token) {
  const suffix = createHash('sha256')
    .update(String(token))
    .digest('hex')
    .slice(0, 24);
  return `editorial_preview_${suffix}`;
}

function safePreviewPath(distRoot, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0') || decoded.startsWith('//')) return null;
  const relativePath = decoded === '/'
    ? 'index.html'
    : decoded.replace(/^\/+/, '');
  const candidates = extname(relativePath)
    ? [relativePath]
    : [relativePath, `${relativePath}.html`, `${relativePath}/index.html`];
  return candidates.map((candidate) => {
    const path = resolve(distRoot, candidate);
    return isInside(distRoot, path) ? path : null;
  }).filter(Boolean);
}

async function startProtectedPreviewServer(distRoot, token, deploymentHeaders) {
  const cookieName = previewCookieName(token);
  let activePort = null;
  const server = createServer(async (request, response) => {
    const headers = previewHeaders(deploymentHeaders);
    const method = request.method || 'GET';
    const allowedHosts = new Set([
      `localhost:${activePort}`,
      `127.0.0.1:${activePort}`,
      `[::1]:${activePort}`,
    ]);
    if (
      !isLoopbackAddress(request.socket.remoteAddress)
      || !allowedHosts.has(String(request.headers.host || '').toLowerCase())
    ) {
      response.writeHead(403, headers);
      response.end();
      return;
    }
    if (!['GET', 'HEAD'].includes(method)) {
      response.writeHead(405, { ...headers, allow: 'GET, HEAD' });
      response.end();
      return;
    }

    const url = new URL(request.url || '/', `http://localhost:${activePort}`);
    if (url.pathname === `/__editorial-preview/open/${token}`) {
      const destination = url.searchParams.get('path') || '/';
      if (
        !destination.startsWith('/')
        || destination.startsWith('//')
        || destination.includes('\\')
      ) {
        response.writeHead(400, headers);
        response.end();
        return;
      }
      response.writeHead(303, {
        ...headers,
        location: destination,
        'set-cookie': `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/`,
      });
      response.end();
      return;
    }

    if (cookieValue(request.headers.cookie, cookieName) !== token) {
      response.writeHead(403, headers);
      response.end();
      return;
    }

    const candidates = safePreviewPath(distRoot, url.pathname);
    let filePath = null;
    let info = null;
    for (const candidate of candidates || []) {
      const candidateInfo = await lstat(candidate).catch(() => null);
      if (candidateInfo?.isFile() && !candidateInfo.isSymbolicLink()) {
        filePath = candidate;
        info = candidateInfo;
        break;
      }
    }
    if (!filePath || !info) {
      response.writeHead(404, {
        ...headers,
        'content-type': 'text/plain; charset=utf-8',
      });
      response.end(method === 'HEAD' ? undefined : 'Preview não encontrado.');
      return;
    }
    response.writeHead(200, {
      ...headers,
      'content-length': info.size,
      'content-type': MIME_TYPES.get(extname(filePath).toLowerCase())
        || 'application/octet-stream',
    });
    if (method === 'HEAD') response.end();
    else createReadStream(filePath).pipe(response);
  });

  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, 'localhost', resolveListen);
  });
  const address = server.address();
  activePort = typeof address === 'object' && address ? address.port : null;
  if (!activePort) {
    server.close();
    throw new Error('Servidor de preview não recebeu uma porta');
  }
  const origin = `http://localhost:${activePort}`;
  return {
    openUrl(path = '/') {
      return `${origin}/__editorial-preview/open/${token}?path=${encodeURIComponent(path)}`;
    },
    origin,
    server,
  };
}

function publicPreview(preview) {
  return {
    id: preview.id,
    workspaceId: preview.workspaceId,
    impactDigest: preview.impactDigest,
    workspaceVersion: preview.workspaceVersion,
    status: preview.status,
    createdAt: preview.createdAt,
    expiresAt: preview.expiresAt,
    ...(preview.openUrl ? { openUrl: preview.openUrl } : {}),
    ...(preview.error ? { error: preview.error } : {}),
  };
}

export function createPreviewService({
  contentLockPath = CONTENT_TRANSACTION_LOCK_PATH,
  logger = console,
  previewTtlMs = 30 * 60 * 1000,
  projectRoot = DASHBOARD_PROJECT_ROOT,
  workspaceStore,
  previewRoot = resolve(
    projectRoot,
    '.content-cache',
    'editorial-dashboard',
    'previews',
    randomUUID(),
  ),
} = {}) {
  if (!workspaceStore) throw new TypeError('Preview exige workspaceStore');
  const privateCacheRoot = resolve(projectRoot, '.content-cache', 'editorial-dashboard');
  const publicContentRoot = resolve(projectRoot, 'content', 'public');
  if (!isInside(privateCacheRoot, previewRoot)) {
    throw new Error('A raiz de preview precisa permanecer no cache privado');
  }
  const previews = new Map();

  async function assertSafePathChain(target) {
    if (!isInside(projectRoot, target) || isInside(publicContentRoot, target)) {
      throw new DashboardError('Caminho inseguro para preview.', {
        code: 'unsafe-preview-root',
        status: 500,
      });
    }
    let cursor = projectRoot;
    for (const segment of relative(projectRoot, target).split(/[\\/]/).filter(Boolean)) {
      cursor = resolve(cursor, segment);
      const info = await lstat(cursor).catch((error) => {
        if (error.code === 'ENOENT') return null;
        throw error;
      });
      if (info?.isSymbolicLink()) {
        throw new DashboardError('Link simbólico recusado no cache de preview.', {
          code: 'preview-symlink-rejected',
          status: 500,
        });
      }
      if (info && !info.isDirectory() && cursor !== target) {
        throw new DashboardError('O cache de preview possui um ancestral inválido.', {
          code: 'unsafe-preview-root',
          status: 500,
        });
      }
    }
  }

  const initialized = (async () => {
    await assertSafePathChain(previewRoot);
    await rm(previewRoot, { force: true, recursive: true });
    await mkdir(previewRoot, { recursive: true });
    await assertSafePathChain(previewRoot);
    const [
      resolvedCache,
      resolvedPreview,
      resolvedPublicContent,
    ] = await Promise.all([
      realpath(privateCacheRoot),
      realpath(previewRoot),
      realpath(publicContentRoot).catch(() => publicContentRoot),
    ]);
    if (
      !isInside(resolvedCache, resolvedPreview)
      || isInside(resolvedPublicContent, resolvedPreview)
    ) {
      throw new DashboardError('A raiz real de preview é insegura.', {
        code: 'unsafe-preview-root',
        status: 500,
      });
    }
  })();

  async function copyPreviewSources(shadowRoot) {
    await withFileLock(contentLockPath, async () => {
      for (const file of PREVIEW_SOURCE_FILES) {
        await copyTree(resolve(projectRoot, file), resolve(shadowRoot, file));
      }
      for (const directory of PREVIEW_SOURCE_DIRECTORIES) {
        await copyTree(
          resolve(projectRoot, directory),
          resolve(shadowRoot, directory),
          {
            sourceRoot: resolve(projectRoot, directory),
            exclude: (path) => (
              directory === 'scripts'
              && (
                path === 'theory-sources.mjs'
                || path.startsWith('tests/')
              )
            ),
          },
        );
      }
      await copyTree(
        resolve(projectRoot, 'content', 'public'),
        resolve(shadowRoot, 'content', 'public'),
      );
      await copyTree(
        resolve(projectRoot, 'content', 'schemas'),
        resolve(shadowRoot, 'content', 'schemas'),
      );
    }, {
      label: 'a captura de uma fonte consistente para preview',
      waitMs: 2 * 60 * 1000,
    });
  }

  async function disposePreview(preview) {
    preview.controller?.abort();
    clearTimeout(preview.timer);
    if (preview.server) {
      await new Promise((resolveClose) => preview.server.close(resolveClose));
    }
    await assertSafePathChain(preview.directory);
    await rm(preview.directory, {
      force: true,
      maxRetries: 5,
      recursive: true,
      retryDelay: 100,
    });
  }

  async function stopPreview(previewId, {
    clearWorkspaceState = true,
  } = {}) {
    const preview = previews.get(previewId);
    if (!preview) return false;
    previews.delete(previewId);
    await disposePreview(preview);
    if (clearWorkspaceState) {
      await workspaceStore.withWorkspaceLock(preview.workspaceId, () => (
        workspaceStore.clearPreviewUnlocked(preview.workspaceId, previewId)
      ));
    }
    return true;
  }

  async function disposeWorkspacePreviewUnlocked(workspaceId) {
    const matching = [...previews.values()]
      .find((preview) => preview.workspaceId === workspaceId);
    if (matching) {
      await stopPreview(matching.id, {
        clearWorkspaceState: false,
      });
    }
    return Boolean(matching);
  }

  async function invalidateWorkspacePreviewUnlocked(workspaceId) {
    const disposed = await disposeWorkspacePreviewUnlocked(workspaceId);
    const workspace = await workspaceStore.readWorkspaceUnlocked(workspaceId);
    if (workspace.lastPreview) {
      await workspaceStore.clearPreviewUnlocked(
        workspaceId,
        workspace.lastPreview.id,
      );
    }
    return Boolean(disposed || workspace.lastPreview);
  }

  async function createPreview(workspaceId, impactDigest) {
    await initialized;
    return workspaceStore.withWorkspaceLock(workspaceId, async () => {
      const workspace = await workspaceStore.readWorkspaceUnlocked(workspaceId);
      if (
        !workspace.lastImpact
        || workspace.lastImpact.allowed !== true
        || workspace.lastImpact.workspaceVersion !== workspace.version
        || workspace.lastImpact.digest !== impactDigest
      ) {
        throw new DashboardError('Execute e aprove uma análise atual antes do preview.', {
          code: 'stale-impact',
          status: 409,
        });
      }
      await invalidateWorkspacePreviewUnlocked(workspaceId);

      const previewId = randomUUID();
      const directory = resolve(previewRoot, previewId);
      const shadowRoot = resolve(directory, 'workspace');
      if (!isInside(previewRoot, directory)) throw new Error('Preview fora da raiz privada');
      await mkdir(shadowRoot, { recursive: true });
      await assertSafePathChain(shadowRoot);
      const preview = {
        id: previewId,
        workspaceId,
        impactDigest,
        workspaceVersion: workspace.version,
        status: 'building',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + previewTtlMs).toISOString(),
        directory,
        controller: new AbortController(),
        server: null,
        timer: null,
      };
      previews.set(previewId, preview);

      try {
        await copyPreviewSources(shadowRoot);
        const shadowWorkspace = resolve(
          shadowRoot,
          '.content-drafts',
          'editorial-dashboard',
          workspaceId,
        );
        await copyTree(
          workspaceStore.workspaceDirectory(workspaceId),
          shadowWorkspace,
        );
        const manifest = `.content-drafts/editorial-dashboard/${workspaceId}/manifest.json`;
        await runNode(
          ['scripts/content/cli.mjs', 'apply', '--manifest', manifest],
          {
            cwd: shadowRoot,
            label: 'A aplicação no workspace de preview',
            logger,
            signal: preview.controller.signal,
          },
        );
        await runNode(['scripts/build.mjs'], {
          cwd: shadowRoot,
          label: 'O build do preview',
          logger,
          signal: preview.controller.signal,
        });
        const token = randomBytes(32).toString('base64url');
        const vercel = JSON.parse(await readFile(
          resolve(shadowRoot, 'vercel.json'),
          'utf8',
        ));
        const deploymentHeaders = Object.fromEntries(
          (vercel.headers?.find(({ source }) => source === '/(.*)')?.headers || [])
            .map(({ key, value }) => [key.toLowerCase(), value]),
        );
        const protectedServer = await startProtectedPreviewServer(
          resolve(shadowRoot, 'dist'),
          token,
          deploymentHeaders,
        );
        preview.server = protectedServer.server;
        preview.openUrl = protectedServer.openUrl('/');
        preview.status = 'ready';
        preview.timer = setTimeout(() => {
          stopPreview(previewId).catch((error) => logger?.error?.(error));
        }, previewTtlMs);
        preview.timer.unref?.();
        await workspaceStore.recordPreviewUnlocked(workspaceId, {
          id: previewId,
          impactDigest,
          workspaceVersion: workspace.version,
          status: 'ready',
          createdAt: preview.createdAt,
          expiresAt: preview.expiresAt,
        });
        return publicPreview(preview);
      } catch (error) {
        preview.status = 'failed';
        preview.error = error instanceof DashboardError
          ? { code: error.code, message: error.message }
          : { code: 'preview-failed', message: 'O preview não pôde ser criado.' };
        previews.delete(previewId);
        await disposePreview(preview).catch((disposeError) => {
          logger?.error?.(disposeError);
        });
        await workspaceStore.clearPreviewUnlocked(workspaceId, previewId)
          .catch((clearError) => {
            logger?.error?.(clearError);
          });
        throw error;
      }
    });
  }

  function assertReady(workspaceId, previewState) {
    const preview = previews.get(previewState?.id);
    if (
      !preview
      || preview.workspaceId !== workspaceId
      || preview.status !== 'ready'
      || preview.impactDigest !== previewState?.impactDigest
      || preview.workspaceVersion !== previewState?.workspaceVersion
      || preview.expiresAt !== previewState?.expiresAt
      || Date.parse(preview.expiresAt) <= Date.now()
      || !preview.server?.listening
    ) {
      throw new DashboardError('O preview está desatualizado ou expirou.', {
        code: 'stale-preview',
        status: 409,
      });
    }
    return publicPreview(preview);
  }

  function getPreview(previewId, workspaceId) {
    const preview = previews.get(previewId);
    if (!preview || preview.workspaceId !== workspaceId) {
      throw new DashboardError('Preview não encontrado ou expirado.', {
        code: 'preview-not-found',
        status: 404,
      });
    }
    return publicPreview(preview);
  }

  async function stopWorkspacePreviewUnlocked(workspaceId, {
    clearWorkspaceState = true,
  } = {}) {
    if (!clearWorkspaceState) {
      return disposeWorkspacePreviewUnlocked(workspaceId);
    }
    return invalidateWorkspacePreviewUnlocked(workspaceId);
  }

  async function stopWorkspacePreview(workspaceId, options) {
    return workspaceStore.withWorkspaceLock(
      workspaceId,
      () => stopWorkspacePreviewUnlocked(workspaceId, options),
    );
  }

  async function close() {
    await Promise.all([...previews.keys()].map(stopPreview));
    await initialized.catch(() => {});
    await assertSafePathChain(previewRoot);
    await rm(previewRoot, {
      force: true,
      maxRetries: 5,
      recursive: true,
      retryDelay: 100,
    });
  }

  return Object.freeze({
    assertReady,
    close,
    createPreview,
    getPreview,
    invalidateWorkspacePreviewUnlocked,
    stopPreview,
    stopWorkspacePreview,
    stopWorkspacePreviewUnlocked,
  });
}
