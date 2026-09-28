/**
 * SDE ingestion transforms: properties of `src/sde/ingestion/transforms.ts`
 * and `metadata.ts`, the functions that turn CCP's YAML records into the
 * rows both providers serve (guides/SDE.md, tests/bdd/features/sde/0020,
 * 0023).
 *
 *   Field names   `ID` at a word boundary becomes `Id` (`solarSystemID` →
 *                 `solarSystemId`, `IDs` stays). Normalising is idempotent,
 *                 changes nothing but that suffix (same length, same spelling
 *                 case-insensitively), leaves no `ID` boundary behind, and is
 *                 reversible: a name with no `Id` boundary of its own comes
 *                 back from the inverse substitution.
 *   Locale        `extractLocale` always returns a string: the map's entry for
 *                 the locale when it is a string, the input when it is a
 *                 string, the fallback otherwise.
 *   Nesting       `transformRecordNative` renames keys and extracts locale
 *                 maps at any depth, through arrays and objects, and injects
 *                 the ID; a naive recursive model over the same raw record
 *                 predicts the row. `transformRecord` flattens the same
 *                 record to SQLite values: strings, numbers and null only,
 *                 booleans as 0/1, nested values as JSON that parses back.
 *   Metadata      `parseSdeMetadata` reads the build at the top level or
 *                 nested under `sde:`, the nested block winning, and turns a
 *                 missing field into an empty string.
 */
import * as fc from 'fast-check';
import { dump } from 'js-yaml';

import { parseSdeMetadata } from '../../src/sde/ingestion/metadata';
import {
  extractLocale,
  normalizeSdeFieldName,
  toSqliteValue,
  transformRecord,
  transformRecordNative,
} from '../../src/sde/ingestion/transforms';
import { loadJsYaml } from '../../src/sde/optionalPeers';
import { describeProperty, invariant } from './support/property';
import {
  LOCALES,
  denormalizeFieldName,
  localeMapArb,
  rawFieldNameArb,
  rawRecordArb,
} from './support/sde';

// ── Field names ─────────────────────────────────────────────────────────

type Normalize = typeof normalizeSdeFieldName;

const anyNameArb = fc.oneof(rawFieldNameArb, fc.string({ maxLength: 16 }));

describeProperty<Normalize>({
  name: 'SDE field-name normalisation is idempotent and reversible on the ID suffix',
  file: __filename,
  subject: () => normalizeSdeFieldName,
  mutants: {
    'renames only the first ID': () => (name) =>
      name.replace(/ID(?=[A-Z]|$)/, 'Id'),
    'renames ID inside a word too': () => (name) => name.replace(/ID/g, 'Id'),
    'lower-cases the suffix': () => (name) =>
      name.replace(/ID(?=[A-Z]|$)/g, 'id'),
  },
  property: (normalize) =>
    fc.property(rawFieldNameArb, anyNameArb, (raw, any) => {
      const once = normalize(raw);
      invariant(
        normalize(once) === once,
        `normalising "${raw}" twice gives "${normalize(once)}", once gives "${once}"`,
      );
      invariant(
        normalize(normalize(any)) === normalize(any),
        `normalising "${any}" is not idempotent`,
      );
      invariant(
        once.length === raw.length && once.toLowerCase() === raw.toLowerCase(),
        `"${raw}" became "${once}", which changes more than the ID suffix`,
      );
      invariant(
        !/ID(?=[A-Z]|$)/.test(once),
        `"${once}" still carries an ID boundary`,
      );
      invariant(
        denormalizeFieldName(once) === raw,
        `"${raw}" → "${once}" does not come back through Id → ID`,
      );
    }),
});

// ── Locale extraction ───────────────────────────────────────────────────

type ExtractLocale = typeof extractLocale;

// A map whose every locale entry is not a string: the only input that
// separates "return the entry" from "return the fallback", so it is drawn
// often enough that 200 runs cannot miss it (CI seed -1231326067 did).
const nonStringLocaleMapArb: fc.Arbitrary<Record<string, unknown>> = fc
  .oneof(fc.integer(), fc.boolean(), fc.constant({}), fc.constant([]))
  .map((value) => Object.fromEntries(LOCALES.map((l) => [l, value])));

const localeInputArb: fc.Arbitrary<unknown> = fc.oneof(
  { arbitrary: localeMapArb, weight: 3 },
  { arbitrary: nonStringLocaleMapArb, weight: 2 },
  { arbitrary: fc.string({ maxLength: 8 }), weight: 1 },
  { arbitrary: fc.anything(), weight: 2 },
);

function expectedLocale(
  field: unknown,
  locale: string,
  fallback: string,
): string {
  if (typeof field === 'string') return field;
  if (field !== null && typeof field === 'object' && !Array.isArray(field)) {
    const value = (field as Record<string, unknown>)[locale];
    return typeof value === 'string' ? value : fallback;
  }
  return fallback;
}

describeProperty<ExtractLocale>({
  name: 'SDE locale extraction always yields the locale string or the fallback',
  file: __filename,
  subject: () => extractLocale,
  mutants: {
    'returns whatever the map holds':
      () =>
      (field, locale = 'en', fallback = '') => {
        if (field == null) return fallback;
        if (typeof field === 'string') return field;
        if (typeof field === 'object' && !Array.isArray(field)) {
          return ((field as Record<string, unknown>)[locale] ??
            fallback) as string;
        }
        return fallback;
      },
    'always reads the English entry':
      () =>
      (field, _locale, fallback = '') =>
        extractLocale(field, 'en', fallback),
    'ignores the fallback':
      () =>
      (field, locale = 'en') =>
        extractLocale(field, locale, ''),
  },
  property: (extract) =>
    fc.property(
      localeInputArb,
      fc.constantFrom(...LOCALES),
      fc.string({ maxLength: 6 }),
      (field, locale, fallback) => {
        const result: unknown = extract(field, locale, fallback);
        invariant(
          typeof result === 'string',
          `extractLocale returned a ${typeof result} for ${JSON.stringify(field)}`,
        );
        const expected = expectedLocale(field, locale, fallback);
        invariant(
          result === expected,
          `extractLocale(${JSON.stringify(field)}, "${locale}", "${fallback}") gave ${JSON.stringify(result)}, expected ${JSON.stringify(expected)}`,
        );
      },
    ),
});

// ── Nested records ──────────────────────────────────────────────────────

interface RecordTransforms {
  native: typeof transformRecordNative;
  sqlite: typeof transformRecord;
}

const SPEC = { idAttribute: 'entityId', injectId: true } as const;

function isLocaleMap(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'en' in value
  );
}

/** The naive model of `transformRecordNative` over a raw value. */
function modelNative(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(modelNative);
  if (isLocaleMap(value)) return extractLocale(value);
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    out[normalizeSdeFieldName(key)] = modelNative(inner);
  }
  return out;
}

/** Top-level rename and locale extraction only: nested values untouched. */
function shallowNative(
  entityId: number | string,
  raw: Record<string, unknown>,
  spec: { idAttribute: string; injectId: boolean },
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (spec.injectId) row[spec.idAttribute] = entityId;
  for (const [key, value] of Object.entries(raw)) {
    row[normalizeSdeFieldName(key)] = isLocaleMap(value)
      ? extractLocale(value)
      : value;
  }
  return row;
}

function walkKeys(value: unknown, visit: (key: string) => void): void {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const inner of value) walkKeys(inner, visit);
    return;
  }
  for (const [key, inner] of Object.entries(value)) {
    visit(key);
    walkKeys(inner, visit);
  }
}

const entityIdArb = fc.oneof(
  fc.integer({ min: 1, max: 1_000_000 }),
  fc.string({ minLength: 1, maxLength: 6 }),
);

describeProperty<RecordTransforms>({
  name: 'SDE record transforms rename keys and extract locale maps at any depth',
  file: __filename,
  subject: () => ({ native: transformRecordNative, sqlite: transformRecord }),
  mutants: {
    'renames and extracts at the top level only': () => ({
      native: shallowNative,
      sqlite: transformRecord,
    }),
    'forgets to inject the ID': () => ({
      native: (id, raw) =>
        transformRecordNative(id, raw, { ...SPEC, injectId: false }),
      sqlite: transformRecord,
    }),
    'stores nested values as objects': () => ({
      native: transformRecordNative,
      sqlite: (id, raw, spec) => {
        const row = transformRecordNative(id, raw, spec);
        for (const [key, value] of Object.entries(row)) {
          if (typeof value === 'boolean') row[key] = value ? 1 : 0;
          if (value === undefined) row[key] = null;
        }
        return row as Record<string, string | number | null>;
      },
    }),
  },
  property: ({ native, sqlite }) =>
    fc.property(entityIdArb, rawRecordArb, (entityId, raw) => {
      const row = native(entityId, raw, SPEC);
      const expected = {
        [SPEC.idAttribute]: entityId,
        ...(modelNative(raw) as Record<string, unknown>),
      };
      expect(row).toEqual(expected);
      walkKeys(row, (key) => {
        invariant(
          !/ID(?=[A-Z]|$)/.test(key),
          `key "${key}" in the native row still carries an ID boundary`,
        );
      });

      // The SQLite row: one column per raw field, the same names, and a
      // value SQLite can hold. A nested value is stored as it came, as JSON.
      const flat = sqlite(entityId, raw, SPEC);
      invariant(
        flat[SPEC.idAttribute] === entityId,
        `the SQLite row carries ${JSON.stringify(flat[SPEC.idAttribute])} as its ID, not ${JSON.stringify(entityId)}`,
      );
      invariant(
        Object.keys(flat).length === Object.keys(row).length,
        `the SQLite row has ${Object.keys(flat).length} columns, the native row ${Object.keys(row).length} fields`,
      );
      for (const [rawKey, source] of Object.entries(raw)) {
        const key = normalizeSdeFieldName(rawKey);
        const value = flat[key];
        invariant(
          value === null ||
            typeof value === 'string' ||
            typeof value === 'number',
          `the SQLite row holds a ${typeof value} under "${key}"`,
        );
        if (isLocaleMap(source)) {
          invariant(
            value === extractLocale(source),
            `locale map under "${key}" became ${JSON.stringify(value)}`,
          );
        } else if (typeof source === 'boolean') {
          invariant(
            value === (source ? 1 : 0),
            `boolean ${source} under "${key}" became ${JSON.stringify(value)}`,
          );
        } else if (source !== null && typeof source === 'object') {
          invariant(
            typeof value === 'string',
            `nested value under "${key}" was not stored as JSON text`,
          );
          expect(JSON.parse(value)).toEqual(JSON.parse(JSON.stringify(source)));
        } else if (source === null) {
          invariant(
            value === null,
            `null under "${key}" became ${JSON.stringify(value)}`,
          );
        } else {
          invariant(
            value === (source as string | number),
            `${typeof source} ${JSON.stringify(source)} under "${key}" became ${JSON.stringify(value)}`,
          );
        }
      }
    }),
});

// ── toSqliteValue on anything ───────────────────────────────────────────

type ToSqlite = typeof toSqliteValue;

/** Describe any generated value without calling its own toString. */
function show(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return `<${typeof value}>`;
  }
}

describeProperty<ToSqlite>({
  name: 'SDE SQLite values are always a string, a number or null',
  file: __filename,
  subject: () => toSqliteValue,
  mutants: {
    'passes booleans through': () => (value) =>
      typeof value === 'boolean'
        ? (value as unknown as number)
        : toSqliteValue(value),
    'passes undefined through': () => (value) =>
      value === undefined ? (value as unknown as null) : toSqliteValue(value),
  },
  property: (toSqlite) =>
    fc.property(fc.anything(), (value) => {
      const result: unknown = toSqlite(value);
      invariant(
        result === null ||
          typeof result === 'string' ||
          typeof result === 'number',
        `toSqliteValue(${show(value)}) returned a ${typeof result}`,
      );
      if (typeof value === 'boolean') {
        invariant(
          result === (value ? 1 : 0),
          `boolean ${value} became ${result}`,
        );
      }
      if (value === null || value === undefined) {
        invariant(result === null, `${show(value)} became ${result}`);
      }
    }),
});

// ── Metadata ────────────────────────────────────────────────────────────

type ParseMetadata = typeof parseSdeMetadata;

const metadataValueArb = fc.option(
  fc.oneof(
    fc.integer({ min: 1, max: 99_999_999 }),
    fc.string({ minLength: 1, maxLength: 12 }).filter((s) => s.trim() === s),
  ),
  { nil: undefined },
);

const metadataBlockArb = fc.record(
  { buildNumber: metadataValueArb, releaseDate: metadataValueArb },
  { requiredKeys: [] },
);

type Block = { buildNumber?: string | number; releaseDate?: string | number };

const layoutArb = fc.oneof(
  fc.record({ kind: fc.constant('top' as const), top: metadataBlockArb }),
  fc.record({ kind: fc.constant('nested' as const), nested: metadataBlockArb }),
  fc.record({
    kind: fc.constant('both' as const),
    top: metadataBlockArb,
    nested: metadataBlockArb,
  }),
);

function present(block: Block): Block {
  const out: Block = {};
  if (block.buildNumber !== undefined) out.buildNumber = block.buildNumber;
  if (block.releaseDate !== undefined) out.releaseDate = block.releaseDate;
  return out;
}

type MetadataValue = string | number | undefined;

function asText(value: MetadataValue): string {
  return value === undefined ? '' : String(value);
}

describeProperty<ParseMetadata>({
  name: 'SDE metadata is read from the top level or the nested sde block, nested first',
  file: __filename,
  subject: () => parseSdeMetadata,
  mutants: {
    'reads the top level only': () => (content) => {
      const parsed = loadJsYaml().load(content) as Record<string, unknown>;
      return {
        buildNumber: asText(parsed.buildNumber as MetadataValue),
        releaseDate: asText(parsed.releaseDate as MetadataValue),
      };
    },
    'lets the top level win': () => (content) => {
      const parsed = loadJsYaml().load(content) as Record<string, unknown>;
      const nested = (parsed.sde ?? {}) as Block;
      return {
        buildNumber: asText(
          (parsed.buildNumber as MetadataValue) ?? nested.buildNumber,
        ),
        releaseDate: asText(
          (parsed.releaseDate as MetadataValue) ?? nested.releaseDate,
        ),
      };
    },
  },
  property: (parse) =>
    fc.property(layoutArb, (layout) => {
      const top = 'top' in layout ? present(layout.top) : {};
      const nested = 'nested' in layout ? present(layout.nested) : undefined;
      const document: Record<string, unknown> = { ...top };
      if (nested) document.sde = nested;
      const content = dump(document);
      const expected = {
        buildNumber: asText((nested ?? top).buildNumber),
        releaseDate: asText((nested ?? top).releaseDate),
      };
      expect(parse(content)).toEqual(expected);
    }),
});
