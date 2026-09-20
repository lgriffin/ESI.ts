# tests/tdd/composition — agent notes

The composition and concurrency tier (bead `esi-23g.7`). It owns one failure
class: **pipeline stages that are each correct on their own but wrong
together when calls overlap.** A retry that keeps backing off into an open
circuit, a 304 that overwrites a concurrent 200, a write whose invalidation a
slower read undoes: each stage's unit tests pass while the composition fails.

## What runs here

Every scenario drives a real `EsiClient` with the whole request pipeline on
(rate limiter out of test mode, circuit breaker, deduplication, retry, ETag
cache, Zod response validation), built by `support/world.ts`
`createPipelineClient`. The only mock is HTTP, at the BDD transport seam
([`tests/bdd/support/transport.ts`](../../bdd/support/transport.ts)), through
its additive `setRequestGate` hook and the strict `queueResponse` queue.

[`support/interleave.ts`](support/interleave.ts) holds every request at the
seam and chooses, step by step, which call starts, which response arrives and
when virtual time (Jest fake timers) advances. On a PR it explores every
schedule of two and three calls (pinned counts, bound 5000). The nightly
`nightly-interleave.yml` samples four calls in seeded random order.

| File                        | Interaction                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| `retryCircuit.test.ts`      | retry inside a circuit that has just opened                       |
| `staleRefresh.test.ts`      | stale-on-error while the stale entry is being refreshed           |
| `dedupeRejection.test.ts`   | deduplication when the shared in-flight request fails             |
| `etagOrdering.test.ts`      | a 304 for an old ETag arriving after a 200 for a new one          |
| `errorLimit.test.ts`        | the ESI error-limit back-off holding back every endpoint          |
| `writeInvalidation.test.ts` | a POST/PUT/DELETE invalidating the cache while a GET is in flight |
| `interleave.test.ts`        | the scheduler itself                                              |

Each file's header names the Rules in `tests/bdd/features/core/0050-etag-caching.feature`
and `0051-resilience.feature` it backs, or says that none states the behaviour
yet (error-limit back-off, write invalidation).

## The tier's signal

- `interleave.test.ts` shows the scheduler enumerating exactly the schedules
  that exist, finding and replaying a planted lost-update race, and failing
  closed on a deadlock, a nondeterministic scenario, an out-of-range replay and
  malformed environment variables.
- Exhaustive schedule counts are pinned per scenario (`PINNED`). A count that
  moves in either direction fails, so a change that stops calls overlapping
  cannot silently shrink what the tier tests.
- Hand mutations of `src/` (a retry that backs off on `CircuitOpenError`, a
  deduplicator that keeps a rejected promise, a dropped error-limit gate, a
  304 that overwrites the stored ETag, and others) are each killed by a named
  invariant; the table is in the pull request that introduced the tier.
  Stryker mutates `src/core/**` against `tests/tdd/**`, so these tests count
  there too.

## Writing a scenario

- `respond` chooses a response when the scheduler delivers it, from the
  request and the trace so far. Model the server, not the client: decide what
  ESI would send given which requests reached it first (`ordinal` is arrival
  order at the seam).
- Invariants are named, one outcome each, and return a sentence saying what
  broke. Assert the sequence (`trace.events`, `trace.requests` with method,
  path and If-None-Match), not only final values. Never snapshot bodies.
- Keep schedules deterministic: backoff is jitter-free because
  `maxDelayMs` (500) is below three quarters of `baseDelayMs` (1000), and the
  client timeout is beyond the scheduler's horizon. Do not mock
  `Math.random`, `Date` or any pipeline module.
- Pin the exhaustive count you observe for two and three calls, after reading
  a few traces (`ESI_INTERLEAVE_REPLAY`) to confirm the calls really overlap.

## Reproducing a failure

A failure prints the broken invariant, the event log and a command, e.g.

```bash
ESI_INTERLEAVE_REPLAY=0,0,1,0 npx jest --config jest.unit.config.cjs --testPathPatterns=composition -t "2 calls a contact DELETE racing contact list reads with a cold cache"
# a nightly failure also sets the mode that selects the four-call variants:
ESI_INTERLEAVE_MODE=random ESI_INTERLEAVE_SEED=123 ESI_INTERLEAVE_RUNS=2000 npx jest --config jest.unit.config.cjs --testPathPatterns=composition
```

## What does not belong here

- One stage's behaviour in isolation: unit tests in `tests/tdd/core/`.
- A user-facing behaviour example for a Rule: BDD scenarios in `tests/bdd/`.
- Injected transport faults (resets, truncation, DNS): the fault catalogue in
  `tests/faults/`.
- Generated inputs or model-based properties of one component: `tests/fuzz/`.
- Anything against live ESI or recorded fixtures: `tests/contract/`,
  `tests/integration/`.
- Real sleeps, wall-clock timing, `jest.spyOn` on a client or pipeline module.

## Known gap

With a cold cache and more than one reader, a read that starts after a
DELETE has completed can join, through request deduplication, a GET sent
before the write and resolve with the pre-write list.
`writeInvalidation.test.ts` leaves those variants out until the deduplicator
forgets in-flight reads a write invalidates.
