/**
 * The generated artefacts must describe the spec the client actually asks for.
 *
 * `COMPATIBILITY_DATE` goes out on every request as `X-Compatibility-Date`, so
 * it decides which ESI serves. The generator had its own copy of that date, and
 * the two drifted: the client asked for 2026-05-19 while the cache TTLs, rate
 * limit groups, scopes and response types all came from 2025-12-16. Twelve
 * routes ESI introduced in between had no TTL at all — `sovereignty/systems`
 * among them — so the client revalidated them on every single call
 * (esi-23g.31).
 *
 * Nothing could catch it, because no committed file recorded the date it came
 * from: the artefacts carried a spec hash, which says two builds agree with
 * each other but not which spec they agree about. Each now carries the date,
 * and this compares it with the constant. Offline, so it runs in `npm test`
 * rather than waiting for a nightly that pinned the stale date anyway.
 */
import { readFileSync } from 'fs';
import * as path from 'path';

import { COMPATIBILITY_DATE } from '../../../src/core/constants';

const ROOT = path.resolve(__dirname, '../../..');

/** Every generated file whose content depends on which spec was fetched. */
const GENERATED = [
  'src/types/generated/esi-spec.generated.ts',
  'src/core/endpoints/esi-cache-ttls.generated.ts',
  'src/core/endpoints/esi-rate-limit-groups.generated.ts',
  'src/core/endpoints/esi-scopes.generated.ts',
];

/** The `// Compatibility date: YYYY-MM-DD` header the generator writes. */
function recordedDate(file: string): string | undefined {
  const header = readFileSync(path.join(ROOT, file), 'utf8').slice(0, 400);
  return /^\/\/ Compatibility date: (\d{4}-\d{2}-\d{2})$/m.exec(header)?.[1];
}

describe('generated artefacts match the compatibility date the client sends', () => {
  it('has a date to compare against', () => {
    // A constant that stopped being a date would make every case below pass
    // against nothing.
    expect(COMPATIBILITY_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it.each(GENERATED)('%s records the date it was generated from', (file) => {
    expect(recordedDate(file)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it.each(GENERATED)('%s was generated from COMPATIBILITY_DATE', (file) => {
    expect(recordedDate(file)).toBe(COMPATIBILITY_DATE);
  });
});

describe('recordedDate', () => {
  it('reads the header the generator writes', () => {
    expect(recordedDate(GENERATED[0] as string)).toBe(COMPATIBILITY_DATE);
  });

  it('finds nothing in a file without the header', () => {
    // If the generator stops writing the line, the cases above must fail
    // rather than quietly compare undefined with undefined.
    expect(recordedDate('package.json')).toBeUndefined();
  });
});
