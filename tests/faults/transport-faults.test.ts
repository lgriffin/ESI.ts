/**
 * The PR run: every fault in the catalogue, once per representative target,
 * through the real pipeline. See tests/faults/AGENTS.md.
 */
import fetchMock from 'jest-fetch-mock';
import { useHttpTransport } from '../bdd/support/transport';
import { assertThat } from '../support/assertions';
import { FAULTS } from './catalogue';
import { knownGapFor } from './knownGaps';
import { checkFault, failureMessage, useVirtualClock } from './runner';
import { TARGETS } from './targets';

// jest.faults.config.cjs has no setup file; the seam drives the global mock.
fetchMock.enableMocks();

const cases = FAULTS.flatMap((fault) =>
  TARGETS.filter((t) => fault.appliesTo?.(t) ?? true).map((target) => ({
    name: `${fault.id} ${target.name}`,
    fault,
    target,
  })),
);

describe('Transport fault catalogue (through the transport seam)', () => {
  useHttpTransport();
  useVirtualClock();

  it.each(cases)('$name', async ({ fault, target }) => {
    const problems = await checkFault(target, fault);
    const gap = knownGapFor(fault.id, target.name);
    if (gap) {
      assertThat(
        problems.length > 0,
        `Known gap "${fault.id}" on ${target.name} (${gap.bead}) no longer reproduces: the client now meets the expected outcome. Remove the entry from tests/faults/known-gaps.json.`,
      );
      return;
    }
    assertThat(problems.length === 0, failureMessage(target, fault, problems));
  });
});
