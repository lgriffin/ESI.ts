/**
 * Vendors the ESI OpenAPI document that the generated operations
 * (npm run spec:generate) and the contract tests read.
 *
 * Defaults to COMPATIBILITY_DATE, the date the client sends on every request,
 * so the vendored document describes the API the client actually asks for.
 * The fetch needs esi.evetech.net; .github/workflows/spec-refresh.yml runs it
 * where that host is reachable.
 *
 * Usage: npm run contract:snapshot [-- --compatibility-date=YYYY-MM-DD]
 */
import * as fs from 'fs';
import * as path from 'path';

import { COMPATIBILITY_DATE } from '../src/core/constants';

/**
 * No arguments, or exactly one `--compatibility-date=YYYY-MM-DD`. Anything
 * else throws before any fetch, so a mistyped option cannot quietly vendor
 * the default date instead of the one asked for.
 */
export function parseCompatibilityDate(
  args: readonly string[],
  fallback: string = COMPATIBILITY_DATE,
): string {
  if (args.length === 0) return fallback;
  const [arg] = args;
  const match =
    args.length === 1
      ? /^--compatibility-date=(\d{4}-\d{2}-\d{2})$/.exec(arg!)
      : null;
  if (!match) {
    throw new Error(
      `Expected no arguments or one --compatibility-date=YYYY-MM-DD, got: ${args.join(' ')}`,
    );
  }
  return match[1]!;
}

const SNAPSHOT_PATH = path.resolve(
  __dirname,
  '../tests/contract/snapshots/esi-openapi.snapshot.json',
);

async function main(): Promise<void> {
  const ESI_OPENAPI_URL = `https://esi.evetech.net/meta/openapi.json?compatibility_date=${parseCompatibilityDate(process.argv.slice(2))}`;
  console.log(`Fetching ESI OpenAPI spec from ${ESI_OPENAPI_URL}...`);
  const response = await fetch(ESI_OPENAPI_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch spec: HTTP ${response.status}`);
  }

  const spec = await response.json();
  const paths = Object.keys(spec.paths || {});
  const operations = Object.values(spec.paths || {}).reduce(
    (count: number, methods: any) =>
      count +
      Object.keys(methods).filter((m) =>
        ['get', 'post', 'put', 'delete'].includes(m),
      ).length,
    0,
  );

  fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
  fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(spec, null, 2)}\n`);

  console.log(`Snapshot saved to ${SNAPSHOT_PATH}`);
  console.log(`  Paths: ${paths.length}`);
  console.log(`  Operations: ${operations}`);
  console.log(
    `  Schemas: ${Object.keys(spec.components?.schemas || {}).length}`,
  );
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
