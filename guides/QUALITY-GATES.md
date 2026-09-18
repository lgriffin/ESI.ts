# Quality Gates

**Implements:** `GATE-01`, `GATE-02`, `GATE-03`, `GATE-04`, `GATE-05`, `GATE-06` — see [CHARTER.md](CHARTER.md) Part 5 for the requirements and their status.

What runs at commit, push, pull request, nightly and release, what blocks, and what files an issue instead. This guide describes the gates as the workflow files and hooks define them today. Where the charter's matrix and the YAML disagree, the YAML wins and the difference is called out.

How the tests themselves are organised is in [TESTING.md](TESTING.md). The release flow end to end is in [RELEASE.md](RELEASE.md). Supply-chain controls (SHA pinning, provenance, signing) are in [SECURITY.md](SECURITY.md).

---

## The gate matrix

● blocks; ◐ runs but does not block; · does not run.

| Check                                      | Commit |           Push           |        PR        |    Nightly    |   Release    |
| ------------------------------------------ | :----: | :----------------------: | :--------------: | :-----------: | :----------: |
| lint-staged: ESLint fix + Prettier         |   ●    |            ·             |        ·         |       ·       |      ·       |
| commitlint (conventional commits)          |   ●    |            ·             |        ·         |       ·       |      ·       |
| ESLint, Prettier check, build, typecheck   |   ·    |            ●             |        ●         |       ·       |    ● (1)     |
| Unit tests (includes BDD step definitions) |   ·    |            ●             |    ● 18/20/22    |       ·       |      ●       |
| Coverage thresholds + PR comment           |   ·    |            ·             |        ●         |       ·       |      ·       |
| BDD suite                                  |   ·    |          ● (2)           |        ●         |       ·       |      ●       |
| EARS spec audit                            |   ·    |            ·             |        ●         |       ·       |      ·       |
| Determinism lint (time in `src/`)          |   ·    |            ·             |        ●         |       ·       |      ·       |
| Test lints: transport seam, suite health   |   ·    |            ●             |        ●         |       ·       |      ·       |
| Generated types fresh, schema drift        |   ·    |            ·             |     ● (3)(7)     | ◐ files issue |      ●       |
| Auth/scope alignment                       |   ·    |            ·             |        ●         |       ·       |      ·       |
| Export coverage (every export in a test)   |   ·    |            ·             |        ●         |       ·       |      ·       |
| Contract tests                             |   ·    |            ·             |      ● (3)       | ◐ weekly (4)  |      ·       |
| Fuzz, integration (mocked), type tests     |   ·    |            ·             |        ●         |       ·       |      ●       |
| Fault catalogue (transport faults)         |   ·    |            ·             |        ●         | ◐ files issue |      ·       |
| API surface diff (api-extractor)           |   ·    |            ·             |        ●         |       ·       |      ·       |
| Breaking API change declared (SemVer gate) |   ·    |            ·             |        ●         |       ·       |      ·       |
| Lockfile consistency                       |   ·    |            ·             |        ●         |       ·       |      ·       |
| publint, attw, size budgets (packed)       |   ·    |            ·             |        ●         |       ·       |      ·       |
| Consumer contract (packed tarball)         |   ·    |            ·             |    ● 18/20/22    |       ·       |      ·       |
| Documentation examples (packed tarball)    |   ·    |            ·             |        ●         |       ·       |      ·       |
| Dependency audit (diff-aware / allowlist)  |   ·    |            ·             | ● new advisories | ◐ files issue | ● ≥ high (6) |
| knip dead-code                             |   ·    |            ·             |        ◐         | ◐ weekly (4)  |      ◐       |
| CodeQL                                     |   ·    | ◐ protected branches (5) |      ◐ (5)       |   ◐ weekly    |      ·       |
| zizmor (workflow security)                 |   ·    |            ·             |        ●         |       ·       |      ·       |
| Benchmarks, head against base (8)          |   ·    |            ·             |        ●         | ◐ files issue |      ·       |
| Heap soak, 100 000 requests                |   ·    |            ·             |        ·         | ◐ files issue |      ·       |
| TypeDoc generation                         |   ·    |            ·             |        ●         |       ·       |      ●       |
| Unit + BDD, fails if any test was retried  |   ·    |            ·             |        ·         |       ◐       |      ·       |
| Stryker mutation                           |   ·    |            ·             | ● changed files  |       ◐       |      ·       |
| Stryker mutation                           |   ·    |            ·             |        ·         |       ◐       |      ·       |
| Type mutation (tsd ratchet)                |   ·    |            ·             |        ·         |       ◐       |      ·       |
| Schemathesis API fuzz                      |   ·    |            ·             |        ·         |       ◐       |      ·       |
| Payload fuzz, every endpoint (seeded)      |   ·    |            ·             |        ·         | ◐ files issue |      ·       |
| Missing-endpoint spec drift                |   ·    |            ·             |        ·         | ◐ files issue |      ·       |
| OpenSSF Scorecard                          |   ·    |            ·             |        ·         |   ◐ weekly    |      ·       |

1. The release job runs lint, format check and build. It has no separate `typecheck` step; `npm run build` runs `tsc --emitDeclarationOnly`, which type-checks `src/`.
2. `npm test` uses `jest.unit.config.cjs`, whose `testMatch` includes `tests/bdd/step-definitions/**/*.steps.ts` and `tests/bdd/specs/**/*.spec.ts`. Every push therefore runs the BDD scenarios as part of the unit suite.
3. Soft-skips with a warning annotation when ESI returns HTTP 503 (Tranquility downtime).
4. From `maintenance.yml`, which runs weekly and only uploads artifacts.
5. Runs and reports a status, but is outside `ci-success`, so a red result does not stop a merge. See [What actually blocks a merge](#what-actually-blocks-a-merge).
6. Threshold `high`, after removing advisories accepted in `scripts/audit-exceptions.json`.
7. Blocks only when the pull request touches the check's inputs; otherwise a failure is pre-existing drift, reported as a warning and left to the nightly `spec-drift` issue. See [`static-analysis`](#ciyml--cicd-pipeline).
8. The measurement runs only when the pull request touches `src/core/`, `src/schemas/`, `tests/benchmark/`, the bench scripts or `package-lock.json`; otherwise the job reports success with a summary line, so it stays inside `ci-success` without a job-level `if:`. A regression can be accepted with a reviewed `Performance-Accepted:` commit trailer; a comparison that could not be made (no baseline, too few rounds, a dropped task) cannot.

### What actually blocks a merge

Branch protection on `master` should require exactly one status check, with "require branch to be up to date" (`strict`) enabled:

| Required check | Workflow | Job          |
| -------------- | -------- | ------------ |
| `ci-success`   | `ci.yml` | `ci-success` |

`ci-success` fans in every job in `ci.yml`, so requiring any of those jobs individually adds nothing, and requiring a job that can be skipped or path-filtered is exactly what the gate exists to avoid. `Lint, Build & Test` from `ci-fast.yml` repeats `lint-and-build` and `unit-tests` for pushes before a pull request exists; it stays useful as early feedback but does not need to be required. The previous required checks were `Quality Gate` (renamed to `ci-success`) and `Lint, Build & Test`; branch protection has to be switched to `ci-success` when this change merges, or pull requests wait forever for a `Quality Gate` check that no longer reports.

Everything else on a pull request is visible but advisory: `codeql.yml` and `skill-eval.yml`. Force-pushes and branch deletion are disabled. Administrators are not yet included in enforcement (tracked under `SEC-07`).

`.github/CODEOWNERS` names `@lgriffin` as owner of everything, with explicit entries for the files automation rewrites (`package.json`, `package-lock.json`, `.github/`, `.zizmor.yml`, the release-please config and manifest). It only blocks a merge once "Require review from Code Owners" is enabled on `master`. With a single owner, that setting also means the owner cannot satisfy it on their own pull requests (GitHub does not let an author approve their own PR), so those need an admin override; on Dependabot and release-please PRs it requires the owner's approval.

---

## The requirements in practice

### GATE-01 · ci-success fans in every job, and a skip is a failure

`ci.yml` ends with a `ci-success` job that `needs` every other job in the workflow and runs with `if: always()`, so it reports even when an upstream job fails, is skipped or is cancelled. Without `if: always()` a failure upstream would skip the gate itself, and GitHub treats a skipped required check as passing.

The gate's rules (R10):

- Every needed job must finish with result `success`. `skipped`, `cancelled` and `failure` all fail the gate. There is no allow-list.
- No job in `ci.yml` has a job-level `if:`. A job that sometimes has nothing to do runs anyway and makes that decision in a step, with a notice or summary line, so it still reports `success` and the decision is visible: `lockfile` exits early for Dependabot, `dependency-audit` skips its steps when neither manifest changed. A job-level `if:` added later fails the gate whenever it evaluates false.
- Its first step reads the job ids from `ci.yml` (with `yq`) and compares them with the `needs` context. A job added to the workflow but not to `needs` fails the gate with its name, so nothing can run outside it.
- The results are read from `toJSON(needs)`, so adding a job means adding it to `needs` once. The step summary lists every job with its result, and the failure message names each job that was not green.

To add a blocking job: add the job, add its id to `ci-success.needs`. To add an advisory job, put it in a different workflow.

### GATE-02 · Every push gets fast feedback

`ci-fast.yml` runs on a push to any branch (`'**'`) on Node 20: ESLint, Prettier check, build, typecheck, `npm test`. It has one unconditional job, so it has no gate of its own; everything it checks is also inside `ci-success`.

### GATE-03 · The public API surface is diffed

The `api-surface` job in `ci.yml` builds, runs `npm run api-report` (api-extractor in local mode, which rewrites `etc/esi.ts.api.md`), and compares the result with the committed file. Both sides are CRLF-normalised and sorted so that Windows line endings and enum ordering do not cause false failures. A difference fails the job with "API surface report is out of date". Fix it by running `npm run api-report` locally and committing the report alongside the change.

The `api-semver` job then checks that the change is declared correctly for release-please. It compares the committed report between the base tip (`HEAD^1` of GitHub's merge commit) and the merge result (`HEAD`), line by line as multisets, ignoring blanks, `//` comments and warnings, `import` lines and bracket-only lines:

| Report change                       | Passes when                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| None                                | Always                                                                                                      |
| Lines only added                    | Always. A new export, member or overload ships as a minor or a patch                                        |
| A line lost (removal or signature)  | A commit in `HEAD^1..HEAD^2` is `type!:` or has a `BREAKING CHANGE:` footer, so release-please cuts a major |
| A line lost, and no consumer breaks | A commit carries an `API-Compatible: <why>` trailer; the reason is echoed in the log and step summary       |

The rule is deliberately strict. A changed line is often a widening (an optional parameter, a union member, an `implements` clause), and the gate cannot tell those from a narrowing, so the author states which it is. Replayed one commit at a time over the 34 non-merge commits in history that touched the report, 21 lost at least one line and none carried a marker: renames and removals such as `generatedSchemas`, the `ILogger` interface gaining required methods, and union widenings. What additions miss is a new required member on an interface consumers implement (`ILogger`, `ICircuitBreaker`, `IRetryStrategy`); that stays a reviewer call. The gate holds under both merge buttons. A merge commit keeps every commit, so a marker on any of them reaches release-please. A squash merge of several commits takes the pull request title as its commit title, so when the break is declared in a commit the title must be `type!:` too (verdict `breaking-title-undeclared` otherwise); a single-commit squash keeps that commit's message. The job reads the current title through the API, so after fixing it, re-running the failed jobs is enough. A squash message edited by hand in the merge dialog is outside what the gate can see. Only the root entry point is in the report, so the sub-path exports (`./schemas`, `./errors`, `./testing`, `./sde`) are not covered; the consumer contract test at least proves they still resolve.

Locally, on a feature branch: `npm run api-report:semver -- --base $(git merge-base origin/master HEAD) --pr-head HEAD`.

### GATE-04 · knip does not block anywhere yet

knip runs with `--no-exit-code` in `ci.yml` (`static-analysis`), `release.yml` (`validate-release`) and both local aggregate scripts, and without a flag but with `|| true` in `maintenance.yml`. It never fails a run. Configuration is `knip.json`. The charter's target is to drop `--no-exit-code` in `release.yml` once the baseline is clean.

### GATE-05 · Nightlies file issues

| Nightly                    | Finds a problem →                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nightly-audit.yml`        | Creates or comments on an issue labelled `security-audit`; auto-closes it when clean                                                                |
| `nightly-spec-drift.yml`   | Creates or comments on an issue labelled `spec-drift`; auto-closes it when clean. If the check itself fails, the same for `spec-drift-check-failed` |
| `nightly-mutation.yml`     | Fails if a directory is below its mutation floor; uploads `reports/mutation/`; caches the incremental report for pull requests                      |
| `nightly-benchmarks.yml`   | Creates or comments on an issue labelled `performance-nightly`; auto-closes it when the benchmarks and the soak both pass                           |
| `nightly-schemathesis.yml` | Uploads `reports/schemathesis/` as an artifact only                                                                                                 |
| `nightly-no-retry.yml`     | Fails the run and uploads `reports/no-retry/` as an artifact only                                                                                   |
| `nightly-interleave.yml`   | Fails the run; the log names the broken invariant and the replay command                                                                            |

The label-based workflows keep at most one open issue per label: if one is open they comment on it, otherwise they create one. Mutation, Schemathesis and the no-retry run still need an issue step (bead `esi-mbr`).
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `consumer-matrix-nightly.yml` | Fails the run only; the step summary names the failing cell |
Both issue-filing workflows keep at most one open issue per label: if one is open they comment on it, otherwise they create one. Mutation, Schemathesis, the no-retry run and the consumer matrix still need an issue step (bead `esi-mbr`).

### GATE-06 · Scripts resolve to files

Checked by `tests/tdd/scripts/package-scripts.test.ts`, so it runs in `npm test`: every path a script names under `scripts/`, `examples/` or `tests/`, and every runner config it is pointed at, must be a file that exists. Adding a script whose target is not there fails the suite and names the command that would break.

Two scripts used to point at files that were never committed — `sde:seed` at `scripts/seed-sde-test-db.ts` and `example:sde-cross-ref` at `examples/sde-cross-reference.ts`. Both are gone; the three SDE examples that do exist (`sde-fitting`, `sde-industry`, `sde-market-tree`) have scripts now.

---

## Local hooks

Installed by husky through the `prepare` script (which also runs a build after `npm install`).

| Hook         | Runs                                 | Effect                                                                                                                              |
| ------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit` | `npx lint-staged`                    | Staged `src/**/*.ts`: `eslint --fix` then `prettier --write`. Staged `tests/**/*.ts` and `*.{json,md,yml,yaml}`: `prettier --write` |
| `commit-msg` | `npx --no -- commitlint --edit "$1"` | Rejects messages that do not follow `@commitlint/config-conventional`                                                               |

Test files are formatted but not linted at commit. In CI they get two narrow lint configs, `lint:bdd-seam` and `lint:suite-health` ([Suite-health lint](#suite-health-lint)); the `src/` rule set does not apply to them yet (`TEST-09`). Commit types map to changelog sections through `release-please-config.json`; see [RELEASE.md](RELEASE.md).

---

## Workflows

All workflows live in `.github/workflows/`. Every action is pinned to a full commit SHA and every workflow declares read-only top-level permissions with per-job escalation (`SEC-03`, see [SECURITY.md](SECURITY.md)).

| Workflow                      | Trigger                                                          | Blocks                        | Output                                                      |
| ----------------------------- | ---------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `ci-fast.yml`                 | Push, any branch                                                 | No (covered by `ci-success`)  | Status                                                      |
| `ci.yml`                      | Pull request to `master`, `main`, `develop`                      | Required check (`ci-success`) | Status, coverage comment, artifacts                         |
| `package-checks.yml`          | Pull request to `master`, `main`                                 | No                            | Status, step summary                                        |
| `codeql.yml`                  | Push and PR to `master`/`main`/`develop`; Mondays 06:00 UTC      | No                            | Code scanning alerts                                        |
| `skill-eval.yml`              | PR touching `.claude/skills/**` or the skill eval runner; manual | No                            | Status, artifacts                                           |
| `nightly-schemathesis.yml`    | Daily 01:00 UTC; manual                                          | No                            | Artifact                                                    |
| `nightly-mutation.yml`        | Daily 02:00 UTC; manual                                          | No                            | Artifact                                                    |
| `nightly-no-retry.yml`        | Daily 03:00 UTC; manual                                          | No                            | Artifact                                                    |
| `nightly-interleave.yml`      | Daily 03:30 UTC; manual                                          | No                            | Status, step summary                                        |
| `nightly-audit.yml`           | Daily 05:00 UTC; manual                                          | No                            | `security-audit` issue                                      |
| `nightly-spec-drift.yml`      | Daily 06:00 UTC; manual                                          | No                            | `spec-drift` / `spec-drift-check-failed` issue              |
| `scorecard.yml`               | Mondays 04:00 UTC; manual; branch protection rule change         | No                            | SARIF to code scanning, public score                        |
| `maintenance.yml`             | Mondays 09:00 UTC; manual                                        | No                            | Artifacts                                                   |
| `release-please.yml`          | Push to `master`                                                 | —                             | Release PR, tag, GitHub release                             |
| `release.yml`                 | Tag `v*.*.*` pushed; GitHub release published                    | Publishing                    | npm, GitHub Packages, gh-pages, signed assets               |
| `nightly-benchmarks.yml`      | Daily 04:30 UTC; manual                                          | No                            | `performance-nightly` issue, `bench-data` branch, artifacts |
| ----------------------------- | ---------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `consumer-matrix-nightly.yml` | Daily 04:45 UTC; manual                                          | No                            | Status, step summary                                        |

### `ci-fast.yml` — CI Fast

One job, `Lint, Build & Test`, on Node 20: `npm ci`, `lint`, `lint:bdd-seam`, `lint:suite-health`, `format:check`, `build`, `typecheck`, `test`. It runs on every push to every branch, before a pull request exists. Everything it runs is repeated inside `ci-success`, so it is early feedback rather than a required check.

### `ci.yml` — CI/CD Pipeline

Runs on pull requests only. `lint-and-build` runs first; most test jobs `need` it. `pr-info`, `static-analysis`, `lockfile`, `dependency-audit`, `zizmor` and `mutation-pr` run in parallel with it. No job has a job-level `if:`, and every job is in the gate (GATE-01).

| Job (display name)                       | What it does                                                                                                                                                                                                                                                                                                                                                           | In gate |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----: |
| `pr-info` (PR Information)               | Writes title, author, branches and change size to the step summary. Runs on drafts too                                                                                                                                                                                                                                                                                 |   yes   |
| `lint-and-build` (Lint & Build)          | ESLint, `lint:determinism` (fetches master for its baseline), Prettier check, build, typecheck; uploads `dist/`                                                                                                                                                                                                                                                        |   yes   |
| `static-analysis` (Static Analysis)      | Regenerates types and diffs `src/types/generated/` and `esi-cache-ttls.generated.ts`; knip (non-blocking); `schema:drift:ci`; `validate:auth-scopes`. The two live-spec checks block only when the pull request touches their inputs (below)                                                                                                                           |   yes   |
| `unit-tests` (Unit Tests)                | `npm test` on Node 18, 20 and 22                                                                                                                                                                                                                                                                                                                                       |   yes   |
| `coverage` (Test Coverage)               | `npm run coverage` with the thresholds in `jest.unit.config.cjs`; posts or updates a PR comment; uploads `coverage/`                                                                                                                                                                                                                                                   |   yes   |
| `bdd-tests` (BDD Scenarios)              | `npm run bdd`                                                                                                                                                                                                                                                                                                                                                          |   yes   |
| `spec-audit` (EARS Spec Audit)           | `npm run spec:audit`; emits inline GitHub annotations when `GITHUB_ACTIONS` is set. Then `npm run lint:bdd-seam`, which fails on any scenario that spies on or reassigns an ESI client method, and `npm run lint:suite-health` ([Suite-health lint](#suite-health-lint))                                                                                               |   yes   |
| `contract-tests` (Contract Tests)        | `npm run contract:live` with `ESI_LIVE_TESTS=true`; fails if the variable is missing rather than skipping; soft-skips on 503                                                                                                                                                                                                                                           |   yes   |
| `fuzz-tests` (Fuzz Tests)                | `npm run fuzz` (fast-check)                                                                                                                                                                                                                                                                                                                                            |   yes   |
| `full-test-suite` (Complete Test Suite)  | `npm run test:all`: unit, BDD, mocked integration, fuzz, type tests                                                                                                                                                                                                                                                                                                    |   yes   |
| `consumer-contract` (Consumer Contract)  | `npm run test:consumer` on Node 18, 20 and 22: installs the `npm pack` tarball into a clean consumer, type-checks and runs it under CommonJS, ES module and bundler resolution, and checks every `exports` sub-path (see [TESTING.md](TESTING.md#consumer-contract))                                                                                                   |   yes   |
| `doc-examples` (Documentation Examples)  | `npm run test:docs-examples` on Node 20: type-checks every `ts` block in the README, guides and SDE docs against the packed tarball, runs the `runnable` ones and rejects the negative fixtures (see [DOCUMENTATION.md](DOCUMENTATION.md#documentation-examples-are-checked))                                                                                          |   yes   |
| `api-surface` (API Surface Check)        | Rebuilds `etc/esi.ts.api.md` and fails on a difference (GATE-03)                                                                                                                                                                                                                                                                                                       |   yes   |
| `api-semver` (API SemVer Gate)           | `npm run api-report:semver`: fails when the report lost or changed a line and no commit in the pull request is `type!:`, has a `BREAKING CHANGE:` footer or an `API-Compatible:` trailer, or when a declared break spans several commits and the pull request title is not `type!:` (GATE-03)                                                                          |   yes   |
| `lockfile` (Lockfile Consistency)        | `npm install --package-lock-only --ignore-scripts` then `git diff --exit-code package-lock.json`. For `dependabot[bot]` the step exits early with a notice; the job still reports success                                                                                                                                                                              |   yes   |
| `dependency-audit` (Dependency Audit)    | Audits base and head, fails only on advisories the PR introduces. Its steps skip when `package.json` and `package-lock.json` are unchanged; the job still reports success                                                                                                                                                                                              |   yes   |
| `documentation` (Generate Documentation) | Runs TypeDoc and uploads `docs-site/public/api/`, so a docs break is caught before `release.yml` runs `npm run docs`                                                                                                                                                                                                                                                   |   yes   |
| `zizmor` (Workflow Security (zizmor))    | `uvx zizmor@<pinned>` over `.github/` with `.zizmor.yml`, on every pull request                                                                                                                                                                                                                                                                                        |   yes   |
| `mutation-pr` (Mutation (changed files)) | `npm run mutation:fixture` (a known-weak fixture must leave survivors), then `npm run mutation:pr:gate`: incremental Stryker over changed `src/` files in scope, reusing the nightly cache; fails on a lowered floor in `mutation-thresholds.json`, or a touched directory below or without one. A cold run that runs out of time warns instead of failing — see below |   yes   |
| `ci-success` (ci-success)                | Fails unless every other job succeeded, and fails if a job is missing from its `needs` (GATE-01)                                                                                                                                                                                                                                                                       |    —    |
| `benchmarks` (Benchmarks (base vs head)) | Builds the base tip and the head on one runner and runs them in 10 alternating processes each (`npm run bench:ab`), then decides statistically (`npm run bench:compare`). Its steps skip when no hot path changed; the job still reports success. See [TESTING.md](TESTING.md#tier-25-benchmarks-and-the-heap-soak)                                                    |   yes   |
| `consumer-tarball` (Consumer Tarball)    | Packs the `dist/` uploaded by `lint-and-build` once, so every `consumer-contract` row installs the same bytes                                                                                                                                                                                                                                                          |   yes   |
| `package-lint` (Package Lint)            | `npm run lint:package -- --skip-build` then `npm run size`, on the `dist/` uploaded by `lint-and-build`: publint and attw on the `npm pack` tarball, and a size ceiling per `exports` sub-path (see [Package lint and size budgets](#package-lint-and-size-budgets))                                                                                                   |   yes   |

The generated-types, schema-drift and contract steps all call the live ESI spec. Each captures its log and, if the failure contains `HTTP 503`, downgrades it to a `::warning::` and passes (`TEST-08`).

Like `npm audit`, the generated-types and schema-drift checks report the state of the world: CCP changing ESI turns them red on every open pull request. `static-analysis` therefore first compares the merge commit with its base tip (`HEAD^1`) and blocks on each check only when the pull request touches that check's inputs:

| Check                     | Inputs                                                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generated types freshness | `scripts/generate-esi-types.ts`, `src/types/generated/`, `src/core/endpoints/esi-cache-ttls.generated.ts`                                                                                                           |
| Schema drift              | `scripts/generate-schema-drift-report.ts`, `scripts/schema-drift-core.ts`, `scripts/schema-drift-baseline.json`, `scripts/schema-drift-exceptions.json`, `src/schemas/`, `src/core/endpoints/`, `package-lock.json` |

Otherwise the result would be the same on the base branch, so a failure is reported as a `::warning::` and a step-summary line, and the job passes; `nightly-spec-drift.yml` files that drift as an issue. Both steps now run with `pipefail`, so a generator or drift script that fails outright is reported rather than masked by `tee`. The contract tests are not diff-aware yet. `release.yml` still blocks on both checks unconditionally. Schema drift that is already tracked turns neither red: it is listed in a ratcheted baseline, described under [Schema drift](#schema-drift).

The lockfile check skips Dependabot because Dependabot's npm version produces byte-level lockfile differences. When regenerating a lockfile locally, use the npm major that CI uses so the file round-trips.

### `codeql.yml` — CodeQL

GitHub CodeQL analysis for `javascript-typescript` on pushes and pull requests to `master`, `main` and `develop`, and weekly on Mondays at 06:00 UTC. Findings go to the repository's code scanning alerts. Not a required check.

### zizmor — Workflow Security

The `zizmor` job in `ci.yml` runs `zizmor` (pinned version, via `uvx`) over `.github/` with `.zizmor.yml` on every pull request, inside `ci-success`. It used to live in a separate `zizmor.yml` that only ran when workflow files changed; a path-filtered workflow cannot be a required check, so it never blocked a merge.

`.zizmor.yml` requires a justification comment on every ignore and currently has none. The three it used to carry were resolved: `cache-poisoning` on `release.yml` by setting `package-manager-cache: false` on its `setup-node` steps, `dependabot-cooldown` by configuring a Dependabot cooldown, and `use-trusted-publishing` was producing no finding.

### `skill-eval.yml` — Skill Eval

Gates changes to agent skills (`R14`). `deterministic` unit-tests the judges, fails if a skill's `SKILL.md` changed without a `skill.version` bump in its `eval/eval.yaml`, and runs `scripts/skill-eval.ts` offline against each case's recorded outputs: one `shall` per Rule, scenarios under Rules, no `spyOn(client…)`, transport-seam mocking, step bindings, and the spec audit. `live` then runs the native `claude plugin eval` suite through the same script, which enforces the manifest's per-case score, LLM-grader `min_mean`, deterministic pass rate and `max_cost_usd` budget. `live` fails rather than skips when the `ANTHROPIC_API_KEY` secret is absent — including on fork PRs, where a maintainer re-runs it via `workflow_dispatch`. Not a required check yet.

### `nightly-schemathesis.yml` — Nightly Schemathesis API Fuzz

Daily at 01:00 UTC on Node 22 with a 40-minute timeout. Pulls a digest-pinned Schemathesis image and runs `scripts/run-schemathesis.sh`, which downloads the ESI spec, strips security requirements, serves it with a Prism mock on port 4010, and fuzzes it. Schemathesis exits non-zero for both schema violations and network errors, so the script parses the JUnit report and fails only when it records real failures. The report is uploaded as `schemathesis-report`. No issue is filed.

### `nightly-no-retry.yml` — Nightly No-Retry Test Run

Daily at 03:00 UTC on Node 20 with a 60-minute timeout. Runs the `npm test` suite (`jest.unit.config.cjs`: `tests/tdd` plus the BDD step definitions) and writes Jest's JSON report. No Jest retries are configured anywhere, so there is nothing to switch off; instead the job reads the report and fails, naming each test, if any test was invoked more than once. A future `jest.retryTimes` that hides a flaky test therefore turns this run red even while pull request runs stay green. A missing or unparsable report also fails it. The report is uploaded as `no-retry-report`, and the step summary lists pass and fail counts and the failed tests. No issue is filed.

Test order within each file is randomised (`jest --randomize`), so a test that passes only because of what ran before it in the same file fails here rather than hiding behind declaration order. Each run picks a new seed, or uses the `seed` input of a manual dispatch. The seed appears as a notice annotation and in the job log, the step summary, and `seed.txt` in the uploaded report; `npx jest --config jest.unit.config.cjs --randomize --seed=<seed>` replays the same order locally.

### `nightly-interleave.yml` — Nightly Interleaving Run

Daily at 03:30 UTC on Node 20 with a 60-minute timeout. Runs the composition tier (`tests/tdd/composition`) with `ESI_INTERLEAVE_MODE=random`: each scenario starts four overlapping calls and runs `ESI_INTERLEAVE_RUNS` schedules (5000 by default) chosen by a PRNG seeded with `ESI_INTERLEAVE_SEED`. Pull requests already explore every schedule of two and three calls inside `npm test`. Each run picks a new seed, or uses the `seed` input of a manual dispatch; the seed is a notice annotation and in the step summary with the command that replays the run, and a failing schedule prints its own `ESI_INTERLEAVE_REPLAY` command. No issue is filed. See [TESTING.md](TESTING.md#composition-and-concurrency).

### `consumer-matrix-nightly.yml` — Nightly Consumer Matrix

Daily at 04:45 UTC. Builds, packs, and runs `npm run test:consumer -- --tarball` on the rows pull requests skip: TypeScript `next` and `latest` on Node `lts/*` and `current`, and the oldest supported TypeScript on `current`. A failure is a toolchain release breaking a consumer, not a pull request; the job title and step summary name the Node and TypeScript versions and the failing cell. No issue is filed.

### `nightly-mutation.yml` — Nightly Mutation Testing

Daily at 02:00 UTC on Node 22 with a 240-minute timeout per job. Runs `npm run mutation -- --incremental --force` (Stryker, `stryker.config.mjs`) over `src/core/**` excluding endpoint definitions and pure interface files, as one job per shard in `mutation-unit-shards.json` — a single job stopped finishing inside the timeout as the suite grew. Each shard saves its own incremental file under `stryker-unit-shard-<name>-<sha>-<run id>`; `mutation-pr` in `ci.yml` does not read those yet (`esi-23g.55`). A `mutation-ratchet` job merges the shard reports before scoring. There is no global break threshold: `npm run mutation:ratchet` scores every directory against `mutation-thresholds.json` and fails if one is below its floor or has none. The HTML, JSON and incremental reports are uploaded as `mutation-report` whether or not it passed. No issue is filed. Details in [MUTATION-TESTING.md](MUTATION-TESTING.md).

A matrix of jobs, `bdd-mutation-testing` (300-minute timeout each), runs `npm run mutation:bdd` (`stryker.bdd.config.mjs`) once per shard in `mutation-bdd-shards.json`: all of `src/` except generated files, types, interfaces and test helpers, with only the BDD step definitions as the test suite, so a surviving mutant is a behaviour no Rule protects. It is sharded because the single job it replaces never finished. `fail-fast` is off, so one slow shard does not hide the others' scores. There is no global break threshold.

`bdd-mutation-ratchet` then downloads every shard's report, rebuilds one report with `npm run mutation:bdd:merge` and scores it with `npm run mutation:bdd:ratchet` per directory (`src/<area>`, and `src/core/<sub>` inside core), writing the table to the step summary. The merge fails on a shard that is missing, mutated nothing, or overlaps another, because each of those would score a directory on a partial run. Every scored directory must have an entry in `mutation-bdd-thresholds.json`: the file starts empty, so the ratchet fails until a completed run seeds it, which is the point — a ratchet with nothing in it gates nothing. Dispatching the workflow with `seed_bdd_thresholds` prints and uploads the file raised to that run's scores; `-- --update` never lowers a floor and nothing is committed automatically. The merged report is uploaded as `bdd-mutation-report`.

A third job, `type-mutation-testing` (45-minute timeout), is the type-level equivalent. After `npm run build` it runs `npm run test:type-mutation -- --ratchet` (`scripts/type-mutation.ts`): each mutant is one edit to a copy of `dist/**/*.d.ts` (return type to `unknown`, `readonly` dropped, optional to required and back, a union member dropped, a literal widened, an overload removed, a generic constraint to `unknown`), found with the TypeScript compiler API in the declarations the `exports` entries reach, and the tsd suite runs against it with its `src` imports pointed at the copy. A mutant is killed when a type test fails, invalid (excluded from the score, like Stryker's compile errors) when the mutated declarations no longer compile, and survives when tsd passes. At most 500 mutants run, shared between entry points and ranked by a seeded hash of each mutant's id (seed 1, printed), so the sample is reproducible and each added mutant displaces at most one sampled mutant rather than reshuffling it. The run fails if an entry point scores below its floor in `scripts/type-mutation-thresholds.json`, if a floor names an entry point that scored nothing, or if the file lowers or drops a floor relative to `origin/master` (fetched explicitly; no base ref fails closed). The score table and every surviving mutant (file, symbol, operator, before and after) go to the step summary and to the `type-mutation-report` artifact. No issue is filed.

### `nightly-benchmarks.yml` — Nightly Benchmarks and Heap Soak

Daily at 04:30 UTC on Node 20. Three parts:

- `benchmarks` builds the commit named in `reference.json` on the `bench-data` branch alongside master and runs both in 15 alternating processes (45-minute timeout). Pull requests only compare against their own base, so a series of slowdowns each below the threshold would pass one at a time; the pinned reference catches the sum. With no `bench-data` branch the run bootstraps: it measures and records the reference. A branch that exists but holds no usable `reference.json`, or a `git ls-remote` that fails for any other reason, fails the job.
- `soak` first runs `npm run soak -- --inject-leak --expect-fail`, which passes only if the analysis flags a client that retains every response, then the real 100 000-request soak.
- `publish` appends the night's medians to `history.jsonl` on `bench-data` and moves `reference.json` forward only on a bootstrap, on an improvement with no regression, or when a maintainer dispatched the workflow with `accept_reference` after reviewing an accepted slowdown. That is the ratchet: the reference only moves towards faster code unless someone says otherwise. It pushes with the job's `contents: write` token supplied through `GIT_CONFIG_*` environment variables, so no credential is written to disk.
- `report` keeps one open issue labelled `performance-nightly` while either job fails, and closes it when both pass.

### `nightly-audit.yml` — Nightly Security Audit

Daily at 05:00 UTC. Runs `npm audit --json`, filters out accepted advisories with `scripts/audit-check.ts --filter` (which also hard-fails on an expired acceptance), and counts what remains by severity. If anything remains it ensures the `security-audit` label exists, then creates an issue with a severity table, a per-package table and resolution steps, or comments the same tables on the open one. If nothing remains it closes any open `security-audit` issue with a comment. See [Dependency audit](#dependency-audit).

### `nightly-spec-drift.yml` — Nightly ESI Spec Drift

Daily at 06:00 UTC. Detects three kinds of drift between the repository and the live ESI spec and reports them in one issue. Described in full under [Nightly spec drift](#nightly-spec-drift).

### `scorecard.yml` — OSSF Scorecard

Weekly on Mondays at 04:00 UTC, on manual dispatch, and whenever a branch protection rule changes. Runs `ossf/scorecard-action`, publishes the results to the public Scorecard API, and uploads the SARIF to code scanning. Scorecard scores the controls described in [SECURITY.md](SECURITY.md).

### `maintenance.yml` — Maintenance & Security

Weekly on Mondays at 09:00 UTC, and manually. Every job produces a report artifact and none of them fail on findings:

| Job                 | Report                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Dependency Updates  | `npm outdated` → `dependency-report.md`, `outdated.json`                                                       |
| Security Audit      | `npm audit`, then `--audit-level=high` → `security-report.md` and JSON (does not apply the allowlist)          |
| Code Quality        | lint, format check and knip output captured to files; `npm run coverage` (this step can fail the job)          |
| Health Check        | Build, `npm run health-check` against live ESI, dist size and versions → `health-report.md`                    |
| ESI Spec Drift      | `contract:snapshot`, live contract tests, `contract:diff` (oasdiff breaking changes) → `spec-drift-summary.md` |
| Maintenance Summary | Result of each job → `maintenance-summary.md`                                                                  |

Much of this overlaps the nightlies, which file issues rather than artifacts. It is the one place the oasdiff breaking-change report runs in CI.

### `release-please.yml` and `release.yml`

`release-please.yml` runs on every push to `master`, maintains the release pull request from conventional commits, and creates the tag and GitHub release when that pull request merges.

`release.yml` runs on the `v*.*.*` tag push and again when the GitHub release is published:

| Job                       | Runs on           | What it does                                                                                                                                                                  |
| ------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate-release`        | both triggers     | lint, format check, knip (non-blocking), `audit:check`, `CHANGELOG.md` has `## [<version>]`, build, `schema:drift:ci`, generated-types freshness, `test:all`, `docs`          |
| `publish-npm`             | release published | `npm publish --provenance` to npmjs.org                                                                                                                                       |
| `publish-github`          | release published | `npm publish --provenance` to GitHub Packages                                                                                                                                 |
| `deploy-docs`             | both triggers     | TypeDoc to gh-pages from `docs-site/public/api`                                                                                                                               |
| `create-assets`           | both triggers     | `npm pack`, docs archive, `checksums.txt`; no OIDC permission                                                                                                                 |
| `consumer-contract`       | both triggers     | `npm run test:consumer -- --tarball` on the tarball `create-assets` packed, same four rows as `ci.yml`; `publish-npm`, `publish-github` and `sign-and-publish-assets` need it |
| `sign-and-publish-assets` | release published | Keyless cosign signatures, uploads assets to the release; the only job that can mint an OIDC token for signing                                                                |
| `notify-success`          | after publish     | Log line when the npm publish succeeded                                                                                                                                       |

Every publishing job `needs` `validate-release` (`REL-02`). Unlike the PR path, the release gate does not run `spec:audit`, `validate:auth-scopes`, contract tests or the API surface check. The procedure, versioning and support window are in [RELEASE.md](RELEASE.md).

Secrets: `NPM_TOKEN` for npmjs.org; `GITHUB_TOKEN` (automatic) for GitHub Packages, gh-pages, release uploads and issue filing.

### Dependabot

Not a workflow, but it drives a lot of CI traffic. `.github/dependabot.yml` opens npm updates weekly on Monday (prefix `chore(deps):`, grouped into minor-and-patch, eslint majors and jest majors, at most five open) and GitHub Actions updates weekly on Wednesday (prefix `chore(ci):`, CodeQL actions grouped). This is what keeps the pinned action SHAs current.

Both ecosystems have a `cooldown` (R13): a version has to have been public for a number of days before Dependabot proposes it, so a compromised or broken release has time to be caught upstream first. npm uses 7 days by default, 14 for majors, 7 for minors and 3 for patches. GitHub Actions uses 7 days for every update, including digest bumps, because that ecosystem has no semver-specific keys. Cooldown does not delay Dependabot security updates.

There is no npm-side equivalent in `.npmrc`. npm's `min-release-age` needs npm 11.10 or later; the npm 10 bundled with Node 20 in CI accepts the key without a warning and ignores it (checked locally: npm 10.9.9 installed a day-old release that npm 11 refused). The reason is recorded in `dependabot.yml`; add the setting once CI runs npm 11.10 or later.

There is no auto-merge workflow for Dependabot pull requests; each one is merged by hand after `ci-success` passes.

---

## Nightly spec drift

`nightly-spec-drift.yml` is how the project learns that CCP changed ESI without anyone noticing. It runs three checks against the live spec, combines the results, and keeps one labelled issue current.

### What it checks

| Step                      | Command                                                                                                                  | Drift when                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Missing endpoints         | `npx ts-node scripts/check-spec-drift.ts --latest`                                                                       | Exit code `1`: the spec has an endpoint no `*Endpoints.ts` file declares. Exit `2` or unparsable JSON fails the run |
| Generated types freshness | `npm run generate:types`, then `git diff` on `src/types/generated/` and `src/core/endpoints/esi-cache-ttls.generated.ts` | The regenerated files differ from `master`, or generation failed for a reason other than 503                        |
| Schema drift              | `npm run schema:drift:ci`                                                                                                | Drift not in `scripts/schema-drift-baseline.json`, a baseline entry that no longer occurs, or a broken check        |

A 503 from ESI on the second or third step is logged as a warning and treated as no drift. The schema step runs with `pipefail`; before it did, it read the exit status of `tee` and never registered drift.

The missing-endpoint check works in five steps:

1. Fetch the newest compatibility date from `https://esi.evetech.net/meta/compatibility-dates`.
2. Download the OpenAPI spec for that date from `https://esi.evetech.net/meta/openapi.json?compatibility_date=<date>`.
3. Parse the endpoint definitions in `src/core/endpoints/*Endpoints.ts`.
4. Compare: endpoints in the spec but not the codebase are `missing`; the reverse are `extra`.
5. Hand the JSON report to the workflow, which builds the issue.

### The issue

If any of the three checks found drift, the workflow ensures the `spec-drift` label exists and builds one body with a section per finding: a method/path table of missing endpoints with the compatibility date, the `git diff --stat` of stale generated files, and the last 50 lines of the schema drift report. The title names what was found, for example `spec-drift: 3 missing endpoints, schema drift`.

- No open `spec-drift` issue: a new one is created.
- An open one exists: the new body is added as a comment.
- No drift at all: any open `spec-drift` issue is closed automatically with a dated comment.

If `check-spec-drift` itself fails (the endpoint script exits `2`, the report is unreadable, `npm ci` or a `gh` call fails), the `report-check-failure` job opens an issue titled `spec-drift: nightly check failed` with the label `spec-drift-check-failed` and a link to the run, or comments on the open one. The next run that completes closes it. A cancelled run does neither.

The run's step summary also carries the compatibility date, the three flags and the raw drift report.

### Running it locally

```bash
# Against the newest compatibility date
npx ts-node scripts/check-spec-drift.ts --latest

# Against a specific date
npx ts-node scripts/check-spec-drift.ts --compatibility-date=2026-08-04

# No flag: the script's own baseline date, 2025-12-16
npx ts-node scripts/check-spec-drift.ts
```

The report goes to stdout:

```json
{
  "compatibilityDate": "2026-08-04",
  "specEndpointCount": 225,
  "codebaseEndpointCount": 208,
  "matchedCount": 198,
  "missing": [
    {
      "tag": "Military Campaigns",
      "method": "GET",
      "path": "/military-campaigns"
    }
  ],
  "extra": [
    {
      "method": "GET",
      "path": "mercenary/dens",
      "name": "getMercenaryDens",
      "file": "mercenaryEndpoints.ts"
    }
  ]
}
```

Exit codes: `0` no missing endpoints, `1` missing endpoints found, `2` the check itself failed.

The other two checks run locally as `npm run generate:types` followed by `git diff`, and `npm run schema:drift` (report only) or `npm run schema:drift:ci` (non-zero exit on drift outside the baseline).

### Compatibility dates

CCP versions breaking changes to ESI with compatibility dates. A new endpoint only appears in a spec requested with a date at or after its introduction, so the nightly uses `--latest`. The available dates are listed at `https://esi.evetech.net/meta/compatibility-dates`.

`COMPATIBILITY_DATE` in `src/core/constants.ts` is the one the client sends on every request, and `generate-esi-types.ts` now defaults to it rather than keeping its own copy. Each file it writes records the date in its header, and `tests/tdd/scripts/generated-spec-date.test.ts` fails when a header stops matching the constant. That pairing is what was missing: the two dates had drifted to 2026-05-19 and 2025-12-16, so twelve routes ESI added in between had no cache TTL and were revalidated on every call, and no committed file said which spec the artefacts came from (esi-23g.31).

The other spec-reading tools still pin `2025-12-16` independently — `generate-schema-drift-report.ts`, `generate-okf.ts`, `generate-endpoint-scaffold.ts`, `snapshot-openapi.ts`, `validate-esi-endpoints.ts`, `create-token.ts`, `run-schemathesis.sh`, `tests/contract/helpers.ts` and `redocly.yaml`. Moving those moves their baselines too (`schema-drift-baseline.json` most of all), so each is its own change; `esi-v2s.25` tracks the drift report's.

### Responding to drift

1. Read the issue and decide which findings are real gaps and which are intentional.
2. Check the [ESI changelog](https://esi.evetech.net/meta/changelog) and the [developer blog](https://developers.eveonline.com/blog) for context.
3. For stale generated types, run `npm run generate:types` and commit the result on its own branch.
4. For missing endpoints, file a bead per coherent group and follow the "add an endpoint" walkthrough in [DESIGN-RULES.md](DESIGN-RULES.md).
5. For schema drift, fix the schema and remove its baseline entries in the same change, or remove the entries whose drift CCP fixed. See [Schema drift](#schema-drift).
6. The issue closes itself on the first clean nightly after the fixes merge. Close it by hand only if a gap is being skipped on purpose.

Related scripts:

| Script                                    | Purpose                                                     |
| ----------------------------------------- | ----------------------------------------------------------- |
| `scripts/check-spec-drift.ts`             | JSON missing/extra endpoint report (nightly)                |
| `scripts/validate-esi-endpoints.ts`       | Human-readable endpoint validation (`npm run validate:esi`) |
| `scripts/generate-esi-types.ts`           | Regenerate types, TTLs, rate limits and scopes              |
| `scripts/generate-schema-drift-report.ts` | Zod schema versus spec field comparison                     |
| `scripts/snapshot-openapi.ts`             | Snapshot the spec for contract tests                        |

---

## Schema drift

`npm run schema:drift` compares the Zod `responseSchema` of every endpoint definition with the response body the ESI spec defines for that operation, pinned to `compatibility_date=2025-12-16`. The comparison lives in `scripts/schema-drift-core.ts`, with unit tests in `tests/tdd/schema-drift/`; the CLI is `scripts/generate-schema-drift-report.ts`.

### How an endpoint finds its spec operation

The script loads `src/core/endpoints/*Endpoints.ts` as modules, so each definition's path pairs with its own `responseSchema`, inline schemas included. Definition paths and spec paths are spelled differently (`corporations/{corporationId}/projects/` against `/corporations/{corporation_id}/projects`), so both reduce to a shape before matching:

- exactly one leading slash and no trailing slash;
- every `{parameter}` becomes `{}`, so parameters match by position and never by name;
- literal segments keep their case.

The method must match too. A mapping that finds no operation is listed as `path_not_in_spec`, `method_not_in_spec`, or `ambiguous_in_spec` when its shape matches two spec paths. One that matches an operation with no JSON 2xx body is listed as not compared. Nothing is skipped silently.

### What counts as drift

The schema and the first 2xx JSON body are walked together through objects and arrays, following `$ref` and `allOf`. Each finding has a field path such as `[].bidder_id` or `details.expires` (`(response)` for the body itself) and one of these kinds:

| Kind                            | Meaning                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `required_not_in_spec`          | The schema requires a field the spec does not define: every body fails        |
| `required_but_optional_in_spec` | The schema requires a field ESI may omit: a body without it fails             |
| `type_mismatch`                 | Object, array, string, number or boolean disagree                             |
| `optional_but_required_in_spec` | The schema is looser than the spec                                            |
| `missing_from_schema`           | The spec defines a field the schema does not declare (`looseObject` keeps it) |
| `optional_not_in_spec`          | The schema declares an optional field the spec does not define                |

`.nullable()` counts as present and `.default()` as optional. Unions of one scalar kind (`esiEnum`), records, free-form objects and `oneOf`/`anyOf` are not compared further.

### A check that compares nothing fails

The script exits `2`, in report mode as well as under `--ci`, when no schema was compared or when more than 25% of mappings resolve to no spec operation. Before this guard the report said "154 schemas checked, 0 drift" while matching no path at all (`esi-v2s.22`).

### The known-drift baseline

`scripts/schema-drift-baseline.json` lists drift that is tracked but not yet fixed. Keys are `<endpoint> <field> <kind>` under `findings` and `<endpoint>` under `unmatched`; each value is the bead that tracks the fix, and an entry without a bead id is rejected. The seed from `master` holds 203 findings on 52 endpoints (`esi-v2s.10`, `.12`, `.14` and `.21`) and 28 endpoints newer than the pinned compatibility date (`esi-v2s.25`).

`--ci` exits `1` when:

1. a finding or unmatched endpoint is not in the baseline: fix the schema;
2. a baseline entry no longer occurs, because the schema or ESI was fixed: remove the entry;
3. the baseline has an entry the base ref's copy lacks: the baseline only shrinks.

The base ref is `SCHEMA_DRIFT_BASE_REF`, else `origin/master`, else `master`. When none resolves, every entry reads as an addition and the check fails closed. When the ref resolves but has no baseline file, the change is the one introducing it and additions are allowed.

| Where                            | Base ref        | Effect                                                                                   |
| -------------------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| `ci.yml` `static-analysis`       | `HEAD^1`        | The pull request's base tip, fetched by `fetch-depth: 2`; blocks only when inputs change |
| `release.yml` `validate-release` | `HEAD`          | New or stale drift blocks the release; shrink-only is enforced on pull requests          |
| `nightly-spec-drift.yml`         | `HEAD`          | New drift and stale entries go into the `spec-drift` issue                               |
| Local                            | `origin/master` | Fetch first, or set `SCHEMA_DRIFT_BASE_REF`                                              |

A pull request that fixes drift therefore removes its entries in the same change, and one that changes a schema so a finding changes kind fixes it rather than re-baselining it. `npm run schema:drift -- --update-baseline` rewrites the file from the current findings and keeps existing bead ids; new entries need `--bead=esi-<id>` and still fail the ratchet on a pull request, so baselining drift that CCP introduced needs a maintainer's decision, as with any ratchet exception.

`scripts/schema-drift-exceptions.json` is separate and not ratcheted: schema name to field paths, relative to that schema, accepted as permanent deviations. An entry that suppresses nothing prints a warning.

---

## Export coverage

Line and branch coverage only see code that something runs, so an exported helper that no test calls, or an exported type no test names, never shows up in them. `npm run test:export-coverage` asks the question of the public surface instead: for each `package.json` `exports` entry, which exported names does no test reference? The analysis is in `scripts/export-coverage-core.ts`, the CLI in `scripts/export-coverage.ts`, and its self-tests and fixture project in `tests/tdd/export-coverage/`. `ci.yml` runs it with `--ci` in `static-analysis`.

- **The surface** is what the TypeScript checker reports as the exports of each entry's source (`./dist/<name>.d.ts`, and the `import` condition's `./dist/<name>.d.mts`, map to `src/<name>.ts`), following named, type-only, `export *` and `export * as` re-exports. The entry list must match `tsup.config.ts`, or the check exits `2`.
- **A reference** is an identifier in a `.ts`, `.mts` or `.cts` file under `tests/` that the checker resolves to the same declaration, whether imported from the entry, from the source module directly, or by package name (the consumer contract tests). Files under `fixtures`, `step-fixtures`, `snapshots` and `__snapshots__` directories do not count. Neither does a name in a comment or string, or an import that is never used. Type tests in `tests/typetests` count.
- **Classes** count as referenced when the class is; members are not checked individually.

Report mode prints the unreferenced names by entry point and exits `0`. `--ci` exits `1` when an unreferenced export is not in `scripts/export-coverage-baseline.json`, when a baseline entry is now referenced or no longer exported, or when the baseline has an entry the base ref's copy lacks. The base ref is `EXPORT_COVERAGE_BASE_REF` (`HEAD^1` in `static-analysis`), else `origin/master`, else `master`; when none resolves the check fails closed, and when the ref has no baseline file yet additions are allowed, as for [schema drift](#the-known-drift-baseline). `--write-baseline` rewrites the file from today's result, and the ratchet still rejects anything it adds.

The seed baseline has 424 entries: `.` 197 of 366 exports, `./schemas` 46 of 201, `./errors` 1 of 24, `./testing` 0 of 1, `./sde` 90 of 123 and `./sde/memory` 90 of 122. Most are response and SDE row types; the runtime functions among them are tracked in `esi-23g.19`.

## Suite-health lint

`npm run lint:suite-health` lints every `.ts`, `.mts` and `.cts` file under `tests/` except the `fixtures/` and `step-fixtures/` trees, which break rules on purpose. It is Testing Runway tier N: it catches the decay that turns a green suite into a decorative one. It is not the `src/` rule set; the config and rules are in `eslint.suite-health.rules.cjs`, loaded by `eslint.suite-health.config.mjs`.

| Rule                                      | Rejects                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jest/no-focused-tests`                   | `.only`, `fit`, `fdescribe`                                                                                                                                                                                                                                                                                   |
| `suite-health/no-focused-scenario`        | `test.only` on the scenario parameter of a jest-cucumber `defineFeature` callback, which `eslint-plugin-jest` does not see as Jest's `test`                                                                                                                                                                   |
| `jest/no-disabled-tests`                  | `.skip`, `xit`, `xtest`, `xdescribe`, `pending()`, a test without a callback                                                                                                                                                                                                                                  |
| `suite-health/no-disabled-scenario`       | `test.skip` and `test.todo` on a `defineFeature` scenario, and Jest's `it.todo` / `test.todo`                                                                                                                                                                                                                 |
| `jest/expect-expect`                      | A test with no assertion. `expect`, any `expect*` helper (`expectEsiError`, tsd's `expectType`) and `fc.assert` count. Under `tests/bdd` a `Then` step file registration and a legacy `then` step are checked the same way; spec files register no callbacks, so a scenario is covered through its Then steps |
| `suite-health/no-swallowed-assertion`     | A `try` block containing an assertion whose `catch` neither rethrows nor asserts                                                                                                                                                                                                                              |
| `suite-health/no-unrestored-console-mock` | `jest.spyOn(console, m).mockImplementation(...)` or `.mockReturnValue(...)` not restored in the file (no `mockRestore()` on the spy, no `jest.restoreAllMocks()`), and `console.m = jest.fn()` never reassigned                                                                                               |

Every rule is an error and there is no baseline: the initial run found no focused, skipped, swallowed or silenced tests, and the 18 tests without an assertion were fixed. A conditional skip (`LIVE ? describe : describe.skip`) is not flagged; that is how the live tiers opt out. `describeClientErrors` needs no configuration: its `it` blocks are linted where the helper defines them. `tests/bdd/support/binder.ts` is exempt from `jest/expect-expect`, because the test it registers per scenario asserts through the Then steps.

`tests/tdd/suite-health/suite-health-lint.test.ts` loads the same config and lints one fixture per rule, as if it lived at a real test path, and requires exactly the expected findings, plus a compliant fixture that must produce none. It runs in `npm test`, so a rule that stops firing fails the unit suite. The script runs in `ci-fast.yml` on every push and in the `spec-audit` job inside `ci-success`.

## Package lint and size budgets

The `package-lint` job in `ci.yml` checks what `npm publish` would ship, statically, before the consumer contract installs and runs it. It downloads the `dist/` that `lint-and-build` uploaded rather than building again, packs it once, and runs two commands.

### `npm run lint:package`: publint and Are The Types Wrong

`scripts/package-lint.ts` builds (unless `--skip-build`), runs `npm pack`, and hands the tarball to both tools; `--tarball <path>` lints one that is already packed. The logic lives in `scripts/package-lint-core.ts`.

| Tool                            | Blocks on                                               | Does not block                 |
| ------------------------------- | ------------------------------------------------------- | ------------------------------ |
| publint (API, on the tarball)   | Errors and warnings                                     | Suggestions, which are printed |
| attw (`--format json`, tarball) | Any problem under `node16-cjs`, `node16-esm`, `bundler` | `node10` (below)               |

`node10` is out of the profile on purpose. It ignores `exports`, so no sub-path other than `.` resolves under it; `engines.node` is `>=18`, where every runtime reads `exports`; and TypeScript deprecated `moduleResolution: node10`, while this repository builds with TypeScript 6. The root entry still resolves under `node10` through `main` and `types`, but the check makes no promise about it. The advisory `package-checks.yml` this job replaces ignored `no-resolution` for that reason and `false-cjs` across the board; the first is now out of profile and the second is fixed (`esi-23g.29`, below).

Known findings are in `scripts/package-lint-baseline.json`, keyed `<tool>:<code> <where>` (for example `attw:FalseCJS ./errors node16-esm`) with the tracking bead as the value. It is a ratchet like the others: a blocking finding outside the baseline fails, an entry that no longer occurs fails, and an entry the base ref's copy lacks fails. The base ref is `PACKAGE_LINT_BASE_REF`, else `origin/master`, else `master`; the job fetches master first, and with no ref the check fails closed. The baseline is empty. Its last seven entries were one defect, `esi-23g.29`: every `import` condition resolved to a `.d.ts` in a `type: commonjs` package, so TypeScript read the ES module entry points as CommonJS ("Masquerading as CJS"). The build now writes `.d.mts` declarations for the `import` condition (`scripts/esm-declarations.cjs`).

### `npm run size`: a budget per sub-path

`.size-limit.cjs` holds a budget for the ESM build and one for the CJS build of each `exports` sub-path (`.`, `./schemas`, `./errors`, `./testing`, `./sde`, `./sde/memory`). `scripts/size-limit-checks.cjs` derives the checks from the `exports` map, so a new sub-path without a budget, or a budget for a removed one, fails before anything is measured.
Each check bundles the entry with esbuild the way a consumer loading that sub-path would: the entry plus every shared `chunk-*` file it imports (tsup builds with `splitting: true`), minified and uncompressed, for `platform: node`. `dependencies` and `peerDependencies` (`pino`, `zod`, `better-sqlite3`, `js-yaml`, `adm-zip`) and Node built-ins stay external, so the number is this package's own code, and a helper that starts inlining a dependency shows up. Budgets are the size measured at 9.9.0 plus 5%; each line's comment records the measurement.
To raise a budget, run `npm run build && npm run size`, set the new measurement plus 5%, update the comment, and justify the growth in the pull request body. `.size-limit.cjs` and the package-lint baseline have explicit `CODEOWNERS` entries.

### Negative fixtures

`tests/tdd/package-lint/package-lint.test.ts`, part of `npm test`, runs the real tools against packages it writes to a temporary directory. A package whose `./sub` entry names a missing `types` file must produce `publint:FILE_DOES_NOT_EXIST` and an attw problem under all three resolutions, while a clean control produces none. A size-limit fixture whose CJS budget is below its entry plus chunk must exit 1, while its ESM check passes. The ratchet rules and the budget-to-exports matching have unit tests in the same file. attw 0.18 and size-limit 12 need Node 20, so the suites that run the tools skip on Node 18.

---

## Dependency audit

`npm audit` reports the state of the world, not the state of a diff. An unchanged commit passes before an advisory is published and fails after it. Used as a plain merge gate, it turns every open pull request red for something its author did not do. The audit is therefore split three ways, all driven by `scripts/audit-check.ts`:

| Where                              | Question                                                | Mode       | Blocking       |
| ---------------------------------- | ------------------------------------------------------- | ---------- | -------------- |
| `ci.yml` → `dependency-audit`      | Does this PR _introduce_ an advisory the base lacks?    | `--diff`   | Yes            |
| `nightly-audit.yml`                | Does `master` have any unaccepted advisory today?       | `--filter` | Files an issue |
| `release.yml` → `validate-release` | Is the tree clean at or above `high` before publishing? | `--check`  | Yes            |

The pull request job audits base and head in one run, each from its `package.json` and `package-lock.json` alone in a bare directory, so both hit the same advisory snapshot and neither depends on how `node_modules` was installed. Any difference is a real difference between the trees. The job skips entirely when neither file changed.

Advisories are keyed by GHSA id (taken from the advisory URL), falling back to `npm-<source>` for older advisories without one. One advisory reached through several dependency paths counts once.

### Accepting a known risk

When an advisory has no acceptable fix, record it in `scripts/audit-exceptions.json`:

```json
{
  "exceptions": [
    {
      "ghsa": "GHSA-xxxx-xxxx-xxxx",
      "package": "some-package",
      "severity": "moderate",
      "reason": "Why there is no acceptable fix, and why the exposure is limited.",
      "expires": "2026-12-09"
    }
  ]
}
```

| Field      | Rule                                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| `ghsa`     | The match key. Must equal the id the audit reports                                                                |
| `package`  | The vulnerable package, for readers                                                                               |
| `severity` | As reported, for readers                                                                                          |
| `reason`   | Why it cannot be fixed now and why the risk is acceptable: runtime or dev dependency, reachable code, input trust |
| `expires`  | `YYYY-MM-DD`. Keep it short enough that the decision is genuinely revisited                                       |

All three audit paths honour the file. An accepted advisory stops blocking pull requests and releases and stops appearing in the nightly issue.

An entry whose `expires` is before today is a hard failure in every mode, before any advisory is examined. The run prints the expired ids and the file to edit. That is deliberate (`SEC-05`): an acceptance that silently outlives its review is indistinguishable from an advisory nobody looked at.

To renew, re-check whether a fix now exists. If it does, upgrade or add an `overrides` entry and delete the exception. If not, update `reason` with what changed and set a new `expires`. Either way it goes through a pull request so the decision is reviewed.

In `--filter` mode a package entry is dropped only if _every_ advisory on it is accepted, so accepting one advisory cannot hide a second one arriving through the same package.

```bash
npm run audit:check                        # unaccepted advisories at or above high
npm run audit:check -- --level=moderate    # lower the threshold
npm run audit:diff -- --base base.json --head head.json
npx ts-node scripts/audit-check.ts --filter --in audit-raw.json --out audit-report.json
```

### Other exception files

The same "explicit, reasoned exception" pattern appears in six more places:

| File                                   | Consumed by                    | Rule                                                                                              |
| -------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `mutation-bdd-thresholds.json`         | `npm run mutation:bdd:ratchet` | Per-directory BDD mutation floors; every scored directory needs one; `--update` only raises them  |
| `mutation-thresholds.json`             | `npm run mutation:pr`          | Per-directory unit mutation floors; every mutated directory needs one; they may only rise         |
| `type-mutation-thresholds.json`        | `npm run test:type-mutation`   | In `scripts/`. Per-entry-point type mutation floors; only rise against `origin/master`            |
| `scripts/spec-audit-exceptions.json`   | `npm run spec:audit`           | A ratchet: now empty, and the audit fails if a listed file passes, so entries can only be removed |
| `scripts/schema-drift-exceptions.json` | `npm run schema:drift`         | Schema name → accepted permanent deviations (field paths); an unused entry warns                  |
| `scripts/schema-drift-baseline.json`   | `npm run schema:drift:ci`      | Known drift → bead id; shrink-only, stale entries fail. See [Schema drift](#schema-drift)         |
| `scripts/determinism-baseline.json`    | `npm run lint:determinism`     | Clock, timer and `Math.random()` sites per file and construct; shrink-only, stale counts fail     |
| `scripts/auth-scope-exceptions.json`   | `npm run validate:auth-scopes` | `METHOD:path` key with a `reason`, for endpoints whose scope mapping lags the generated map       |
| `scripts/package-lint-baseline.json`   | `npm run lint:package`         | Known publint/attw finding → bead id; shrink-only, stale entries fail                             |

---

## npm scripts

`npm run help` prints the scripts grouped by intent and accepts a keyword (`npm run help -- wallet`). The tables below list every script in `package.json` except the two large families, which are summarised.

### Build and static checks

| Script                    | Runs                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `build`                   | `tsup` then `tsc --emitDeclarationOnly`                                                 |
| `typecheck`               | `tsc --noEmit`                                                                          |
| `lint` / `lint:fix`       | ESLint over `src`                                                                       |
| `lint:bdd-seam`           | ESLint over `tests/bdd` with only the transport-seam rule (`eslint.bdd-seam.rules.cjs`) |
| `lint:determinism`        | Time and randomness in `src` only via the clock module; shrink-only baseline            |
| `lint:suite-health`       | ESLint over `tests/` with only the suite-health rules (`eslint.suite-health.rules.cjs`) |
| `lint:package`            | Build, `npm pack`, then publint and attw on the tarball (`-- --skip-build`)             |
| `size`                    | size-limit budget per `exports` sub-path, ESM and CJS (`.size-limit.cjs`)               |
| `format` / `format:check` | Prettier over `src/**/*.ts` and `tests/**/*.ts`                                         |
| `knip`                    | Dead code and unused exports (`knip.json`)                                              |
| `api-report`              | api-extractor, local mode: rewrites `etc/esi.ts.api.md`                                 |
| `api-report:check`        | api-extractor, check mode                                                               |
| `api-report:semver`       | Fails if the report lost a line without a breaking-change commit (GATE-03)              |
| `clean` / `clean:docs`    | Remove `dist`, `coverage`, `docs-site/public/api`                                       |
| `prepare`                 | Install husky hooks, then build                                                         |

### Tests

| Script                                                         | Runs                                                                                                                                                                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test` / `test:watch`                                          | Jest unit config: `tests/tdd` plus BDD step definitions                                                                                                                                                                               |
| `coverage`                                                     | The same, with coverage thresholds                                                                                                                                                                                                    |
| `bdd`                                                          | BDD step definitions only                                                                                                                                                                                                             |
| `bdd:<suite>`                                                  | One BDD suite, for example `bdd:market`, `bdd:resilience`, `bdd:sde`. See `npm run help -- bdd`                                                                                                                                       |
| `spec:audit` / `spec:audit:verbose`                            | EARS and Gherkin structure audit over the feature files                                                                                                                                                                               |
| `test:integration`                                             | Integration tests, mocked                                                                                                                                                                                                             |
| `test:integration:live`                                        | `tests/integration/live-esi.test.ts` against live ESI (`jest.integration.live.config.cjs`). Fails in global setup unless `ESI_LIVE_TESTS=true`                                                                                        |
| `test:integration:gated`                                       | Authenticated integration tests (`ESI_GATED_TESTS`, reads `.env`)                                                                                                                                                                     |
| `test:all`                                                     | `test`, `bdd`, `test:integration`, `fuzz`, `test:types`                                                                                                                                                                               |
| `contract`                                                     | Contract tests; the live-spec suites skip unless `ESI_LIVE_TESTS=true`                                                                                                                                                                |
| `contract:live`                                                | Contract tests against the live spec and the committed snapshot (`jest.contract.live.config.cjs`). Fails in global setup unless `ESI_LIVE_TESTS=true`; what CI runs                                                                   |
| `contract:snapshot`                                            | Refresh the committed spec snapshot                                                                                                                                                                                                   |
| `contract:diff`                                                | oasdiff breaking changes, snapshot versus live spec (Docker)                                                                                                                                                                          |
| `fuzz`                                                         | Property-based fuzz tests (fast-check)                                                                                                                                                                                                |
| `faults`                                                       | Fault catalogue and its self-test (`jest.faults.config.cjs`); see [TESTING.md](TESTING.md#fault-injection)                                                                                                                            |
| `faults:nightly`                                               | Seeded payload fuzz over every endpoint definition (`jest.faults.nightly.config.cjs`); `FAULTS_SEED` replays, `FAULTS_RUNS` sets cases per endpoint                                                                                   |
| `fuzz:api`                                                     | Schemathesis against a Prism mock (Docker)                                                                                                                                                                                            |
| `mock:esi`                                                     | Prism mock of ESI on port 4010                                                                                                                                                                                                        |
| `test:consumer`                                                | Consumer contract: pack, install into a clean consumer, type-check and run it (not part of `npm test`; see [TESTING.md](TESTING.md#consumer-contract))                                                                                |
| `test:export-coverage`                                         | Public exports no test references, by entry point; `--ci` gates against `scripts/export-coverage-baseline.json`                                                                                                                       |
| `test:docs-examples`                                           | Documentation examples checked against the packed tarball (not part of `npm test`; see [DOCUMENTATION.md](DOCUMENTATION.md#documentation-examples-are-checked))                                                                       |
| `test:types`                                                   | tsd type tests                                                                                                                                                                                                                        |
| `test:type-mutation`                                           | Mutates the built `dist/**/*.d.ts` and runs tsd against each mutant; `-- --ratchet` gates per-entry-point scores (`scripts/type-mutation-thresholds.json`)                                                                            |
| `benchmark`                                                    | Benchmark suite                                                                                                                                                                                                                       |
| `bench:ab`                                                     | Bundles the harness for two trees and runs them in alternating processes                                                                                                                                                              |
| `bench:compare`                                                | The statistical verdict: exit 3 on a regression, 1 when the comparison cannot be made                                                                                                                                                 |
| `bench:trend`                                                  | One JSON record per nightly run for the `bench-data` history                                                                                                                                                                          |
| `soak`                                                         | Heap soak under `--expose-gc`; `-- --inject-leak --expect-fail` checks the detector                                                                                                                                                   |
| `mutation` / `mutation:report`                                 | Stryker                                                                                                                                                                                                                               |
| `mutation:bdd` / `mutation:bdd:merge` / `mutation:bdd:ratchet` | Stryker with only the BDD step definitions as tests, one shard at a time (`BDD_MUTATION_SHARD`); `:merge` rebuilds the whole report and refuses an incomplete run; per-directory score ratchet against `mutation-bdd-thresholds.json` |
| `mutation:ratchet` / `mutation:pr`                             | Unit-suite per-directory ratchet against `mutation-thresholds.json`; `:pr` mutates only the changed `src/` files (MUTATION-TESTING.md)                                                                                                |
| `mutation:fixture`                                             | Stryker over the known-weak fixture in `tests/mutation-fixture/`; fails unless mutants both die and survive                                                                                                                           |

### Spec alignment and generation

| Script                 | Runs                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `generate:types`       | Types, cache TTLs, rate-limit groups and scopes from the live spec                    |
| `generate:okf`         | OKF knowledge bundle in `okf/` (see [OKF.md](OKF.md))                                 |
| `generate:endpoints`   | Endpoint definition scaffold (see [DESIGN-RULES.md](DESIGN-RULES.md))                 |
| `generate:all`         | `generate:types`, `generate:okf`, `contract:snapshot`, `schema:drift`, `validate:esi` |
| `schema:drift`         | Zod schema versus spec report; exits 2 only when the check compared nothing           |
| `schema:drift:ci`      | The same, also exiting 1 on drift outside the baseline or a stale or grown baseline   |
| `validate:esi`         | Endpoint definitions versus spec; fails on method mismatches                          |
| `validate:auth-scopes` | `requiresAuth` versus the generated scope map (`DES-04`)                              |
| `validate:spec`        | Redocly lint of the ESI spec (`.redocly.yaml`)                                        |
| `validate:versions`    | `package.json` version equals `PACKAGE_VERSION` in `src/core/constants.ts`            |

### Security

| Script        | Runs                                      |
| ------------- | ----------------------------------------- |
| `audit:check` | `audit-check.ts --check` (default `high`) |
| `audit:diff`  | `audit-check.ts --diff`                   |

### Aggregates

| Script      | Runs                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------- |
| `validate`  | `lint`, `format:check`, `build`, `coverage`, `knip --no-exit-code`                          |
| `check:all` | `validate`'s steps, then `validate:esi`, `validate:spec`, `validate:versions`, `spec:audit` |

### Documentation, tokens, SDE and examples

| Script                           | Runs                                                                    |
| -------------------------------- | ----------------------------------------------------------------------- |
| `docs` / `docs:watch`            | TypeDoc into `docs-site/public/api`                                     |
| `docs:serve`                     | Serve the TypeDoc output on port 8080                                   |
| `token:create` / `token:refresh` | PKCE token into `.env`, and refresh it (see [SECURITY.md](SECURITY.md)) |
| `sde:ingest`                     | Build the SDE database from CCP's archive                               |
| `health-check`                   | `EsiClient.healthCheck()` against live ESI                              |
| `start` / `example`              | `examples/character-profile.ts`                                         |
| `example:<name>`                 | One runnable example from `examples/`; see `npm run help -- example`    |
| `help`                           | Grouped script listing                                                  |

---

## Running the gates locally

`npm run check:local` runs every tier `ci.yml` gates on that works offline, in one command, and keeps going after a failure so the answer is the whole list rather than the first thing to break:

```bash
npm run check:local        # the quick tiers, then build and the tiers that need dist/
npm run check:local:fast   # quick only: no build
npm run check:local:all    # adds the slow tiers (type mutation)
```

What it runs, and what it deliberately does not, is `scripts/verify-local-core.ts`. The list is held to CI by `tests/tdd/verify-local/verify-local.test.ts`, which reads `ci.yml` two ways and fails unless each thing it finds is in the tier list, reachable from a composite, or excluded with a written reason — so a tier added to CI cannot silently go unrun locally. It reads every `npm run`, and every tool a step invokes directly through `npx`, `uvx`, `pipx` or `bunx`. The second was added after `zizmor` spent a day as a CI-only gate precisely because nothing looked for it: it is not an npm script, so the first pass never saw it. `format:check` is one of the excluded ones: on a Windows checkout CRLF endings fail it across the whole repository, so run it on a specific path instead.

Two older aggregate scripts cover the static side:

```bash
npm run validate     # lint, format:check, build, coverage, knip (non-blocking)
npm run check:all    # validate + validate:esi + validate:spec + validate:versions + spec:audit
```

Neither reproduces `ci-success` completely, and neither includes the tiers added around the unit suite. `check:all` needs network access for the spec checks. What `check:local` leaves out, because it needs the network or a base branch:

```bash
npm run typecheck
npm run bdd
npm run test:all                                  # integration, fuzz, type tests
ESI_LIVE_TESTS=true npm run contract:live        # what the CI job runs
npm run validate:auth-scopes
npm run schema:drift:ci
npm run test:export-coverage -- --ci
npm run generate:types && git diff --exit-code src/types/generated/ src/core/endpoints/esi-cache-ttls.generated.ts
npm run api-report && git diff etc/esi.ts.api.md  # commit any change
npm run lint:package && npm run size              # packed-tarball lint, size budgets
npm run audit:check
```

Conversely, `validate:esi`, `validate:spec` and `validate:versions` run only locally: no workflow calls them. `release-please` keeps `src/core/constants.ts` in step with `package.json` through its `extra-files` setting, which is why the version check is not in CI.
