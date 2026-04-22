export class EsiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly url?: string,
  ) {
    super(message);
    this.name = 'EsiError';
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
