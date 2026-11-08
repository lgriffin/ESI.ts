# 8 · The testing framework through a Lean lens

A Lean review of the test suite, made on 8 November 2026 at the maintainer's request. The changes it recommended are recorded as amendments in [CHARTER.md](../CHARTER.md).

As of 8 November 2026, `master` at `5ee54c6`. Evidence window: 241 merged PRs since 26 September 2026, 2,152 GitHub Actions runs in the 30 days from 9 October, and every bot-filed nightly issue since 24 September. Method and sources are at the end.

## The verdict

The framework is worth keeping at its core and is overbuilt at its edges. The checks that found real defects are the ones that touch the outside world (live ESI, recorded payloads, the spec at the client's date, CCP's SDE export) plus plain typecheck, unit tests and properties. The layer that costs most, nightly mutation and above all BDD-only mutation, found no product defect in 30 days, was red on 20 of 30 nights, and consumed about three quarters of all CI runner time.

In Lean terms: most of the appraisal effort sits where defects are not, and the gap where they are (the 145 of 235 operations that need a token) has no live check at all.

| Measure (30 days to 8 Nov unless stated)                                |                                  Value |
| ----------------------------------------------------------------------- | -------------------------------------: |
| CI runner time, all workflows                                           |                 ~88,800 min (~1,480 h) |
| of which nightly mutation                                               |                      ~68,500 min (77%) |
| of which BDD-only mutation shards                                       |                      ~48,200 min (54%) |
| Nightly mutation, scheduled runs red                                    |                               20 of 30 |
| Product defects found by nightly mutation or the BDD floors epic (#738) |                                      0 |
| Product defects fixed since 26 Sep, found by touching real ESI/SDE data |         11 methods/fields across 6 PRs |
| Merged PRs since 26 Sep that were quality work (build, repair, tests)   |                       102 of 241 (42%) |
| of which repairing the test machinery itself                            | 34 (more than half the 60 product PRs) |
| Test code to hand-written product code                                  |           ~151k : ~32k lines (4.7 : 1) |
| Test tiers / workflows / npm scripts / ratchet and exception files      |                     17 / 29 / 228 / 21 |

## 1 · What the customer pays for

The customer of ESI.ts is a TypeScript developer calling EVE's ESI. What they value: a typed call that returns what ESI actually sends, does not throw on a valid response, behaves well under rate limits and outages, keeps tokens safe, and does not break on upgrade.

A test adds value in the Lean sense only when it stops a defect reaching that developer, sooner or more cheaply than anything else would. Everything else is appraisal: necessary non-value-add (Type 1 muda) when compliance or safety requires it, pure waste (Type 2 muda) when it does not.

That gives three questions for every layer:

1. Has it found a defect a consumer would hit, and how recently?
2. Is it the cheapest place that defect could be found?
3. What does it cost to run, to keep green, and to keep honest?

## 2 · Where the runner time goes

Nightly mutation is 77% of all runner time. The BDD-only shards alone (46 jobs a night, ~1,460 runner minutes a run) are more than half of everything the repository runs.

| Workflow                                          | Runs (30 d) | Runner min per run | Est. runner min (30 d) | Share |                       Red runs |
| ------------------------------------------------- | ----------: | -----------------: | ---------------------: | ----: | -----------------------------: |
| nightly-mutation: BDD-only shards                 |          33 |             ~1,460 |                ~48,200 |   54% | 20 nights red (whole workflow) |
| nightly-mutation: unit + type shards and ratchets |          33 |               ~615 |                ~20,300 |   23% |                    (same runs) |
| ci.yml (PR gate, 29 jobs)                         |         274 |                 39 |                 10,800 |   12% |                             30 |
| mutation-pr (advisory, changed files)             |         274 |                 13 |                  3,500 |    4% |                             32 |
| ci-fast (push)                                    |         381 |                  7 |                  2,600 |    3% |                             15 |
| nightly-sde                                       |          31 |                 25 |                    780 |  0.9% |                              0 |
| codeql                                            |         364 |                  2 |                    750 |  0.8% |                              0 |
| All 14 other nightlies together                   |        ~440 |            1 to 10 |                 ~1,400 |  1.6% |                              7 |

The money cost is nil (the repository is public), so the Lean cost is not dollars. It is what the time and the red signals do to flow: a 35-runner-hour nightly that cannot be reproduced locally (local Stryker is ~25 s a mutant, ~65 min for one auth shard), an issue filed most mornings, and agent sessions spent on the machinery rather than the product. The earlier study found agent capacity and usage limits were the constraint. Test-infrastructure rework spends exactly that constraint.

## 3 · Where defects were actually found

Every product defect fixed since 26 September, traced to what found it:

| Found by                                                                  | PRs                                      | What it found                                                                                                                                                                                                        | Escaped to npm first?                                        |
| ------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Real ESI responses (nightly/PR live examples, recorded payloads)          | #423, #428, #434                         | `getRaidableSkyhooks` and `getChangelog` threw on every real call; empty 200 on expired contracts threw `JSON_PARSE_ERROR`                                                                                           | Yes, all three                                               |
| Schema drift at the client's compatibility date                           | #641                                     | 7 methods threw `EsiValidationError` on every real call (access lists, mercenary dens, sovereignty hubs, skyhooks)                                                                                                   | Yes, through 11.x                                            |
| Real SDE export (nightly-sde)                                             | #533, #574                               | Dogma ids missing on real data; 38 new CCP keys across 18 tables                                                                                                                                                     | #533 yes                                                     |
| Human or agent review (gap register, charter, security model, CSH review) | #394, #417, #419, #465, #467, #629, #636 | Unsent `X-User-Agent`, 304 on streamed pages, retries treating POST as GET, cache keyed by token, factory ignoring compatibility date, unbounded `X-Pages`, redirects followed; drift check pinned to the wrong date | Yes, most                                                    |
| Writing tests to kill unit mutants                                        | #608, #609, #723                         | SQL keyword columns and dropped late fields in the SQLite builder; public view throwing synchronously instead of rejecting                                                                                           | #723 yes; #608/#609 were in code deleted 9 days later (#658) |
| Property tests                                                            | #430                                     | `.` and `..` accepted as path parameters                                                                                                                                                                             | No                                                           |
| Nightly mutation ratchet (30 nights)                                      | none                                     | 0 product defects                                                                                                                                                                                                    | n/a                                                          |
| BDD-only mutation floors epic #738 (16 PRs, 2 full measurement runs)      | none                                     | 0 product defects; 1 vacuous scenario repaired (#759)                                                                                                                                                                | n/a                                                          |

Two things stand out.

**The escaped defects shipped at 99% statement coverage and 85 to 90% mutation score.** The tests asserted the same invented response shapes the code expected, so every mutant of that code was killed and every call still failed in production. Mutation testing measures whether tests check the code. It cannot tell whether the code and its tests share a wrong belief about the world. That is verification without validation.

**Reality-facing checks found the most serious defects, and they are the cheapest checks the repository runs** (1 to 25 runner minutes a night each). Review found almost all the rest. Mutation-driven test writing found three, two of them in code that was about to be removed, which is polishing inventory.

## 4 · What the framework costs in work

Of 241 merged PRs since 26 September, 102 (42%) were quality work and 60 (25%) were product. In the last 30 days the split widened: 38 quality PRs against 20 product PRs.

| Class                                                 | 26 Sep to 8 Oct | 9 Oct to 8 Nov | Total |
| ----------------------------------------------------- | --------------: | -------------: | ----: |
| Product (feat, fix, perf, refactor in `src`)          |              40 |             20 |    60 |
| Quality build-out (new tiers, gates, lints, audits)   |              30 |              8 |    38 |
| Quality repair (making the test machinery work again) |              23 |             11 |    34 |
| Tests written (coverage, specs, mutation floors)      |              11 |             19 |    30 |
| Docs, Beads, layout                                   |              39 |             10 |    49 |
| Dependencies and audit fixes                          |               7 |             12 |    19 |
| Release PRs                                           |               5 |              6 |    11 |

Quality repair is failure demand in Seddon's sense: work that exists only because the system failed to do its job first time. Its 34 PRs include eleven that exist only to keep the mutation machinery running (#523, #576, #586, #606, #649, #651, #690, #698, #702, #733, #736), the payload-drift false positives (#441, #570/#583), example downtime noise (#604), the spec-drift script broken by a refactor (#699), a seed-dependent vacuity check (#530/#566), and a canary that needed two fixes before it could check anything (#557, #559).

The 30 "tests written" PRs since 9 October are dominated by the #738 epic: 15 PRs raising BDD-only mutation floors on code that already had unit mutation floors in the 80s and 90s. The survivors it chased were mostly log lines, debug guards and equivalent mutants (#754, #756, #758, #762, #765 list them).

## 5 · The nightlies: signal against noise

About 42 bot-filed nightly issues since 24 September. Sorted by what each turned out to be:

| Nightly                          |             Issues | Real product signal |             Upstream or dependency |                                                                       Test or infra fault |                               Transient |
| -------------------------------- | -----------------: | ------------------: | ---------------------------------: | ----------------------------------------------------------------------------------------: | --------------------------------------: |
| mutation                         | 9 (≈20 red nights) |                   0 |                                  0 | 9 (runner OOM, dry-run timeout, time budgets, `afterAll` hook bug, ±3-mutant floor noise) |                                       0 |
| examples                         |                 10 |                   0 |                                  0 |                                                                                         0 | 10 (Tranquility downtime, #594 to #603) |
| security audit                   |                  7 |                   0 |       7 (one critical: handlebars) |                                                                                         0 |                                       0 |
| recorded payloads                |                  4 |                   0 |             1 (shape change, #443) |                                                                                         0 |                                       3 |
| benchmarks                       |                  3 |                   0 |                                  0 |                                                                 1 (cost of #665 accepted) |                                       2 |
| spec drift                       |                  2 |                   0 |                                  0 |                                                       1 (#692, script broken by refactor) |                                       1 |
| sde                              |                  1 |     1 (38 new keys) |                                  0 |                                                             1 (false report on one table) |                                       0 |
| consumer matrix                  |                  1 |                   0 | 1 (TypeScript-next vs zod, 8 days) |                                                                                         0 |                                       0 |
| no-retry                         |                  1 |                   0 |                                  0 |                                                            1 (order-dependent test, #726) |                                       0 |
| faults, properties, Schemathesis |                  3 |                   0 |                                  0 |                                                                                         0 |                                       3 |

Eleven of the 14 nightlies were green all 30 nights. Green is only good news if the check could have gone red. Three cannot:

- **nightly-live-health** passes with the warning "not configured" because `ESI_HEALTH_REFRESH_TOKEN` (#545) was never minted. 31 green runs, zero authenticated calls.
- **Live and gated integration suites** (208 tests) skip without environment variables, and TESTING.md says no workflow sets them.
- **API fuzz (Schemathesis)** is listed in TESTING.md as the one tier with no signal that it can fail. By the guide's own first rule, "a tier that cannot fail manufactures confidence."

## 6 · The eight wastes, applied to testing

| Waste                              | Where it shows in the test system                                                                                                                                                                                                                            | Evidence                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Overprocessing                     | The same code scored twice for mutation (unit and BDD-only), each with its own floors, shards and ratchet; on every PR the unit suite runs 4 times and BDD up to 6 times (unit Node 22, unit Node 24, coverage, BDD job, security-model job, complete suite) | `ci.yml` jobs; ~10 runner min per PR run duplicated |
| Overproduction                     | Coverage and mutation pushed past the point of finding defects: 99.2% statements, unit floors to 95 to 100, BDD floors to 80 to 93                                                                                                                           | #738 found 0 product defects                        |
| Inventory                          | 208 live/gated tests no workflow runs; a live-health check with no token; mutation work on the SQLite builder deleted 9 days later                                                                                                                           | TESTING.md tier table; #608/#609 then #658          |
| Defects (in the inspection system) | Mutation nightly red 20 of 30 nights for infra reasons; advisory `mutation-pr` red 32 of 274 runs, often timeouts                                                                                                                                            | Section 5                                           |
| Motion                             | 21 ratchet, baseline and exception files that new tests trip (export coverage, client spec coverage, docs metrics), and docs-metrics conflicts between sibling PRs                                                                                           | esi-bdd-floors-738 gotchas                          |
| Waiting                            | Mutation feedback arrives the next morning; local reproduction takes hours                                                                                                                                                                                   | ~25 s a mutant locally                              |
| Handoffs                           | Nightly issue → triage thread → fix PR → next nightly to prove it closed: a one-day cycle per attempt                                                                                                                                                        | #670 took 6 nights and 3 PRs                        |
| Unused talent                      | Agent and maintainer attention spent on the machinery while authenticated live coverage, the largest real gap, waits on a 10-minute token mint                                                                                                               | #545 open since 28 Sep                              |

The andon analogy is the sharpest one. Jidoka asks the line to stop on a real abnormality. A cord pulled 20 nights out of 30 by the cord itself teaches everyone to ignore the cord.

## 7 · Layer by layer

VA = value-adding (finds defects consumers would hit, at or near the cheapest point). NNVA = necessary non-value-add (keep, minimise). W = waste (remove or shrink).

| Layer                                                                                | Class                              | Evidence                                                                                                                | Verdict                                                           |
| ------------------------------------------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Typecheck, build, lint, layers, cycles                                               | VA                                 | Poka-yoke at the workstation; cheap; catches whole classes before tests run                                             | Keep                                                              |
| Unit tests (one run, with coverage)                                                  | VA                                 | The fast feedback loop; `check:local` runs them                                                                         | Keep, run once per PR                                             |
| BDD/EARS specifications as tests                                                     | VA                                 | The executable statement of required behaviour; new Rules pin each fix (#417)                                           | Keep, run once per PR                                             |
| Recorded replay + payload re-recording                                               | VA                                 | Found #428; replay is offline and fast                                                                                  | Keep; finish the drift false-positive work                        |
| Schema drift at the client's date                                                    | VA                                 | Found 7 broken methods (#641) once pointed at the right date                                                            | Keep; it must test the date the client sends                      |
| Nightly examples (public)                                                            | VA                                 | Found #423, #433; noise only during Tranquility downtime, now handled                                                   | Keep                                                              |
| nightly-sde real data                                                                | VA                                 | Found #533 and 38 new keys                                                                                              | Keep                                                              |
| Properties and fuzz (PR)                                                             | VA                                 | Found #430; 20 s                                                                                                        | Keep                                                              |
| Fault catalogue                                                                      | VA                                 | Owns outage behaviour cheaply on fake clocks                                                                            | Keep                                                              |
| API report, SemVer gate, consumer tarball and contract, package lint, size           | VA                                 | The upgrade promise to consumers; cheap                                                                                 | Keep                                                              |
| Post-publish canary                                                                  | VA                                 | Verifies what consumers install; 6 runs a month                                                                         | Keep                                                              |
| Unit mutation                                                                        | VA at PR scope, W at nightly scale | Found #721 via test writing; nightly scale finds nothing new day to day                                                 | Keep on changed lines at PR; full run weekly                      |
| BDD-only mutation (shards, floors, ratchet, retry)                                   | W                                  | 54% of runner time; 0 product defects; most red nights; duplicates unit mutation of the same code                       | Drop, or run monthly as information                               |
| Type tests and type mutation                                                         | VA (small)                         | Half the library's value is in its types; 22 runner min a night                                                         | Keep; weekly is enough                                            |
| Security audit, CodeQL, zizmor, lockfile, Scorecard, signatures                      | NNVA                               | 7 real advisories; supply-chain hygiene                                                                                 | Keep; fold nightly audit and PR audit into one                    |
| EARS check and dashboard                                                             | NNVA                               | Traceability Leigh chose as governance; cheap                                                                           | Keep the check                                                    |
| Charter audit, security-model audit, spec-coverage baselines, docs metrics           | Mostly W                           | Appraisal of the appraisal: #639/#640 produced PRs whose only output was tags (#644, #645); baselines trip on new tests | Collapse into one report; stop shrink-only gates on test-only PRs |
| Benchmarks (PR when hot path changes; nightly)                                       | NNVA                               | 3 nightly issues, none led to a revert                                                                                  | PR job keep; nightly to weekly                                    |
| Composition, no-retry, interleave nightlies                                          | NNVA                               | Found one order-dependent test (#726); never a product defect                                                           | Weekly                                                            |
| Consumer matrix nightly (TypeScript next)                                            | W                                  | Only failure was upstream, open 8 days                                                                                  | Make the `next` cells informational                               |
| Live health (no token), live/gated integration (never run), Schemathesis (no signal) | W as they stand                    | Green that proves nothing                                                                                               | Make them real (below) or delete them                             |
| Advisory `mutation-pr`                                                               | W as it stands                     | 32 of 274 red, not required, often timeouts                                                                             | Scope to changed lines and make it reliable, or remove            |

## 8 · Recommendations, ranked

Ranked by value released per unit of effort.

**Add (the one gap that matters)**

1. **Mint the live-health token (#545) and point the authenticated examples, live-health and the gated integration suite at it.** 145 of 235 operations need auth, and every real escaped defect so far came from the gap between our beliefs and ESI's responses. This is about ten minutes of Leigh's time and turns three inert checks into the highest-value tier. Until then, make live-health fail, not pass, when unconfigured.

**Drop**

2. **Stop BDD-only mutation as a nightly gate.** Remove the BDD shards from `nightly-mutation.yml`, retire `bdd-thresholds.json` and the BDD ratchet (keep the file history), and if the number is still wanted, run it monthly as a report that files no issue. Saves ~48,000 runner minutes a month (over half of all CI) and removes the source of most red nights and most repair PRs.
3. **Delete or wire up the inert tiers**: Schemathesis (no can-fail signal), and live integration tests that no workflow runs (wire to #545 or remove).

**Trim**

4. **Unit mutation: changed lines on PRs, full run weekly.** Scope `mutation-pr` to the changed line ranges (the fix proposed in #571), make it reliable, then make it required. Move the full unit and type mutation run from nightly to weekly. Give floors a tolerance of ±3 mutants so measurement noise never files an issue.
5. **De-duplicate the PR gate.** One job runs `npm test` with coverage on Node 22 (unit and BDD together, as the config already does), one Node 24 smoke, and the security-model audit reads that job's JSON instead of re-running BDD. "Complete Test Suite" keeps only what nothing else runs (integration, type tests). About a quarter of `ci.yml`'s runner time and 4 to 6 jobs.
6. **Collapse the traceability gates into one report.** EARS check stays. Charter audit, security-model audit, spec-coverage baselines and docs metrics become one `npm run audit:trace` with one baseline, and a test-only PR may grow coverage without editing a shrink-only file.
7. **Move low-yield nightlies to weekly**: benchmarks, no-retry, interleave, properties, faults, consumer matrix (with `next` informational). Keep nightly only for checks that watch something that changes daily outside the repo: examples, payload recording, spec drift, SDE, audit.

**Keep as is**

8. Typecheck and lint, unit, BDD/EARS specs, replay, schema drift, examples, SDE nightly, properties, fault catalogue, API report and SemVer, consumer tarball, package lint, canary, CodeQL, zizmor, audit.

If 2, 4, 5 and 7 are taken, CI runner time falls by roughly 75 to 80% (from ~88,800 to ~18,000 to 22,000 minutes a month), nightly issues fall from about ten a week to one or two, and every remaining red signal is one worth stopping for.

## 9 · What this does not say

- It does not say mutation testing is worthless. Unit mutation drove the tests that found #721 and two SQLite bugs, and it keeps tests honest. The claim is narrower: past the point where scores sit in the 80s and 90s, a second, BDD-only mutation regime run nightly has produced no product value.
- It does not say BDD or EARS are waste. The specifications are the requirements and Leigh's chosen governance. What is waste is mutation-scoring them separately and auditing their tagging in several overlapping gates.
- Defect attribution was done from PR and issue bodies. A few fixes were found by more than one route; each is credited to the route that reported it first.
- Runner minutes are estimated from a sample of 749 runs' job timings (all nightly runs, 25 to 60 runs of each high-volume PR workflow), scaled to the 30-day run count.

## Method and sources

- Repository: [lgriffin/ESI.ts](https://github.com/lgriffin/ESI.ts) at `5ee54c6`; sizes by line count of `src`, `tests`, `scripts`, `config` and `.github/workflows`.
- PRs: all 550 PRs via the GitHub API; the 241 merged since 26 Sep classified by conventional-commit type plus hand assignment of test-infrastructure repairs (the project data files).
- CI: 2,152 runs created on or after 9 Oct across all 29 workflows; job timings for 749 sampled runs (`data/ci-runs-30d.tsv`).
- Issues: every issue since 20 Sep with its labels and closing comments.
- Repository guides: `guides/TESTING.md` (tier table, suite stats), `guides/QUALITY-GATES.md`, `config/mutation/*.json`.
- Earlier sections of this study (00 to 07) for vocabulary: value stream, the eight wastes, failure demand, constraint.
