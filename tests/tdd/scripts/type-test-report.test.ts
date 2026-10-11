import * as path from 'path';

import { buildTypeTestResults } from '../../../scripts/quality/type-test-report-core';

const ROOT = path.resolve('/repo');
const FILES = ['tests/typetests/a.test-d.ts', 'tests/typetests/b.test-d.ts'];

describe('buildTypeTestResults', () => {
  it('reports every listed file as passed when tsd returns no diagnostics', () => {
    const results = buildTypeTestResults(ROOT, FILES, []);

    expect(results).toEqual({
      tool: 'tsd',
      success: true,
      numTotalTestFiles: 2,
      numFailedTestFiles: 0,
      otherDiagnostics: [],
      testResults: [
        { name: FILES[0], status: 'passed', diagnostics: [] },
        { name: FILES[1], status: 'passed', diagnostics: [] },
      ],
    });
  });

  it('fails the file an error is reported against, with a repository-relative path', () => {
    const results = buildTypeTestResults(ROOT, FILES, [
      {
        fileName: path.join(ROOT, 'tests/typetests/b.test-d.ts'),
        message: "Argument of type 'number' is not assignable",
        severity: 'error',
        line: 2,
        column: 19,
      },
    ]);

    expect(results.success).toBe(false);
    expect(results.numFailedTestFiles).toBe(1);
    expect(results.testResults[0]!.status).toBe('passed');
    expect(results.testResults[1]).toEqual({
      name: 'tests/typetests/b.test-d.ts',
      status: 'failed',
      diagnostics: [
        {
          fileName: 'tests/typetests/b.test-d.ts',
          message: "Argument of type 'number' is not assignable",
          severity: 'error',
          line: 2,
          column: 19,
        },
      ],
    });
  });

  it('keeps a warning on the file without failing it', () => {
    const results = buildTypeTestResults(ROOT, FILES, [
      { fileName: FILES[0]!, message: 'deprecated', severity: 'warning' },
    ]);

    expect(results.success).toBe(true);
    expect(results.testResults[0]!.status).toBe('passed');
    expect(results.testResults[0]!.diagnostics).toHaveLength(1);
  });

  it('fails the run on an error outside every test file', () => {
    const results = buildTypeTestResults(ROOT, FILES, [
      { fileName: 'dist/index.d.ts', message: 'broken', severity: 'error' },
    ]);

    expect(results.success).toBe(false);
    expect(results.numFailedTestFiles).toBe(0);
    expect(results.otherDiagnostics).toEqual([
      { fileName: 'dist/index.d.ts', message: 'broken', severity: 'error' },
    ]);
  });
});
