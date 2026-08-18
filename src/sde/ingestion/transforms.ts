export type SqliteValue = string | number | null;

export function extractLocale(
  field: unknown,
  locale: string = 'en',
  fallback: string = '',
): string {
  if (field == null) return fallback;
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && !Array.isArray(field)) {
    const map = field as Record<string, unknown>;
    // eslint-disable-next-line security/detect-object-injection
    const value = map[locale];
    if (typeof value === 'string') return value;
    return fallback;
  }
  return fallback;
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
    row[spec.idAttribute] =
      typeof entityId === 'string' ? entityId : Number(entityId);
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
