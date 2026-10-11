/**
 * Turns tsd diagnostics into a per-file result record, so a type test run
 * can be read the way a Jest `--json` file is. See `type-test-report.ts`.
 */
import * as path from 'path';

/** One tsd diagnostic, as `tsd` returns it. */
export interface TypeDiagnostic {
  fileName: string;
  message: string;
  severity: 'error' | 'warning';
  line?: number;
  column?: number;
}

export interface TypeTestFileResult {
  /** Repository-relative path, forward slashes. */
  name: string;
  status: 'passed' | 'failed';
  diagnostics: TypeDiagnostic[];
}

export interface TypeTestResults {
  tool: 'tsd';
  success: boolean;
  numTotalTestFiles: number;
  numFailedTestFiles: number;
  /** Diagnostics in no listed test file, such as the typings themselves. */
  otherDiagnostics: TypeDiagnostic[];
  testResults: TypeTestFileResult[];
}

const toRelative = (root: string, file: string): string =>
  path.relative(root, path.resolve(root, file)).split(path.sep).join('/');

/**
 * One record per test file: failed when any error-severity diagnostic is
 * reported against it. A run fails on any error, in a test file or not.
 */
export function buildTypeTestResults(
  root: string,
  testFiles: readonly string[],
  diagnostics: readonly TypeDiagnostic[],
): TypeTestResults {
  const byFile = new Map<string, TypeDiagnostic[]>();
  for (const file of testFiles) byFile.set(toRelative(root, file), []);

  const otherDiagnostics: TypeDiagnostic[] = [];
  for (const diagnostic of diagnostics) {
    const name = toRelative(root, diagnostic.fileName);
    const relative = { ...diagnostic, fileName: name };
    const list = byFile.get(name);
    if (list) list.push(relative);
    else otherDiagnostics.push(relative);
  }

  const isError = (d: TypeDiagnostic) => d.severity === 'error';
  const testResults = [...byFile]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, list]): TypeTestFileResult => ({
      name,
      status: list.some(isError) ? 'failed' : 'passed',
      diagnostics: list,
    }));
  const numFailedTestFiles = testResults.filter(
    (r) => r.status === 'failed',
  ).length;

  return {
    tool: 'tsd',
    success: numFailedTestFiles === 0 && !otherDiagnostics.some(isError),
    numTotalTestFiles: testResults.length,
    numFailedTestFiles,
    otherDiagnostics,
    testResults,
  };
}
