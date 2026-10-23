/**
 * ESI Spec Drift Checker
 *
 * Compares the codebase endpoint definitions against the latest ESI
 * OpenAPI spec and outputs a JSON report of missing endpoints. Designed
 * to be called by CI to auto-file GitHub issues for new spec gaps.
 *
 * Usage: npx ts-node scripts/spec/check-spec-drift.ts  (the client's COMPATIBILITY_DATE)
 *        npx ts-node scripts/spec/check-spec-drift.ts --compatibility-date=2026-08-04
 *
 * Output: JSON to stdout with structure:
 *   { compatibilityDate, missing: [{ tag, method, path }], extra: [...] }
 *
 * Exit codes: 0 = no missing, 1 = missing endpoints found
 */

import * as fs from 'fs';
import * as path from 'path';

import { COMPATIBILITY_DATE } from '../../src/core/constants';

const ESI_OPENAPI_BASE = 'https://esi.evetech.net/meta/openapi.json';
const ESI_COMPATIBILITY_DATES_URL =
  'https://esi.evetech.net/meta/compatibility-dates';
const ENDPOINTS_DIR = path.resolve(__dirname, '../../src/core/endpoints');

interface DriftReport {
  compatibilityDate: string;
  specEndpointCount: number;
  codebaseEndpointCount: number;
  matchedCount: number;
  missing: { tag: string; method: string; path: string }[];
  extra: { method: string; path: string; name: string; file: string }[];
}

function parseCompatibilityDate(): string {
  for (const arg of process.argv.slice(2)) {
    if (arg === '--latest') return 'latest';
    const match = arg.match(/^--compatibility-date=(\d{4}-\d{2}-\d{2})$/);
    if (match) return match[1]!;
  }
  return COMPATIBILITY_DATE;
}

async function resolveCompatibilityDate(
  requested: string, // a YYYY-MM-DD date or 'latest'
): Promise<string> {
  if (requested !== 'latest') return requested;
  const response = await fetch(ESI_COMPATIBILITY_DATES_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch compatibility dates: HTTP ${response.status}`,
    );
  }
  const data = (await response.json()) as { compatibility_dates: string[] };
  const dates = data.compatibility_dates;
  if (!dates || dates.length === 0) {
    throw new Error('No compatibility dates returned from ESI');
  }
  return dates[0]!;
}

export function normalizePath(p: string): string {
  return p
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/\{[^}]+\}/g, '{param}')
    .toLowerCase();
}

export interface CodebaseEndpoint {
  path: string;
  method: string;
  name: string;
  file: string;
}

/**
 * Every endpoint definition the custom clients call, read from the endpoint
 * maps themselves. Since #679 and #681 most definitions are built by
 * `fromOperation` from the generated route table, so their paths no longer
 * appear as literals in the source, and the regex this replaced found none of
 * them: the nightly reported all 233 spec operations missing (#692).
 *
 * @throws Error when no map yields a definition, so a broken reader fails the
 *   run (exit 2) instead of filing every endpoint as missing.
 */
export function codebaseEndpoints(
  endpointsDir: string = ENDPOINTS_DIR,
): CodebaseEndpoint[] {
  const entries: CodebaseEndpoint[] = [];
  const files = fs
    .readdirSync(endpointsDir)
    .filter((f) => f.endsWith('Endpoints.ts'))
    .sort();

  for (const file of files) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const exported = require(path.join(endpointsDir, file)) as Record<
      string,
      unknown
    >;
    for (const map of Object.values(exported)) {
      if (typeof map !== 'object' || map === null) continue;
      for (const [name, definition] of Object.entries(map)) {
        const { path: route, method } = (definition ?? {}) as {
          path?: unknown;
          method?: unknown;
        };
        if (typeof route === 'string' && typeof method === 'string') {
          entries.push({ name, path: route, method, file });
        }
      }
    }
  }
  if (entries.length === 0) {
    throw new Error(`No endpoint definitions found in ${endpointsDir}`);
  }
  return entries;
}

async function checkDrift(): Promise<DriftReport> {
  const requested = parseCompatibilityDate();
  const compatibilityDate = await resolveCompatibilityDate(requested);
  const specUrl = `${ESI_OPENAPI_BASE}?compatibility_date=${compatibilityDate}`;

  const response = await fetch(specUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch spec: HTTP ${response.status}`);
  }
  const spec = (await response.json()) as {
    paths: Record<string, Record<string, { tags?: string[] }>>;
  };

  const codebaseEntries = codebaseEndpoints();

  const specEntries: { method: string; path: string; tag: string }[] = [];
  for (const [routePath, methods] of Object.entries(spec.paths)) {
    for (const method of ['get', 'post', 'put', 'delete']) {
      if (methods[method]) {
        const op = methods[method];
        specEntries.push({
          method: method.toUpperCase(),
          path: routePath,
          tag: op.tags?.[0] || 'Uncategorized',
        });
      }
    }
  }

  const specKeys = new Set(
    specEntries.map((e) => `${normalizePath(e.path)}:${e.method}`),
  );
  const codeKeys = new Set(
    codebaseEntries.map((e) => `${normalizePath(e.path)}:${e.method}`),
  );

  const matched = [...codeKeys].filter((k) => specKeys.has(k)).length;

  const extra: DriftReport['extra'] = codebaseEntries.filter(
    (e) => !specKeys.has(`${normalizePath(e.path)}:${e.method}`),
  );

  const missing: DriftReport['missing'] = specEntries.filter(
    (e) => !codeKeys.has(`${normalizePath(e.path)}:${e.method}`),
  );

  return {
    compatibilityDate,
    specEndpointCount: specEntries.length,
    codebaseEndpointCount: codebaseEntries.length,
    matchedCount: matched,
    missing,
    extra,
  };
}

async function main(): Promise<void> {
  try {
    const report = await checkDrift();
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.missing.length > 0 ? 1 : 0);
  } catch (err) {
    console.error(`Spec drift check failed: ${err}`);
    process.exit(2);
  }
}

if (require.main === module) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(2);
  });
}
