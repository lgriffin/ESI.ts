# tests/fuzz — agent notes

This tier owns **invariants over input spaces**: properties that must hold for
every page count, response order, cursor sequence, cache history, clock
position and backoff attempt, checked with
[fast-check](https://fast-check.dev). Example-based behaviour belongs to the
BDD Rules in `tests/bdd/`; a property here states what no example can cover.

## Property files

Model-based and invariant properties are `*.property.test.ts` and register
through `describeProperty` in [`support/property.ts`](support/property.ts).
Older files in this directory (`*-fuzz.test.ts`, the fault-injection suite)
are plain fast-check tests and are not covered by the rules below.

| File                                     | Invariant                                                                                                                   |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `circuit-breaker-model.property.test.ts` | `CircuitBreaker` matches a closed/open/half-open reference model under any command sequence, including overlapping calls    |
| `pagination-assembly.property.test.ts`   | Eager, `fetchAll*` and cursor walks return every page once, in order, for any page count, failure pattern and arrival order |
| `cache-key.property.test.ts`             | Cache keys are deterministic, injective, in canonical query order, and scoped to the access token                           |
| `etag-cache-model.property.test.ts`      | The ETag cache predicts every request, If-None-Match, result and stored entry across calls, identities, faults and time     |
| `backoff.property.test.ts`               | `retryDelay` is finite, in `[0, maxDelayMs]` and monotonic in attempt for any jitter value                                  |

Drive the client through a real domain client and a fake ESI installed on
`jest-fetch-mock` ([`support/fakeEsi.ts`](support/fakeEsi.ts)), the same seam
as `tests/bdd/support/transport.ts`. The fake is a handler rather than a queue
because properties need replies that depend on the request (If-None-Match,
page number, attempt count). Never stub a client method, `handleRequest` or a
pipeline stage for the real subject.

## Run modes

| Mode    | Where                                      | Runs per property                                   | Seed                               |
| ------- | ------------------------------------------ | --------------------------------------------------- | ---------------------------------- |
| PR      | `fuzz-tests` job in `ci.yml`               | fast-check default (100); `prRuns` where noted (60) | random, printed on failure         |
| Nightly | `.github/workflows/nightly-properties.yml` | `FC_NUM_RUNS=10000`                                 | chosen per night, printed up front |
| Replay  | local                                      | as the failure message says                         | `FC_SEED`, `FC_PATH`               |

A failure prints the shrunk counter-example, the violated invariant, the seed,
the path and the exact command, for example:

```bash
FC_SEED=641468347 FC_PATH=250:13:5:7 npx jest --config jest.fuzz.config.cjs --testPathPatterns circuit-breaker-model.property.test -t "circuit breaker matches the closed/open/half-open reference model holds"
```

`FC_NUM_RUNS`, `FC_SEED` and `FC_PATH` are validated; a malformed value fails
the run instead of falling back to defaults (`run-settings.test.ts`).

## Counter-example policy

A shrunk failure is a bug report with a minimal reproduction. In the PR that
fixes it:

1. Commit the counter-example as a named example test in the same property
   file, under `describe('<subject> counter-examples')`, naming the bead or
   issue and the seed it was shrunk from. It replays the exact inputs through
   the same runner the property uses (`runModel`, `runEager`, ...).
2. Fix the code in a separate `fix:` commit. If the behaviour is covered by a
   BDD Rule, add the reproducing scenario first (`ears-gherkin-dev` skill).
3. Never weaken a generator or an invariant to make a counter-example go away.

If the fix cannot land in the same PR, exclude the case through a named,
shrink-only known-failures list in the property file, link the bead, and
describe the bug in the PR. There are no known failures today.

## Vacuity: every property must be able to fail

A property that still passes when its subject is broken is vacuous: it runs,
it is green, and it proves nothing. `describeProperty` therefore requires each
property to register at least one **mutant**, a known-bad subject, and adds a
test per mutant that runs the property against it and **expects it to fail**.

Why this design:

- **It tests the property, not the assertions.** Disabling assertions (a
  no-op `expect`) would make every property "fail" the check trivially and
  would say nothing about whether the generators ever reach the defect.
  Running against a broken subject answers the real question: do these
  generators and these invariants, together, catch this class of bug?
- **It is cheap.** A mutant check stops at the first failure without
  shrinking (`endOnFailure`) and is capped at `vacuityRuns` (default 200).
- **It cannot pass by accident.** A mutant must be caught by an assertion
  (`expect` or `invariant`). A crash in setup counts as a broken check and
  fails, so a harness that throws for every subject is not mistaken for a
  sharp property.
- **It stays next to the property.** Mutants are subclasses (circuit
  breaker), alternative functions (backoff, cache keys), `ICache` wrappers,
  or a pipeline stage swapped with `jest.doMock` inside `jest.isolateModules`
  ([`support/pipeline.ts`](support/pipeline.ts)), so the real module registry
  is never touched.

Choose mutants that model real defects: an off-by-one threshold, a dropped
page, a key that ignores the token, a 304 that does not refresh. When a
property finds a bug, the pre-fix behaviour is a good mutant to keep.

**Ratchet: vacuous properties = 0.** Every mutant test is a hard failure in
the PR run; there is no allow-list, and a property with no mutant does not
load. Adding a property without a mutant that it kills is not possible.

## Before you push

```bash
npm run fuzz                         # every fuzz test, PR settings
FC_NUM_RUNS=2000 npm run fuzz:properties   # a deeper local pass on the properties
```

The whole fuzz tier must stay inside the PR budget: about 30 s locally with
`--maxWorkers=4`.
