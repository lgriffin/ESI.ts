/**
 * Self-tests for the nightly spec drift check (scripts/spec/check-spec-drift.ts).
 *
 * The check compares the live spec with the endpoints the custom clients
 * define. It once read those definitions with a regex over the source, which
 * found none after the maps moved to `fromOperation` (#679, #681), and the
 * nightly filed every spec operation as missing (#692). These cases read the
 * real maps offline: every operation in the vendored route table must come
 * back as a definition, and an empty directory must fail rather than report.
 */
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';

import { esiOperations } from '../../../src/core/endpoints/esi-operations.generated';
import {
  codebaseEndpoints,
  normalizePath,
} from '../../../scripts/spec/check-spec-drift';

describe('check-spec-drift codebaseEndpoints', () => {
  const endpoints = codebaseEndpoints();
  const keys = new Set(
    endpoints.map((e) => `${normalizePath(e.path)}:${e.method}`),
  );

  it('reads definitions built by fromOperation, not only literal paths', () => {
    expect(endpoints).toContainEqual({
      name: 'getAllianceById',
      path: 'alliances/{allianceId}/',
      method: 'GET',
      file: 'allianceEndpoints.ts',
    });
  });

  it('finds a definition for every operation in the vendored route table', () => {
    const missing = Object.entries(esiOperations)
      .filter(
        ([, row]) => !keys.has(`${normalizePath(row.path)}:${row.method}`),
      )
      .map(([id]) => id);
    expect(missing).toEqual([]);
  });

  it('fails instead of reporting when no definition is found', () => {
    const empty = mkdtempSync(path.join(tmpdir(), 'spec-drift-'));
    try {
      expect(() => codebaseEndpoints(empty)).toThrow(
        /No endpoint definitions found/,
      );
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
