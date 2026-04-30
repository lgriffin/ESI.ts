function sanitizeUrl(url?: string): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    const sensitiveParams = ['token', 'access_token', 'api_key'];
    for (const param of sensitiveParams) {
      if (parsed.searchParams.has(param)) {
        parsed.searchParams.set(param, '[REDACTED]');
      }
    }
    return parsed.toString();
  } catch {
    const qIndex = url.indexOf('?');
    return qIndex >= 0 ? url.substring(0, qIndex) + '?[params-redacted]' : url;
  }
}

export class EsiError extends Error {
  public readonly url?: string;

  constructor(
    public readonly statusCode: number,
    message: string,
    url?: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'EsiError';
    this.url = sanitizeUrl(url);
  }

  isRateLimited(): boolean {
    return this.statusCode === 420 || this.statusCode === 429;
  }

  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  isForbidden(): boolean {
    return this.statusCode === 403;
  }

  isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

export function isEsiError(error: unknown): error is EsiError {
  return error instanceof EsiError;
}

export function isRateLimited(error: unknown): error is EsiError {
  return error instanceof EsiError && error.isRateLimited();
}

export function isNotFound(error: unknown): error is EsiError {
  return error instanceof EsiError && error.isNotFound();
}

export function isUnauthorized(error: unknown): error is EsiError {
  return error instanceof EsiError && error.isUnauthorized();
}

export function isForbidden(error: unknown): error is EsiError {
  return error instanceof EsiError && error.isForbidden();
}

export function isServerError(error: unknown): error is EsiError {
  return error instanceof EsiError && error.isServerError();
}

export const buildError = (
  message: string,
  type: string = 'ERROR',
  url?: string,
): Error => {
  const error = new Error(`[${type}] ${message}`);
  if (url) {
    (error as Error & { url: string }).url = url;
  }
  return error;
};
