# tests/benchmark — agent notes

Tier L of the testing runway: performance and memory. This tier owns one
failure class, **the client got slower or started holding memory**, and
nothing else. Bundle size is owned by the size-limit budgets, not here.

## What is here

| File                                    | Role                                                                                           |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `tasks.ts`                              | The micro-benchmark catalogue: per-request hot paths, each built in `setup`, timed in `fn`     |
| `fixtures.ts`                           | Deterministic payloads and ESI response headers                                                |
| `harness.ts`                            | One process: runs every task with mitata, writes one JSON result                               |
| `summary.ts`                            | Per-process mean, p50, p75, p99 and RME from mitata's samples                                  |
| `soak.ts`                               | Heap soak driver: 100 000 requests through a real `EsiClient`, plus the leaky fixture          |
| `../../scripts/bench-ab.ts`             | Bundles the harness for a base and a head tree, runs them in alternating processes             |
| `../../scripts/bench-compare(-core).ts` | The statistical decision (below)                                                               |
| `../../scripts/bench-trend.ts`          | One JSON record per nightly run for the `bench-data` branch                                    |
| `../../scripts/soak(-core).ts`          | Soak CLI and its verdict: heap slope, cache bound, timers, listeners                           |
| `../tdd/benchmark/`                     | Unit tests: statistics on synthetic distributions, soak verdicts, the leak fixture, task smoke |

## The signal

- **Pull request** (`ci.yml`, job `benchmarks`): only when `src/core/`,
  `src/schemas/`, this harness, the bench scripts or `package-lock.json`
  change. The base tip and the head are built on the same runner and run in
  10 alternating processes each. Otherwise the job reports success with a
  summary line.
- **Nightly** (`nightly-benchmarks.yml`): master against a pinned reference
  commit (15 rounds each), then the soak. One issue labelled
  `performance-nightly` while either fails.
- **Proof the tier can fail:** `tests/tdd/benchmark/bench-compare.test.ts`
  fails a synthetic 30% regression and a missing baseline;
  `tests/tdd/benchmark/soak.test.ts` runs the real pipeline with
  `leakyInterceptor()` and requires the verdict to flag it; the nightly soak
  job does the same with `--inject-leak --expect-fail` before the real run.

## How a regression is decided

The observation is one **per-process median ns/op** per task. Samples inside
one process share a JIT outcome and are autocorrelated, so they are not used
as independent observations. A task regresses when all three hold:

1. a one-sided Mann–Whitney U test says head medians are larger, with the
   p-value Holm-adjusted across all tasks below α = 0.05;
2. the ratio of medians is at least 1.10;
3. the absolute difference is at least 2 ns/op.

`npm run bench:compare` exits 3 for regressions alone and 1 when the
comparison cannot be made.

Improvements are reported the same way and never fail. No baseline results,
fewer than 5 rounds on a side, or a task the baseline measured and the head
did not, fail closed. A task only the head measures is `new` and passes.

## Working here

```bash
npm run benchmark                          # this tree only: table of medians, compares nothing
npm run benchmark -- --filter cache        # one area
git worktree add --detach ../base origin/master
npm run bench:ab -- --base ../base --head . --rounds 8
npm run bench:compare                      # exit 1 on a regression
npm run soak                               # 100 000 requests, --expose-gc
npm run soak -- --inject-leak --expect-fail --requests 20000
```

Local numbers on a shared or busy machine are noise. Use local runs to check
the harness works and to A/B a change within one session; trust CI for the
numbers.

- **Adding a task:** add it to `tasks.ts` with a stable `<area>/<what>` name.
  Build state in `setup`, return only the operation in `fn`, and tear down
  timers. Import from `../../src` by relative path: `bench-ab.ts` copies this
  directory into the base tree and bundles it there.
- **Renaming a task** breaks its series in the `bench-data` history. Both
  sides of a comparison run the head's harness, so the comparison itself is
  unaffected; only if the head's harness no longer builds against the base
  does the base run its own harness, and then the old name shows as
  `removed`, which fails.
- **An accepted slowdown** (a feature that costs time on purpose): add a
  `Performance-Accepted: <why>` trailer to a commit in the pull request. The
  `benchmarks` job then reports the regression as a warning instead of
  failing, and the reviewer decides whether the reason holds. The trailer never
  excuses a comparison that could not be made (no baseline, too few rounds, a
  dropped task). After merge the nightly flags the same slowdown against its
  reference until a maintainer dispatches `nightly-benchmarks.yml` with
  `accept_reference`. Never raise `minEffect` to get a pull request through.

## What does not belong here

- Wall-clock assertions in Jest (`expect(elapsed).toBeLessThan(500)`). They
  cannot see a 30% regression and they flake on a slow runner. The old Jest
  benchmark files were retired for that reason.
- Latency budgets in BDD Rules. Behaviour scenarios assert what happens, such
  as requests overlapping; how fast it happens is measured here.
- Live ESI calls, or anything with network latency in the measured path.
- Bundle or install size (size-limit), and type-check speed.

## Known gaps

- The opt-in circuit breaker keeps one record per resolved endpoint and never
  reclaims records for endpoints that never failed, so a long-running client
  with `enableCircuitBreaker` grows by about 140 KiB per 1000 distinct
  endpoints. `npm run soak -- --circuit-breaker` shows it. The nightly soak runs
  the default profile until that is fixed; then add the circuit-breaker
  profile to the nightly.
- Benchmarks run on Node 20 only.
