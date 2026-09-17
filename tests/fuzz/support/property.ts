/**
 * Shared runner for the property files in tests/fuzz (`*.property.test.ts`).
 *
 * `describeProperty` registers two kinds of test for one invariant:
 *
 *   holds                      the property against the real subject.
 *   is not vacuous › <mutant>  the same property against each registered
 *                              known-bad subject, which must FAIL it.
 *
 * A property that still passes when the code under test is broken proves
 * nothing, so every property declares at least one mutant and the vacuity
 * test fails when a mutant survives. The mutant must be caught by an
 * assertion (`expect` or `InvariantViolation`); a crash in setup does not
 * count, so a broken harness cannot pass for a working property.
 *
 * Run modes, read from the environment (see tests/fuzz/AGENTS.md):
 *
 *   FC_NUM_RUNS  runs per `holds` property (default: fast-check's 100).
 *                The nightly job sets 10000.
 *   FC_SEED      replay a run with this seed (32-bit integer).
 *   FC_PATH      replay the shrunk counter-example at this path. Needs FC_SEED.
 *
 * Invalid values throw rather than falling back, so a nightly run can never
 * silently use fewer runs than it asked for.
 */
import * as path from 'path';
import * as fc from 'fast-check';

import { setLogger } from '../../../src/core/logger/loggerUtil';
import { createNoopLogger } from '../../../src/core/logger/NoopLogger';

// Thousands of runs per property: library log lines would bury the report.
setLogger(createNoopLogger());

/** Thrown by model checks that do not use `expect`. */
export class InvariantViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvariantViolation';
  }
}

/** Fail the current property run with a message naming the broken invariant. */
export function invariant(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new InvariantViolation(message);
}

export interface RunSettings {
  numRuns?: number;
  seed?: number;
  path?: string;
}

/** Parse FC_NUM_RUNS / FC_SEED / FC_PATH. Exported for its own unit test. */
export function readRunSettings(
  env: Record<string, string | undefined> = process.env,
): RunSettings {
  const settings: RunSettings = {};
  const runs = env.FC_NUM_RUNS;
  if (runs !== undefined && runs !== '') {
    if (!/^[1-9][0-9]{0,6}$/.test(runs)) {
      throw new Error(
        `FC_NUM_RUNS must be a positive integer below 10000000, got "${runs}"`,
      );
    }
    settings.numRuns = Number(runs);
  }
  const seed = env.FC_SEED;
  if (seed !== undefined && seed !== '') {
    if (!/^-?[0-9]{1,10}$/.test(seed) || Number(seed) !== (Number(seed) | 0)) {
      throw new Error(`FC_SEED must be a 32-bit integer, got "${seed}"`);
    }
    settings.seed = Number(seed);
  }
  const replayPath = env.FC_PATH;
  if (replayPath !== undefined && replayPath !== '') {
    if (settings.seed === undefined) {
      throw new Error('FC_PATH replays a counter-example and needs FC_SEED');
    }
    if (!/^[0-9]+(:[0-9]+)*$/.test(replayPath)) {
      throw new Error(`FC_PATH must look like "12:0:3", got "${replayPath}"`);
    }
    settings.path = replayPath;
  }
  return settings;
}

type AnyProperty = fc.IRawProperty<unknown, boolean>;

export interface PropertySpec<S> {
  /** Stable name. It is the `describe` title, so it is what `-t` selects. */
  name: string;
  /** `__filename` of the declaring test file, used in the replay command. */
  file: string;
  /** Load the real subject. */
  subject: () => S;
  /**
   * Known-bad subjects, by name. Each must violate the invariant; a mutant the
   * property cannot catch means the property is vacuous for that defect.
   */
  mutants: Record<string, () => S>;
  /** Build the property for a subject. */
  property: (subject: S) => AnyProperty;
  /**
   * Runs for a `holds` check when FC_NUM_RUNS is unset. Leave undefined for
   * fast-check's default of 100; only lower it for a property whose single run
   * goes through the full request pipeline, and say why at the call site.
   */
  prRuns?: number;
  /** Runs allowed to find each mutant. Default 200. */
  vacuityRuns?: number;
  /** Per-test timeout in ms. */
  timeoutMs?: number;
}

function replayCommand(
  file: string,
  testName: string,
  seed: number,
  counterexamplePath: string | null,
): string {
  const base = path.basename(file).replace(/\.ts$/, '');
  const env = [`FC_SEED=${seed}`];
  if (counterexamplePath) env.push(`FC_PATH=${counterexamplePath}`);
  const escaped = testName
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/"/g, '\\"');
  return `${env.join(' ')} npx jest --config jest.fuzz.config.cjs --testPathPatterns ${base} -t "${escaped}"`;
}

function isAssertionFailure(error: unknown): boolean {
  if (error instanceof InvariantViolation) return true;
  return (
    typeof error === 'object' && error !== null && 'matcherResult' in error
  );
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function currentTestName(fallback: string): string {
  return expect.getState().currentTestName ?? fallback;
}

/** Register the `holds` and `is not vacuous` tests for one property. */
export function describeProperty<S>(spec: PropertySpec<S>): void {
  const mutantNames = Object.keys(spec.mutants);
  if (mutantNames.length === 0) {
    throw new Error(
      `Property "${spec.name}" registers no mutant. Every property needs at least one known-bad subject it must fail against (tests/fuzz/AGENTS.md).`,
    );
  }

  // A deeper run (FC_NUM_RUNS) gets a proportionally longer Jest timeout.
  const requestedRuns = readRunSettings().numRuns;
  const baseTimeout = spec.timeoutMs ?? 30_000;
  const holdsTimeout = requestedRuns
    ? Math.max(
        baseTimeout,
        Math.ceil((baseTimeout * requestedRuns) / (spec.prRuns ?? 100)),
      )
    : spec.timeoutMs;

  describe(spec.name, () => {
    it(
      'holds',
      async () => {
        const settings = readRunSettings();
        const params: fc.Parameters<unknown> = {
          numRuns: settings.numRuns ?? spec.prRuns,
          seed: settings.seed,
          path: settings.path,
        };
        const details = await fc.check(spec.property(spec.subject()), params);
        if (details.failed) {
          const name = currentTestName(`${spec.name} holds`);
          throw new Error(
            `${fc.defaultReportMessage(details) ?? 'Property failed'}\n\n` +
              `Violation: ${describeError(details.errorInstance)}\n\n` +
              `Property: ${spec.name}\nSeed: ${details.seed}\nPath: ${details.counterexamplePath ?? '(none)'}\n` +
              `Reproduce: ${replayCommand(spec.file, name, details.seed, details.counterexamplePath)}\n` +
              'Policy: commit the shrunk counter-example as a named example test in the PR that fixes it (tests/fuzz/AGENTS.md).',
          );
        }
        expect(details.failed).toBe(false);
      },
      holdsTimeout,
    );

    describe('is not vacuous', () => {
      for (const mutantName of mutantNames) {
        it(
          `fails against mutant: ${mutantName}`,
          async () => {
            const settings = readRunSettings();
            const loadMutant = spec.mutants[mutantName]!;
            const details = await fc.check(spec.property(loadMutant()), {
              numRuns: spec.vacuityRuns ?? 200,
              seed: settings.seed,
              endOnFailure: true,
            });
            const name = currentTestName(`${spec.name} ${mutantName}`);
            if (!details.failed) {
              throw new Error(
                `VACUOUS PROPERTY: "${spec.name}" passed ${details.numRuns} runs against the known-bad mutant "${mutantName}".\n` +
                  'The property cannot tell this defect from correct code. Strengthen its assertions or its generators.\n' +
                  `Seed: ${details.seed}\nReproduce: ${replayCommand(spec.file, name, details.seed, null)}`,
              );
            }
            if (!isAssertionFailure(details.errorInstance)) {
              throw new Error(
                `Vacuity check for "${spec.name}" is broken: mutant "${mutantName}" failed with a non-assertion error, so it proves nothing about the property.\n` +
                  `${String(details.errorInstance)}\nSeed: ${details.seed}\n` +
                  `Reproduce: ${replayCommand(spec.file, name, details.seed, null)}`,
              );
            }
            expect(details.failed).toBe(true);
          },
          spec.timeoutMs,
        );
      }
    });
  });
}
