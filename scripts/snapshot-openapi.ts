import * as fs from 'fs';
import * as path from 'path';

const ESI_OPENAPI_URL =
  'https://esi.evetech.net/meta/openapi.json?compatibility_date=2025-12-16';
const SNAPSHOT_PATH = path.resolve(
  __dirname,
  '../tests/contract/snapshots/esi-openapi.snapshot.json',
);

async function main(): Promise<void> {
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
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(spec, null, 2));

  console.log(`Snapshot saved to ${SNAPSHOT_PATH}`);
  console.log(`  Paths: ${paths.length}`);
  console.log(`  Operations: ${operations}`);
  console.log(
    `  Schemas: ${Object.keys(spec.components?.schemas || {}).length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
