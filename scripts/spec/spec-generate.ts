/**
 * Generates src/generated/operations.generated.ts and
 * src/adapters/responseSchemas.generated.ts from the vendored ESI OpenAPI
 * document. The emitters live in scripts/spec/spec-generate-core.ts and
 * scripts/spec/spec-zod.ts.
 *
 * Usage: npm run spec:generate          # write the file
 *        npm run spec:generate:check    # exit 1 when the file is stale
 */
import * as fs from 'fs';
import * as path from 'path';
import * as prettier from 'prettier';

import {
  generateOperations,
  OUT_PATH,
  SPEC_PATH,
  type OpenApiDocument,
} from './spec-generate-core';
import {
  generateResponseSchemas,
  ZOD_OUT_PATH,
  type SchemaOverrides,
} from './spec-zod';

const OVERRIDES_PATH = 'scripts/spec/response-schema-overrides.json';

const ROOT = path.resolve(__dirname, '../..');

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
  const overrides = JSON.parse(
    fs.readFileSync(path.join(ROOT, OVERRIDES_PATH), 'utf8'),
  ) as SchemaOverrides;
  const operations = generateOperations(doc, {
    specPath: SPEC_PATH,
    transportImport: '../core/ports/OperationTransport',
    overrides,
  });
  const zod = generateResponseSchemas(doc, SPEC_PATH, overrides);
  return [
    {
      outPath: OUT_PATH,
      source: await format(operations.source, path.join(ROOT, OUT_PATH)),
      summary: `${operations.operations.length} operations, ${operations.typeCount} types`,
    },
    {
      outPath: ZOD_OUT_PATH,
      source: await format(zod.source, path.join(ROOT, ZOD_OUT_PATH)),
      summary: `${zod.operations} response schemas, ${zod.components} components`,
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
