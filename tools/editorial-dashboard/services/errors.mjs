export class DashboardError extends Error {
  constructor(message, {
    code = 'dashboard-error',
    details = null,
    status = 400,
  } = {}) {
    super(message);
    this.name = 'DashboardError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export function dashboardError(message, options) {
  return new DashboardError(message, options);
}

export function assertDashboard(condition, message, options) {
  if (!condition) throw dashboardError(message, options);
}

export function publicErrorPayload(error) {
  if (error instanceof DashboardError) {
    return {
      status: error.status,
      payload: {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details === null ? {} : { details: error.details }),
        },
      },
    };
  }
  return {
    status: 500,
    payload: {
      ok: false,
      error: {
        code: 'internal-error',
        message: 'A operação não pôde ser concluída. Consulte o terminal da dashboard.',
      },
    },
  };
}

export function sanitizeDiagnostics(error) {
  return String(error?.message || error || '')
    .split('\n')
    .map((line) => line
      .replace(/[A-Za-z]:[\\/][^\s"'`]+/g, '[caminho privado]')
      .replace(/\/(?:home|Users|private|tmp|var)\/[^\s"'`]+/g, '[caminho privado]')
      .replace(/^[\s-]+/, '')
      .trim())
    .filter(Boolean)
    .slice(0, 100);
}
