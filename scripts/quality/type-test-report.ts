/**
 * Runs the tsd type tests (`tests/typetests/*.test-d.ts`, what
 * `npm run test:types` runs) and writes one result per file to a JSON file,
 * so CI can publish the outcome the way it publishes Jest's `--json` output.
 *
 * Usage: npm run test:types:report [-- --output=<json>]
 *   default output: reports/test-results/types.json
 * Exit code 0 when every type test holds, 1 otherwise.
 */
import { mkdirSync, readdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import tsd from 'tsd';

import { buildTypeTestResults } from './type-test-report-core';

const REPO_ROOT = path.resolve(__dirname, '../..');
const TEST_DIR = 'tests/typetests';

async function main(): Promise<number> {
  const output = path.resolve(
    REPO_ROOT,
    process.argv
      .slice(2)
      .find((a) => a.startsWith('--output='))
      ?.slice('--output='.length) ?? 'reports/test-results/types.json',
  );
  const testFiles = readdirSync(path.join(REPO_ROOT, TEST_DIR))
    .filter((f) => f.endsWith('.test-d.ts'))
    .map((f) => `${TEST_DIR}/${f}`);

  const diagnostics = await tsd({ cwd: REPO_ROOT, testFiles });
  const results = buildTypeTestResults(REPO_ROOT, testFiles, diagnostics);

  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(results, null, 2)}\n`);

  for (const result of results.testResults) {
    console.log(
      `${result.status === 'passed' ? 'PASS' : 'FAIL'} ${result.name}`,
    );
  }
  for (const d of [
    ...results.testResults.flatMap((r) => r.diagnostics),
    ...results.otherDiagnostics,
  ]) {
    console.log(
      `  ${d.fileName}:${d.line ?? 0}:${d.column ?? 0} ${d.severity} ${d.message}`,
    );
  }
  console.log(
    `\n${results.numTotalTestFiles - results.numFailedTestFiles}/` +
      `${results.numTotalTestFiles} type test files passed; wrote ${path.relative(REPO_ROOT, output)}`,
  );
  return results.success ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error('Type test report failed:', err);
    process.exit(1);
  },
);
