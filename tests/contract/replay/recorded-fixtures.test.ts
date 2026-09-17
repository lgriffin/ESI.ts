/**
 * Every recorded ESI payload, replayed through the public client method that
 * reaches its endpoint. See tests/contract/AGENTS.md.
 *
 * Reproduce one: npm run contract:replay -- -t "<endpoint key>"
 */
import * as path from 'path';
import { publicGetEndpoints } from '../recorded/catalogue';
import { listFixtureFiles, loadFixture } from '../recorded/fixture';
import { KNOWN_MISMATCHES_PATH } from '../recorded/policy';
import { readReasonList } from '../recorded/ratchet';
import { describeIssues, replayFixture } from '../recorded/replay';

const definitions = new Map(
  publicGetEndpoints().map((e) => [e.key, e.definition]),
);
const knownMismatches = readReasonList(KNOWN_MISMATCHES_PATH);
const fixtures = listFixtureFiles().map((file) => ({
  file,
  fixture: loadFixture(file),
}));

const repro = (key: string) =>
  `Reproduce: npm run contract:replay -- -t "${key}"`;

describe('recorded ESI payloads replay through the client pipeline', () => {
  it('has fixtures to replay', () => {
    expect(fixtures.length).toBeGreaterThan(0);
  });

  describe.each(fixtures.map((f) => [f.fixture.endpoint, f] as const))(
    '%s',
    (key, { file, fixture }) => {
      const where = path.relative(process.cwd(), file);

      if (key in knownMismatches) {
        it('still fails to replay, as known-mismatches.json records', async () => {
          const definition = definitions.get(key);
          if (!definition)
            throw new Error(`${key} is not a public GET endpoint`);
          const report = await replayFixture(fixture, definition);
          if (!report.rejection && report.problems.length === 0) {
            throw new Error(
              `${key} now replays cleanly. Remove it from tests/contract/fixtures/known-mismatches.json. ${repro(key)}`,
            );
          }
        });
        return;
      }

      it('is accepted by the schema, keeps its keys, and caches by its headers', async () => {
        const definition = definitions.get(key);
        if (!definition) {
          throw new Error(
            `${where} replays ${key}, which is not a public GET endpoint definition`,
          );
        }
        const report = await replayFixture(fixture, definition);
        if (report.rejection) {
          throw new Error(
            [
              `The ${key} response schema rejects the body ESI sent (recorded ${fixture.recordedAt}, compatibility date ${fixture.compatibilityDate}):`,
              ...describeIssues(report.rejection).map((l) => `  ${l}`),
              `Fixture: ${where}`,
              'Fix the schema (a loosening is a fix per guides/SEMVER.md) or, if it cannot be fixed here, list it in tests/contract/fixtures/known-mismatches.json.',
              repro(key),
            ].join('\n'),
          );
        }
        if (report.problems.length > 0) {
          throw new Error(
            [
              `Replaying ${where}:`,
              ...report.problems.map((p) => `  ${p}`),
              repro(key),
            ].join('\n'),
          );
        }
      });
    },
  );
});
