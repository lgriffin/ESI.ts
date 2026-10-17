/**
 * Fails when the committed generated operations and the vendored OpenAPI
 * document disagree. See scripts/spec/spec-coverage-core.ts.
 *
 * Usage: npm run spec:coverage
 */
import * as fs from 'fs';
import * as path from 'path';

import * as generated from '../../src/generated/operations.generated';
import { checkCoverage, metasOf } from './spec-coverage-core';
import {
  mergeOverlay,
  SPEC_PATH,
  type OpenApiDocument,
} from './spec-generate-core';
import { readOverlay } from './spec-generate';

// The overlay's operations are generated too, so they count as spec here.
const doc = mergeOverlay(
  JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../..', SPEC_PATH), 'utf8'),
  ) as OpenApiDocument,
  readOverlay(),
);
const report = checkCoverage(doc, metasOf(generated));

if (report.problems.length > 0) {
  console.error(`spec:coverage found ${report.problems.length} problem(s):`);
  for (const p of report.problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `spec:coverage: ${report.generatedOperations}/${report.specOperations} operations generated and consistent with ${SPEC_PATH}.`,
);
