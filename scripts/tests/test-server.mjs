import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { get, request as httpRequest } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function readResponse(url, options = {}) {
  return new Promise((resolveResponse, reject) => {
    const method = options.method || 'GET';
    const request = method === 'GET'
      ? get(url)
      : httpRequest(url, { method }).end();
    request.on('response', (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolveResponse({
        body: Buffer.concat(chunks).toString('utf8'),
        headers: response.headers,
        status: response.statusCode,
      }));
    });
    request.on('error', reject);
  });
}

export async function startServer(flag, { environment = {} } = {}) {
  const child = spawn(process.execPath, ['scripts/serve.mjs', flag], {
    cwd: projectRoot,
    env: { ...process.env, ...environment, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  const origin = await new Promise((resolveOrigin, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Servidor não iniciou. Saída: ${output}`)), 8000);
    const collect = (chunk) => {
      output += chunk.toString();
      const match = output.match(/http:\/\/localhost:(\d+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolveOrigin(`http://localhost:${match[1]}`);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Servidor terminou antes do smoke test com código ${code}. Saída: ${output}`));
    });
  });

  return { child, origin };
}

export async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    once(child, 'exit'),
    new Promise((resolveWait) => setTimeout(resolveWait, 3000)),
  ]);
}
