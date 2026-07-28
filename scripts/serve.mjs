import './check-node-version.cjs';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  PUBLIC_BUILD_FILES,
  PUBLIC_REQUIRED_FILES,
  PUBLIC_ROUTES,
} from './public-manifest.mjs';
import { compileContent } from './content/compiler.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv.includes('--dist') ? 'dist' : 'source';
const configuredDistRoot = process.env.OBSERVATORIO_DIST_ROOT;
const root = mode === 'dist'
  ? resolve(configuredDistRoot || resolve(projectRoot, 'dist'))
  : projectRoot;
const deploymentHeadersEnabled = (
  mode === 'dist'
  && process.env.OBSERVATORIO_DEPLOY_HEADERS === '1'
);
const deploymentHeaders = deploymentHeadersEnabled
  ? Object.fromEntries(
    (
      JSON.parse(await readFile(resolve(projectRoot, 'vercel.json'), 'utf8'))
        .headers
        ?.find(({ source }) => source === '/(.*)')
        ?.headers || []
    ).map(({ key, value }) => [key.toLowerCase(), value]),
  )
  : {};
const host = 'localhost';
const requestedPort = Number(process.env.PORT || 5173);
const port = Number.isInteger(requestedPort) && requestedPort >= 0 && requestedPort <= 65535
  ? requestedPort
  : 5173;

if (mode === 'source') {
  await compileContent({ writeRuntime: true, writeIntegrityReport: true });
}

const runtimeDirectory = resolve(root, 'assets', 'data', 'generated', 'runtime');
const { PUBLICATIONS } = await import(
  pathToFileURL(resolve(runtimeDirectory, 'publications.js')).href
);
const { NOTABLE_FIGURES } = mode === 'source'
  ? await import(pathToFileURL(resolve(runtimeDirectory, 'notable-figures.js')).href)
  : { NOTABLE_FIGURES: [] };
const allowedSourceFiles = new Set([
  ...PUBLIC_BUILD_FILES,
  ...PUBLIC_REQUIRED_FILES,
  ...NOTABLE_FIGURES.map(({ portrait }) => portrait.src.split(/[?#]/, 1)[0]),
].map((path) => path.replaceAll('\\', '/').replace(/^\/+/, '')));

const mimeTypes = new Map([
  ['.avif', 'image/avif'],
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

const routeFiles = new Map();
for (const route of PUBLIC_ROUTES) {
  routeFiles.set(route.url, route.file);
  routeFiles.set(route.cleanUrl, route.file);
}
for (const publication of PUBLICATIONS) {
  for (const slug of [publication.slug, ...publication.aliases]) {
    const publicationFile = mode === 'dist'
      ? `Arquivo/publicacoes/${slug}.html`
      : 'Arquivo/publicacao.html';
    routeFiles.set(`/Arquivo/publicacoes/${slug}`, publicationFile);
    routeFiles.set(`/Arquivo/publicacoes/${slug}.html`, publicationFile);
  }
}

function normalizePublicPath(path) {
  return path.replaceAll('\\', '/').replace(/^\/+/, '');
}

function isInsideRoot(path) {
  const pathFromRoot = relative(root, path);
  return pathFromRoot === '' || (!pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot));
}

function isAllowedSourcePath(path) {
  const publicPath = normalizePublicPath(relative(projectRoot, path));
  return allowedSourceFiles.has(publicPath);
}

function resolveRequestPath(rawUrl) {
  const url = new URL(rawUrl, `http://${host}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const routeFile = routeFiles.get(decodedPath);
  const publicPath = routeFile || normalizePublicPath(decodedPath || 'index.html') || 'index.html';
  const filePath = resolve(root, publicPath);
  if (!isInsideRoot(filePath)) return null;
  if (mode === 'source' && !isAllowedSourcePath(filePath)) return null;
  return filePath;
}

async function sendNotFound(response, method) {
  const notFoundPath = resolve(root, 'index.html');
  const notFound = await readFile(notFoundPath).catch(() => Buffer.from('Página não encontrada.'));
  response.writeHead(404, {
    ...deploymentHeaders,
    'content-type': 'text/html; charset=utf-8',
    'x-content-type-options': 'nosniff',
  });
  response.end(method === 'HEAD' ? undefined : notFound);
}

const server = createServer(async (request, response) => {
  const method = request.method || 'GET';
  if (!['GET', 'HEAD'].includes(method)) {
    response.writeHead(405, { ...deploymentHeaders, allow: 'GET, HEAD' });
    response.end();
    return;
  }

  try {
    const filePath = resolveRequestPath(request.url || '/');
    const info = filePath ? await stat(filePath).catch(() => null) : null;
    if (!info?.isFile()) {
      await sendNotFound(response, method);
      return;
    }

    const type = mimeTypes.get(extname(filePath).toLowerCase()) || 'application/octet-stream';
    response.writeHead(200, {
      ...deploymentHeaders,
      'cache-control': type.startsWith('image/') ? 'public, max-age=86400' : 'no-cache',
      'content-length': info.size,
      'content-type': type,
      'x-content-type-options': 'nosniff',
    });
    if (method === 'HEAD') response.end();
    else createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(400, {
      ...deploymentHeaders,
      'content-type': 'text/plain; charset=utf-8',
      'x-content-type-options': 'nosniff',
    });
    response.end('Requisição inválida.');
  }
});

server.listen(port, host, () => {
  const address = server.address();
  const activePort = typeof address === 'object' && address ? address.port : port;
  const label = mode === 'dist' ? 'preview de dist' : 'desenvolvimento com allowlist pública';
  console.log(`Observatório de Ideias (${label}) em http://${host}:${activePort}`);
});

function stopServer() {
  server.close(() => process.exit(0));
}

process.once('SIGINT', stopServer);
process.once('SIGTERM', stopServer);
