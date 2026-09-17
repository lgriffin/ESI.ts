/**
 * The fault catalogue's self-test: the gate on the catalogue (every fault
 * cites a real Rule and asserts a fully specified outcome), the proof that the
 * gate and the runner can fail, and the shrink-only known-gaps ratchet.
 */
import fetchMock from 'jest-fetch-mock';
import { useHttpTransport } from '../bdd/support/transport';
import { FAULTS } from './catalogue';
import { WEAK_FAULT } from './fixtures/weak-fault';
import { KNOWN_GAPS, parseKnownGaps } from './knownGaps';
import { checkFault, useVirtualClock } from './runner';
import { TARGETS } from './targets';
import type { Fault, KnownGap } from './types';
import {
  addedGaps,
  catalogueProblems,
  knownGapProblems,
  loadBaseGaps,
  ruleProblems,
} from './validate';

fetchMock.enableMocks();

const byId = (id: string): Fault => {
  const fault = FAULTS.find((f) => f.id === id);
  if (!fault) throw new Error(`No fault "${id}" in the catalogue`);
  return fault;
};

const target = (name: string) => {
  const t = TARGETS.find((x) => x.name === name);
  if (!t) throw new Error(`No target "${name}"`);
  return t;
};

describe('Fault catalogue self-test', () => {
  describe('the gate', () => {
    it('finds no fault without a real Rule or a fully specified outcome (ratchet: stays 0)', () => {
      expect(catalogueProblems(FAULTS, TARGETS)).toEqual([]);
    });

    it('rejects the weak fixture for every property it fails to assert', () => {
      const problems = catalogueProblems([WEAK_FAULT], TARGETS).filter((p) =>
        p.startsWith('fault "Weak_Fault" on status.getStatus: '),
      );
      const reasons = problems.map((p) =>
        p.replace('fault "Weak_Fault" on status.getStatus: ', ''),
      );
      expect(reasons).toEqual([
        'names no error class (one of EsiError, TimeoutError, EsiValidationError, CodedError)',
        'error message /.*/ is not anchored with ^',
        'error message /.*/ matches the empty string',
        'does not assert the request count (retry count)',
        'does not assert the cache state (one of empty, holds-result)',
        'does not assert elapsed time within a window of at most 1000 ms',
        'does not assert the logs ([] for none)',
      ]);
      expect(catalogueProblems([WEAK_FAULT], TARGETS)).toEqual(
        expect.arrayContaining([
          'fault "Weak_Fault": id is not kebab-case',
          'fault "Weak_Fault": cites a Rule that core/0051-resilience.feature does not contain: "The EsiClient shall handle errors."',
        ]),
      );
    });

    it('rejects a Rule reference that differs from the feature file by one character', () => {
      const real = byId('body-stalls-after-headers').rule;
      if (!('feature' in real)) throw new Error('expected a feature reference');
      expect(ruleProblems(real)).toEqual([]);
      expect(
        ruleProblems({ ...real, rule: real.rule.replace(/\.$/, '') }),
      ).toHaveLength(1);
      expect(
        ruleProblems({ guide: 'ERRORS.md', section: 'Retryabilty' }),
      ).toEqual([
        'cites a section guides/ERRORS.md does not have: "Retryabilty"',
      ]);
    });

    it('rejects two faults that inject the same exchange', () => {
      const original = byId('html-body-on-200');
      const copy: Fault = { ...original, id: 'html-body-on-200-again' };
      expect(catalogueProblems([original, copy], TARGETS)).toEqual(
        expect.arrayContaining([
          'fault "html-body-on-200-again" on status.getStatus: injects the same exchange as fault "html-body-on-200"',
        ]),
      );
    });
  });

  describe('the runner', () => {
    useHttpTransport();
    useVirtualClock();

    it('reports every invariant a wrong expectation breaks', async () => {
      const real = byId('service-unavailable-html-body');
      const wrong: Fault = {
        ...real,
        expected: () => ({
          settlement: {
            rejects: {
              class: 'EsiError',
              statusCode: 503,
              message: /^Bad Request$/,
            },
          },
          requests: 1,
          cache: 'holds-result',
          elapsedMs: { min: 1000, max: 1050 },
          logs: [],
        }),
      };
      const problems = await checkFault(target('status.getStatus'), wrong);
      const invariants = problems.map((p) => p.split(':')[0]);
      expect(invariants).toEqual([
        'error message',
        'requests (retry count)',
        'elapsed time',
        'log',
        'cache (holds-result)',
      ]);
      expect(problems).toContain(
        'requests (retry count): expected 1, the client sent 4',
      );
    });

    it('reports a rejection where the fault expects the call to resolve', async () => {
      const real = byId('service-unavailable-html-body');
      const wrong: Fault = {
        ...real,
        expected: (ctx) => ({
          ...real.expected(ctx),
          settlement: { resolves: ctx.good.result, stale: true },
        }),
      };
      const problems = await checkFault(target('status.getStatus'), wrong);
      expect(problems).toEqual([
        'settlement: expected the call to resolve, but it rejected EsiError status 503 "Service Unavailable"',
      ]);
    });

    it('passes the real fault it was just shown to fail', async () => {
      await expect(
        checkFault(
          target('status.getStatus'),
          byId('service-unavailable-html-body'),
        ),
      ).resolves.toEqual([]);
    });
  });

  describe('known gaps', () => {
    it('names real faults, applicable targets, a bead and a reason', () => {
      expect(knownGapProblems(KNOWN_GAPS, FAULTS, TARGETS)).toEqual([]);
    });

    it('only shrinks against the base branch', () => {
      expect(addedGaps(KNOWN_GAPS, loadBaseGaps(parseKnownGaps))).toEqual([]);
    });

    const gap: KnownGap = {
      fault: 'later-page-unavailable',
      targets: ['market.getMarketOrders'],
      bead: 'esi-l38.2',
      reason: 'r',
    };

    it('fails closed when no base copy can be read', () => {
      expect(addedGaps([gap], { ref: null, gaps: null })).toEqual([
        'cannot read the base copy of tests/faults/known-gaps.json: fetch origin/master or set FAULTS_BASE_REF (the ratchet fails closed)',
      ]);
    });

    it('rejects a gap the base list does not have', () => {
      expect(addedGaps([gap], { ref: 'origin/master', gaps: [] })).toEqual([
        'known gap "later-page-unavailable market.getMarketOrders" is not in origin/master\'s list: the list only shrinks; fix the bug instead',
      ]);
      expect(addedGaps([], { ref: 'origin/master', gaps: [gap] })).toEqual([]);
    });
  });
});
