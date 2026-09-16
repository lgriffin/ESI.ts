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
| Generated types fresh, schema drift        |   ·    |            ·             |     ● (3)(7)     | ◐ files issue |      ●       |
| Auth/scope alignment                       |   ·    |            ·             |        ●         |       ·       |      ·       |
| Contract tests                             |   ·    |            ·             |      ● (3)       | ◐ weekly (4)  |      ·       |
| Fuzz, integration (mocked), type tests     |   ·    |            ·             |        ●         |       ·       |      ●       |
| API surface diff (api-extractor)           |   ·    |            ·             |        ●         |       ·       |      ·       |
| Breaking API change declared (SemVer gate) |   ·    |            ·             |        ●         |       ·       |      ·       |
| Lockfile consistency                       |   ·    |            ·             |        ●         |       ·       |      ·       |
| Are The Types Wrong (packed tarball)       |   ·    |            ·             |      ◐ (5)       |       ·       |      ·       |
| Consumer contract (packed tarball)         |   ·    |            ·             |    ● 18/20/22    |       ·       |      ·       |
| Dependency audit (diff-aware / allowlist)  |   ·    |            ·             | ● new advisories | ◐ files issue | ● ≥ high (6) |
| knip dead-code                             |   ·    |            ·             |        ◐         | ◐ weekly (4)  |      ◐       |
| CodeQL                                     |   ·    | ◐ protected branches (5) |      ◐ (5)       |   ◐ weekly    |      ·       |
| zizmor (workflow security)                 |   ·    |            ·             |        ●         |       ·       |      ·       |
| TypeDoc generation                         |   ·    |            ·             |        ●         |       ·       |      ●       |
| Unit + BDD, fails if any test was retried  |   ·    |            ·             |        ·         |       ◐       |      ·       |
| Stryker mutation                           |   ·    |            ·             |        ·         |       ◐       |      ·       |
| Schemathesis API fuzz                      |   ·    |            ·             |        ·         |       ◐       |      ·       |
| Missing-endpoint spec drift                |   ·    |            ·             |        ·         | ◐ files issue |      ·       |
| OpenSSF Scorecard                          |   ·    |            ·             |        ·         |   ◐ weekly    |      ·       |

1. The release job runs lint, format check and build. It has no separate `typecheck` step; `npm run build` runs `tsc --emitDeclarationOnly`, which type-checks `src/`.
2. `npm test` uses `jest.unit.config.cjs`, whose `testMatch` includes `tests/bdd/step-definitions/**/*.steps.ts` and `tests/bdd/specs/**/*.spec.ts`. Every push therefore runs the BDD scenarios as part of the unit suite.
3. Soft-skips with a warning annotation when ESI returns HTTP 503 (Tranquility downtime).
4. From `maintenance.yml`, which runs weekly and only uploads artifacts.
5. Runs and reports a status, but is outside `ci-success`, so a red result does not stop a merge. See [What actually blocks a merge](#what-actually-blocks-a-merge).
6. Threshold `high`, after removing advisories accepted in `scripts/audit-exceptions.json`.
7. Blocks only when the pull request touches the check's inputs; otherwise a failure is pre-existing drift, reported as a warning and left to the nightly `spec-drift` issue. See [`static-analysis`](#ciyml--cicd-pipeline).

### What actually blocks a merge

Branch protection on `master` should require exactly one status check, with "require branch to be up to date" (`strict`) enabled:

| Required check | Workflow | Job          |
| -------------- | -------- | ------------ |
| `ci-success`   | `ci.yml` | `ci-success` |

`ci-success` fans in every job in `ci.yml`, so requiring any of those jobs individually adds nothing, and requiring a job that can be skipped or path-filtered is exactly what the gate exists to avoid. `Lint, Build & Test` from `ci-fast.yml` repeats `lint-and-build` and `unit-tests` for pushes before a pull request exists; it stays useful as early feedback but does not need to be required. The previous required checks were `Quality Gate` (renamed to `ci-success`) and `Lint, Build & Test`; branch protection has to be switched to `ci-success` when this change merges, or pull requests wait forever for a `Quality Gate` check that no longer reports.

Everything else on a pull request is visible but advisory: `package-checks.yml` (Are The Types Wrong) and `codeql.yml`. Force-pushes and branch deletion are disabled. Administrators are not yet included in enforcement (tracked under `SEC-07`).

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
| `nightly-mutation.yml`     | Uploads `reports/mutation/` as an artifact only                                                                                                     |
| `nightly-schemathesis.yml` | Uploads `reports/schemathesis/` as an artifact only                                                                                                 |
| `nightly-no-retry.yml`     | Fails the run and uploads `reports/no-retry/` as an artifact only                                                                                   |

Both issue-filing workflows keep at most one open issue per label: if one is open they comment on it, otherwise they create one. Mutation, Schemathesis and the no-retry run still need an issue step (bead `esi-mbr`).

### GATE-06 · Scripts resolve to files

Not yet machine-checked. Two scripts in `package.json` currently point at files that do not exist:

| Script                  | Missing file                      |
| ----------------------- | --------------------------------- |
| `sde:seed`              | `scripts/seed-sde-test-db.ts`     |
| `example:sde-cross-ref` | `examples/sde-cross-reference.ts` |

---

## Local hooks

Installed by husky through the `prepare` script (which also runs a build after `npm install`).

| Hook         | Runs                                 | Effect                                                                                                                              |
| ------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `pre-commit` | `npx lint-staged`                    | Staged `src/**/*.ts`: `eslint --fix` then `prettier --write`. Staged `tests/**/*.ts` and `*.{json,md,yml,yaml}`: `prettier --write` |
| `commit-msg` | `npx --no -- commitlint --edit "$1"` | Rejects messages that do not follow `@commitlint/config-conventional`                                                               |

Test files are formatted but not linted, at commit or anywhere else (`TEST-09`). Commit types map to changelog sections through `release-please-config.json`; see [RELEASE.md](RELEASE.md).

---

## Workflows

All workflows live in `.github/workflows/`. Every action is pinned to a full commit SHA and every workflow declares read-only top-level permissions with per-job escalation (`SEC-03`, see [SECURITY.md](SECURITY.md)).

| Workflow                   | Trigger                                                          | Blocks                        | Output                                         |
| -------------------------- | ---------------------------------------------------------------- | ----------------------------- | ---------------------------------------------- |
| `ci-fast.yml`              | Push, any branch                                                 | No (covered by `ci-success`)  | Status                                         |
| `ci.yml`                   | Pull request to `master`, `main`, `develop`                      | Required check (`ci-success`) | Status, coverage comment, artifacts            |
| `package-checks.yml`       | Pull request to `master`, `main`                                 | No                            | Status, step summary                           |
| `codeql.yml`               | Push and PR to `master`/`main`/`develop`; Mondays 06:00 UTC      | No                            | Code scanning alerts                           |
| `skill-eval.yml`           | PR touching `.claude/skills/**` or the skill eval runner; manual | No                            | Status, artifacts                              |
| `nightly-schemathesis.yml` | Daily 01:00 UTC; manual                                          | No                            | Artifact                                       |
| `nightly-mutation.yml`     | Daily 02:00 UTC; manual                                          | No                            | Artifact                                       |
| `nightly-no-retry.yml`     | Daily 03:00 UTC; manual                                          | No                            | Artifact                                       |
| `nightly-audit.yml`        | Daily 05:00 UTC; manual                                          | No                            | `security-audit` issue                         |
| `nightly-spec-drift.yml`   | Daily 06:00 UTC; manual                                          | No                            | `spec-drift` / `spec-drift-check-failed` issue |
| `scorecard.yml`            | Mondays 04:00 UTC; manual; branch protection rule change         | No                            | SARIF to code scanning, public score           |
| `maintenance.yml`          | Mondays 09:00 UTC; manual                                        | No                            | Artifacts                                      |
| `release-please.yml`       | Push to `master`                                                 | —                             | Release PR, tag, GitHub release                |
| `release.yml`              | Tag `v*.*.*` pushed; GitHub release published                    | Publishing                    | npm, GitHub Packages, gh-pages, signed assets  |

### `ci-fast.yml` — CI Fast

One job, `Lint, Build & Test`, on Node 20: `npm ci`, `lint`, `format:check`, `build`, `typecheck`, `test`. It runs on every push to every branch, before a pull request exists. Everything it runs is repeated inside `ci-success`, so it is early feedback rather than a required check.

### `ci.yml` — CI/CD Pipeline

Runs on pull requests only. `lint-and-build` runs first; most test jobs `need` it. `pr-info`, `static-analysis`, `lockfile`, `dependency-audit` and `zizmor` run in parallel with it. No job has a job-level `if:`, and every job is in the gate (GATE-01).

| Job (display name)                       | What it does                                                                                                                                                                                                                                                                                  | In gate |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-----: |
| `pr-info` (PR Information)               | Writes title, author, branches and change size to the step summary. Runs on drafts too                                                                                                                                                                                                        |   yes   |
| `lint-and-build` (Lint & Build)          | ESLint, `lint:determinism` (fetches master for its baseline), Prettier check, build, typecheck; uploads `dist/`                                                                                                                                                                               |   yes   |
| `static-analysis` (Static Analysis)      | Regenerates types and diffs `src/types/generated/` and `esi-cache-ttls.generated.ts`; knip (non-blocking); `schema:drift:ci`; `validate:auth-scopes`. The two live-spec checks block only when the pull request touches their inputs (below)                                                  |   yes   |
| `unit-tests` (Unit Tests)                | `npm test` on Node 18, 20 and 22                                                                                                                                                                                                                                                              |   yes   |
| `coverage` (Test Coverage)               | `npm run coverage` with the thresholds in `jest.unit.config.cjs`; posts or updates a PR comment; uploads `coverage/`                                                                                                                                                                          |   yes   |
| `bdd-tests` (BDD Scenarios)              | `npm run bdd`                                                                                                                                                                                                                                                                                 |   yes   |
| `spec-audit` (EARS Spec Audit)           | `npm run spec:audit`; emits inline GitHub annotations when `GITHUB_ACTIONS` is set. Then `npm run lint:bdd-seam`, which fails on any scenario that spies on or reassigns an ESI client method                                                                                                 |   yes   |
| `contract-tests` (Contract Tests)        | `npm run contract:live` with `ESI_LIVE_TESTS=true`; fails if the variable is missing rather than skipping; soft-skips on 503                                                                                                                                                                  |   yes   |
| `fuzz-tests` (Fuzz Tests)                | `npm run fuzz` (fast-check)                                                                                                                                                                                                                                                                   |   yes   |
| `full-test-suite` (Complete Test Suite)  | `npm run test:all`: unit, BDD, mocked integration, fuzz, type tests                                                                                                                                                                                                                           |   yes   |
| `consumer-contract` (Consumer Contract)  | `npm run test:consumer` on Node 18, 20 and 22: installs the `npm pack` tarball into a clean consumer, type-checks and runs it under CommonJS, ES module and bundler resolution, and checks every `exports` sub-path (see [TESTING.md](TESTING.md#consumer-contract))                          |   yes   |
| `api-surface` (API Surface Check)        | Rebuilds `etc/esi.ts.api.md` and fails on a difference (GATE-03)                                                                                                                                                                                                                              |   yes   |
| `api-semver` (API SemVer Gate)           | `npm run api-report:semver`: fails when the report lost or changed a line and no commit in the pull request is `type!:`, has a `BREAKING CHANGE:` footer or an `API-Compatible:` trailer, or when a declared break spans several commits and the pull request title is not `type!:` (GATE-03) |   yes   |
| `lockfile` (Lockfile Consistency)        | `npm install --package-lock-only --ignore-scripts` then `git diff --exit-code package-lock.json`. For `dependabot[bot]` the step exits early with a notice; the job still reports success                                                                                                     |   yes   |
| `dependency-audit` (Dependency Audit)    | Audits base and head, fails only on advisories the PR introduces. Its steps skip when `package.json` and `package-lock.json` are unchanged; the job still reports success                                                                                                                     |   yes   |
| `documentation` (Generate Documentation) | Runs TypeDoc and uploads `docs-site/public/api/`, so a docs break is caught before `release.yml` runs `npm run docs`                                                                                                                                                                          |   yes   |
| `zizmor` (Workflow Security (zizmor))    | `uvx zizmor@<pinned>` over `.github/` with `.zizmor.yml`, on every pull request                                                                                                                                                                                                               |   yes   |
| `ci-success` (ci-success)                | Fails unless every other job succeeded, and fails if a job is missing from its `needs` (GATE-01)                                                                                                                                                                                              |    —    |

The generated-types, schema-drift and contract steps all call the live ESI spec. Each captures its log and, if the failure contains `HTTP 503`, downgrades it to a `::warning::` and passes (`TEST-08`).

Like `npm audit`, the generated-types and schema-drift checks report the state of the world: CCP changing ESI turns them red on every open pull request. `static-analysis` therefore first compares the merge commit with its base tip (`HEAD^1`) and blocks on each check only when the pull request touches that check's inputs:

| Check                     | Inputs                                                                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generated types freshness | `scripts/generate-esi-types.ts`, `src/types/generated/`, `src/core/endpoints/esi-cache-ttls.generated.ts`                                                                                                           |
| Schema drift              | `scripts/generate-schema-drift-report.ts`, `scripts/schema-drift-core.ts`, `scripts/schema-drift-baseline.json`, `scripts/schema-drift-exceptions.json`, `src/schemas/`, `src/core/endpoints/`, `package-lock.json` |

Otherwise the result would be the same on the base branch, so a failure is reported as a `::warning::` and a step-summary line, and the job passes; `nightly-spec-drift.yml` files that drift as an issue. Both steps now run with `pipefail`, so a generator or drift script that fails outright is reported rather than masked by `tee`. The contract tests are not diff-aware yet. `release.yml` still blocks on both checks unconditionally. Schema drift that is already tracked turns neither red: it is listed in a ratcheted baseline, described under [Schema drift](#schema-drift).

The lockfile check skips Dependabot because Dependabot's npm version produces byte-level lockfile differences. When regenerating a lockfile locally, use the npm major that CI uses so the file round-trips.

### `package-checks.yml` — Package Checks

Builds, runs `npm pack`, and checks the tarball with Are The Types Wrong (`@arethetypeswrong/cli`), ignoring the `false-cjs` and `no-resolution` rules. The full table is written to the step summary. This verifies the dual CJS/ESM entry points (`ARCH-05`). It is outside `ci-success` and not a required check. The blocking check on the packed tarball is `consumer-contract` in `ci.yml`, which installs and runs it rather than inspecting it.

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

### `nightly-mutation.yml` — Nightly Mutation Testing

Daily at 02:00 UTC on Node 22 with a 240-minute timeout. Runs `npm run mutation` (Stryker, `stryker.config.mjs`) over `src/core/**` excluding endpoint definitions and pure interface files. Thresholds are `high: 80`, `low: 60`, `break: 65`; a score below `break` fails the run. The HTML report is uploaded as `mutation-report` whether or not it passed. No issue is filed. Details in [TESTING.md](TESTING.md).

A second job, `bdd-mutation-testing` (300-minute timeout), runs `npm run mutation:bdd` (`stryker.bdd.config.mjs`): all of `src/` except generated files, types, interfaces and test helpers, with only the BDD step definitions as the test suite, so a surviving mutant is a behaviour no Rule protects. There is no global break threshold. `npm run mutation:bdd:ratchet` then scores the JSON report per directory (`src/<area>`, and `src/core/<sub>` inside core), writes the table to the step summary, and fails if any directory falls below its entry in `mutation-bdd-thresholds.json`. Directories without an entry are reported, not gated; the file starts empty, and `-- --update` raises entries to the current scores but never lowers one. The report is uploaded as `bdd-mutation-report`.

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

| Job                       | Runs on           | What it does                                                                                                                                                         |
| ------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validate-release`        | both triggers     | lint, format check, knip (non-blocking), `audit:check`, `CHANGELOG.md` has `## [<version>]`, build, `schema:drift:ci`, generated-types freshness, `test:all`, `docs` |
| `publish-npm`             | release published | `npm publish --provenance` to npmjs.org                                                                                                                              |
| `publish-github`          | release published | `npm publish --provenance` to GitHub Packages                                                                                                                        |
| `deploy-docs`             | both triggers     | TypeDoc to gh-pages from `docs-site/public/api`                                                                                                                      |
| `create-assets`           | both triggers     | `npm pack`, docs archive, `checksums.txt`; no OIDC permission                                                                                                        |
| `sign-and-publish-assets` | release published | Keyless cosign signatures, uploads assets to the release; the only job that can mint an OIDC token for signing                                                       |
| `notify-success`          | after publish     | Log line when the npm publish succeeded                                                                                                                              |

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

# No flag: the script's baseline date, 2025-12-16
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

CCP versions breaking changes to ESI with compatibility dates. A new endpoint only appears in a spec requested with a date at or after its introduction, so the nightly uses `--latest`. The available dates are listed at `https://esi.evetech.net/meta/compatibility-dates`. Note that the other spec-reading scripts (`generate-schema-drift-report.ts`, `run-schemathesis.sh`, `.redocly.yaml`) pin `2025-12-16`.

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

The same "explicit, reasoned exception" pattern appears in five more places:

| File                                   | Consumed by                    | Rule                                                                                              |
| -------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `mutation-bdd-thresholds.json`         | `npm run mutation:bdd:ratchet` | Per-directory BDD mutation floors; `--update` only raises them                                    |
| `scripts/spec-audit-exceptions.json`   | `npm run spec:audit`           | A ratchet: now empty, and the audit fails if a listed file passes, so entries can only be removed |
| `scripts/schema-drift-exceptions.json` | `npm run schema:drift`         | Schema name → accepted permanent deviations (field paths); an unused entry warns                  |
| `scripts/schema-drift-baseline.json`   | `npm run schema:drift:ci`      | Known drift → bead id; shrink-only, stale entries fail. See [Schema drift](#schema-drift)         |
| `scripts/determinism-baseline.json`    | `npm run lint:determinism`     | Clock, timer and `Math.random()` sites per file and construct; shrink-only, stale counts fail     |
| `scripts/auth-scope-exceptions.json`   | `npm run validate:auth-scopes` | `METHOD:path` key with a `reason`, for endpoints whose scope mapping lags the generated map       |

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
| `format` / `format:check` | Prettier over `src/**/*.ts` and `tests/**/*.ts`                                         |
| `knip`                    | Dead code and unused exports (`knip.json`)                                              |
| `api-report`              | api-extractor, local mode: rewrites `etc/esi.ts.api.md`                                 |
| `api-report:check`        | api-extractor, check mode                                                               |
| `api-report:semver`       | Fails if the report lost a line without a breaking-change commit (GATE-03)              |
| `clean` / `clean:docs`    | Remove `dist`, `coverage`, `docs-site/public/api`                                       |
| `prepare`                 | Install husky hooks, then build                                                         |

### Tests

| Script                                  | Runs                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test` / `test:watch`                   | Jest unit config: `tests/tdd` plus BDD step definitions                                                                                                             |
| `coverage`                              | The same, with coverage thresholds                                                                                                                                  |
| `bdd`                                   | BDD step definitions only                                                                                                                                           |
| `bdd:<suite>`                           | One BDD suite, for example `bdd:market`, `bdd:resilience`, `bdd:sde`. See `npm run help -- bdd`                                                                     |
| `spec:audit` / `spec:audit:verbose`     | EARS and Gherkin structure audit over the feature files                                                                                                             |
| `test:integration`                      | Integration tests, mocked                                                                                                                                           |
| `test:integration:live`                 | `tests/integration/live-esi.test.ts` against live ESI (`jest.integration.live.config.cjs`). Fails in global setup unless `ESI_LIVE_TESTS=true`                      |
| `test:integration:gated`                | Authenticated integration tests (`ESI_GATED_TESTS`, reads `.env`)                                                                                                   |
| `test:all`                              | `test`, `bdd`, `test:integration`, `fuzz`, `test:types`                                                                                                             |
| `contract`                              | Contract tests; the live-spec suites skip unless `ESI_LIVE_TESTS=true`                                                                                              |
| `contract:live`                         | Contract tests against the live spec and the committed snapshot (`jest.contract.live.config.cjs`). Fails in global setup unless `ESI_LIVE_TESTS=true`; what CI runs |
| `contract:snapshot`                     | Refresh the committed spec snapshot                                                                                                                                 |
| `contract:diff`                         | oasdiff breaking changes, snapshot versus live spec (Docker)                                                                                                        |
| `fuzz`                                  | Property-based fuzz tests (fast-check)                                                                                                                              |
| `fuzz:api`                              | Schemathesis against a Prism mock (Docker)                                                                                                                          |
| `mock:esi`                              | Prism mock of ESI on port 4010                                                                                                                                      |
| `test:consumer`                         | Consumer contract: pack, install into a clean consumer, type-check and run it (not part of `npm test`; see [TESTING.md](TESTING.md#consumer-contract))              |
| `test:types`                            | tsd type tests                                                                                                                                                      |
| `benchmark`                             | Benchmark suite                                                                                                                                                     |
| `mutation` / `mutation:report`          | Stryker                                                                                                                                                             |
| `mutation:bdd` / `mutation:bdd:ratchet` | Stryker with only the BDD step definitions as tests; per-directory score ratchet against `mutation-bdd-thresholds.json`                                             |

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

| Script                           | Runs                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `docs` / `docs:watch`            | TypeDoc into `docs-site/public/api`                                                                               |
| `docs:serve`                     | Serve the TypeDoc output on port 8080                                                                             |
| `token:create` / `token:refresh` | PKCE token into `.env`, and refresh it (see [SECURITY.md](SECURITY.md))                                           |
| `sde:ingest`                     | Build the SDE database from CCP's archive                                                                         |
| `sde:seed`                       | **Broken**: target script missing (GATE-06)                                                                       |
| `health-check`                   | `EsiClient.healthCheck()` against live ESI                                                                        |
| `start` / `example`              | `examples/character-profile.ts`                                                                                   |
| `example:<name>`                 | One runnable example from `examples/`; see `npm run help -- example`. `example:sde-cross-ref` is broken (GATE-06) |
| `help`                           | Grouped script listing                                                                                            |

---

## Running the gates locally

Two aggregate scripts cover the static side of the pull request gate:

```bash
npm run validate     # lint, format:check, build, coverage, knip (non-blocking)
npm run check:all    # validate + validate:esi + validate:spec + validate:versions + spec:audit
```

Neither reproduces `ci-success` completely. `check:all` needs network access for the spec checks. To cover what `ci.yml` blocks on that neither aggregate runs:

```bash
npm run typecheck
npm run bdd
npm run test:all                                  # integration, fuzz, type tests
ESI_LIVE_TESTS=true npm run contract:live        # what the CI job runs
npm run validate:auth-scopes
npm run schema:drift:ci
npm run generate:types && git diff --exit-code src/types/generated/ src/core/endpoints/esi-cache-ttls.generated.ts
npm run api-report && git diff etc/esi.ts.api.md  # commit any change
npm run audit:check
```

Conversely, `validate:esi`, `validate:spec` and `validate:versions` run only locally: no workflow calls them. `release-please` keeps `src/core/constants.ts` in step with `package.json` through its `extra-files` setting, which is why the version check is not in CI.
