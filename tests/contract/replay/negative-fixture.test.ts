/**
 * The replay tier's own failure signal: a recorded fixture edited to break its
 * schema must be rejected by the same replay the real fixtures go through.
 * If this passes while the replay stops validating, the tier is blind.
 */
import * as fs from 'fs';
import * as path from 'path';
import { publicGetEndpoints } from '../recorded/catalogue';
import { fixturePath, loadFixture } from '../recorded/fixture';
import { NEGATIVE_FIXTURES_DIR } from '../recorded/policy';
import { describeIssues, replayFixture } from '../recorded/replay';
import { EsiValidationError } from '../../../src/core/util/error';

const definitions = new Map(
  publicGetEndpoints().map((e) => [e.key, e.definition]),
);

/** The negative fixtures, each with the field its edit breaks. */
const NEGATIVE = [
  {
    endpoint: 'status.getStatus',
    field: 'players',
    edit: 'players is the string "many" instead of an integer',
  },
];

describe('a recorded fixture edited to violate its schema', () => {
  it('has a negative fixture on disk for each case', () => {
    const onDisk = fs
      .readdirSync(NEGATIVE_FIXTURES_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
      .sort();
    expect(onDisk).toEqual(NEGATIVE.map((n) => n.endpoint).sort());
  });

  it.each(NEGATIVE)(
    '$endpoint is rejected with EsiValidationError naming $field ($edit)',
    async ({ endpoint, field }) => {
      const fixture = loadFixture(fixturePath(endpoint, NEGATIVE_FIXTURES_DIR));
      const report = await replayFixture(fixture, definitions.get(endpoint)!);

      expect(report.rejection).toBeInstanceOf(EsiValidationError);
      expect(report.rejection!.direction).toBe('response');
      expect(describeIssues(report.rejection!)).toEqual(
        expect.arrayContaining([
          expect.stringMatching(new RegExp(`^${field}: `)),
        ]),
      );
    },
  );

  it('differs from its recorded original only in the edited field', () => {
    for (const { endpoint, field } of NEGATIVE) {
      const negative = loadFixture(
        path.join(NEGATIVE_FIXTURES_DIR, `${endpoint}.json`),
      );
      const original = loadFixture(fixturePath(endpoint));
      const strip = (body: unknown) => {
        const copy = { ...(body as Record<string, unknown>) };
        delete copy[field];
        return copy;
      };
      expect(
        negative.pages.map((p) => Object.keys(p.body as object).sort()),
      ).toEqual(
        original.pages.map((p) => Object.keys(p.body as object).sort()),
      );
      expect(strip(negative.pages[0]!.body)).toEqual(
        strip(original.pages[0]!.body),
      );
    }
  });
});
