import '../../scripts/check-node-version.cjs';
import { createReadStream } from 'node:fs';
import {
  lstat,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import {
  dirname,
  extname,
  isAbsolute,
  relative,
  resolve,
} from 'node:path';
import { fileURLToPath } from 'node:url';
import { acquireFileLock } from '../../scripts/content/file-lock.mjs';
import { createCatalogService } from './services/catalog-service.mjs';
import {
  DashboardError,
  publicErrorPayload,
} from './services/errors.mjs';
import { createEditorialWorkflow } from './services/editorial-workflow.mjs';
import { createPreviewService } from './services/preview-service.mjs';
import {
  createRequestSecurity,
  CSRF_HEADER,
  readJsonBody,
} from './services/security.mjs';
import { createWorkspaceStore } from './services/workspace-store.mjs';

const DASHBOARD_ROOT = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(DASHBOARD_ROOT, '..', '..');
const DEFAULT_PORT = 4174;

const APP_MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function isInside(parent, child) {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..') && !isAbsolute(path));
}

function sendJson(response, method, status, payload, headers) {
  const body = Buffer.from(`${JSON.stringify(payload)}\n`, 'utf8');
  response.writeHead(status, {
    ...headers,
    'content-length': body.length,
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(method === 'HEAD' ? undefined : body);
}

function sendEmpty(response, status, headers, extra = {}) {
  response.writeHead(status, { ...headers, ...extra });
  response.end();
}

function apiSuccess(data) {
  return { ok: true, data };
}

function routeMatch(pathname, pattern) {
  const match = pathname.match(pattern);
  if (!match) return null;
  try {
    return match.slice(1).map((value) => decodeURIComponent(value));
  } catch {
    throw new DashboardError('Parâmetro de rota inválido.', {
      code: 'invalid-route-parameter',
      status: 400,
    });
  }
}

function parseRequestUrl(request) {
  try {
    return new URL(request.url || '/', `http://${request.headers.host}`);
  } catch {
    throw new DashboardError('URL da requisição inválida.', {
      code: 'invalid-request-url',
      status: 400,
    });
  }
}

async function serveAppAsset({
  appRoot,
  headers,
  method,
  pathname,
  response,
}) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return false;
  }
  const requested = decoded === '/'
    ? 'index.html'
    : decoded.replace(/^\/app\//, '').replace(/^\/+/, '');
  if (
    !requested
    || requested.includes('\0')
    || requested.split('/').some((segment) => segment === '.' || segment === '..')
  ) return false;
  const path = resolve(appRoot, requested);
  if (!isInside(appRoot, path)) return false;
  const info = await lstat(path).catch(() => null);
  if (!info?.isFile() || info.isSymbolicLink()) return false;
  const type = APP_MIME_TYPES.get(extname(path).toLowerCase());
  if (!type) return false;
  response.writeHead(200, {
    ...headers,
    'content-length': info.size,
    'content-type': type,
  });
  if (method === 'HEAD') response.end();
  else createReadStream(path).pipe(response);
  return true;
}

export function createDashboardApplication({
  appRoot = resolve(DASHBOARD_ROOT, 'app'),
  bodyLimit,
  catalog = createCatalogService(),
  logger = console,
  previewService = null,
  security = createRequestSecurity(),
  workspaceStore = createWorkspaceStore(),
  workflow = null,
} = {}) {
  const activePreviewService = previewService || createPreviewService({
    logger,
    workspaceStore,
  });
  const activeWorkflow = workflow || createEditorialWorkflow({
    catalog,
    previewInvalidator: activePreviewService.invalidateWorkspacePreviewUnlocked,
    previewVerifier: activePreviewService.assertReady,
    workspaceStore,
  });

  async function dispatch(request, response) {
    const method = request.method || 'GET';
    const headers = security.headers;
    try {
      security.assertLoopbackRequest(request);
      if (!['DELETE', 'GET', 'HEAD', 'POST', 'PUT'].includes(method)) {
        sendEmpty(response, 405, headers, {
          allow: 'DELETE, GET, HEAD, POST, PUT',
        });
        return;
      }
      const url = parseRequestUrl(request);
      const pathname = url.pathname;
      const mutating = ['DELETE', 'POST', 'PUT'].includes(method);
      let body = null;
      if (mutating) {
        security.assertMutationRequest(request);
        body = await readJsonBody(request, {
          ...(bodyLimit === undefined ? {} : { limit: bodyLimit }),
        });
      }

      if (pathname === '/api/v1/session' && ['GET', 'HEAD'].includes(method)) {
        sendJson(response, method, 200, apiSuccess({
          csrfToken: security.csrfToken,
          csrfHeader: 'X-Editorial-CSRF',
          apiVersion: 1,
          capabilities: {
            entityTypes: ['theory', 'relation', 'reference', 'party'],
            preview: true,
            apply: true,
            git: false,
            deploy: false,
          },
        }), headers);
        return;
      }

      if (pathname === '/api/v1/overview' && ['GET', 'HEAD'].includes(method)) {
        sendJson(response, method, 200, apiSuccess(await catalog.overview()), headers);
        return;
      }

      if (pathname === '/api/v1/catalog' && ['GET', 'HEAD'].includes(method)) {
        const type = url.searchParams.get('type');
        const catalogLoaders = {
          party: () => catalog.listParties(),
          reference: () => catalog.listReferences(),
          theory: () => catalog.listTheories(),
        };
        if (!catalogLoaders[type]) {
          throw new DashboardError('Catálogo editorial não permitido.', {
            code: 'unsupported-catalog',
            status: 400,
          });
        }
        sendJson(response, method, 200, apiSuccess({
          type,
          items: await catalogLoaders[type](),
        }), headers);
        return;
      }

      const contentRoute = routeMatch(
        pathname,
        /^\/api\/v1\/content\/([^/]+)\/([^/]+)$/,
      );
      if (contentRoute && ['GET', 'HEAD'].includes(method)) {
        sendJson(
          response,
          method,
          200,
          apiSuccess(await catalog.getRecord(contentRoute[0], contentRoute[1])),
          headers,
        );
        return;
      }

      const schemaRoute = routeMatch(pathname, /^\/api\/v1\/schemas\/([^/]+)$/);
      if (schemaRoute && ['GET', 'HEAD'].includes(method)) {
        sendJson(
          response,
          method,
          200,
          apiSuccess(await catalog.getSchema(schemaRoute[0])),
          headers,
        );
        return;
      }

      if (pathname === '/api/v1/relation-types' && ['GET', 'HEAD'].includes(method)) {
        sendJson(response, method, 200, apiSuccess(await catalog.relationTypes()), headers);
        return;
      }

      if (pathname === '/api/v1/workspaces' && ['GET', 'HEAD'].includes(method)) {
        sendJson(
          response,
          method,
          200,
          apiSuccess({ items: await workspaceStore.listWorkspaces() }),
          headers,
        );
        return;
      }

      if (pathname === '/api/v1/workspaces' && method === 'POST') {
        if (body.type !== 'theory' || typeof body.id !== 'string') {
          throw new DashboardError('Informe type=theory e o ID da teoria.', {
            code: 'invalid-workspace-request',
            status: 422,
          });
        }
        sendJson(
          response,
          method,
          201,
          apiSuccess(await activeWorkflow.createTheoryWorkspace(body.id)),
          headers,
        );
        return;
      }

      const workspaceRoute = routeMatch(
        pathname,
        /^\/api\/v1\/workspaces\/([^/]+)$/,
      );
      if (workspaceRoute && ['GET', 'HEAD'].includes(method)) {
        const workspace = await workspaceStore.withWorkspaceLock(
          workspaceRoute[0],
          () => workspaceStore.readWorkspaceUnlocked(workspaceRoute[0]),
        );
        sendJson(
          response,
          method,
          200,
          apiSuccess(workspace),
          headers,
        );
        return;
      }
      if (workspaceRoute && method === 'DELETE') {
        await workspaceStore.withWorkspaceLock(
          workspaceRoute[0],
          async () => {
            await activePreviewService.stopWorkspacePreviewUnlocked(
              workspaceRoute[0],
              { clearWorkspaceState: false },
            );
            return workspaceStore.deleteWorkspaceUnlocked(workspaceRoute[0]);
          },
        );
        sendJson(response, method, 200, apiSuccess({ deleted: true }), headers);
        return;
      }

      const recordRoute = routeMatch(
        pathname,
        /^\/api\/v1\/workspaces\/([^/]+)\/record$/,
      );
      if (recordRoute && method === 'PUT') {
        const data = await workspaceStore.withWorkspaceLock(
          recordRoute[0],
          async () => {
            const saved = await workspaceStore.savePrimaryRecordUnlocked(recordRoute[0], {
              changeClass: body.changeClass ?? null,
              record: body.record,
              version: body.version,
            });
            await activePreviewService.invalidateWorkspacePreviewUnlocked?.(
              recordRoute[0],
            );
            return saved;
          },
        );
        sendJson(response, method, 200, apiSuccess(data), headers);
        return;
      }

      const relationRoute = routeMatch(
        pathname,
        /^\/api\/v1\/workspaces\/([^/]+)\/relations\/([^/]+)$/,
      );
      if (relationRoute && method === 'PUT') {
        sendJson(
          response,
          method,
          200,
          apiSuccess(await activeWorkflow.stageRelationDecision(
            relationRoute[0],
            relationRoute[1],
            body,
          )),
          headers,
        );
        return;
      }

      const operationRoute = routeMatch(
        pathname,
        /^\/api\/v1\/workspaces\/([^/]+)\/operations\/([^/]+)\/([^/]+)$/,
      );
      if (operationRoute && method === 'PUT') {
        sendJson(
          response,
          method,
          200,
          apiSuccess(await activeWorkflow.stageOperation(
            operationRoute[0],
            operationRoute[1],
            operationRoute[2],
            body,
          )),
          headers,
        );
        return;
      }

      const validateRoute = routeMatch(
        pathname,
        /^\/api\/v1\/workspaces\/([^/]+)\/validate$/,
      );
      if (validateRoute && method === 'POST') {
        sendJson(
          response,
          method,
          200,
          apiSuccess(await activeWorkflow.validateWorkspace(validateRoute[0])),
          headers,
        );
        return;
      }

      const impactRoute = routeMatch(
        pathname,
        /^\/api\/v1\/workspaces\/([^/]+)\/impact$/,
      );
      if (impactRoute && method === 'POST') {
        sendJson(
          response,
          method,
          200,
          apiSuccess(await activeWorkflow.analyzeWorkspace(impactRoute[0])),
          headers,
        );
        return;
      }

      const previewRoute = routeMatch(
        pathname,
        /^\/api\/v1\/workspaces\/([^/]+)\/preview$/,
      );
      if (previewRoute && method === 'POST') {
        sendJson(
          response,
          method,
          201,
          apiSuccess(await activePreviewService.createPreview(
            previewRoute[0],
            body.impactDigest,
          )),
          headers,
        );
        return;
      }
      if (previewRoute && ['GET', 'HEAD'].includes(method)) {
        const workspace = await workspaceStore.withWorkspaceLock(
          previewRoute[0],
          () => workspaceStore.readWorkspaceUnlocked(previewRoute[0]),
        );
        if (!workspace.lastPreview?.id) {
          throw new DashboardError('O workspace não possui preview ativo.', {
            code: 'preview-not-found',
            status: 404,
          });
        }
        sendJson(
          response,
          method,
          200,
          apiSuccess(activePreviewService.getPreview(
            workspace.lastPreview.id,
            previewRoute[0],
          )),
          headers,
        );
        return;
      }
      if (previewRoute && method === 'DELETE') {
        const stopped = await activePreviewService.stopWorkspacePreview(previewRoute[0]);
        sendJson(response, method, 200, apiSuccess({ stopped }), headers);
        return;
      }

      const applyRoute = routeMatch(
        pathname,
        /^\/api\/v1\/workspaces\/([^/]+)\/apply$/,
      );
      if (applyRoute && method === 'POST') {
        const applied = await activeWorkflow.applyWorkspace(applyRoute[0], body);
        if (applied.operationalWarning) {
          logger?.error?.(applied.operationalWarning.message);
        }
        await activePreviewService.stopWorkspacePreview(applyRoute[0])
          .catch((error) => logger?.error?.(error));
        sendJson(
          response,
          method,
          200,
          apiSuccess(applied),
          headers,
        );
        return;
      }

      if (pathname.startsWith('/api/')) {
        throw new DashboardError('Endpoint não encontrado.', {
          code: 'endpoint-not-found',
          status: 404,
        });
      }

      if (['GET', 'HEAD'].includes(method) && await serveAppAsset({
        appRoot,
        headers,
        method,
        pathname,
        response,
      })) return;

      sendJson(response, method, 404, {
        ok: false,
        error: {
          code: 'not-found',
          message: 'Recurso não encontrado.',
        },
      }, headers);
    } catch (error) {
      if (!(error instanceof DashboardError)) logger?.error?.(error);
      if (response.headersSent) {
        response.destroy();
        return;
      }
      const { payload, status } = publicErrorPayload(error);
      sendJson(response, method, status, payload, security.headers);
    }
  }

  return Object.freeze({
    close() {
      return activePreviewService.close();
    },
    dispatch,
    security,
  });
}

export function createDashboardServer({
  application = null,
  logger = console,
  port = DEFAULT_PORT,
  projectRoot = PROJECT_ROOT,
  security = null,
} = {}) {
  const activeSecurity = security || application?.security || createRequestSecurity({
    port: port === 0 ? null : port,
  });
  const activeApplication = application || createDashboardApplication({
    logger,
    security: activeSecurity,
  });
  const server = createServer(activeApplication.dispatch);
  server.headersTimeout = 10 * 1000;
  server.keepAliveTimeout = 5 * 1000;
  server.requestTimeout = 5 * 60 * 1000;
  let releaseServerLock = null;
  let listening = false;

  async function start() {
    if (listening) throw new Error('Dashboard já iniciada');
    releaseServerLock = await acquireFileLock(
      resolve(projectRoot, '.content-cache', 'editorial-dashboard', 'server.lock'),
      {
        label: 'a dashboard editorial local',
        waitMs: 1000,
      },
    );
    try {
      await new Promise((resolveListen, reject) => {
        server.once('error', reject);
        server.listen(port, 'localhost', resolveListen);
      });
    } catch (error) {
      await releaseServerLock();
      releaseServerLock = null;
      throw error;
    }
    const address = server.address();
    const activePort = typeof address === 'object' && address ? address.port : port;
    activeSecurity.setPort(activePort);
    listening = true;
    return {
      origin: `http://localhost:${activePort}`,
      port: activePort,
    };
  }

  async function close() {
    const closeErrors = [];
    if (listening) {
      try {
        await new Promise((resolveClose, rejectClose) => {
          server.close((error) => {
            if (error) rejectClose(error);
            else resolveClose();
          });
        });
      } catch (error) {
        closeErrors.push(error);
      } finally {
        listening = false;
      }
    }
    try {
      await activeApplication.close?.();
    } catch (error) {
      closeErrors.push(error);
    }
    if (releaseServerLock) {
      try {
        await releaseServerLock();
      } catch (error) {
        closeErrors.push(error);
      } finally {
        releaseServerLock = null;
      }
    }
    if (closeErrors.length) throw closeErrors[0];
  }

  return Object.freeze({
    application: activeApplication,
    close,
    security: activeSecurity,
    server,
    start,
  });
}

function configuredPort(environment = process.env) {
  const value = Number(environment.EDITORIAL_DASHBOARD_PORT || DEFAULT_PORT);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error('EDITORIAL_DASHBOARD_PORT precisa ser uma porta válida');
  }
  return value;
}

async function runDashboard() {
  if (process.env.VERCEL) {
    throw new Error('A dashboard editorial local não pode iniciar na Vercel');
  }
  const dashboard = createDashboardServer({
    port: configuredPort(),
  });
  const { origin } = await dashboard.start();
  console.log(`Dashboard editorial privada em ${origin}`);
  console.log(`Sessão local protegida pelo cabeçalho ${CSRF_HEADER}.`);
  const stop = async () => {
    await dashboard.close();
    process.exit(0);
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await runDashboard();
}
