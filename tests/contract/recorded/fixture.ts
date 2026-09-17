/**
 * The recorded payload fixture format, and the pure functions the recorder,
 * the replay tests and the nightly shape diff share.
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  ARRAY_HEAD,
  ARRAY_MAX,
  FIXTURES_DIR,
  KEPT_HEADERS,
  OBJECT_MAP_KEEP,
  OBJECT_MAP_THRESHOLD,
  STRING_MAX,
} from './policy';

export interface RecordedPage {
  /** Request path relative to the ESI base URL, exactly as the client sent it. */
  url: string;
  status: number;
  /** Lower-cased response headers from policy.KEPT_HEADERS. */
  headers: Record<string, string>;
  body: unknown;
}

export interface Truncation {
  page: number;
  /** JSONPath-like location, `$` is the page body. */
  at: string;
  kind: 'array' | 'map' | 'string';
  original: number;
  kept: number;
}

export interface RecordedFixture {
  /** `<endpoints file stem>.<endpoint name>`, e.g. `market.getMarketOrders`. */
  endpoint: string;
  /** The public client method the fixture is replayed through. */
  call: { client: string; method: string; args: unknown[] };
  recordedAt: string;
  /** X-Compatibility-Date the request was sent with. */
  compatibilityDate: string;
  /** sha256 of the OpenAPI document served for that compatibility date. */
  specHash: string;
  /** `x-cache-age` of the operation in that document, in seconds. */
  specCacheSeconds: number | null;
  /** Pages ESI reported (X-Pages) before the recorder capped them. */
  upstreamPages: number;
  truncated: Truncation[];
  pages: RecordedPage[];
}

export function fixturePath(endpoint: string, dir = FIXTURES_DIR): string {
  return path.join(dir, `${endpoint}.json`);
}

export function listFixtureFiles(dir = FIXTURES_DIR): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => path.join(dir, f));
}

export function parseFixture(raw: string, source: string): RecordedFixture {
  const parsed = JSON.parse(raw) as Partial<RecordedFixture>;
  const problems: string[] = [];
  if (typeof parsed.endpoint !== 'string') problems.push('endpoint');
  if (
    !parsed.call ||
    typeof parsed.call.client !== 'string' ||
    typeof parsed.call.method !== 'string' ||
    !Array.isArray(parsed.call.args)
  )
    problems.push('call');
  if (!Array.isArray(parsed.pages) || parsed.pages.length === 0)
    problems.push('pages');
  if (typeof parsed.specHash !== 'string') problems.push('specHash');
  if (typeof parsed.compatibilityDate !== 'string')
    problems.push('compatibilityDate');
  if (problems.length > 0) {
    throw new Error(
      `${source} is not a recorded fixture: missing or invalid ${problems.join(', ')}`,
    );
  }
  return parsed as RecordedFixture;
}

export function loadFixture(file: string): RecordedFixture {
  return parseFixture(fs.readFileSync(file, 'utf-8'), file);
}

export function serializeFixture(fixture: RecordedFixture): string {
  return `${JSON.stringify(fixture, null, 2)}\n`;
}

/** Keep only the headers the fixture format preserves, lower-cased. */
export function keepHeaders(
  headers: Iterable<[string, string]>,
): Record<string, string> {
  const kept: Record<string, string> = {};
  const allowed = new Set<string>(KEPT_HEADERS);
  for (const [name, value] of headers) {
    const key = name.toLowerCase();
    if (allowed.has(key)) kept[key] = value;
  }
  return Object.fromEntries(
    Object.entries(kept).sort(([a], [b]) => a.localeCompare(b)),
  );
}

/**
 * Every key path in a JSON value, with array indices collapsed to `[]`.
 * Two values with the same key paths have the same set of object keys at
 * every depth.
 */
export function keyPaths(value: unknown, prefix = '$'): Set<string> {
  const out = new Set<string>();
  const walk = (v: unknown, at: string) => {
    if (Array.isArray(v)) {
      for (const el of v) walk(el, `${at}[]`);
    } else if (v !== null && typeof v === 'object') {
      for (const [k, child] of Object.entries(v)) {
        const p = `${at}.${k}`;
        out.add(p);
        walk(child, p);
      }
    }
  };
  walk(value, prefix);
  return out;
}

/**
 * Cut a response body down to fixture size, recording each cut. Arrays keep
 * their first ARRAY_HEAD elements and then any element that adds a key path
 * the kept ones lack (so optional fields stay exercised), up to ARRAY_MAX.
 * Objects with more than OBJECT_MAP_THRESHOLD keys are maps and keep
 * OBJECT_MAP_KEEP entries. Long strings are cut to STRING_MAX characters.
 */
export function truncateBody(
  body: unknown,
  page: number,
): { body: unknown; truncated: Truncation[] } {
  const truncated: Truncation[] = [];

  const visit = (v: unknown, at: string): unknown => {
    if (typeof v === 'string') {
      if (v.length <= STRING_MAX) return v;
      truncated.push({
        page,
        at,
        kind: 'string',
        original: v.length,
        kept: STRING_MAX,
      });
      return v.slice(0, STRING_MAX);
    }
    if (Array.isArray(v)) {
      let kept: unknown[] = v;
      if (v.length > ARRAY_HEAD) {
        kept = v.slice(0, ARRAY_HEAD);
        const seen = keyPaths(kept);
        for (const el of v.slice(ARRAY_HEAD)) {
          if (kept.length >= ARRAY_MAX) break;
          const paths = keyPaths([el]);
          if ([...paths].some((p) => !seen.has(p))) {
            kept.push(el);
            paths.forEach((p) => seen.add(p));
          }
        }
        truncated.push({
          page,
          at,
          kind: 'array',
          original: v.length,
          kept: kept.length,
        });
      }
      return kept.map((el) => visit(el, `${at}[]`));
    }
    if (v !== null && typeof v === 'object') {
      let entries = Object.entries(v);
      if (entries.length > OBJECT_MAP_THRESHOLD) {
        truncated.push({
          page,
          at,
          kind: 'map',
          original: entries.length,
          kept: OBJECT_MAP_KEEP,
        });
        entries = entries.slice(0, OBJECT_MAP_KEEP);
      }
      return Object.fromEntries(
        entries.map(([k, child]) => [k, visit(child, `${at}.${k}`)]),
      );
    }
    return v;
  };

  return { body: visit(body, '$'), truncated };
}

/** The value a client returns for a fixture: page bodies concatenated. */
export function mergedBody(fixture: RecordedFixture): unknown {
  if (fixture.pages.length === 1) return fixture.pages[0]!.body;
  return fixture.pages.flatMap((p) =>
    Array.isArray(p.body) ? (p.body as unknown[]) : [p.body],
  );
}

/** Turn an endpoint path template into a pattern for the path it produces. */
export function templatePattern(template: string): RegExp {
  const escaped = template
    .replace(/\/$/, '')
    .split(/\{[^}]+\}/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${escaped.join('[^/?]+')}/?(\\?|$)`);
}
