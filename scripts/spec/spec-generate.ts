/**
 * Generates src/generated/operations.generated.ts,
 * src/adapters/responseSchemas.generated.ts and
 * src/core/endpoints/esi-operations.generated.ts from the vendored ESI
 * OpenAPI document. The emitters live in scripts/spec/spec-generate-core.ts,
 * scripts/spec/spec-zod.ts and scripts/spec/spec-routes.ts.
 *
 * Usage: npm run spec:generate          # write the file
 *        npm run spec:generate:check    # exit 1 when the file is stale
 */
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';

import {
  generateOperations,
  mergeOverlay,
  OUT_PATH,
  OVERLAY_PATH,
  overlayRoutesMissingFrom,
  SPEC_PATH,
  SpecGenerateError,
  type OpenApiDocument,
  type OperationOverlay,
} from './spec-generate-core';
import { generateRouteTable, ROUTES_OUT_PATH } from './spec-routes';
import {
  generateResponseSchemas,
  BASELINE_OUT_PATH,
  ZOD_OUT_PATH,
  type SchemaOverrides,
} from './spec-zod';

const OVERRIDES_PATH = 'scripts/spec/response-schema-overrides.json';

const ROOT = path.resolve(__dirname, '../..');

/**
 * The overlay, refused when it adds a route endpoint validation does not
 * know the spec leaves out (scripts/spec/esi-endpoint-exceptions.json).
 */
export function readOverlay(): OperationOverlay {
  const overlay = JSON.parse(
    fs.readFileSync(path.join(ROOT, OVERLAY_PATH), 'utf8'),
  ) as OperationOverlay;
  const exceptions = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'scripts/spec/esi-endpoint-exceptions.json'),
      'utf8',
    ),
  ) as { key: string }[];
  const missing = overlayRoutesMissingFrom(
    overlay,
    new Set(exceptions.map((e) => e.key)),
  );
  if (missing.length > 0) {
    throw new SpecGenerateError(
      `${OVERLAY_PATH} adds ${missing.join(', ')}, which scripts/spec/esi-endpoint-exceptions.json does not list`,
    );
  }
  return overlay;
}

async function format(source: string, outFile: string): Promise<string> {
  const config = (await prettier.resolveConfig(outFile)) ?? {};
  return prettier.format(source, { ...config, filepath: outFile });
}

interface Rendered {
  readonly outPath: string;
  readonly source: string;
  readonly summary: string;
}

async function render(): Promise<Rendered[]> {
  const doc = JSON.parse(
    fs.readFileSync(path.join(ROOT, SPEC_PATH), 'utf8'),
  ) as OpenApiDocument;
  // `$comment` documents the file; every other key names a component schema.
  const overrides = Object.fromEntries(
    Object.entries(
      JSON.parse(
        fs.readFileSync(path.join(ROOT, OVERRIDES_PATH), 'utf8'),
      ) as Record<string, unknown>,
    ).filter(([key]) => !key.startsWith('$')),
  ) as SchemaOverrides;
  const overlay = readOverlay();
  // The overrides widen the Zod schemas only. Widening the operation types
  // too (number to number | null) is a major change under guides/SEMVER.md:
  // pass `overrides` to generateOperations in the next major.
  const operations = generateOperations(doc, {
    specPath: SPEC_PATH,
    transportImport: '../core/ports/OperationTransport',
    overlay,
  });
  // The overlay's routes get a schema too, so every generated operation with
  // a JSON body has one, as the hand-written MetaClient validates its own.
  const zod = generateResponseSchemas(
    mergeOverlay(doc, overlay),
    SPEC_PATH,
    overrides,
  );
  return [
    {
      outPath: OUT_PATH,
      source: await format(operations.source, path.join(ROOT, OUT_PATH)),
      summary: `${operations.operations.length} operations, ${operations.typeCount} types`,
    },
    {
      outPath: BASELINE_OUT_PATH,
      source: await format(
        zod.baselineSource,
        path.join(ROOT, BASELINE_OUT_PATH),
      ),
      summary: `${zod.operations} response schemas, ${zod.components} components`,
    },
    {
      outPath: ZOD_OUT_PATH,
      source: await format(zod.source, path.join(ROOT, ZOD_OUT_PATH)),
      summary: `${zod.operations} response schemas by operationId`,
    },
    {
      outPath: ROUTES_OUT_PATH,
      source: await format(
        generateRouteTable(operations.operations, SPEC_PATH),
        path.join(ROOT, ROUTES_OUT_PATH),
      ),
      summary: `${operations.operations.length} routes`,
    },
    {
      outPath: ROUTES_OUT_PATH,
      source: await format(
        generateRouteTable(operations.operations, SPEC_PATH),
        path.join(ROOT, ROUTES_OUT_PATH),
      ),
      summary: `${operations.operations.length} routes`,
    },
  ];
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check');
  const files = await render();
  let stale = false;
  for (const { outPath, source, summary } of files) {
    const outFile = path.join(ROOT, outPath);
    if (check) {
      const current = fs.existsSync(outFile)
        ? fs.readFileSync(outFile, 'utf8')
        : '';
      if (current !== source) {
        console.error(
          `${outPath} is stale against ${SPEC_PATH}. Run \`npm run spec:generate\` and commit the result.`,
        );
        stale = true;
      } else {
        console.log(`${outPath} is up to date (${summary}).`);
      }
      continue;
    }
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, source);
    console.log(`wrote ${outPath}: ${summary}`);
  }
  if (stale) process.exit(1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
