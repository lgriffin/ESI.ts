# tests/faults — agent notes

The fault tier: what the client does when the network misbehaves. Everything
runs through the real request pipeline; only `fetch` is replaced, by the BDD
transport seam ([`tests/bdd/support/transport.ts`](../bdd/support/transport.ts)).
The guide section is [TESTING.md › Fault injection](../../guides/TESTING.md#fault-injection).

## Scope

This tier owns one failure class: **a response, or its absence, that is not
the clean exchange ESI promises**, and what the client does with it.

- Bodies: truncated JSON, an HTML page on a 200, an empty body, the wrong
  Content-Type, schema violations, `null`, unknown fields, schema-valid but
  absurd values.
- Headers: Expires in the past or unparseable, a 304 without an ETag or
  without a cached entry, X-Pages that changes between pages.
- Connections: a reset before the headers, a reset part way through the
  body, a body that stalls after the headers, no response before the timeout.
- Statuses: 5xx with an HTML body (with and without a cached entry, GET and
  POST), 502 without a reason phrase, 500 with ESI's error JSON, 420 with and
  without `X-ESI-Error-Limit-*`, 429 with Retry-After in seconds, as a date,
  and absent.
- Nightly: every endpoint definition's response schema, fuzzed and mutated.

## Files

| File                           | What it is                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| `catalogue.ts`                 | The faults. Each has an id, a Rule reference, an exchange and an expected `Outcome`   |
| `targets.ts`                   | The five PR targets: public GET, authenticated GET, X-Pages GET, cursor GET, POST     |
| `runner.ts`                    | Serves a fault on the virtual clock, observes the outcome, probes the cache, compares |
| `validate.ts`                  | The gate on the catalogue, and the known-gaps ratchet                                 |
| `catalogue.selftest.test.ts`   | The gate at zero, the weak fixture rejected, the runner shown to fail, the ratchet    |
| `transport-faults.test.ts`     | PR run: every fault on every target it applies to (`npm run faults`)                  |
| `known-gaps.json`              | Faults that expose an unfixed bug, each with its bead. Only shrinks                   |
| `fixtures/weak-fault.ts`       | A fault that asserts too little. The self-test fails if the gate accepts it           |
| `zodArbitrary.ts`              | fast-check arbitraries and single-point mutations derived from Zod schemas            |
| `payload-fuzz.nightly.test.ts` | Nightly: every endpoint, generated and mutated bodies (`npm run faults:nightly`)      |

## The signal

A fault is only worth having if it can fail, so the tier proves it at three
levels:

1. **The gate.** `catalogueProblems()` rejects a fault whose Rule reference
   does not resolve to a `Rule:` line or guide heading, whose outcome leaves
   anything open (error class, status or code, an anchored message, the exact
   request count, the cache state, an elapsed-time window of at most 1 s,
   every warn/error log with its count), or whose exchange duplicates another
   fault's. The ratchet is **zero** such faults. The weak fixture must be
   rejected on every count.
2. **The runner.** The self-test runs a real fault with wrong expectations and
   requires every invariant it breaks to be reported, then runs it with the
   right ones and requires none.
3. **Mutations of `src/`.** See the evidence table in the PR that introduced
   the tier (bead `esi-23g.8`), for example swallowing JSON parse errors,
   retrying a 400, caching a 5xx body and ignoring Retry-After.

## Writing a fault

- Start from the target's good exchange (`ctx.good`) and change one thing.
- Cite the Rule in `tests/bdd/features` that specifies the answer, word for
  word, or the guide section. If no Rule or section says what should happen,
  that is a specification gap: write the Rule first (`ears-gherkin-dev`).
- State the whole outcome. Derive counts from the target (`attempts(t)`), not
  from a run: the expectation is what the Rule says, not what the code does.
- A fault that fails because the client is wrong goes in `known-gaps.json`
  with its bead and reason only if the fix is not yours to make; otherwise
  fix the bug in a separate `fix:` commit with a scenario. The list only
  shrinks against `origin/master` and fails closed without it; a listed
  fault that starts passing fails the run until its entry is removed.
- Failure messages name the fault, the target, each broken invariant, the
  Rule and a reproduce command. Keep them that way.

## Decisions the catalogue pins

- **Content-Type is not trusted.** The body decides: valid JSON labelled
  `text/plain` is parsed; HTML on a 200 is a `[JSON_PARSE_ERROR]`, not retried.
- **Expires is ignored.** Freshness comes from the spec TTL or Cache-Control.
- **Page 1's X-Pages is authoritative.** Later pages' X-Pages is not read; a
  page past the end that comes back empty ends pagination with a warning.
- **Absurd values pass through.** Schemas check shape, not domain invariants:
  a negative `volume_remain` is returned as ESI sent it, without a log. ESI is
  the source of truth; a consumer that needs the invariant checks it.

## What does not belong here

- Pipeline stages in isolation (a unit test in `tests/tdd/core/`).
- Model-based properties of the circuit breaker, pagination or cache keys
  (`tests/fuzz/`).
- The contract with ESI's published spec (`tests/contract/`).
- Concurrency between calls (`tests/tdd/composition/`).
- Anything that stubs a client method, `handleRequest` or `createClient`.
- Snapshots of response bodies.
