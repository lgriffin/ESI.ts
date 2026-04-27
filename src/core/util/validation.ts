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
