/**
 * The nightly re-recording compares shapes, not values. Prices, IDs, dates
 * and ETags change every day; a field appearing, disappearing, changing type
 * or becoming nullable, or a cache header appearing or disappearing, is what
 * a schema or the pipeline depends on.
 */
import type { RecordedFixture } from './fixture';
import { SHAPE_HEADERS } from './policy';

/** Type labels per key path, e.g. `$[].price` -> `number`. */
export type Shape = Record<string, string[]>;

function typeLabel(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

/** The set of JSON types seen at each key path of a value. */
export function shapeOf(value: unknown): Shape {
  const seen = new Map<string, Set<string>>();
  const walk = (v: unknown, at: string) => {
    const labels = seen.get(at) ?? new Set<string>();
    labels.add(typeLabel(v));
    seen.set(at, labels);
    if (Array.isArray(v)) {
      for (const el of v) walk(el, `${at}[]`);
    } else if (v !== null && typeof v === 'object') {
      for (const [k, child] of Object.entries(v)) walk(child, `${at}.${k}`);
    }
  };
  walk(value, '$');
  return Object.fromEntries(
    [...seen.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, [...v].sort()]),
  );
}

export interface FixtureShape {
  status: number[];
  headers: string[];
  body: Shape;
}

export function fixtureShape(fixture: RecordedFixture): FixtureShape {
  const shapeHeaders = new Set<string>(SHAPE_HEADERS);
  return {
    status: [...new Set(fixture.pages.map((p) => p.status))].sort(
      (a, b) => a - b,
    ),
    headers: [
      ...new Set(
        fixture.pages.flatMap((p) =>
          Object.keys(p.headers).filter((h) => shapeHeaders.has(h)),
        ),
      ),
    ].sort(),
    body: shapeOf(fixture.pages.map((p) => p.body)),
  };
}

/** A JSON Schema fragment as the ESI OpenAPI document writes one. */
interface SchemaNode {
  $ref?: string;
  type?: string | string[];
  properties?: Record<string, SchemaNode>;
  required?: string[];
  items?: SchemaNode;
  additionalProperties?: SchemaNode | boolean;
  oneOf?: SchemaNode[];
  anyOf?: SchemaNode[];
  allOf?: SchemaNode[];
}

/**
 * Walks an OpenAPI response schema in fixture shape notation (the page body
 * is `$[]`, a map entry is `.*`), calling `visit` on every node with its path.
 */
function walkSchema(
  schema: unknown,
  components: Record<string, unknown>,
  visit: (node: SchemaNode, at: string) => void,
): void {
  // `refs` holds the $refs already followed on this branch, so a
  // self-referencing schema stops instead of recursing forever.
  const walk = (node: SchemaNode, at: string, refs: ReadonlySet<string>) => {
    if (node.$ref) {
      if (refs.has(node.$ref)) return;
      const target = components[node.$ref.replace('#/components/schemas/', '')];
      if (target && typeof target === 'object') {
        walk(target as SchemaNode, at, new Set([...refs, node.$ref]));
      }
      return;
    }
    visit(node, at);
    for (const branch of [
      ...(node.oneOf ?? []),
      ...(node.anyOf ?? []),
      ...(node.allOf ?? []),
    ])
      walk(branch, at, refs);
    if (node.items) walk(node.items, `${at}[]`, refs);
    if (
      node.additionalProperties &&
      typeof node.additionalProperties === 'object'
    )
      walk(node.additionalProperties, `${at}.*`, refs);
    for (const [key, child] of Object.entries(node.properties ?? {}))
      walk(child, `${at}.${key}`, refs);
  };
  if (schema && typeof schema === 'object') {
    walk(schema as SchemaNode, '$[]', new Set());
  }
}

/**
 * Key paths the OpenAPI response schema declares but does not require, in
 * fixture shape notation (the page body is `$[]`). ESI leaves these out when
 * they do not apply (blueprint fields on a contract item that is not a
 * blueprint), so whether they appear depends on which live record the
 * recorder picked, not on ESI changing.
 */
export function optionalPaths(
  schema: unknown,
  components: Record<string, unknown> = {},
): Set<string> {
  const out = new Set<string>();
  walkSchema(schema, components, (node, at) => {
    const required = new Set(node.required ?? []);
    for (const key of Object.keys(node.properties ?? {}))
      if (!required.has(key)) out.add(`${at}.${key}`);
  });
  return out;
}

/**
 * Key paths the OpenAPI response schema declares as `additionalProperties`
 * maps, in fixture shape notation. Their keys are data (a freelance job's
 * parameter names), so which keys a recording holds depends on the record
 * sampled, not on ESI changing.
 */
export function mapPaths(
  schema: unknown,
  components: Record<string, unknown> = {},
): Set<string> {
  const out = new Set<string>();
  walkSchema(schema, components, (node, at) => {
    if (node.additionalProperties) out.add(at);
  });
  return out;
}

/**
 * A shape with every key under a map path (see mapPaths) written as `*`, so
 * entries are compared by value shape whatever their keys. Labels of entries
 * that collapse onto one path are merged.
 */
export function collapseMapKeys(
  shape: Shape,
  maps: ReadonlySet<string>,
): Shape {
  if (maps.size === 0) return shape;
  // Shortest first: a nested map's path already has its parent's `*`.
  const ordered = [...maps].sort((a, b) => a.length - b.length);
  const collapse = (p: string) => {
    let out = p;
    for (const m of ordered) {
      if (!out.startsWith(`${m}.`)) continue;
      const rest = out.slice(m.length + 1);
      const end = rest.search(/[.[]/);
      out = `${m}.*${end < 0 ? '' : rest.slice(end)}`;
    }
    return out;
  };
  const merged = new Map<string, Set<string>>();
  for (const [p, labels] of Object.entries(shape)) {
    const key = collapse(p);
    const set = merged.get(key) ?? new Set<string>();
    for (const l of labels) set.add(l);
    merged.set(key, set);
  }
  return Object.fromEntries(
    [...merged.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, [...v].sort()]),
  );
}

/**
 * Human-readable differences between two fixture shapes; empty when equal.
 * An array that is empty in one recording and not in the other has no
 * element shape to compare, so element paths under it are not reported.
 * A field in `optional` (see optionalPaths), or under one, appearing or
 * disappearing is sampling, not drift, and is not reported either; a type
 * change on it still is. Keys under a path in `maps` (see mapPaths) are
 * compared as `*`, so a map holding different keys is not drift either.
 */
export function diffShapes(
  beforeShape: FixtureShape,
  afterShape: FixtureShape,
  optional: ReadonlySet<string> = new Set(),
  maps: ReadonlySet<string> = new Set(),
): string[] {
  const before = {
    ...beforeShape,
    body: collapseMapKeys(beforeShape.body, maps),
  };
  const after = { ...afterShape, body: collapseMapKeys(afterShape.body, maps) };
  const out: string[] = [];
  if (before.status.join() !== after.status.join()) {
    out.push(`status ${before.status.join('/')} -> ${after.status.join('/')}`);
  }
  for (const h of before.headers.filter((x) => !after.headers.includes(x))) {
    out.push(`header ${h} no longer sent`);
  }
  for (const h of after.headers.filter((x) => !before.headers.includes(x))) {
    out.push(`header ${h} now sent`);
  }

  const underEmptyArray = (shape: Shape, p: string) =>
    Object.keys(shape).some(
      (parent) => p.startsWith(`${parent}[]`) && !(`${parent}[]` in shape),
    );

  const declaredOptional = (p: string) =>
    [...optional].some(
      (o) => p === o || p.startsWith(`${o}.`) || p.startsWith(`${o}[]`),
    );

  const paths = new Set([
    ...Object.keys(before.body),
    ...Object.keys(after.body),
  ]);
  for (const p of [...paths].sort()) {
    const b = before.body[p];
    const a = after.body[p];
    if (b && !a) {
      if (!underEmptyArray(after.body, p) && !declaredOptional(p))
        out.push(`${p} removed (was ${b.join('|')})`);
    } else if (!b && a) {
      if (!underEmptyArray(before.body, p) && !declaredOptional(p))
        out.push(`${p} added (${a.join('|')})`);
    } else if (a && b && a.join() !== b.join()) {
      out.push(`${p} type ${b.join('|')} -> ${a.join('|')}`);
    }
  }
  return out;
}
