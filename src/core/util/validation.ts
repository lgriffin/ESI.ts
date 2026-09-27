import { EsiConfigurationError } from './error';

const UNSAFE_PATH_CHARS = /[/\\?#@!$&'()*+,;=<>{}|^`]/;

export function validatePathParam(paramName: string, value: unknown): string {
  const str =
    value === null || value === undefined ? '' : `${value as string | number}`;

  // Checked on the string form: an empty array stringifies to '' too, and
  // would otherwise leave an empty path segment.
  if (str === '') {
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      `Path parameter '${paramName}' must not be empty`,
    );
  }

  if (UNSAFE_PATH_CHARS.test(str)) {
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      `Path parameter '${paramName}' contains invalid characters`,
    );
  }

  // A lone `.` or `..` survives encodeURIComponent and is collapsed by URL
  // resolution, so `characters/../assets/` would reach `/assets/`.
  if (str === '.' || str === '..') {
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      `Path parameter '${paramName}' must not be a dot segment`,
    );
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      `Path parameter '${paramName}' must be a finite number`,
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
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      `Invalid base URL: ${url}`,
    );
  }

  if (parsed.protocol !== 'https:') {
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      'Base URL must use HTTPS protocol',
    );
  }

  if (!allowCustomHost && !ALLOWED_ESI_HOSTS.includes(parsed.hostname)) {
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      `Base URL host '${parsed.hostname}' is not in the allowlist. ` +
        `Allowed hosts: ${ALLOWED_ESI_HOSTS.join(', ')}. ` +
        `Set unsafeAllowCustomHost to bypass this check.`,
    );
  }

  return url.replace(/\/$/, '');
}

export function validateQueryParam(paramName: string, value: unknown): string {
  if (value === null || value === undefined) {
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      `Query parameter '${paramName}' must not be null or undefined`,
    );
  }

  const str = `${value as string | number}`;

  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      `Query parameter '${paramName}' must be a finite number`,
    );
  }

  if (str.length > 2000) {
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      `Query parameter '${paramName}' exceeds maximum length`,
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
    throw new EsiConfigurationError(
      'VALIDATION_ERROR',
      `${option} must be printable ASCII with no line breaks or control characters`,
    );
  }
  return value;
}
