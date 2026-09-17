/**
 * The limits recorded payload fixtures live within. Every number here is
 * checked: the recorder applies the truncation limits, and
 * tests/contract/replay/coverage.test.ts fails when a committed fixture set
 * breaks the size limits.
 */
import * as path from 'path';

export const CONTRACT_DIR = path.resolve(__dirname, '..');
export const REPO_ROOT = path.resolve(CONTRACT_DIR, '../..');
export const FIXTURES_DIR = path.join(CONTRACT_DIR, 'fixtures', 'recorded');
export const NEGATIVE_FIXTURES_DIR = path.join(
  CONTRACT_DIR,
  'fixtures',
  'recorded-negative',
);
export const UNRECORDABLE_PATH = path.join(
  CONTRACT_DIR,
  'fixtures',
  'unrecordable.json',
);
export const KNOWN_MISMATCHES_PATH = path.join(
  CONTRACT_DIR,
  'fixtures',
  'known-mismatches.json',
);

/** Arrays longer than this keep their first elements... */
export const ARRAY_HEAD = 3;
/** ...plus elements that add a key path the kept ones lack, up to this many. */
export const ARRAY_MAX = 8;
/** Objects with more keys than this are maps (the OpenAPI document), not records. */
export const OBJECT_MAP_THRESHOLD = 60;
/** Keys a truncated map keeps. */
export const OBJECT_MAP_KEEP = 4;
/** Strings longer than this are cut (descriptions, changelog text). */
export const STRING_MAX = 400;

/** Offset-paginated endpoints record at most this many pages. */
export const MAX_RECORDED_PAGES = 2;

/** One fixture file may not exceed this. */
export const FIXTURE_MAX_BYTES = 24 * 1024;
/** All committed fixtures together may not exceed this. */
export const FIXTURE_BUDGET_BYTES = 256 * 1024;

/**
 * Response headers a fixture keeps. Everything else (request ids, dates,
 * rate-limit counters, CDN headers) is dropped at record time.
 */
export const KEPT_HEADERS = [
  'cache-control',
  'content-type',
  'etag',
  'expires',
  'last-modified',
  'x-cursor-after',
  'x-cursor-before',
  'x-pages',
] as const;

/** Headers whose presence, not value, the nightly shape diff compares. */
export const SHAPE_HEADERS = [
  'cache-control',
  'etag',
  'expires',
  'last-modified',
  'x-pages',
] as const;
