const API_ROOT = '/api/v1';

let csrfToken = '';

export class EditorialApiError extends Error {
  constructor(message, {
    code = 'request-failed',
    details = null,
    status = 0,
  } = {}) {
    super(message);
    this.name = 'EditorialApiError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

function endpoint(path) {
  return `${API_ROOT}${path}`;
}

function encodeSegment(value) {
  return encodeURIComponent(String(value));
}

function isMutation(method) {
  return !['GET', 'HEAD'].includes(method);
}

async function readResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }
  const text = await response.text().catch(() => '');
  return text ? { ok: response.ok, data: text } : null;
}

async function request(path, {
  body,
  method = 'GET',
  signal,
} = {}) {
  const normalizedMethod = method.toUpperCase();
  const headers = new Headers({
    Accept: 'application/json',
  });

  if (isMutation(normalizedMethod)) {
    if (!csrfToken) {
      throw new EditorialApiError(
        'A sessão local ainda não está pronta para alterações.',
        { code: 'missing-csrf-token' },
      );
    }
    headers.set('Content-Type', 'application/json');
    headers.set('X-Editorial-CSRF', csrfToken);
  }

  let response;
  try {
    response = await fetch(endpoint(path), {
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      credentials: 'same-origin',
      headers,
      method: normalizedMethod,
      redirect: 'error',
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new EditorialApiError(
      'Não foi possível alcançar o processo editorial local.',
      {
        code: 'network-error',
        details: error.message,
      },
    );
  }

  const payload = await readResponse(response);
  const envelopeError = payload?.ok === false ? payload.error : null;
  if (!response.ok || envelopeError) {
    throw new EditorialApiError(
      envelopeError?.message
        || (typeof payload?.data === 'string' ? payload.data : '')
        || `A operação local falhou com status ${response.status}.`,
      {
        code: envelopeError?.code || `http-${response.status}`,
        details: envelopeError?.details || null,
        status: response.status,
      },
    );
  }

  if (payload?.ok === true && Object.hasOwn(payload, 'data')) return payload.data;
  return payload?.data ?? payload ?? null;
}

export function setEditorialCsrfToken(token) {
  csrfToken = typeof token === 'string' ? token : '';
}

export const editorialApi = Object.freeze({
  session({ signal } = {}) {
    return request('/session', { signal });
  },

  overview({ signal } = {}) {
    return request('/overview', { signal });
  },

  catalog(type = 'theory', { signal } = {}) {
    return request(`/catalog?type=${encodeURIComponent(type)}`, { signal });
  },

  content(type, id, { signal } = {}) {
    return request(`/content/${encodeSegment(type)}/${encodeSegment(id)}`, { signal });
  },

  schema(type, { signal } = {}) {
    return request(`/schemas/${encodeSegment(type)}`, { signal });
  },

  relationTypes({ signal } = {}) {
    return request('/relation-types', { signal });
  },

  createWorkspace(type, id, { signal } = {}) {
    return request('/workspaces', {
      body: { type, id },
      method: 'POST',
      signal,
    });
  },

  workspaces({ signal } = {}) {
    return request('/workspaces', { signal });
  },

  workspace(workspaceId, { signal } = {}) {
    return request(`/workspaces/${encodeSegment(workspaceId)}`, { signal });
  },

  deleteWorkspace(workspaceId, { signal } = {}) {
    return request(`/workspaces/${encodeSegment(workspaceId)}`, {
      body: {},
      method: 'DELETE',
      signal,
    });
  },

  saveWorkspaceRecord(workspaceId, {
    changeClass,
    record,
    version,
  }, { signal } = {}) {
    return request(`/workspaces/${encodeSegment(workspaceId)}/record`, {
      body: { changeClass, record, version },
      method: 'PUT',
      signal,
    });
  },

  validateWorkspace(workspaceId, { signal } = {}) {
    return request(`/workspaces/${encodeSegment(workspaceId)}/validate`, {
      body: {},
      method: 'POST',
      signal,
    });
  },

  impactWorkspace(workspaceId, { signal } = {}) {
    return request(`/workspaces/${encodeSegment(workspaceId)}/impact`, {
      body: {},
      method: 'POST',
      signal,
    });
  },

  saveRelationDecision(workspaceId, relationId, decision, { signal } = {}) {
    return request(
      `/workspaces/${encodeSegment(workspaceId)}/relations/${encodeSegment(relationId)}`,
      {
        body: decision,
        method: 'PUT',
        signal,
      },
    );
  },

  createPreview(workspaceId, impactDigest, { signal } = {}) {
    return request(`/workspaces/${encodeSegment(workspaceId)}/preview`, {
      body: { impactDigest },
      method: 'POST',
      signal,
    });
  },

  preview(workspaceId, { signal } = {}) {
    return request(`/workspaces/${encodeSegment(workspaceId)}/preview`, { signal });
  },

  deletePreview(workspaceId, { signal } = {}) {
    return request(`/workspaces/${encodeSegment(workspaceId)}/preview`, {
      body: {},
      method: 'DELETE',
      signal,
    });
  },

  applyWorkspace(workspaceId, {
    confirmation,
    impactDigest,
  }, { signal } = {}) {
    return request(`/workspaces/${encodeSegment(workspaceId)}/apply`, {
      body: { confirmation, impactDigest },
      method: 'POST',
      signal,
    });
  },
});
