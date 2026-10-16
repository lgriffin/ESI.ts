/**
 * `COMPATIBILITY_DATE` (src/core/constants.ts) is the one place the ESI
 * compatibility date lives.
 *
 * The client sends it on every request, and the generators read it, but six
 * other consumers of the OpenAPI document carried their own literal copy:
 * the Schemathesis runner (spec URL and `X-Compatibility-Date` header), the
 * endpoint scaffold, the token creator, the OKF generator and two contract
 * helpers. All six stayed on 2025-12-16 while the client moved to 2026-08-18,
 * so the nightly fuzz run and the live contract tests checked a contract the
 * client no longer asks for. Each now imports the constant (or, in bash,
 * prints it with ts-node), and this test fails if a literal date comes back.
 *
 * Offline: it reads the working tree only. `redocly.yaml`, which cannot import
 * the constant, is checked separately in `generated-spec-date.test.ts`.
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');

/** Trees that hold code or CI configuration that talks to ESI. */
const SCANNED_ROOTS = ['scripts', 'tests', 'src', '.github'];

/**
 * Recorded material: responses and documents captured from ESI as they were,
 * which legitimately name the date they were recorded under.
 */
const EXCLUDED_DIRS = [
  'tests/contract/snapshots',
  'tests/contract/fixtures/recorded',
];

const DATE = String.raw`\d{4}-\d{2}-\d{2}`;

/**
 * A literal YYYY-MM-DD date in a spec URL query (`compatibility_date=` then
 * the date) or a header (`X-Compatibility-Date:` then the date, also as a
 * quoted object key).
 */
const LITERAL_DATE = new RegExp(
  String.raw`compatibility_date=${DATE}|x-compatibility-date['"]?\s*:\s*['"]?${DATE}`,
  'i',
);

function filesUnder(dir: string): string[] {
  const rel = path.relative(ROOT, dir).split(path.sep).join('/');
  if (EXCLUDED_DIRS.includes(rel)) return [];
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules') return [];
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}

/** Every `file:line` in the scanned trees that hardcodes a date. */
function literalDateSites(): string[] {
  return SCANNED_ROOTS.flatMap((root) => filesUnder(path.join(ROOT, root)))
    .flatMap((file) => {
      const text = readFileSync(file, 'utf8');
      if (text.includes('\0')) return [];
      const rel = path.relative(ROOT, file).split(path.sep).join('/');
      return text
        .split('\n')
        .flatMap((line, i) =>
          LITERAL_DATE.test(line) ? [`${rel}:${i + 1}`] : [],
        );
    })
    .sort();
}

describe('COMPATIBILITY_DATE is the only compatibility date in code and CI', () => {
  it('no file in scripts/, tests/, src/ or .github/ hardcodes one', () => {
    expect(literalDateSites()).toEqual([]);
  });

  it('scans a non-trivial number of files', () => {
    // An empty walk would make the case above pass against nothing.
    const count = SCANNED_ROOTS.flatMap((root) =>
      filesUnder(path.join(ROOT, root)),
    ).length;
    expect(count).toBeGreaterThan(100);
  });
});

describe('the literal-date pattern', () => {
  const year = '2025';
  const date = `${year}-12-16`;

  it.each([
    `https://esi.evetech.net/meta/openapi.json?compatibility_date=${date}`,
    `--header "X-Compatibility-Date: ${date}"`,
    `'X-Compatibility-Date': '${date}'`,
    `"x-compatibility-date": "${date}"`,
  ])('flags %s', (line) => {
    expect(LITERAL_DATE.test(line)).toBe(true);
  });

  it.each([
    'openapi.json?compatibility_date=${COMPATIBILITY_DATE}',
    '--header "X-Compatibility-Date: ${COMPAT_DATE}"',
    "'x-compatibility-date': COMPATIBILITY_DATE,",
    `compatibility_date: '${date}'`,
  ])('leaves %s alone', (line) => {
    expect(LITERAL_DATE.test(line)).toBe(false);
  });

  it('skips the recorded fixtures and snapshots', () => {
    const scanned = filesUnder(path.join(ROOT, 'tests')).map((f) =>
      path.relative(ROOT, f).split(path.sep).join('/'),
    );
    expect(
      scanned.some((f) => EXCLUDED_DIRS.some((dir) => f.startsWith(`${dir}/`))),
    ).toBe(false);
  });
});
