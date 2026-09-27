/**
 * Fails when an endpoint definition whose operation returns a JSON body has
 * no responseSchema (DES-02). See scripts/spec-response-schemas-core.ts.
 *
 * Usage: npm run spec:response-schemas
 */
import * as fs from 'fs';
import * as path from 'path';

import {
  checkResponseSchemas,
  definitionsOf,
} from './spec-response-schemas-core';
import { SPEC_PATH, type OpenApiDocument } from './spec-generate-core';

const ENDPOINTS_DIR = path.resolve(__dirname, '..', 'src/core/endpoints');

const doc = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', SPEC_PATH), 'utf8'),
) as OpenApiDocument;

const modules: Record<string, Record<string, unknown>> = {};
for (const file of fs.readdirSync(ENDPOINTS_DIR)) {
  if (!file.endsWith('Endpoints.ts')) continue;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  modules[file] = require(path.join(ENDPOINTS_DIR, file)) as Record<
    string,
    unknown
  >;
}

const report = checkResponseSchemas(doc, definitionsOf(modules));
if (report.problems.length > 0) {
  console.error(
    `spec:response-schemas found ${report.problems.length} definition(s) without a responseSchema:`,
  );
  for (const p of report.problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `spec:response-schemas: ${report.checked} definitions checked against ${SPEC_PATH}; every JSON body has a responseSchema.`,
);
