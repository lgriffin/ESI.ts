# Mutation Testing

**Implements:** `TEST-07` — see [CHARTER.md](CHARTER.md) Part 4 for the requirement and its status.

The deep-dive on the mutation tier. [TESTING.md](TESTING.md#mutation) places it among the other tiers and summarises it; this guide holds the detail the scripts and workflows link to: how the pull request run chooses what to mutate, why the nightly is sharded, how the floors were seeded, and where the scores stand.

Mutation testing measures whether the tests detect bugs, not whether they execute code. [Stryker](https://stryker-mutator.io/) makes small changes ("mutants") to the source and checks whether any test fails. A test that fails kills the mutant. A mutant every test passes survived: a bug the suite would ship. A suite can reach 100% line coverage without asserting anything; mutation is the signal that it asserts. A tier that cannot fail manufactures confidence, and this is the tier that proves the others can fail.

Three runs, each held by a one-way ratchet:

| Run      | Config                                   | Scope                                               | Floors                                                 |
| -------- | ---------------------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| Unit     | `config/mutation/stryker.config.mjs`     | `src/core/**`, minus endpoints and interfaces       | `config/mutation/unit-thresholds.json`, 9 directories  |
| BDD-only | `config/mutation/stryker.bdd.config.mjs` | all of `src/`, with the BDD suite as the only tests | `config/mutation/bdd-thresholds.json`, 15 directories  |
| Type     | `scripts/mutation/type-mutation.ts`      | the built `dist/**/*.d.ts`                          | `config/mutation/type-thresholds.json`, 6 entry points |

Type mutation is described in [TESTING.md](TESTING.md#type-mutation); the rest of this guide covers the two Stryker runs.

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

| Where                            | What                                                                                                   | Gate                                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pull request (`mutation-pr.yml`) | Known-weak fixture, then the changed `src/` files in scope, incrementally                              | Advisory since 2026-09-27 (its own check, outside `ci-success`, until the target floors hold, after 11.0.0; ROADMAP.md): touched directories vs their floors, and the fixture. A cold run that times out warns |
| Nightly (`nightly-mutation.yml`) | Every file in scope (`--incremental --force`), one job per shard in `config/mutation/unit-shards.json` | Fails the run: every directory vs its floor, scored on the merged report                                                                                                                                       |
| Nightly, BDD-only matrix         | All of `src/`, BDD step definitions only, one job per shard in `config/mutation/bdd-shards.json`       | Fails the run: every scored directory vs its floor in `config/mutation/bdd-thresholds.json`                                                                                                                    |

The pull request job owns "this change weakened the tests of the code it touched". The nightly owns everything a pull request cannot see: test-only changes, merges that interact, and directories no pull request touched.

## Pull requests

`npm run mutation:pr` (`scripts/mutation/mutation-pr.ts`) does, in order:

1. **Base.** `MUTATION_BASE_REF` (CI sets `HEAD^1`, the base tip of the pull request merge commit, with `fetch-depth: 2`), otherwise the merge base with `origin/master` or `master`. If none resolves, it fails closed (exit 2).
2. **Ratchet direction.** `config/mutation/unit-thresholds.json` is compared with the base copy. Raising or adding a floor passes; lowering or removing one fails (exit 1). A missing or unparsable head file, or an unparsable base copy, fails closed. The only case with nothing to compare is a base commit that predates the file.
3. **Plan.** `git diff --name-only --diff-filter=d <base> -- src/`, intersected with the `mutate` patterns in `config/mutation/stryker.config.mjs`. If nothing is left, the job summary says "Skipped" with the reason (no `src/` change, or only files outside the scope) and the step exits 0. The job still ran the thresholds check and the fixture, so it reports `success` honestly rather than being `skipped`, which `ci-success` counted as a failure while the job was inside it and will again once the release gate moves it back.
4. **Run.** `stryker run config/mutation/stryker.config.mjs --incremental --mutate <files>`. The files are the changed ones plus any file in the same score directories that the restored nightly report cannot vouch for: absent from it, or with a source that has changed since. Stryker drops (rather than re-runs) stale mutants in files outside `--mutate`, so without this a directory score would silently shrink. With no restored report, every file in the touched directories is mutated from scratch: slower, never wrong. When the pull request changes or deletes a file under `tests/`, every reused file whose mutants that test covered in the restored report is mutated again and the run passes `--force`, because a score can only fall through a test that killed one of the file's mutants last night, and Stryker would otherwise reuse the old verdict as long as the test keeps its name ([#380](https://github.com/lgriffin/ESI.ts/issues/380)). A test the report does not know (a new file, or coverage it newly gained) can only raise a score, and the next nightly records that; re-mutating whole directories for it does not fit the job's time budget. A report without per-test coverage retests every reused file of the touched directories. A test-only pull request mutates the directories its tests reach: those the restored report shows the test covering, and for a test under `tests/tdd/` the directory its path mirrors; one the run can tie to no directory, or whose tests covered nothing in the report, is reported and skipped.
5. **Gate.** Each touched directory is scored from the merged report (fresh results for changed code, nightly results for the rest) and fails if it is below its floor, or has no floor at all. The job summary lists the directory table, per-file scores for the changed files, and every surviving or uncovered mutant in them with its line, mutator and replacement. The HTML and JSON reports are uploaded as `mutation-pr-report`.

Run it locally the same way; it diffs your working tree (committed or not) against the merge base with master:

```bash
npm run mutation:pr -- --concurrency 4
```

To reuse a nightly baseline locally, download the `mutation-report` artifact from the latest nightly and put its `stryker-incremental.json` in `reports/mutation/`. Stryker's incremental mode keys a mutant's result on the source and the covering tests' names, so a test you strengthen under the same name would reuse the old Survived verdict on a plain `--incremental` run; `mutation:pr` passes `--force` for you when the diff touches `tests/`, and a direct `npm run mutation -- --incremental --force --mutate <file>` does the same by hand.

### When there is no baseline

`npm run mutation:pr:gate` runs the check under a deadline and decides what the outcome means, because two very different things look alike from outside: a run that measured a regression, and a run that measured nothing.

| Outcome                                          | With the nightly baseline | Without it |
| :----------------------------------------------- | :------------------------ | :--------- |
| A directory below its floor                      | blocks                    | blocks     |
| The check cannot read its thresholds or base ref | blocks                    | blocks     |
| The run does not finish in time                  | blocks                    | **warns**  |

A cold run mutates every file in the touched directories, not just the changed ones. #355 hit an eight-minute wall at 48% of 589 mutants, having killed every one it reached. Nothing was wrong with the change, and failing the pull request for it teaches people to read a red mutation job as noise. A timeout _with_ the baseline restored still blocks: that run should only have had the changed files to mutate, so it is broken rather than slow.

The tier keeps a hard signal either way. `npm run mutation:fixture` runs first in the same job and fails when the known-weak fixture stops leaving survivors, so the gate can still fail even on a run that measures nothing. The policy is `classifyPrMutationRun` in `scripts/mutation/mutation-ratchet-core.ts`, pinned by `tests/tdd/mutation-ratchet/mutation-pr.test.ts`; `esi-23g.52` covers why a baseline can be missing in the first place.

### When a runner is reclaimed

GitHub-hosted runners intermittently drop a long job with `The runner has received a shutdown signal` and exit 143. On this repository: the unsharded BDD run at 30 minutes, the `core-pipeline` shard at 36, the `core-rest` shard at 45, while `core-rest` had itself finished at 59 minutes earlier the same day. (`core-pipeline` and `core-rest` are the names of BDD shards on 17 and 18 September 2026; they have since been split into the shards `config/mutation/bdd-shards.json` lists today.) It is random rather than a length limit, and nothing inside the job can defend against it: the runner goes, not the process.

Because the merge refuses an incomplete set, one reclaim costs every shard's score. Two things blunt that:

- **Shorter shards.** A reclaim is roughly proportional to how long a job runs, so splitting the longest ones makes each loss smaller and each re-run cheaper. It does not make reclaims rarer.
- **`nightly-mutation-retry.yml`.** On `workflow_run`, if the nightly finished as a failure on its first attempt, it re-runs the failed jobs once. `gh run rerun --failed` re-runs their dependents too, so the merge and the ratchet run again with the artifacts the surviving shards already uploaded, which persist across attempts of one run.

It has to be a separate workflow: a job inside a run cannot re-run its own run. It is bounded to one extra attempt, because a shard that fails twice is not a reclaimed runner and the second failure should be read.

### Why the unit run is sharded

A single job over all of `src/core` took almost exactly two hours on 14, 15 and 16 September 2026 (119m40s, 120m08s, 119m26s) and then stopped finishing inside its 240-minute timeout. Nothing about the mutants changed: the unit suite grew from ~4,957 tests to 6,468, and with `coverageAnalysis: perTest` every added test slows every mutant. A nightly that never completes scores nothing and publishes no baseline, which is how the pull request gate came to mutate from scratch and time out as well (`esi-23g.52`).

`config/mutation/unit-shards.json` splits `src/core` five ways, balanced by mutant count, and gives `src/sde` a shard of its own (Track S Run 2), so the SDE is scored, ratcheted and restored on its own. Counts are a property of the source and the mutator config rather than of the test suite, so these are the same numbers the BDD shards use:

| Shard                   | Directories                                                   | Mutants |
| :---------------------- | :------------------------------------------------------------ | ------: |
| `core-backoff`          | rateLimiter, circuitBreaker                                   |     594 |
| `core-request-pipeline` | requestPipeline                                               |     503 |
| `core-root`             | `src/core` itself, and endpoints, which the globs exclude     |     453 |
| `core-cache`            | cache, pagination, middleware                                 |     448 |
| `core-support`          | logger, util                                                  |     387 |
| `sde`                   | `src/sde`, ingestion included; the test-data factory excluded |   1,317 |

The core shards sum to 2,385, which is what the unsharded run over `src/core` instrumented when they were balanced; with `sde` the unsharded run instruments 3,702. The arithmetic is the check that nothing fell between them.

`UNIT_MUTATION_SHARD=<name> npm run mutation` runs one, writing to `reports/mutation/shards/<name>/`. `npm run mutation:unit:merge` puts them back together for the ratchet and refuses a run with a shard missing, empty or overlapping another. `tests/tdd/mutation-ratchet/unitShards.test.ts` asserts the shards partition `src/core`, so a regrouping cannot drop a directory: orphaning `src/core/endpoints` fails 46 of its cases.

Each shard saves its own incremental file under `stryker-unit-shard-<name>-…`. A shard's file is a whole baseline for its own directories and knows nothing about the others, so the pull request job restores one only when it covers every file the run may mutate: `npm run mutation:pr:shard` plans the run before any baseline exists, names the one shard that claims all of those files (`baselineShardFor` in `scripts/mutation/mutation-merge-core.ts`), and `mutation-pr.yml` restores that shard's cache and copies it to `reports/mutation/stryker-incremental.json`. The common pull request touches one directory and gets a warm run whose timeout fails the job. A change that spans shards (say `src/core/RetryStrategy.ts` and `src/core/cache/`) restores nothing and runs cold, which warns rather than blocks on a timeout: restoring one shard there would claim a baseline the run only half has (`esi-23g.55`).

### The incremental baseline

Each nightly shard runs `npm run mutation -- --incremental --force`: every mutant runs, and Stryker also writes an incremental file, which the job saves with `actions/cache/save` under `stryker-unit-shard-<name>-<sha>-<run id>`.

`mutation-pr` restores the one shard's file that covers every file it will mutate, preferring the entry saved for the pull request's base commit, then the newest for that shard (see "Why the unit run is sharded" for how the shard is chosen). When no single shard covers the run, nothing is restored and the run is cold.

Caches written on `master` are readable by pull requests into `master`. Pull requests never save one.

Stryker reuses a result only when the mutant's code is unchanged and, for a killed mutant, its killing test is unchanged, or, for a survivor, no test was added. The older the baseline, the more mutants re-run: a one-day-old baseline on an active branch reused 51 of 169 mutants in `ETagCacheManager.ts`.

That rule has a blind spot in the local loop. Stryker treats a test as new only by its name, so strengthening an existing test (same name, a sharper assertion) does not invalidate a survivor it now kills: the next `--incremental` run still reports the mutant as Survived. In #375, `AsyncPaginationIterator.ts:17` (`body !== undefined` becoming `true`) stayed Survived after `toEqual([])` became `toHaveLength(0)`, although applying the mutant by hand showed the edited test killed it. It fails safe (the score reads low, never high), but it sends people after mutants that are already dead. Before you chase a survivor you believe a strengthened test kills, re-run that file with `--force`, which runs every mutant in the `--mutate` files and ignores the incremental results for them ([#380](https://github.com/lgriffin/ESI.ts/issues/380)):

```bash
npm run mutation -- --incremental --force --mutate src/core/pagination/AsyncPaginationIterator.ts
```

The nightly always runs with `--force`, so it clears such stale survivors every night. A pull request that only strengthens tests can still see its directory score read low until then, the same fail-safe way.

### Ratchet: `config/mutation/unit-thresholds.json`

One floor per score directory: `src/core` for files directly in core, `src/core/<sub>` below it (the same `directoryOf` as the BDD ratchet in `scripts/mutation/mutation-ratchet-core.ts`). Values are Stryker's mutation score (detected / (detected + undetected)), rounded down to one decimal.

- A pull request that raises a directory's score leaves its floor alone; a follow-up raises it once two nightlies have measured the new tests (`npm run mutation:ratchet -- --update --also <earlier report>`, see "Re-seeding"). The pull request gate cannot prove the raise itself: it re-mutates only the changed `src/` files and keeps the nightly's results for the rest, so a directory improved by new tests alone is still scored on the survivors those tests kill. Re-mutating the whole directory instead does not fit the pull request budget for code that everything imports: on #374, `src/core/logger`'s mutants are each covered by thousands of tests and the run timed out. State the new score in the follow-up's body in one line; ratchet bumps without a reason are how ratchet fatigue starts.
- A floor never goes down. If a change truly has to lower one (for example, deleting dead code that only had killed mutants), that is a reviewed exception in its own pull request, and it fails `mutation-pr` there on purpose.
- A new directory in scope must arrive with its floor; the failure message says which value to add.
- `npm run mutation:ratchet -- --update` (after a full `npm run mutation`) raises every floor to today's score and adds missing ones. It never lowers a floor.

**Seeding.** Each floor is the lower of two real runs: a full local run of this branch's base (`npm run mutation -- --incremental --force`, concurrency 4, 54 minutes) and the last nightly that produced a report (16 September 2026, `bc563d4d`, run 35067980626). They agree within two points for most directories but not all: `src/core/logger` scored 55.5% on the nightly and 33.3% locally, and `src/core/rateLimiter` 73% against 70.9%, mostly because a mutant that times out counts as detected, and how many time out depends on the machine. Taking the lower value means the first pull request to touch a directory is not failed by that spread. The nightly raises nothing on its own; floors move up only in reviewed pull requests.

**Re-seeding, 19 September 2026.** The floors were raised from the first two complete sharded nightlies (runs 35352679266 and 35428381994), which differ only in a two-line change to `src/core/constants.ts`. Taking the lower of the two scores was not enough: 43 mutants changed status between the runs on the same code, 14 of them in `src/core/cache`, mostly a mutant that timed out on one runner and survived on the other. So each floor is the score of a report in which a mutant counts as detected only if _both_ runs detected it. That is below either run's own score, which is the point: a third run on the same code cannot score below it unless a mutant neither run left alive survives. No floor was lowered; `src/core` stays at 81.8% where that rule gave 81.7%.

**Timing tests made deterministic ([#382](https://github.com/lgriffin/ESI.ts/issues/382)).** The flips traced back to unit tests that measured real time: `setTimeout` sleeps before checking a cache entry had expired, circuit breaker cleanup that passed or not depending on whether a millisecond ticked between two calls, and retry and rate-limit waits that were slept through for real and then bounded loosely (`toBeGreaterThanOrEqual(40)` for a 50ms delay). Those tests in `tests/tdd/core` now run on Jest's fake clock (`jest.useFakeTimers()`, or `useFakeDate()` from `tests/tdd/helpers/fakeDate.ts` where the whole request pipeline runs and only `Date` should be frozen) or record `sleep()` calls with `Math.random` pinned, and each asserts the exact delay or boundary: an entry is fresh at its TTL and expired one millisecond later, a circuit is open at `resetTimeoutMs - 1` and half-open at `resetTimeoutMs`, a back-off is `[10, 20, 40]`, not "positive". A mutant of one of those comparisons or delays is now killed by an assertion on every machine rather than by a timeout on a slow one. New tests of timing code follow the same rule (see [TESTING.md](TESTING.md#time-and-randomness)): no real sleeps, no `Date.now()` bounds.

**Re-seeding once the timing tests have landed.** This step needs real nightlies and has not been done yet; the floors above are still the 19 September both-runs values. With the time-dependent mutants deterministic, two nightlies on the same `src/core` should agree mutant for mutant, and then `detectedByEveryRun` stops being what holds a floor down: seeding from one run with `npm run mutation:ratchet -- --update` gives the same floor as seeding from two with `--also`. To confirm that before relying on it:

1. Wait for two complete sharded unit nightlies after the change, with no `src/core` change between them. Download each run's shard reports and merge them (`npm run mutation:unit:merge`) into two `mutation.json` files.
2. Run `npm run mutation:ratchet -- --update --also <earlier report>` against the later report, as on 19 September. Count the mutants whose status differs between the two reports; the issue's 43 is the number to beat, per directory as in the table below.
3. If the gap between each directory's score and its new floor is near zero, record the new floors and the flip count here in one line, and later re-seeds may use a single complete nightly without `--also`. Directories that still flip keep the two-run rule, and their flipping mutants are the next tests to make deterministic.

### Where the scores stand

The SDE directories (Track S Run 2, 2026-09-27) were seeded from a local run rather than a nightly: `src/sde` 87.6% and `src/sde/ingestion` 73.8% on the unit suite (1,317 mutants), `src/sde` 22.6% and `src/sde/ingestion` 0% BDD-only, floored two points below at 85.6 / 71.8 and 20.6 / 0 in the two floor files. The nightly matrix re-seeds them on its next complete run; until then those four floors are provisional and the table below, which lists the nightly-measured core, does not carry them.

The first two complete runs of the sharded unit matrix: 18 September 2026 (run 35352679266) and 19 September 2026 (run 35428381994). Five shards, 38 to 82 minutes each, merged into one report of 37 mutated files. The 18 September run was the first time `src/core` had been scored since 16 September: the unsharded job stopped finishing inside its 240-minute timeout as the suite grew.

| Directory                  | 18 Sept | 19 Sept | Detected / valid (19 Sept) | Floor | Floor before |
| :------------------------- | ------: | ------: | -------------------------: | ----: | -----------: |
| `src/core`                 |   83.3% |   83.3% |                    215/258 | 81.8% |        81.8% |
| `src/core/cache`           |   73.3% |   70.1% |                     87/124 | 65.3% |        53.3% |
| `src/core/circuitBreaker`  |   77.7% |   79.3% |                    100/126 | 77.7% |        75.2% |
| `src/core/logger`          |   59.2% |   62.9% |                      17/27 | 55.5% |        33.3% |
| `src/core/middleware`      |    100% |    100% |                      26/26 |  100% |        92.3% |
| `src/core/pagination`      |   73.9% |   73.9% |                     88/119 | 73.9% |        72.2% |
| `src/core/rateLimiter`     |   78.3% |   79.4% |                    213/268 | 77.9% |        70.9% |
| `src/core/requestPipeline` |   77.6% |   76.0% |                    184/242 | 75.2% |        67.5% |
| `src/core/util`            |   96.1% |   95.4% |                    148/155 | 95.4% |        95.3% |

A snapshot, not a source of truth: the live numbers are whatever the last nightly published, and this table is here to say where the floors sat relative to reality when the matrix first worked.

**The gap between a directory's score and its floor is now the flakiness of its mutants, not slack.** Before the re-seeding, four directories sat 7 to 26 points above their floors, a measurement the ratchet was not holding: a change could have given back twenty points of `src/core/cache` and no gate would have noticed. What is left between score and floor is the mutants that are detected on one runner and not another. Killing those deterministically (fake timers and an exact assertion, rather than a timeout that depends on machine speed) is what lets a floor rise to the score. The timing tests named in #382 have moved to fake timers (see "Timing tests made deterministic" above); the re-seed that measures the effect is still to run.

Two caveats on comparing this table with an earlier one. A mutant that times out counts as detected, and how many time out depends on the machine, so a local run and a nightly disagree by a point or two on the same code (the seeding note above records `src/core/logger` at 55.5% nightly against 33.3% locally for exactly that reason), and two nightlies disagree too. And these are five separate shards merged, so each directory's score comes from the one shard that owns it rather than from a single process.

The BDD-only floors in `config/mutation/bdd-thresholds.json` come from the same two nights by the same rule. 19 September was the first run in which every BDD shard finished; on 18 September the `core-rest` shard (since split into `core-support` and `core-root`) lost a runner and the merge refused the incomplete set, but the seven shards that did finish still count, so a mutant any of them left alive counts as undetected. Most directories were therefore measured once, and BDD-only scores are low by design: the scenarios exercise behaviour through the transport seam, not every branch. The 15 floors today run from 0% (`src/schemas`, where a schema declaration has little for a scenario to kill) and 10.6% (`src/sde`) to 42.8% (`src/core/util`); `cat config/mutation/bdd-thresholds.json` lists them.

### The known-weak fixture

`tests/mutation-fixture/weakClamp.ts` is a `clamp` function whose fixture test only checks an in-range value. `npm run mutation:fixture` mutates it with `config/mutation/stryker.fixture.config.mjs` and fails unless the report shows at least one killed mutant (the run can detect a fault), at least one survivor (a weak test is visible), and a ratchet failure for it against a 100% floor. `mutation-pr` runs it before the real run, so every pull request proves the pipeline can still go red. Do not strengthen that test. The last local run: 5 killed, 4 survived, 2 without coverage, score 45.4%, 15 seconds. Pointing the fixture's Jest `roots` at the original tree instead of the sandbox, the same mistake the module mapper used to make, turns that into 0 killed and 11 survived, and the check exits 1 with "no fixture mutant was killed".

`tests/tdd/mutation-ratchet/` holds the unit tests for the ratchet itself: a directory below its floor fails, a missing or unreadable thresholds file or base ref fails closed, a lowered or removed floor is rejected, a pull request with no in-scope `src/` change skips, and the plan widens to whole directories when the baseline cannot vouch for a file.

### Sharding the BDD-only run

One job mutating all of `src/` against the BDD suite alone does not finish: 4,495 mutants, and the only attempt was killed at 30 minutes, which is why `config/mutation/bdd-thresholds.json` was empty for as long as it was. `nightly-mutation.yml` therefore runs one job per shard in `config/mutation/bdd-shards.json`; `BDD_MUTATION_SHARD=<name> npm run mutation:bdd` mutates that shard alone and writes `reports/mutation-bdd/shards/<name>/`.

A split run only means the same thing as the single run it replaces if nothing falls between the shards, so two checks hold it together:

- `tests/tdd/mutation-ratchet/bddShards.test.ts` asserts the shards partition `src/`: every TypeScript file belongs to exactly one. `src/sde` has a shard of its own since Track S Run 2 (1,536 mutants), so the SDE's BDD scenarios are scored, ratcheted and restored apart from `rest`. A file claimed by none is never mutated and its directory's score quietly improves; a file claimed by two is counted twice. The exclusions in `config/mutation/stryker.bdd.config.mjs` are shared by every shard, so the union of the shards mutates exactly what the unsharded glob did.
- `npm run mutation:bdd:merge` (`scripts/mutation/mutation-merge-core.ts`) refuses to merge a run with a shard missing, a shard that mutated nothing, or two shards reporting one file. Without that, a shard whose job died would leave its directories scored on whatever else ran, which reads as a pass.

Seed the floors from a completed run: dispatch the workflow with `seed_bdd_thresholds`, which prints and uploads `config/mutation/bdd-thresholds.json` raised to that run's scores. Nothing commits it; `--update` never lowers a floor.

### Why the BDD-only run is not on pull requests

Running the step definitions as the dry run for a `src/core/requestPipeline` change would take most of the 12-minute pull request budget on its own, and there is no incremental baseline to restore until the nightly matrix has published one. Once it has, a pull request run scoped to `src/core/requestPipeline` is the natural next step.

## How It Works

1. **Instrumentation**: Stryker parses all files matching the `mutate` glob and identifies possible mutations (2,385 in the unit scope when the shards were balanced on 18 September 2026; see "Why the unit run is sharded").
2. **Dry run**: Stryker runs the tests once to establish a baseline and map which tests cover which code. The unit run narrows the dry run to the tests Jest's module graph relates to the mutated files (`enableFindRelatedTests`); the BDD run cannot, because the step-library specs bind their steps at run time through `bindFeature(__filename)` and relate to nothing statically (the `sde` shard found no tests at all once Run 3 converted the SDE steps), so it runs every BDD spec and lets per-test coverage do the narrowing.
3. **Mutation**: For each mutant, Stryker modifies the source and runs only the tests that cover the changed code (`perTest` coverage analysis). The TypeScript checker discards mutants that do not compile first.
4. **Scoring**: Each mutant is classified:

| Status           | Meaning                                                        |
| ---------------- | -------------------------------------------------------------- |
| **Killed**       | A test failed: the mutation was detected                       |
| **Survived**     | All tests passed: a potential blind spot                       |
| **Timeout**      | A test timed out, likely an infinite loop; counts as detected  |
| **NoCoverage**   | No test executes this code path                                |
| **CompileError** | The TypeScript checker rejected it; not counted                |
| **Ignored**      | Excluded mutator (`StringLiteral`) or static code; not counted |

## Configuration

Config files: `config/mutation/stryker.config.mjs` (unit suite, nightly and pull requests), `config/mutation/stryker.bdd.config.mjs` (BDD-only), `config/mutation/stryker.fixture.config.mjs` (known-weak fixture).

### Scope

The unit run mutates `src/core/**/*.ts` and `src/sde/**/*.ts` with these exclusions:

- `src/core/endpoints/**`: endpoint definitions are data declarations, not logic
- Interface-only files (`ILogger.ts`, `ICache.ts`, `IRateLimiter.ts`, `IRetryStrategy.ts`, `ICircuitBreaker.ts`, `IDeduplicator.ts`) and the `requestPipeline` barrel and dependency wiring
- `src/sde/SdeTestDataFactory.ts`: a test fixture shipped for consumers' tests; mutating it would score the fixture, not the module

Files NOT in scope (and why):

| Excluded                                      | Reason                                                |
| --------------------------------------------- | ----------------------------------------------------- |
| `src/clients/**`                              | Thin delegation layers tested via BDD scenarios       |
| `src/schemas/**`                              | Zod schema declarations, no branching logic           |
| `src/types/**`                                | Type-only files, no runtime code                      |
| `src/config/**`                               | Configuration setup, not core logic                   |
| `src/EsiClient.ts`, `src/EsiClientBuilder.ts` | High-level orchestration tested via integration tests |
| `*.generated.ts`                              | Auto-generated from OpenAPI spec                      |

A pull request that changes only out-of-scope `src/` files skips the mutation step and names those files in the summary.

### Thresholds

The unit config has no global `break`; the per-directory floors in `config/mutation/unit-thresholds.json` are the gate. `high: 80` and `low: 60` only colour the HTML report.

A directory is `src/<area>` for most of the tree and `src/core/<sub>` or `src/sde/<sub>` inside the core and the SDE, whose parts differ enough that one number would hide a weak one (`directoryOf` in `scripts/mutation/mutation-ratchet-core.ts`). The SDE floors are provisional: `src/sde` and `src/sde/ingestion` were seeded on 2026-09-27 from a local unit run (87.6% and 73.8%, 1,317 mutants, 4 minutes) minus two points, and the BDD-only pair from a local run of the `sde` BDD shard the same way (`src/sde` 22.6% so 20.6, up from the 10.6 the whole tree scored before its subdirectories were split out; `src/sde/ingestion` 0, because no scenario reaches ingestion until Track S Run 6 specifies it), until the nightly matrix re-seeds them; floors come from the nightly, never from a laptop. Fifteen SDE mutants crash the test runner rather than fail a test (a missing-file check removed, a transform recursing on itself) and count as `RuntimeError`, which no score counts.

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

Current per-directory floors are in `config/mutation/unit-thresholds.json`; `npm run mutation:ratchet` prints today's scores next to them.

## Improving the Score

When a mutant survives, it means changing that line doesn't break any test. To kill it:

1. Open the HTML report (or the `mutation-pr` job summary) and find the survived mutant
2. Read what the mutation does (e.g., `a > b` changed to `a >= b`)
3. Write a test case where the original behavior and mutated behavior produce different results
4. Re-run the file with `--force` to confirm the mutant is killed (an `--incremental` run can keep reporting it as Survived when you strengthened an existing test rather than adding one; see "The incremental baseline")
5. Raise the directory's floor in `config/mutation/unit-thresholds.json` to the new score, with a one-line reason in the pull request

The weakest directories at seeding were `src/core/cache` (`ETagCacheManager.ts`), `src/core/logger` and `src/core/requestPipeline` (`statusHandling.ts`, `cachePolicy.ts`).

## Runtime

| Run                                                                                                        | Wall time                                                      |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Pull request, one-function change to `ETagCacheManager.ts`, local, concurrency 4, same-day baseline        | 1 min 9 s (169 mutants instrumented, 1 of 1,845 files mutated) |
| The same change against a one-day-old baseline (51 of 169 mutants reused)                                  | 2 min 22 s                                                     |
| Known-weak fixture, local                                                                                  | 15 s                                                           |
| Known-weak fixture, GitHub runner                                                                          | 9 s                                                            |
| Pull request job on a GitHub runner with no cached baseline (the whole `src/core/cache` directory mutated) | 5 min 12 s for the job, 4 min 41 s for the mutation step       |
| Full unit run, local, concurrency 4 (1,907 mutants, the seeding run of 16 September 2026)                  | 54 min                                                         |
| Full unit run, nightly, unsharded (GitHub runner, concurrency 6), until 16 September 2026                  | about 2 h, then no longer finished inside 240 min              |
| Full unit run, nightly, five shards (18 and 19 September 2026)                                             | 38 to 82 min per shard                                         |

The pull request step has a 30-minute deadline inside a 37-minute job. It was 8 minutes until #434: `src/core/ApiRequestHandler.ts` has 110 mutants, and a change to it re-tests about 70 of them even with a fresh baseline, because every test that covers a changed line invalidates the mutants it reaches. At about 7 s a mutant on two test runners, plus 30 s per timeout, one such run reached 54 of 69 at a 15-minute deadline and 59 of 69 at 20, slowed further by test runners running out of memory and restarting. A change that invalidates most of a large directory (for example, a rewrite of `RateLimiter.ts` with no baseline) can still exceed 30; that fails the job rather than passing it.
