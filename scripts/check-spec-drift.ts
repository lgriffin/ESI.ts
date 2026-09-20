/**
 * ESI Spec Drift Checker
 *
 * Compares the codebase endpoint definitions against the latest ESI
 * OpenAPI spec and outputs a JSON report of missing endpoints. Designed
 * to be called by CI to auto-file GitHub issues for new spec gaps.
 *
 * Usage: npx ts-node scripts/check-spec-drift.ts
 *        npx ts-node scripts/check-spec-drift.ts --compatibility-date=2026-08-04
 *
 * Output: JSON to stdout with structure:
 *   { compatibilityDate, missing: [{ tag, method, path }], extra: [...] }
 *
 * Exit codes: 0 = no missing, 1 = missing endpoints found
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_COMPATIBILITY_DATE = '2025-12-16';
const ESI_OPENAPI_BASE = 'https://esi.evetech.net/meta/openapi.json';
const ESI_COMPATIBILITY_DATES_URL =
  'https://esi.evetech.net/meta/compatibility-dates';
const ENDPOINTS_DIR = path.resolve(__dirname, '../src/core/endpoints');

interface DriftReport {
  compatibilityDate: string;
  specEndpointCount: number;
  codebaseEndpointCount: number;
  matchedCount: number;
  missing: { tag: string; method: string; path: string }[];
  extra: { method: string; path: string; name: string; file: string }[];
}

function parseCompatibilityDate(): string | 'latest' {
  for (const arg of process.argv.slice(2)) {
    if (arg === '--latest') return 'latest';
    const match = arg.match(/^--compatibility-date=(\d{4}-\d{2}-\d{2})$/);
    if (match) return match[1]!;
  }
  return DEFAULT_COMPATIBILITY_DATE;
}

async function resolveCompatibilityDate(
  requested: string | 'latest',
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

function normalizePath(p: string): string {
  return p
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .replace(/\{[^}]+\}/g, '{param}')
    .toLowerCase();
}

function parseEndpointFiles(): {
  path: string;
  method: string;
  name: string;
  file: string;
}[] {
  const entries: { path: string; method: string; name: string; file: string }[] =
    [];
  const files = fs
    .readdirSync(ENDPOINTS_DIR)
    .filter((f) => f.endsWith('Endpoints.ts'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(ENDPOINTS_DIR, file), 'utf-8');
    const pathRegex =
      /(\w+):\s*\{[^}]*?path:\s*'([^']+)'[^}]*?method:\s*'(GET|POST|PUT|DELETE)'/gs;
    let match;
    while ((match = pathRegex.exec(content)) !== null) {
      entries.push({
        name: match[1]!,
        path: match[2]!,
        method: match[3]!,
        file,
      });
    }
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

  const codebaseEntries = parseEndpointFiles();

  const specEntries: { method: string; path: string; tag: string }[] = [];
  for (const [routePath, methods] of Object.entries(spec.paths)) {
    for (const method of ['get', 'post', 'put', 'delete']) {
      if (methods[method]) {
        const op = methods[method] as { tags?: string[] };
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

main();
