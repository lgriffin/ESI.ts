import { buildError } from './error';

const UNSAFE_PATH_CHARS = /[/\\?#@!$&'()*+,;=<>{}|^`]/;

export function validatePathParam(paramName: string, value: unknown): string {
  if (value === null || value === undefined || value === '') {
    throw buildError(
      `Path parameter '${paramName}' must not be empty`,
      'VALIDATION_ERROR',
    );
  }

  const str = String(value);

  if (UNSAFE_PATH_CHARS.test(str)) {
    throw buildError(
      `Path parameter '${paramName}' contains invalid characters`,
      'VALIDATION_ERROR',
    );
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw buildError(
      `Path parameter '${paramName}' must be a finite number`,
      'VALIDATION_ERROR',
    );
  }

  return str;
}

const ALLOWED_ESI_HOSTS = ['esi.evetech.net'];

export function validateBaseUrl(
  url: string,
  allowCustomHost?: boolean,
): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw buildError(`Invalid base URL: ${url}`, 'VALIDATION_ERROR');
  }

  if (parsed.protocol !== 'https:') {
    throw buildError('Base URL must use HTTPS protocol', 'VALIDATION_ERROR');
  }

  if (!allowCustomHost && !ALLOWED_ESI_HOSTS.includes(parsed.hostname)) {
    throw buildError(
      `Base URL host '${parsed.hostname}' is not in the allowlist. ` +
        `Allowed hosts: ${ALLOWED_ESI_HOSTS.join(', ')}. ` +
        `Set unsafeAllowCustomHost to bypass this check.`,
      'VALIDATION_ERROR',
    );
  }

  return url.replace(/\/$/, '');
}

export function validateQueryParam(paramName: string, value: unknown): string {
  if (value === null || value === undefined) {
    throw buildError(
      `Query parameter '${paramName}' must not be null or undefined`,
      'VALIDATION_ERROR',
    );
  }

  const str = String(value);

  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw buildError(
      `Query parameter '${paramName}' must be a finite number`,
      'VALIDATION_ERROR',
    );
  }

  if (str.length > 2000) {
    throw buildError(
      `Query parameter '${paramName}' exceeds maximum length`,
      'VALIDATION_ERROR',
    );
  }

  return str;
}
