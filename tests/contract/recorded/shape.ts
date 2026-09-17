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
    status: [...new Set(fixture.pages.map((p) => p.status))].sort(),
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

/**
 * Human-readable differences between two fixture shapes; empty when equal.
 * An array that is empty in one recording and not in the other has no
 * element shape to compare, so element paths under it are not reported.
 */
export function diffShapes(
  before: FixtureShape,
  after: FixtureShape,
): string[] {
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

  const paths = new Set([
    ...Object.keys(before.body),
    ...Object.keys(after.body),
  ]);
  for (const p of [...paths].sort()) {
    const b = before.body[p];
    const a = after.body[p];
    if (b && !a) {
      if (!underEmptyArray(after.body, p))
        out.push(`${p} removed (was ${b.join('|')})`);
    } else if (!b && a) {
      if (!underEmptyArray(before.body, p))
        out.push(`${p} added (${a.join('|')})`);
    } else if (a && b && a.join() !== b.join()) {
      out.push(`${p} type ${b.join('|')} -> ${a.join('|')}`);
    }
  }
  return out;
}
