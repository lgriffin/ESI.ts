/**
 * Generates src/generated/operations.generated.ts from the vendored ESI
 * OpenAPI document. The emitter lives in scripts/spec-generate-core.ts.
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

const ROOT = path.resolve(__dirname, '..');

async function renderOperations(): Promise<{
  source: string;
  operations: number;
  types: number;
}> {
  const doc = JSON.parse(
    fs.readFileSync(path.join(ROOT, SPEC_PATH), 'utf8'),
  ) as OpenApiDocument;
  const result = generateOperations(doc, {
    specPath: SPEC_PATH,
    transportImport: '../core/ports/OperationTransport',
  });
  const outFile = path.join(ROOT, OUT_PATH);
  const config = (await prettier.resolveConfig(outFile)) ?? {};
  const source = await prettier.format(result.source, {
    ...config,
    filepath: outFile,
  });
  return {
    source,
    operations: result.operations.length,
    types: result.typeCount,
  };
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check');
  const { source, operations, types } = await renderOperations();
  const outFile = path.join(ROOT, OUT_PATH);
  if (check) {
    const current = fs.existsSync(outFile)
      ? fs.readFileSync(outFile, 'utf8')
      : '';
    if (current !== source) {
      console.error(
        `${OUT_PATH} is stale against ${SPEC_PATH}. Run \`npm run spec:generate\` and commit the result.`,
      );
      process.exit(1);
    }
    console.log(`${OUT_PATH} is up to date (${operations} operations).`);
    return;
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, source);
  console.log(`wrote ${OUT_PATH}: ${operations} operations, ${types} types`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
