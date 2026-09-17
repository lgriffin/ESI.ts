/**
 * Which public GET endpoints have a recorded fixture, and which lists are
 * stale. Pure, so tests/contract/replay/harness.test.ts can show each problem
 * being reported.
 */
import type { ReasonList } from './ratchet';

export interface CoverageInput {
  publicEndpoints: string[];
  fixtures: string[];
  unrecordable: ReasonList;
  knownMismatches: ReasonList;
}

const record = (key: string) =>
  `ESI_LIVE_TESTS=true npm run contract:record -- --only=${key}`;

export function coverageProblems(input: CoverageInput): string[] {
  const publicSet = new Set(input.publicEndpoints);
  const fixtureSet = new Set(input.fixtures);
  const problems: string[] = [];

  for (const key of input.publicEndpoints) {
    if (!fixtureSet.has(key) && !(key in input.unrecordable)) {
      problems.push(
        `${key}: public GET endpoint with no recorded fixture. Record it (${record(key)}).`,
      );
    }
  }
  for (const key of input.fixtures) {
    if (!publicSet.has(key)) {
      problems.push(
        `${key}: fixture for an endpoint that is not a public GET definition; delete tests/contract/fixtures/recorded/${key}.json.`,
      );
    }
    if (key in input.unrecordable) {
      problems.push(
        `${key}: has a fixture but is still listed in unrecordable.json; remove the entry.`,
      );
    }
  }
  for (const key of Object.keys(input.unrecordable)) {
    if (!publicSet.has(key)) {
      problems.push(
        `${key}: unrecordable.json entry names no public GET endpoint; remove the entry.`,
      );
    }
  }
  for (const key of Object.keys(input.knownMismatches)) {
    if (!fixtureSet.has(key)) {
      problems.push(
        `${key}: known-mismatches.json entry has no fixture to replay; remove the entry.`,
      );
    }
  }
  return problems;
}
