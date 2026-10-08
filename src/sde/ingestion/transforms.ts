export type SqliteValue = string | number | null;

export function extractLocale(
  field: unknown,
  locale: string = 'en',
  fallback: string = '',
): string {
  if (field == null) return fallback;
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) return fallback;
  // Any other value is read as a locale map; a number or boolean has no
  // locale keys, so it falls through to the fallback.
  // eslint-disable-next-line security/detect-object-injection
  const value = (field as Record<string, unknown>)[locale];
  return typeof value === 'string' ? value : fallback;
}

export function normalizeSdeFieldName(name: string): string {
  return name.replace(/ID(?=[A-Z]|$)/g, 'Id');
}

// eslint-disable-next-line sonarjs/function-return-type -- union return is intentional
export function toSqliteValue(value: unknown): SqliteValue {
  if (value == null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return null;
}

function isLocaleMap(value: unknown): value is Record<string, string> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return 'en' in (value as Record<string, unknown>);
}

export function transformRecord(
  entityId: number | string,
  raw: Record<string, unknown>,
  spec: { idAttribute: string; injectId: boolean },
): Record<string, SqliteValue> {
  const row: Record<string, SqliteValue> = {};

  if (spec.injectId) {
    row[spec.idAttribute] = entityId;
  }

  for (const [key, value] of Object.entries(raw)) {
    const normalizedKey = normalizeSdeFieldName(key);

    if (isLocaleMap(value)) {
      row[normalizedKey] = extractLocale(value);
    } else {
      row[normalizedKey] = toSqliteValue(value);
    }
  }

  return row;
}

function normalizeNested(value: unknown): unknown {
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(normalizeNested);
  const obj = value as Record<string, unknown>;
  if (isLocaleMap(obj)) return extractLocale(obj);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[normalizeSdeFieldName(k)] = normalizeNested(v);
  }
  return out;
}

export function transformRecordNative(
  entityId: number | string,
  raw: Record<string, unknown>,
  spec: { idAttribute: string; injectId: boolean },
): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  if (spec.injectId) {
    row[spec.idAttribute] = entityId;
  }

  for (const [key, value] of Object.entries(raw)) {
    row[normalizeSdeFieldName(key)] = normalizeNested(value);
  }

  return row;
}
