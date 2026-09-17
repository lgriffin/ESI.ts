/**
 * The recorded fixture set as a whole: every public GET endpoint is covered
 * or listed, the shrink-only lists have not grown, and the fixtures fit their
 * size budget and describe themselves consistently.
 */
import * as fs from 'fs';
import * as path from 'path';
import { COMPATIBILITY_DATE } from '../../../src/core/constants';
import { publicGetEndpoints } from '../recorded/catalogue';
import { coverageProblems } from '../recorded/coverage';
import { listFixtureFiles, loadFixture } from '../recorded/fixture';
import {
  FIXTURE_BUDGET_BYTES,
  FIXTURE_MAX_BYTES,
  KNOWN_MISMATCHES_PATH,
  NEGATIVE_FIXTURES_DIR,
  UNRECORDABLE_PATH,
} from '../recorded/policy';
import {
  readBaseList,
  readReasonList,
  shrinkOnlyProblems,
} from '../recorded/ratchet';

const fail = (problems: string[]) => {
  if (problems.length > 0) throw new Error(problems.join('\n'));
};

const files = listFixtureFiles();
const fixtures = files.map((file) => ({ file, fixture: loadFixture(file) }));

describe('recorded fixture coverage', () => {
  it('covers every public GET endpoint, or lists why it cannot', () => {
    fail(
      coverageProblems({
        publicEndpoints: publicGetEndpoints().map((e) => e.key),
        fixtures: fixtures.map((f) => f.fixture.endpoint),
        unrecordable: readReasonList(UNRECORDABLE_PATH),
        knownMismatches: readReasonList(KNOWN_MISMATCHES_PATH),
      }),
    );
  });

  it('names each fixture file after the endpoint it records', () => {
    fail(
      fixtures
        .filter(
          ({ file, fixture }) =>
            path.basename(file) !== `${fixture.endpoint}.json`,
        )
        .map(
          ({ file, fixture }) =>
            `${file} records ${fixture.endpoint}; rename it ${fixture.endpoint}.json`,
        ),
    );
  });

  it.each([
    ['unrecordable.json', UNRECORDABLE_PATH],
    ['known-mismatches.json', KNOWN_MISMATCHES_PATH],
  ])('%s only shrinks', (name, file) => {
    fail(shrinkOnlyProblems(name, readReasonList(file), readBaseList(file)));
  });
});

describe('recorded fixture budget', () => {
  const all = [...files, ...listFixtureFiles(NEGATIVE_FIXTURES_DIR)];
  const size = (f: string) => fs.statSync(f).size;

  it(`keeps every fixture under ${FIXTURE_MAX_BYTES} bytes`, () => {
    fail(
      all
        .filter((f) => size(f) > FIXTURE_MAX_BYTES)
        .map(
          (f) =>
            `${f} is ${size(f)} bytes; tighten the truncation limits in tests/contract/recorded/policy.ts`,
        ),
    );
  });

  it(`keeps all fixtures together under ${FIXTURE_BUDGET_BYTES} bytes`, () => {
    const total = all.reduce((sum, f) => sum + size(f), 0);
    if (total > FIXTURE_BUDGET_BYTES) {
      throw new Error(
        `Recorded fixtures total ${total} bytes, over the ${FIXTURE_BUDGET_BYTES}-byte budget in tests/contract/recorded/policy.ts.`,
      );
    }
  });
});

describe('recorded fixture metadata', () => {
  it(`was recorded under the compatibility date the client sends (${COMPATIBILITY_DATE})`, () => {
    fail(
      fixtures
        .filter(
          ({ fixture }) => fixture.compatibilityDate !== COMPATIBILITY_DATE,
        )
        .map(
          ({ fixture }) =>
            `${fixture.endpoint} was recorded under ${fixture.compatibilityDate}; re-record it (ESI_LIVE_TESTS=true npm run contract:record -- --only=${fixture.endpoint}).`,
        ),
    );
  });

  it('keeps X-Pages equal to the number of recorded pages, and the upstream count', () => {
    fail(
      fixtures.flatMap(({ fixture }) => {
        const problems: string[] = [];
        fixture.pages.forEach((page, i) => {
          const xPages = page.headers['x-pages'];
          if (xPages !== undefined && Number(xPages) !== fixture.pages.length) {
            problems.push(
              `${fixture.endpoint} page ${i + 1} says X-Pages ${xPages} but ${fixture.pages.length} page(s) are recorded`,
            );
          }
        });
        if (fixture.upstreamPages < fixture.pages.length) {
          problems.push(
            `${fixture.endpoint} records more pages than ESI reported (${fixture.upstreamPages})`,
          );
        }
        return problems;
      }),
    );
  });

  it('keeps only the allowed response headers', () => {
    const allowed = new Set([
      'cache-control',
      'content-type',
      'etag',
      'expires',
      'last-modified',
      'x-cursor-after',
      'x-cursor-before',
      'x-pages',
    ]);
    fail(
      fixtures.flatMap(({ fixture }) =>
        fixture.pages.flatMap((p) =>
          Object.keys(p.headers)
            .filter((h) => !allowed.has(h))
            .map(
              (h) =>
                `${fixture.endpoint} keeps header ${h}, which recordings drop`,
            ),
        ),
      ),
    );
  });
});
