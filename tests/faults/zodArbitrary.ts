/**
 * fast-check arbitraries derived from the Zod response schemas, and the
 * single-point mutations the nightly payload fuzz applies to what they
 * generate.
 *
 * Only the Zod constructs the response schemas use are supported. Anything
 * else throws, naming the construct and the path, so a new construct fails
 * the nightly run instead of being skipped.
 */
import * as fc from 'fast-check';
import type { z } from 'zod';

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Path = (string | number)[];

interface Def {
  type: string;
  shape?: Record<string, z.ZodType>;
  catchall?: z.ZodType;
  element?: z.ZodType;
  options?: z.ZodType[];
  entries?: Record<string, string | number>;
  values?: unknown[];
  innerType?: z.ZodType;
  keyType?: z.ZodType;
  valueType?: z.ZodType;
}

const defOf = (schema: z.ZodType): Def =>
  (schema as unknown as { _zod: { def: Def } })._zod.def;

const unsupported = (def: Def, path: Path): never => {
  throw new Error(
    `zodArbitrary: unsupported Zod type "${def.type}" at ${formatPath(path)}; add it to tests/faults/zodArbitrary.ts`,
  );
};

export const formatPath = (path: Path): string =>
  path.length === 0 ? '(root)' : path.map(String).join('.');

/** A finite number that survives a JSON round trip unchanged (no -0). */
const jsonNumber = fc
  .oneof(
    fc.integer({ min: -2_000_000_000, max: 2_000_000_000 }),
    fc.double({ noNaN: true, noDefaultInfinity: true, min: -1e12, max: 1e12 }),
  )
  .map((n) => (Object.is(n, -0) ? 0 : n));

const jsonLeaf: fc.Arbitrary<Json> = fc.oneof(
  fc.string({ maxLength: 8 }),
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
);

/** An arbitrary of JSON values the schema accepts. */
export function arbitraryFor(
  schema: z.ZodType,
  path: Path = [],
): fc.Arbitrary<Json> {
  const def = defOf(schema);
  switch (def.type) {
    case 'string':
      return fc.string({ maxLength: 12 });
    case 'number':
      return jsonNumber;
    case 'boolean':
      return fc.boolean();
    case 'unknown':
      return fc.oneof(
        jsonLeaf,
        fc.dictionary(fc.string({ maxLength: 4 }), jsonLeaf, { maxKeys: 2 }),
      );
    case 'enum':
      return fc.constantFrom(...(Object.values(def.entries!) as Json[]));
    case 'literal':
      return fc.constantFrom(...(def.values as Json[]));
    case 'nullable':
      return fc.option(arbitraryFor(def.innerType!, path), {
        nil: null,
        freq: 4,
      });
    case 'optional':
      return arbitraryFor(def.innerType!, path);
    case 'union':
      return fc.oneof(...def.options!.map((o) => arbitraryFor(o, path)));
    case 'array':
      return fc.array(arbitraryFor(def.element!, [...path, 0]), {
        minLength: 1,
        maxLength: 3,
      });
    case 'record':
      return fc.dictionary(
        fc.string({ minLength: 1, maxLength: 6 }),
        arbitraryFor(def.valueType!, [...path, '*']),
        { minKeys: 1, maxKeys: 3 },
      ) as fc.Arbitrary<Json>;
    case 'object': {
      const shape = def.shape!;
      const arbs: Record<string, fc.Arbitrary<Json>> = {};
      const required: string[] = [];
      for (const [key, field] of Object.entries(shape)) {
        arbs[key] = arbitraryFor(field, [...path, key]);
        if (defOf(field).type !== 'optional') required.push(key);
      }
      return fc.record(arbs, { requiredKeys: required }) as fc.Arbitrary<Json>;
    }
    default:
      return unsupported(def, path);
  }
}

export type MutationKind =
  'drop-field' | 'wrong-type' | 'null' | 'unknown-field';

export interface Mutation {
  kind: MutationKind;
  /** Where the mutation applies; for unknown-field, the object that gains it. */
  path: Path;
}

/** A value of a different JSON type, for each base type. */
const WRONG: Record<string, Json> = {
  string: 424242,
  number: 'not-a-number',
  boolean: 'yes',
  enum: 424242,
  array: { not: 'an array' },
  object: 'not an object',
};

const unwrapOptional = (schema: z.ZodType): z.ZodType => {
  const def = defOf(schema);
  return def.type === 'optional' ? unwrapOptional(def.innerType!) : schema;
};

/**
 * Every single-point mutation that applies to `value`, which `schema`
 * accepts. Wrong-type and null mutations are offered only where the result
 * is invalid by construction (no union, unknown or nullable at that point).
 */
export function mutationsFor(
  schema: z.ZodType,
  value: Json,
  path: Path = [],
): Mutation[] {
  const def = defOf(schema);
  const out: Mutation[] = [];
  if (def.type in WRONG) out.push({ kind: 'wrong-type', path });
  if (
    def.type !== 'nullable' &&
    def.type !== 'unknown' &&
    def.type !== 'union'
  ) {
    out.push({ kind: 'null', path });
  }

  if (def.type === 'nullable' && value !== null) {
    return mutationsFor(def.innerType!, value, path).filter(
      (m) => m.kind !== 'null' || m.path !== path,
    );
  }
  if (def.type === 'array' && Array.isArray(value) && value.length > 0) {
    out.push(...mutationsFor(def.element!, value[0]!, [...path, 0]));
  }
  if (
    def.type === 'object' &&
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    out.push({ kind: 'unknown-field', path });
    for (const [key, field] of Object.entries(def.shape!)) {
      if (!(key in value)) continue;
      const inner = unwrapOptional(field);
      if (defOf(field).type !== 'optional')
        out.push({ kind: 'drop-field', path: [...path, key] });
      out.push(...mutationsFor(inner, value[key]!, [...path, key]));
    }
  }
  return out;
}

export const UNKNOWN_FIELD = 'x_fault_unknown_field';

/** Apply `mutation` to a deep copy of `value`. */
export function applyMutation(
  schema: z.ZodType,
  value: Json,
  mutation: Mutation,
): Json {
  const copy = JSON.parse(JSON.stringify(value)) as Json;
  const { path, kind } = mutation;
  if (path.length === 0 && kind !== 'unknown-field') {
    return kind === 'null' ? null : WRONG[baseType(schema, [])]!;
  }
  const parentPath = kind === 'unknown-field' ? path : path.slice(0, -1);
  const parent = parentPath.reduce<Json>(
    (node, key) => (node as Record<string | number, Json>)[key]!,
    copy,
  ) as Record<string | number, Json>;
  if (kind === 'unknown-field') {
    parent[UNKNOWN_FIELD] = { added: true };
    return copy;
  }
  const key = path[path.length - 1]!;
  if (kind === 'drop-field') delete parent[key];
  else if (kind === 'null') parent[key] = null;
  else parent[key] = WRONG[baseType(schema, path)]!;
  return copy;
}

/** The Zod type name at `path`, looking through optional and nullable. */
export function baseType(schema: z.ZodType, path: Path): string {
  let def = defOf(schema);
  for (const key of path) {
    while (def.type === 'optional' || def.type === 'nullable')
      def = defOf(def.innerType!);
    def = defOf(
      def.type === 'array' ? def.element! : def.shape![key as string]!,
    );
  }
  while (def.type === 'optional' || def.type === 'nullable')
    def = defOf(def.innerType!);
  return def.type;
}
