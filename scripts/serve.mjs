import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 5173);

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.md', 'text/markdown; charset=utf-8'],
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const target = normalize(decoded === '/' ? '/index.html' : decoded);
  const absolute = resolve(join(root, target));
  if (!absolute.startsWith(root)) return null;
  return absolute;
}

const server = createServer(async (request, response) => {
  try {
    const filePath = safePath(request.url || '/');
    if (!filePath) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    const info = await stat(filePath).catch(() => null);
    if (!info || !info.isFile()) {
      const notFound = await readFile(join(root, 'index.html'));
      response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      response.end(notFound);
      return;
    }

    const type = mimeTypes.get(extname(filePath)) || 'application/octet-stream';
    response.writeHead(200, {
      'content-type': type,
      'cache-control': type.startsWith('image/') ? 'public, max-age=86400' : 'no-cache',
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(`Internal Server Error: ${error.message}`);
  }
});

server.listen(port, () => {
  console.log(`Observatório de Ideias em http://localhost:${port}`);
});
