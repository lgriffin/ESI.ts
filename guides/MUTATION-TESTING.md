# Mutation Testing Guide for ESI.ts

## Overview

Mutation testing measures whether your tests actually detect bugs — not just whether they execute code. [Stryker](https://stryker-mutator.io/) introduces small changes ("mutants") into your source code and checks if any test fails. If a test fails, the mutant is "killed" (good). If all tests pass, the mutant "survived" (your tests missed a potential bug).

This is fundamentally different from code coverage: you can have 100% line coverage with tests that never assert anything. Mutation testing catches that.

## Quick Start

```bash
npm run mutation             # Full unit-suite run over the mutate scope
npm run mutation:ratchet     # Score reports/mutation/mutation.json per directory
npm run mutation:pr          # What CI runs on a pull request: only your changed src/ files
npm run mutation:fixture     # The tier's self-test on a known-weak fixture
npm run mutation:bdd         # BDD-only run (see below); one shard with BDD_MUTATION_SHARD=<name>
npm run mutation:bdd:merge   # Put the shard reports back together for the ratchet
npm run mutation:bdd:ratchet # Score the BDD-only report per directory
```

Reports are written to `reports/mutation/` (`mutation.html`, `mutation.json` and, with `--incremental`, `stryker-incremental.json`).

## Where mutation testing runs

| Where                                  | What                                                                                      | Gate                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Pull request (`ci.yml`, `mutation-pr`) | Known-weak fixture, then the changed `src/` files in scope, incrementally                 | Blocks via `ci-success`: touched directories vs their floors, and the fixture. A cold run that times out warns |
| Nightly (`nightly-mutation.yml`)       | Every file in scope (`--incremental --force`); publishes the incremental file             | Fails the run: every directory vs its floor                                                                    |
| Nightly, BDD-only matrix               | All of `src/`, BDD step definitions only, one job per shard in `mutation-bdd-shards.json` | Fails the run: every scored directory vs its floor in `mutation-bdd-thresholds.json`                           |

The pull request job owns "this change weakened the tests of the code it touched". The nightly owns everything a pull request cannot see: test-only changes, merges that interact, and directories no pull request touched.

## Pull requests

`npm run mutation:pr` (`scripts/mutation-pr.ts`) does, in order:

1. **Base.** `MUTATION_BASE_REF` (CI sets `HEAD^1`, the base tip of the pull request merge commit, with `fetch-depth: 2`), otherwise the merge base with `origin/master` or `master`. If none resolves, it fails closed (exit 2).
2. **Ratchet direction.** `mutation-thresholds.json` is compared with the base copy. Raising or adding a floor passes; lowering or removing one fails (exit 1). A missing or unparsable head file, or an unparsable base copy, fails closed. The only case with nothing to compare is a base commit that predates the file.
3. **Plan.** `git diff --name-only --diff-filter=d <base> -- src/`, intersected with the `mutate` patterns in `stryker.config.mjs`. If nothing is left, the job summary says "Skipped" with the reason (no `src/` change, or only files outside the scope) and the step exits 0. The job still ran the thresholds check and the fixture, so it reports `success` honestly rather than being `skipped`, which `ci-success` would count as a failure.
4. **Run.** `stryker run --incremental --mutate <files>`. The files are the changed ones plus any file in the same score directories that the restored nightly report cannot vouch for: absent from it, or with a source that has changed since. Stryker drops (rather than re-runs) stale mutants in files outside `--mutate`, so without this a directory score would silently shrink. With no restored report, every file in the touched directories is mutated from scratch: slower, never wrong.
5. **Gate.** Each touched directory is scored from the merged report (fresh results for changed code, nightly results for the rest) and fails if it is below its floor, or has no floor at all. The job summary lists the directory table, per-file scores for the changed files, and every surviving or uncovered mutant in them with its line, mutator and replacement. The HTML and JSON reports are uploaded as `mutation-pr-report`.

Run it locally the same way; it diffs your working tree (committed or not) against the merge base with master:

```bash
npm run mutation:pr -- --concurrency 4
```

To reuse a nightly baseline locally, download the `mutation-report` artifact from the latest nightly and put its `stryker-incremental.json` in `reports/mutation/`.

### The incremental baseline

### When there is no baseline

`npm run mutation:pr:gate` runs the check under a deadline and decides what the outcome means, because two very different things look alike from outside: a run that measured a regression, and a run that measured nothing.

| Outcome                                          | With the nightly baseline | Without it |
| :----------------------------------------------- | :------------------------ | :--------- |
| A directory below its floor                      | blocks                    | blocks     |
| The check cannot read its thresholds or base ref | blocks                    | blocks     |
| The run does not finish in time                  | blocks                    | **warns**  |

A cold run mutates every file in the touched directories, not just the changed ones. #355 hit an eight-minute wall at 48% of 589 mutants, having killed every one it reached — nothing was wrong with the change, and failing the pull request for it teaches people to read a red mutation job as noise. A timeout _with_ the baseline restored still blocks: that run should only have had the changed files to mutate, so it is broken rather than slow.

The tier keeps a hard signal either way. `npm run mutation:fixture` runs first in the same job and fails when the known-weak fixture stops leaving survivors, so the gate can still fail even on a run that measures nothing. The policy is `classifyPrMutationRun` in `scripts/mutation-ratchet-core.ts`, pinned by `tests/tdd/mutation-ratchet/mutation-pr.test.ts`; `esi-23g.52` covers why a baseline can be missing in the first place.

The nightly unit job runs `npm run mutation -- --incremental --force`: every mutant runs, and Stryker also writes `reports/mutation/stryker-incremental.json`. After a complete run (never after a failed or interrupted one, when Stryker may write a partial file) the job saves it with `actions/cache/save` under `stryker-incremental-unit-<sha>-<run id>`. Caches written on `master` are readable by pull requests into `master`, so `mutation-pr` restores with `actions/cache/restore`, preferring an entry for its base commit and otherwise the newest. Pull requests never save the cache.

Stryker reuses a result only when the mutant's code is unchanged and, for a killed mutant, its killing test is unchanged, or, for a survivor, no test was added. The older the baseline, the more mutants re-run: a one-day-old baseline on an active branch reused 51 of 169 mutants in `ETagCacheManager.ts`.

### Ratchet: `mutation-thresholds.json`

One floor per score directory: `src/core` for files directly in core, `src/core/<sub>` below it (the same `directoryOf` as the BDD ratchet in `scripts/mutation-ratchet-core.ts`). Values are Stryker's mutation score (detected / (detected + undetected)), rounded down to one decimal.

- A pull request that raises a directory's score may raise its floor in the same change. State the new score in the pull request body in one line; ratchet bumps without a reason are how ratchet fatigue starts.
- A floor never goes down. If a change truly has to lower one (for example, deleting dead code that only had killed mutants), that is a reviewed exception in its own pull request, and it fails `mutation-pr` there on purpose.
- A new directory in scope must arrive with its floor; the failure message says which value to add.
- `npm run mutation:ratchet -- --update` (after a full `npm run mutation`) raises every floor to today's score and adds missing ones. It never lowers a floor.

**Seeding.** Each floor is the lower of two real runs: a full local run of this branch's base (`npm run mutation -- --incremental --force`, concurrency 4, 54 minutes) and the last nightly that produced a report (16 September 2026, `bc563d4d`, run 35067980626). They agree within two points for most directories but not all — `src/core/logger` scored 55.5% on the nightly and 33.3% locally, and `src/core/rateLimiter` 73% against 70.9% — mostly because a mutant that times out counts as detected, and how many time out depends on the machine. Taking the lower value means the first pull request to touch a directory is not failed by that spread. The nightly raises nothing on its own; floors move up only in reviewed pull requests.

### The known-weak fixture

`tests/mutation-fixture/weakClamp.ts` is a `clamp` function whose fixture test only checks an in-range value. `npm run mutation:fixture` mutates it with `stryker.fixture.config.mjs` and fails unless the report shows at least one killed mutant (the run can detect a fault), at least one survivor (a weak test is visible), and a ratchet failure for it against a 100% floor. `mutation-pr` runs it before the real run, so every pull request proves the pipeline can still go red. Do not strengthen that test. The last local run: 5 killed, 4 survived, 2 without coverage, score 45.4%, 15 seconds. Pointing the fixture's Jest `roots` at the original tree instead of the sandbox — the same mistake the module mapper used to make — turns that into 0 killed and 11 survived, and the check exits 1 with "no fixture mutant was killed".

`tests/tdd/mutation-ratchet/` holds the unit tests for the ratchet itself: a directory below its floor fails, a missing or unreadable thresholds file or base ref fails closed, a lowered or removed floor is rejected, a pull request with no in-scope `src/` change skips, and the plan widens to whole directories when the baseline cannot vouch for a file.

### Sharding the BDD-only run

One job mutating all of `src/` against the BDD suite alone does not finish: 4,495 mutants, and the only attempt was killed at 30 minutes, which is why `mutation-bdd-thresholds.json` was empty for as long as it was. `nightly-mutation.yml` therefore runs one job per shard in `mutation-bdd-shards.json`; `BDD_MUTATION_SHARD=<name> npm run mutation:bdd` mutates that shard alone and writes `reports/mutation-bdd/shards/<name>/`.

A split run only means the same thing as the single run it replaces if nothing falls between the shards, so two checks hold it together:

- `tests/tdd/mutation-ratchet/bddShards.test.ts` asserts the shards partition `src/`: every TypeScript file belongs to exactly one. A file claimed by none is never mutated and its directory's score quietly improves; a file claimed by two is counted twice. The exclusions in `stryker.bdd.config.mjs` are shared by every shard, so the union of the shards mutates exactly what the unsharded glob did.
- `npm run mutation:bdd:merge` (`scripts/mutation-merge-core.ts`) refuses to merge a run with a shard missing, a shard that mutated nothing, or two shards reporting one file. Without that, a shard whose job died would leave its directories scored on whatever else ran, which reads as a pass.

Seed the floors from a completed run: dispatch the workflow with `seed_bdd_thresholds`, which prints and uploads `mutation-bdd-thresholds.json` raised to that run's scores. Nothing commits it; `--update` never lowers a floor.

### Why the BDD-only run is not on pull requests

Running the step definitions as the dry run for a `src/core/requestPipeline` change would take most of the 12-minute pull request budget on its own, and there is no incremental baseline to restore until the nightly matrix has published one. Once it has, a pull request run scoped to `src/core/requestPipeline` is the natural next step.

## How It Works

1. **Instrumentation**: Stryker parses all files matching the `mutate` glob and identifies possible mutations (about 2,100 in the unit scope).
2. **Dry run**: Stryker runs the related tests once to establish a baseline and map which tests cover which code (`enableFindRelatedTests`).
3. **Mutation**: For each mutant, Stryker modifies the source and runs only the tests that cover the changed code (`perTest` coverage analysis). The TypeScript checker discards mutants that do not compile first.
4. **Scoring**: Each mutant is classified:

| Status           | Meaning                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| **Killed**       | A test failed — the mutation was detected                               |
| **Survived**     | All tests passed — a potential blind spot                               |
| **Timeout**      | A test timed out — likely an infinite loop mutation, counts as detected |
| **NoCoverage**   | No test executes this code path                                         |
| **CompileError** | The TypeScript checker rejected it; not counted                         |
| **Ignored**      | Excluded mutator (`StringLiteral`) or static code; not counted          |

## Configuration

Config files: `stryker.config.mjs` (unit suite, nightly and pull requests), `stryker.bdd.config.mjs` (BDD-only), `stryker.fixture.config.mjs` (known-weak fixture).

### Scope

The unit run mutates `src/core/**/*.ts` with these exclusions:

- `src/core/endpoints/**` — endpoint definitions are data declarations, not logic
- Interface-only files (`ILogger.ts`, `ICache.ts`, `IRateLimiter.ts`, `IRetryStrategy.ts`, `ICircuitBreaker.ts`, `IDeduplicator.ts`) and the `requestPipeline` barrel and dependency wiring

Files NOT in scope (and why):

| Excluded                                      | Reason                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| `src/clients/**`                              | Thin delegation layers tested via BDD scenarios       |
| `src/schemas/**`                              | Zod schema declarations — no branching logic          |
| `src/types/**`                                | Type-only files, no runtime code                      |
| `src/config/**`                               | Configuration setup, not core logic                   |
| `src/EsiClient.ts`, `src/EsiClientBuilder.ts` | High-level orchestration tested via integration tests |
| `*.generated.ts`                              | Auto-generated from OpenAPI spec                      |

A pull request that changes only out-of-scope `src/` files skips the mutation step and names those files in the summary.

### Thresholds

The unit config has no global `break`; the per-directory floors in `mutation-thresholds.json` are the gate. `high: 80` and `low: 60` only colour the HTML report.

### Sandbox and Module Resolution

Stryker runs tests in an isolated sandbox (`.stryker-tmp/sandbox-XXX/`) containing mutated source files. Since tests live outside the sandbox at `tests/`, a `moduleNameMapper` redirects relative imports like `../../../src/core/...`, and a bare `../../../src` (the package root), to the sandbox's mutated source:

```js
moduleNameMapper: {
  '^(?:\\.\\./)+src(/.*)?$': '<rootDir>/src$1',
}
```

Without this, tests would import the original (un-mutated) source and every mutant would survive or show as "NoCoverage". Before the root import was mapped, `tests/tdd/auth/index.test.ts` compared classes loaded from the sandbox with classes loaded from the original tree, and the nightly's dry run failed on it (17 September 2026).

### Static Mutants

`ignoreStatic: true` is enabled. Static mutants are mutations in module-level code (e.g., default values, constant expressions) that are only executed once during module initialization. These are expensive to test (they require re-running ALL tests since every test loads the module) and represent only ~1% of mutants. They are reported as "Ignored" in the output.

## Reading the Report

The HTML report at `reports/mutation/mutation.html` shows:

- **Per-file scores** with color coding (green ≥ 80%, yellow ≥ 60%, red < 60%)
- **Individual mutants** with their status, the original code, and the mutation applied
- **Covering tests** for each mutant (which tests would need to kill it)

Current per-directory floors are in `mutation-thresholds.json`; `npm run mutation:ratchet` prints today's scores next to them.

## Improving the Score

When a mutant survives, it means changing that line doesn't break any test. To kill it:

1. Open the HTML report (or the `mutation-pr` job summary) and find the survived mutant
2. Read what the mutation does (e.g., `a > b` changed to `a >= b`)
3. Write a test case where the original behavior and mutated behavior produce different results
4. Raise the directory's floor in `mutation-thresholds.json` to the new score, with a one-line reason in the pull request

The weakest directories at seeding were `src/core/cache` (`ETagCacheManager.ts`), `src/core/logger` and `src/core/requestPipeline` (`statusHandling.ts`, `cachePolicy.ts`).

## Runtime

| Run                                                                                                        | Wall time                                                      |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Pull request, one-function change to `ETagCacheManager.ts`, local, concurrency 4, same-day baseline        | 1 min 9 s (169 mutants instrumented, 1 of 1,845 files mutated) |
| The same change against a one-day-old baseline (51 of 169 mutants reused)                                  | 2 min 22 s                                                     |
| Known-weak fixture, local                                                                                  | 15 s                                                           |
| Known-weak fixture, GitHub runner                                                                          | 9 s                                                            |
| Pull request job on a GitHub runner with no cached baseline (the whole `src/core/cache` directory mutated) | 5 min 12 s for the job, 4 min 41 s for the mutation step       |
| Full unit run, local, concurrency 4 (1,907 mutants)                                                        | 54 min                                                         |
| Full unit run, nightly (GitHub runner, concurrency 6)                                                      | about 2 h                                                      |

The pull request step has an 8-minute timeout inside a 12-minute job. A change that invalidates most of a large directory (for example, a rewrite of `RateLimiter.ts` with no baseline) can exceed it; that fails the job rather than passing it.
