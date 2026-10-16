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

function isLocaleMap(value: unknown): value is Record<string, string> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return 'en' in (value as Record<string, unknown>);
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
