import { buildError } from './error';

const UNSAFE_PATH_CHARS = /[/\\?#@!$&'()*+,;=<>{}|^`]/;

export function validatePathParam(paramName: string, value: unknown): string {
  if (value === null || value === undefined || value === '') {
    throw buildError(
      `Path parameter '${paramName}' must not be empty`,
      'VALIDATION_ERROR',
    );
  }

  const str = `${value as string | number}`;

  if (UNSAFE_PATH_CHARS.test(str)) {
    throw buildError(
      `Path parameter '${paramName}' contains invalid characters`,
      'VALIDATION_ERROR',
    );
  }

  // A lone `.` or `..` survives encodeURIComponent and is collapsed by URL
  // resolution, so `characters/../assets/` would reach `/assets/`.
  if (str === '.' || str === '..') {
    throw buildError(
      `Path parameter '${paramName}' must not be a dot segment`,
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

  const str = `${value as string | number}`;

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

/** Printable ASCII and tab: a header value fetch accepts on every runtime. */
const HEADER_VALUE = /^[\t\x20-\x7e]+$/;

/**
 * A client option that becomes a request header (`tenant`, `userAgent`). fetch
 * rejects a value holding a control character on every request, so the value
 * is refused once, where it was configured.
 */
export function validateHeaderOption(option: string, value: string): string {
  if (!HEADER_VALUE.test(value)) {
    throw buildError(
      `${option} must be printable ASCII with no line breaks or control characters`,
      'VALIDATION_ERROR',
    );
  }
  return value;
}
