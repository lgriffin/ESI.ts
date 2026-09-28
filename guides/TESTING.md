# Testing

**Implements:** `TEST-01`, `TEST-02`, `TEST-03`, `TEST-04`, `TEST-05`, `TEST-06`, `TEST-07`, `TEST-08`, `TEST-09` — see [CHARTER.md](CHARTER.md) Part 4 for the requirements and their status.

How ESI.ts is tested: what each tier owns, where it lives, how to run it, where CI runs it, and the signal that proves it can fail. This is the canonical testing guide. What blocks a merge, what runs nightly and what files an issue is in [QUALITY-GATES.md](QUALITY-GATES.md). Mutation testing has its own deep-dive, [MUTATION-TESTING.md](MUTATION-TESTING.md), which this guide's [Mutation](#mutation) section summarises. How to write a Rule is in [`tests/bdd/README.md`](../tests/bdd/README.md) (the rules) and [`tests/bdd/GUIDE.md`](../tests/bdd/GUIDE.md) (the walkthrough).

## The stance

Three positions explain every choice below.

1. **A tier that cannot fail manufactures confidence.** Each tier owns one class of failure and carries a signal that proves it can go red: a negative fixture, a killed mutant, an injected leak, a deliberately broken package. A green run from a tier with no such signal says nothing, so the one tier that has none today (API fuzz) is listed as such rather than counted as protection.
2. **Every gate is a one-way ratchet.** Floors, baselines and known-gap lists start at the value measured on the day they were introduced and move in one direction. Each shrink-only list fails when an entry is added, fails when a listed entry stops reproducing, and fails closed when the base ref it compares against cannot be read. A fix cannot leave a stale exception behind, and a pull request cannot exempt itself.
3. **The specification executes.** Behaviour is stated as EARS requirements, one `shall` per Gherkin `Rule:`, verified by scenarios that mock only the HTTP transport. `npm run spec:audit` fails a pull request that weakens the wording, `npm run bdd:report` fails one in which a scenario did not run, and the BDD-only mutation ratchet fails when the scenarios stop killing mutants (charter posture 6).

## Where the suite stands

Measured on 2026-09-27 on `master` at `3d57e80` (v10.2.3; 11.0.0 in progress), on a 4-core machine. The command in the first column reproduces each row.

| Command                                       | Config                                   | Suites | Tests | Result                                                                                         |
| --------------------------------------------- | ---------------------------------------- | -----: | ----: | ---------------------------------------------------------------------------------------------- |
| `npm test`                                    | `config/jest/unit.config.cjs`            |    244 | 7,198 | All pass, about 145 s                                                                          |
| of which unit, `tests/tdd` (not composition)  | same                                     |    182 | 6,648 |                                                                                                |
| of which specification, `tests/bdd`           | same                                     |     55 |   508 | 38 legacy `*.steps.ts` files and 17 `*.spec.ts` entries                                        |
| of which composition, `tests/tdd/composition` | same                                     |      7 |    42 |                                                                                                |
| `npm run fuzz`                                | `config/jest/fuzz.config.cjs`            |     15 | 1,240 | All pass, about 22 s with four workers                                                         |
| `npm run faults`                              | `config/jest/faults.config.cjs`          |      2 |   148 | All pass                                                                                       |
| `npm run contract:replay`                     | `config/jest/contract.replay.config.cjs` |      5 |   121 | All pass, over 86 recorded fixtures                                                            |
| `npm run test:integration`                    | `config/jest/integration.config.cjs`     |      6 |   177 | 20 mocked pass; 157 live tests skip without `ESI_LIVE_TESTS`, `ESI_GATED_TESTS` or `sde-data/` |
| **Offline total**                             |                                          |    272 | 8,884 | 8,727 run, 0 failures                                                                          |

| Coverage (`npm run coverage`) | Measured | Floor (`config/jest/unit.config.cjs`) |
| ----------------------------- | -------: | ------------------------------------: |
| Statements                    |   97.18% |                                   90% |
| Branches                      |   95.53% |                                   80% |
| Functions                     |   91.25% |                                   75% |
| Lines                         |   97.32% |                                   90% |

Coverage is collected from `src/**/*.ts`, excluding `.d.ts`, `src/types/`, `*.generated.ts` and `src/clients/generated/`. The floors sit well below the measured values on purpose (`TEST-04`): they catch an untested module without turning one bad week into a broken gate. Mutation, not coverage, is what says the tests assert anything.

| Specification (`npm run spec:audit:verbose`) | Count                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature files                                | <!-- metric:featureFiles -->73<!-- /metric --> (`core/` <!-- metric:featureFilesCore -->48<!-- /metric -->, `integration/` <!-- metric:featureFilesIntegration -->1<!-- /metric -->, `performance/` <!-- metric:featureFilesPerformance -->1<!-- /metric -->, `sde/` <!-- metric:featureFilesSde -->23<!-- /metric -->) |
| `Rule:` requirements                         | <!-- metric:requirements -->545<!-- /metric -->                                                                                                                                                                                                                                                                         |
| Scenarios                                    | <!-- metric:scenarios -->703<!-- /metric --> (<!-- metric:plainScenarios -->698<!-- /metric --> `Scenario`, <!-- metric:scenarioOutlines -->5<!-- /metric --> `Scenario Outline`)                                                                                                                                       |
| Audit result                                 | <!-- metric:featureFiles -->73<!-- /metric --> of <!-- metric:featureFiles -->73<!-- /metric --> pass                                                                                                                                                                                                                   |

Other counts, each reproducible with `ls` or `find`: <!-- metric:typeTestFiles -->9<!-- /metric --> tsd files in `tests/typetests/`, 9 Jest configs (`ls config/jest/*.config.cjs`), and 27 workflows in `.github/workflows/` (28 files including its `README.md`).

## The tiers

This is the canonical tier table. Every other file names tiers by these names; none of them uses a number. Seventeen tiers, each owning one class of failure.

| Tier                        | Location                                                                            | Files                                                                                                                 | Config · command                                                                                | Where CI runs it                                                                                     | Signal that it can fail                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Static analysis             | `config/eslint/*.config.mjs`, `scripts/*/*-lint.ts`                                 | 4 lints and export coverage                                                                                           | `lint:suite-health`, `lint:bdd-seam`, `lint:determinism`, `lint:layers`, `test:export-coverage` | Push (`ci-fast`: seam, suite health, layers); PR (`lint-and-build`, `spec-audit`, `static-analysis`) | One negative fixture per rule, linted at its real path by a suite in `tests/tdd/`                    |
| Unit                        | `tests/tdd/`                                                                        | <!-- metric:unitSuites -->206<!-- /metric --> suites                                                                  | `config/jest/unit.config.cjs` · `npm test`                                                      | Push, Node 22 (`ci-fast`); PR, Node 22/24 (`unit-tests`), `coverage`, `full-test-suite`              | Stryker mutation, per-directory floors                                                               |
| Composition and concurrency | `tests/tdd/composition/`                                                            | <!-- metric:compositionSuites -->7<!-- /metric --> suites                                                             | `config/jest/unit.config.cjs` · `npm test`                                                      | Push; PR; `nightly-interleave.yml` (four calls, seeded random schedules)                             | Pinned schedule counts; `interleave.test.ts` finds and replays a planted race                        |
| Specification (EARS/BDD)    | `tests/bdd/`                                                                        | <!-- metric:featureFiles -->73<!-- /metric --> features, <!-- metric:bddSuites -->74<!-- /metric --> suites           | `config/jest/unit.config.cjs` · `npm run bdd`                                                   | Push (inside `npm test`); PR (`bdd-tests`, `spec-audit`); `ears.yml`, advisory                       | `bdd:report` fails on a scenario that did not execute; BDD-only mutation floors                      |
| Type tests                  | `tests/typetests/`                                                                  | <!-- metric:typeTestFiles -->9<!-- /metric -->                                                                        | tsd · `npm run test:types`                                                                      | PR (`full-test-suite`, through `test:all`)                                                           | Type mutation, nightly, per-entry-point floors                                                       |
| Properties and fuzz         | `tests/fuzz/`                                                                       | <!-- metric:fuzzSuites -->15<!-- /metric --> suites                                                                   | `config/jest/fuzz.config.cjs` · `npm run fuzz`                                                  | PR (`fuzz-tests`, 100 runs per property); `nightly-properties.yml` (10,000)                          | Each model-based property must fail against registered known-bad implementations                     |
| Fault injection             | `tests/faults/`                                                                     | <!-- metric:faultSuites -->2<!-- /metric --> suites, plus <!-- metric:faultNightlySuites -->1<!-- /metric --> nightly | `config/jest/faults.config.cjs` · `npm run faults`; `npm run faults:nightly`                    | PR (`fault-catalogue`); `nightly-faults.yml`                                                         | `fixtures/weak-fault.ts` must be rejected on every count                                             |
| Recorded replay             | `tests/contract/replay/`                                                            | <!-- metric:replaySuites -->5<!-- /metric --> suites, 86 fixtures                                                     | `config/jest/contract.replay.config.cjs` · `npm run contract:replay`                            | PR (`contract-replay`); `nightly-recorded-payloads.yml` re-records                                   | A recording edited to violate its schema must be rejected                                            |
| Live contract               | `tests/contract/`                                                                   | <!-- metric:contractSuites -->2<!-- /metric --> suites                                                                | `config/jest/contract.live.config.cjs` · `npm run contract:live`                                | PR (`contract-tests`, soft-skips on HTTP 503); weekly in `maintenance.yml`                           | An unknown spec mismatch hard-fails; known ones sit in named exception sets                          |
| Integration, mocked         | `tests/integration/full-stack.test.ts`                                              | 1                                                                                                                     | `config/jest/integration.config.cjs` · `npm run test:integration`                               | PR (`full-test-suite`, through `test:all`)                                                           | None of its own; it overlaps the unit and specification tiers, which are mutation-scored             |
| Integration, live           | `tests/integration/`: `live-esi`, `client-integration`, `esi-spec-contract`, `sde/` | 4                                                                                                                     | `ESI_LIVE_TESTS=true npm run test:integration`; `npm run test:integration:live`                 | Not run by any workflow                                                                              | A live response of the wrong shape fails; `test:integration:live` fails when its variable is missing |
| Integration, gated auth     | `tests/integration/gated-auth.test.ts`                                              | 1                                                                                                                     | `npm run test:integration:gated` (reads `.env`)                                                 | Not run by any workflow                                                                              | Fails when `ESI_GATED_TESTS=true` and no token is set                                                |
| Consumer contract           | `tests/consumer/`                                                                   | 1 package                                                                                                             | `npm run test:consumer`                                                                         | PR (`consumer-contract`, four rows); `consumer-matrix-nightly.yml`; `release.yml`                    | Five broken packages must fail the matrix; a clean control must pass                                 |
| Documentation examples      | `tests/doc-examples/`                                                               | every `ts` block in the docs                                                                                          | `npm run test:docs-examples`                                                                    | PR (`doc-examples`)                                                                                  | Negative fixtures in `tests/tdd/doc-examples/`                                                       |
| Benchmarks and heap soak    | `tests/benchmark/`                                                                  | 18 tasks and the soak                                                                                                 | `npm run bench:ab`, `npm run bench:compare`, `npm run soak`                                     | PR (`benchmarks`, only when a hot path changes); `nightly-benchmarks.yml`                            | An injected slowdown and an injected leak must be flagged                                            |
| Mutation                    | `src/**`                                                                            | unit, BDD-only and type runs                                                                                          | Stryker · `npm run mutation:pr`, `mutation`, `mutation:bdd`; `npm run test:type-mutation`       | PR (`mutation-pr`, changed files); `nightly-mutation.yml`                                            | `tests/mutation-fixture/` must leave survivors and kill at least one mutant                          |
| API fuzz                    | Prism mock and Schemathesis                                                         | none                                                                                                                  | `npm run fuzz:api` (Docker)                                                                     | `nightly-schemathesis.yml`                                                                           | None. It uploads a report and files an `api-fuzz` issue on failure; count it as a probe, not a gate  |

The charter's Part 4 table groups the same ground as twelve rows. This table splits its contract row into recorded replay and live contract, and adds four the charter counts under gates: static analysis, composition, consumer contract and documentation examples.

The shrink-only lists that hold today's known gaps live beside the tier that owns them: `tests/faults/known-gaps.json` (empty), `tests/contract/fixtures/known-mismatches.json` (empty) and `unrecordable.json` (one entry), `scripts/spec/spec-audit-exceptions.json` (`unconverted` empty, `legacyStepFiles` 38), `scripts/*/*-baseline.json`, `config/mutation/unit-thresholds.json`, `config/mutation/bdd-thresholds.json` and `config/mutation/type-thresholds.json`.

## The test system in C4

Three views, in the notation of [`guides/ARCHITECTURE.md`](ARCHITECTURE.md): what the suite talks to, what runs when, and how a test reaches the code under test.

### Level 1: Context

Who runs the tests, and the outside things they depend on. Only the live contract, the live and gated integration suites, payload recording, the nightly examples and the post-publish canary reach ESI. The test tiers among them run only when their environment variable is set.

```mermaid
flowchart TB
    contributor(["Contributor"])
    reviewer(["Reviewer"])

    subgraph boundary [" "]
        suite["ESI.ts test suite<br/>17 tiers, one per failure class"]
    end

    esi[/"ESI API<br/>live, public + authenticated"/]
    spec[/"ESI OpenAPI document"/]
    registry[/"npm registry"/]
    actions[/"GitHub Actions"/]

    contributor -- "npm test, npm run check:local, ..." --> suite
    suite -- "recordings, live contract, manual live runs" --> esi
    spec -. "generated types, cache TTLs, drift" .-> suite
    suite -- "packed tarball installed by the consumer matrix" --> registry
    suite -- "jobs, ratchet files, nightly issues" --> actions
    actions -- "one required check: ci-success" --> reviewer

    style contributor fill:#08427b,color:#fff,stroke:#073b6f
    style reviewer fill:#08427b,color:#fff,stroke:#073b6f
    style suite fill:#1168bd,color:#fff,stroke:#0e5aa7
    style esi fill:#999,color:#fff,stroke:#888
    style spec fill:#999,color:#fff,stroke:#888
    style registry fill:#999,color:#fff,stroke:#888
    style actions fill:#999,color:#fff,stroke:#888
    style boundary fill:none,stroke:#1168bd,stroke-width:2px,stroke-dasharray:5
```

### Level 2: Containers

Each tier is a container with its own runner and trigger. A tier moves right as it gets slower: what cannot fit a pull request runs nightly and gates the next pull request through a ratchet file rather than by blocking.

```mermaid
flowchart LR
    subgraph local ["Local: pre-commit, pre-push, check:local"]
        direction TB
        staged["lint-staged<br/>ESLint + Prettier"]
        checklocal["npm run check:local<br/>every offline CI tier"]
    end

    subgraph pr ["Pull request, gate: ci-success"]
        direction TB
        unit["Unit + BDD + composition<br/>config/jest/unit.config.cjs"]
        props["Properties and fuzz<br/>config/jest/fuzz.config.cjs"]
        faults["Fault catalogue<br/>config/jest/faults.config.cjs"]
        replay["Recorded replay<br/>config/jest/contract.replay.config.cjs"]
        live["Live contract<br/>soft-skips on 503"]
        types["tsd · api-extractor · publint · attw · size-limit"]
        consumer["Consumer matrix<br/>ESM/CJS x node16/nodenext/bundler"]
        docs["Documentation examples"]
        mutpr["Mutation of changed files<br/>Stryker --incremental"]
        bench["Benchmarks base vs head<br/>only when hot paths change"]
        statics["Static analysis<br/>export coverage · determinism · layers · suite health · seam lint"]
    end

    subgraph night ["Nightly: reports and issues, never blocks directly"]
        direction TB
        nmut["Full mutation, unit + BDD + type"]
        nprops["Properties at 10 000 runs"]
        nfaults["Payload fuzz, every endpoint"]
        nrec["Re-record payloads, diff, open a PR"]
        nbench["Benchmarks vs pinned reference + heap soak"]
        nex["Examples against live ESI"]
        nflake["No-retry run · interleavings · audit · spec drift · Schemathesis"]
    end

    subgraph weekly ["Weekly"]
        direction TB
        wlive["Live contract + oasdiff<br/>maintenance.yml"]
    end

    subgraph release ["Release"]
        direction TB
        rmatrix["Consumer matrix against the signed tarball"]
        rcanary["Post-publish canary"]
    end

    contributor(["Contributor"]) --> local
    local --> pr
    pr --> release
    night -- "updates ratchet files, opens one issue per tier" --> pr

    style contributor fill:#08427b,color:#fff,stroke:#073b6f
    style local fill:none,stroke:#1168bd,stroke-width:2px
    style pr fill:none,stroke:#1168bd,stroke-width:2px
    style night fill:none,stroke:#999,stroke-width:2px,stroke-dasharray:5
    style weekly fill:none,stroke:#999,stroke-width:2px,stroke-dasharray:5
    style release fill:none,stroke:#999,stroke-width:2px
```

### Level 3: Components of a test run

How a test reaches the code. Everything above the seam is test-owned; everything below it is the real library. Nothing between a public client method and `fetch` is stubbed, which is what lets a scenario fail for a bug anywhere in `src/`.

```mermaid
flowchart TB
    subgraph drivers ["Test drivers"]
        direction LR
        steps["BDD steps<br/>tests/bdd/steps"]
        interleave["Interleaving scheduler<br/>tests/tdd/composition"]
        catalogue["Fault catalogue<br/>tests/faults"]
        fixtures["Recorded payloads<br/>tests/contract/fixtures"]
        properties["Property runner<br/>tests/fuzz"]
    end

    seam["Transport seam: queueResponse() over jest-fetch-mock<br/>strict: an unrequested or unconsumed response fails the test"]

    subgraph lib ["ESI.ts, running for real"]
        direction TB
        client["Domain client method"]
        pipeline["Request pipeline<br/>rate limiter · circuit breaker · dedupe · retry"]
        cache["ETag cache and pagination"]
        validate["Zod validation"]
    end

    fetchboundary[/"fetch()"/]

    assertions["Assertions<br/>expect · assertNoProblems · assertThat · named invariants"]

    steps --> seam
    interleave --> seam
    catalogue --> seam
    fixtures --> seam
    properties --> seam
    seam --> client
    client --> pipeline
    pipeline --> cache
    cache --> validate
    pipeline -. "only the live tiers get here" .-> fetchboundary
    validate --> assertions
    seam -- "recorded request sequence" --> assertions

    style drivers fill:none,stroke:#1168bd,stroke-width:2px
    style lib fill:none,stroke:#0e5aa7,stroke-width:2px
    style seam fill:#1168bd,color:#fff,stroke:#0e5aa7
    style assertions fill:#1168bd,color:#fff,stroke:#0e5aa7
    style fetchboundary fill:#999,color:#fff,stroke:#888
```

## Test layout

```text
tests/
  tdd/                 unit tests: one directory per domain client or core area,
                       plus the self-tests of every gate (spec-audit, bdd-seam,
                       suite-health, determinism-lint, layers, mutation-ratchet,
                       type-mutation, consumer-contract, doc-examples,
                       package-lint, export-coverage, benchmark, verify-local, scripts)
    composition/       pipeline stages under overlapping calls, interleaving scheduler
    helpers/           describeClientErrors and shared test utilities
  bdd/
    features/          the .feature files: core/, integration/, performance/, sde/
    specs/             17 spec entries: 16 converted domains, plus step-library.spec.ts (the dry run)
    steps/             given/ when/ then/, one step per file
    step-definitions/  38 legacy defineFeature files, shrink-only (legacyStepFiles)
    support/           binder, transport seam, World, per-domain fixtures
  fuzz/                15 fast-check suites; 7 model-based *.property.test.ts (two for the SDE)
  faults/              fault catalogue, its self-test, nightly payload fuzz
  contract/            live deep contract and snapshot, recorder, shape diff
    replay/            5 replay suites
    fixtures/          recorded/ (86), recorded-negative/, unrecordable.json, known-mismatches.json
  integration/         full-stack (mocked), live-esi, client-integration,
                       esi-spec-contract, gated-auth, sde/sde-real-data
  typetests/           7 tsd files
  consumer/            a private downstream package for the consumer contract
  doc-examples/        prelude and stub fetch for test:docs-examples
  benchmark/           mitata harness, 18 tasks, heap soak
  mutation-fixture/    the known-weak clamp for Stryker's self-test
  setup/               requireLiveTests.ts, the global setup of the live configs
  support/             shared assertions
```

Each of the tier directories `tests/fuzz`, `tests/faults`, `tests/contract`, `tests/benchmark`, `tests/bdd` and `tests/tdd/composition` has an `AGENTS.md` with its rules. Read it before changing the tier.

## Running tests

```bash
npm test                     # unit + BDD + composition (config/jest/unit.config.cjs)
npm run test:watch           # the same, in watch mode
npm run coverage             # the same, with coverage and the floors
npm run bdd                  # the BDD suites only
npm run bdd:<domain>         # one BDD suite: bdd:market, bdd:resilience, bdd:sde, ... (npm run help -- bdd)
npm run bdd:steps            # BDD dry run: every step matches one definition, none unused
npm run spec:audit           # EARS and Gherkin audit of the feature files
npm run ears                 # one PASS/FAIL/NOT RUN verdict per Rule
npm run fuzz                 # properties and fuzz
npm run fuzz:properties      # the model-based properties and the SDE schema fuzz
npm run faults               # fault catalogue
npm run faults:nightly       # seeded payload fuzz over every endpoint
npm run contract:replay      # recorded payloads through the pipeline, no network
npm run test:integration     # mocked integration; live suites skip
npm run test:types           # tsd
npm run test:all             # test, bdd, test:integration, fuzz, test:types (what full-test-suite runs)
npm run check:local          # every offline CI tier in one run (below)
```

Tiers that need a build, a tarball, Docker, the network or minutes of CPU:

```bash
npm run test:consumer        # pack, install into a clean consumer, type-check and run
npm run test:docs-examples   # type-check every ts block in the docs against the tarball
npm run test:type-mutation   # after npm run build; -- --ratchet gates
npm run mutation:pr          # Stryker over your changed src/ files
npm run bench:ab -- --base ../base-worktree --head . && npm run bench:compare
npm run soak                 # heap soak, 100 000 requests
ESI_LIVE_TESTS=true npm run contract:live
ESI_LIVE_TESTS=true npm run contract:record
npm run fuzz:api             # Schemathesis against a Prism mock (Docker)
```

### Running the gates locally

`npm run check:local` runs every tier `ci.yml` gates on that works offline, and keeps going after a failure so the answer is the whole list. `check:local:fast` skips the build and the tiers that need `dist/`; `check:local:all` adds type mutation. The tier list is `TIERS` in `scripts/quality/verify-local-core.ts`, and `tests/tdd/verify-local/verify-local.test.ts` fails when `ci.yml` gains an `npm run` or a directly invoked tool that is neither in the list nor excluded with a written reason. What it leaves out and why is in [QUALITY-GATES.md](QUALITY-GATES.md#running-the-gates-locally).

## Static analysis

The lints in this tier read tests or source without running them. Each has a Jest suite in `tests/tdd/` that lints negative fixtures at their real paths and requires exactly the expected findings, so a rule that stops firing fails `npm test`.

| Command                        | What it rejects                                                                                                                                                                               | Baseline                                                     | Self-test                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------- |
| `npm run lint:suite-health`    | `.only`, `.skip`, `.todo`, assertion-free tests and Then steps, swallowed assertions, unrestored console mocks, in `tests/`                                                                   | None; every finding fails                                    | `tests/tdd/suite-health/`     |
| `npm run lint:bdd-seam`        | Any `spyOn` of an ESI client, domain client, client prototype or `ApiClient`, and reassigned client methods, in `tests/bdd/`                                                                  | None                                                         | `tests/tdd/bdd-seam/`         |
| `npm run lint:determinism`     | `Date.now()`, timers, `performance.now()`, `Math.random()` in `src/` outside the clock modules (`src/core/clock.ts`; `src/sde/clock.ts` for the SDE, which may import only the ports)         | `scripts/quality/determinism-baseline.json`, shrink-only     | `tests/tdd/determinism-lint/` |
| `npm run lint:layers`          | Imports in `src/` that point outward: core into the layers above it, ports importing anything, generated code importing anything but the ports, the SDE and the pipeline importing each other | `BASELINE` in `config/eslint/layers.rules.cjs`, shrink-only  | `tests/tdd/layers/`           |
| `npm run test:export-coverage` | A public export no file under `tests/` references                                                                                                                                             | `scripts/package/export-coverage-baseline.json`, shrink-only | `tests/tdd/export-coverage/`  |

The rule tables and reasoning are in [QUALITY-GATES.md](QUALITY-GATES.md#suite-health-lint) and [QUALITY-GATES.md](QUALITY-GATES.md#export-coverage). `npm run lint` also covers `tests/` with the `src/` rule set, under the relaxations the `tests/**` block of `eslint.config.mjs` declares; `no-floating-promises`, `no-misused-promises` and `await-thenable` stay errors there (`TEST-09`, [#271](https://github.com/lgriffin/ESI.ts/issues/271)). `lint:suite-health` and `lint:bdd-seam` add the test-only rules.

### Time and randomness

An assertion about `Expires`, retry backoff or circuit half-open timing is only deterministic if the code under test takes its time from something the test controls. `npm run lint:determinism` (`config/eslint/determinism.rules.cjs`, driven by `scripts/quality/determinism-lint.ts`) restricts these in `src/`: `Date.now()`, `new Date()` and `Date()` with no arguments, `performance.now()`, `process.hrtime`, `Math.random()`, `setTimeout`, `setInterval`, `setImmediate`, `queueMicrotask` (bare or through `globalThis`, `global`, `window`, `self`) and imports of `timers` / `timers/promises`. Parsing a date (`new Date(header)`, `Date.parse`) is allowed. The one allow-listed path is the clock module, `src/core/clock.ts`; inline `eslint-disable` comments are ignored.

The sites that exist today are counted per file and construct in `scripts/quality/determinism-baseline.json`. The baseline only shrinks: a count above its entry fails (a new site), a count below its entry fails until the entry is lowered (`npm run lint:determinism -- --update`, which never raises one), and an entry above `origin/master`'s fails. With no base ref resolvable (set `DETERMINISM_BASE_REF`, or fetch master) the check fails closed. Until call sites move to an injected clock, tests of existing timing code keep using `jest.useFakeTimers()`. They assert the exact delay or boundary (fresh at the TTL, expired one millisecond later) rather than sleeping for real and bounding `Date.now()`: a test that waits on the wall clock kills a boundary mutant on one runner and not another, which is how 43 mutants came to flip between nightlies ([#382](https://github.com/lgriffin/ESI.ts/issues/382), [MUTATION-TESTING.md](MUTATION-TESTING.md)). A test that drives the whole request pipeline and needs only `Date` frozen uses `useFakeDate()` from `tests/tdd/helpers/fakeDate.ts`.

Each restricted construct has a negative fixture in `tests/tdd/determinism-lint/fixtures/violations/`, linted through ESLint's Node API by `tests/tdd/determinism-lint/determinism-lint.test.ts`, alongside compliant fixtures that must produce no findings and the ratchet's added, stale and no-base-ref cases.

### Package lint and size budgets

**Run:** `npm run lint:package` (publint and Are The Types Wrong on the `npm pack` tarball) and `npm run size` (size-limit, after a build)
**CI:** `package-lint` in `ci.yml`, inside `ci-success`. Negative fixtures: `tests/tdd/package-lint/`, part of `npm test`.

The consumer contract installs and runs the tarball; these check it statically. The linters block on any finding outside `scripts/package/package-lint-baseline.json` under node16 CJS, node16 ESM and bundler resolution, and `.size-limit.cjs` sets a ceiling for the ESM and CJS build of every `exports` sub-path. The unit suite runs both tools against a package with a broken `exports` map and a clean control, and runs size-limit against a budget set below its fixture's size, so a check that stops firing fails `npm test`. Rules, the baseline ratchet and how to raise a budget: [QUALITY-GATES.md](QUALITY-GATES.md#package-lint-and-size-budgets).

## Unit

**Location:** `tests/tdd/`
**Config:** `config/jest/unit.config.cjs`
**Run:** `npm test`

182 suites and 6,648 tests (`npm test`, 2026-09-27). One directory per domain client, one per core area (`core/`, `schemas/`, `auth/`, `sde/`, `ports/`, `adapters/`, `config/`), and one per gate self-test. The groups that matter most:

- **Domain clients.** One test file per client. Each mocks `fetch` and checks URL construction, response parsing and the result type. The shared `describeClientErrors` helper adds the five HTTP error paths (401, 403, 404, 429, 500) to every non-trivial client.
- **Core infrastructure.** Circuit breaker, rate limiter, offset and cursor pagination, the ETag cache, request deduplication, retry with backoff, the middleware pipeline, endpoint definitions, validation, timeout, diagnostics and configuration.
- **Public API surface.** `publicApiSurface.test.ts` and `apiSurfaceSnapshots.test.ts` snapshot the public exports and the shapes of `EsiError`, `RateLimiter` status and `CircuitBreaker` stats. A rename or removal fails here before it ships under the wrong SemVer.
- **Schemas.** `schemaRejection.test.ts` is table-driven over every schema file: valid data is accepted, a wrong type is rejected, an extra field is preserved (`looseObject`). `tests/tdd/testing/TestDataFactory.schemas.test.ts` checks every factory default passes the schema its endpoint is validated with.
- **Security and resilience.** Token scoping, HTTPS and the host allowlist, path injection, query length and non-finite numbers (`security.test.ts`); 429/420 handling, malformed and truncated bodies, stale-on-error, retry and deduplication under load (`resilience.test.ts`).
- **Gate self-tests.** `spec-audit/`, `bdd-seam/`, `suite-health/`, `determinism-lint/`, `layers/`, `mutation-ratchet/`, `type-mutation/`, `consumer-contract/`, `doc-examples/`, `package-lint/`, `export-coverage/`, `benchmark/`, `verify-local/` and `scripts/`. These are what make the other tiers' signals real.

### The TDD pattern

Each domain client test builds an `ApiClient`, mocks the fetch response, calls the method and asserts the result.

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
import { AllianceClient } from '../../../src/clients/AllianceClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getBody } from '../../../src/core/util/testHelpers';
import fetchMock from 'jest-fetch-mock';

describe('AllianceClient', () => {
  let allianceClient: AllianceClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    const client = new ApiClientBuilder()
      .setClientId('test')
      .setLink('https://esi.evetech.net')
      .build();
    allianceClient = new AllianceClient(client);
  });

  it('returns alliance info', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        alliance_id: 99005338,
        name: 'Goonswarm Federation',
        ticker: 'CONDI',
      }),
    );

    const result = await getBody(() =>
      allianceClient.getAllianceById(99005338),
    );
    expect(result.name).toBe('Goonswarm Federation');
  });

  it('throws on 404', async () => {
    fetchMock.mockResponseOnce('Not Found', { status: 404 });
    await expect(allianceClient.getAllianceById(99999999)).rejects.toThrow(
      'Resource not found',
    );
  });
});
```

### The shared error helper

`describeClientErrors` (`tests/tdd/helpers/clientErrorTests.ts`) generates a `describe` block that tests the five HTTP error codes against the exact messages in `ApiRequestHandler.STATUS_MESSAGES` and checks the thrown error carries the status code. Each case builds a fresh `ApiClient` and passes it to the callback, which must construct the domain client from it: a 429 blocks the endpoint's rate-limit group for 60 seconds on the client that received it, and a shared client would make every later test in the file time out once `jest --randomize` puts the 429 case first.

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
import { describeClientErrors } from '../helpers/clientErrorTests';

describe('MarketClient', () => {
  describeClientErrors('MarketClient', (apiClient) =>
    new MarketClient(apiClient).getMarketPrices(),
  );
});
```

## Composition and concurrency

**Location:** `tests/tdd/composition/` (agent notes in its `AGENTS.md`)
**Config:** `config/jest/unit.config.cjs`, so it runs in `npm test` and Stryker covers it
**Run:** `npx jest --config config/jest/unit.config.cjs --testPathPatterns=composition`
**Nightly:** `nightly-interleave.yml`

Owns one failure class: request pipeline stages that are each correct alone but wrong together when calls overlap. Each scenario drives a real `EsiClient` with every stage on (rate limiter out of test mode, circuit breaker, deduplication, retry, ETag cache, Zod validation) and mocks only HTTP, at the BDD transport seam. The interleaving scheduler (`support/interleave.ts`) holds each request at the seam and chooses step by step which call starts, which response arrives and when fake time advances, then checks named invariants over the sequence of requests (method, path, If-None-Match) and outcomes.

| Scenario                    | Interaction                                              |
| --------------------------- | -------------------------------------------------------- |
| `retryCircuit.test.ts`      | Retry inside a circuit that has just opened              |
| `staleRefresh.test.ts`      | Stale-on-error while the stale entry is being refreshed  |
| `dedupeRejection.test.ts`   | Deduplication when the shared in-flight request fails    |
| `etagOrdering.test.ts`      | A 304 for an old ETag arriving after a 200 for a new one |
| `errorLimit.test.ts`        | The ESI error-limit back-off holding back every endpoint |
| `writeInvalidation.test.ts` | A write invalidating the cache while a read is in flight |

On every PR each scenario runs every schedule of two and three calls; the schedule counts are pinned, so a change that stops calls overlapping fails instead of silently testing less. Nightly, four calls run in seeded random order (`ESI_INTERLEAVE_RUNS` schedules, 5,000 by default). A failure prints the broken invariant, the event log and the command that replays the schedule (`ESI_INTERLEAVE_REPLAY=...`, plus `ESI_INTERLEAVE_MODE=random` for a nightly failure). The scheduler's own tests (`interleave.test.ts`) show it enumerating exactly the schedules that exist, finding and replaying a planted race, and failing closed on deadlock, nondeterminism and malformed environment variables.

## Specification (EARS/BDD)

**Location:** `tests/bdd/`
**Config:** `config/jest/unit.config.cjs` (its `testMatch` includes `tests/bdd/step-definitions/**/*.steps.ts` and `tests/bdd/specs/**/*.spec.ts`)
**Run:** `npm run bdd`, or `npm test`, which includes it

The <!-- metric:featureFiles -->73<!-- /metric --> feature files state <!-- metric:requirements -->545<!-- /metric --> requirements, one per `Rule:`, verified by <!-- metric:scenarios -->703<!-- /metric --> scenarios (`npm run spec:audit:verbose`). Every scenario mocks at the transport seam (`TEST-03`), so the rate limiter, retry, deduplication, ETag cache, JSON parsing and Zod validation all execute. Coverage by area:

- **Core** (`features/core/`, 45 files): one feature per domain client, plus the cross-cutting ones numbered from 0050: ETag caching, resilience, response headers, runtime validation, token management and request headers.
- **Integration** (`features/integration/`): cross-domain workflows such as character profile assembly and fleet operations.
- **Performance** (`features/performance/`): smoke checks that responses are waited for, concurrent calls overlap rather than queue, and large or repeated payloads come back complete and in order. These scenarios state no latency or throughput budget. The only time bounds they keep separate overlapping requests from serial dispatch; how fast a path is, and whether a change slowed it, is the [benchmark tier's](#benchmarks-and-the-heap-soak) job.
- **SDE** (`features/sde/`, 7 files): the Static Data Export provider.

### Three gates decide whether a Rule protects anything

A Rule is protection only when all three hold (`tests/bdd/README.md`, "When a Rule is protection"):

- **Well-formed:** `npm run spec:audit` holds every Rule to one `shall`, one of the five EARS patterns, a named system, no vague language, at least one Scenario under it, no Scenario outside a Rule, and a tracker tag (`@esi-<bead>` or `@gh-<issue>`) beside every `@bug` (`TEST-02`).
- **Executed:** `mkdir -p reports/bdd`, `npm run bdd -- --json --outputFile=reports/bdd/jest-results.json`, then `npm run bdd:report` joins the run to the feature files. It fails when any scenario did not execute (`feature-not-run`, `scenario-not-executed`), and writes `reports/bdd/junit.xml` with each test case named `Feature › Rule › Scenario`. The `bdd-tests` job in `ci.yml` runs both and uploads the `bdd-junit` artifact.
- **Able to fail:** `npm run mutation:bdd:ratchet` floors the BDD-only mutation score per source directory in `config/mutation/bdd-thresholds.json`: 15 floors, from 0% (`src/schemas`) and 10.6% (`src/sde`) to 42.8% (`src/core/util`). Every scored directory has one, and a directory without one fails the ratchet. See [MUTATION-TESTING.md](MUTATION-TESTING.md#where-the-scores-stand).

`npm run validate:spec-consistency` (`scripts/spec/rule-schema-check.ts`) adds a fourth, narrower check in the `spec-audit` job: a Rule that names a response field the schema marks optional must say so.

`npm run charter:audit` (`scripts/quality/charter-audit.ts`) holds `guides/CHARTER.md` to the same form (`PROC-06`): every `####` requirement block has one `shall`, names its system, follows one of the five EARS patterns with the header's pattern matching its leading keyword, and contains no vague language; a block whose status is Enforced must name, in backticks, a script (`npm run <script>`), a job or workflow under `.github/workflows/`, or a file in the repository that exists (branch protection is the one mechanism accepted by name, since it lives in GitHub's settings). It runs in the same `spec-audit` job, in `check:all` and in `check:local`, and its checks in `scripts/quality/charter-audit-core.ts` are unit-tested against fixtures in `tests/tdd/scripts/charter-audit.test.ts`.

#### The standalone EARS check

`npm run ears` runs the first two gates on their own, outside `npm test`, and answers per requirement rather than per scenario. It runs the spec audit, runs the BDD scenarios with Jest's JSON output, joins the run to the feature files, and gives every `Rule:` one verdict:

- **PASS** (verified): every scenario under the Rule ran and passed.
- **FAIL** (failing): at least one scenario under it ran and failed.
- **NOT RUN** (unverified): nothing failed, but a scenario under it did not execute, so the Rule is documentation, not protection.

It exits 1 when the audit fails or any requirement is not PASS, and writes `reports/ears/`:

- `ears-report.md`: the totals, the requirements not verified and why, the exclusion register, advisory feedback on the specification (the EARS pattern mix, how many requirements rest on a single scenario, and which features state no `If …, then … shall` unwanted-behaviour requirement), then every requirement by feature;
- `ears-report.json`: the same data for tooling;
- `junit.xml`: the scenario-level JUnit report `bdd:report` writes.

Each requirement has an id, `<feature file stem>#R<n>` (for example `0023-market#R4`), counting Rules from 1 in file order, so a verdict can be quoted and found.

**The exclusion register.** What the client deliberately does not do is a requirement too (CHARTER `TEST-11`): an exclusion is written as an unwanted-behaviour Rule whose response is negated, `If <condition>, then the <system> shall not <response>.`, with a scenario that proves the absence. The report's "Exclusion register" section lists every such Rule with its id, verdict and the scenarios under it, and the console totals count them (`Exclusions (shall not)`); `ears-report.json` carries `exclusion: true` on each. The register is a listing, not a gate: it cannot know what the client should ignore, so its completeness is a review question. An exclusion stated only in prose (a guide, a code comment) does not appear and protects nothing. `tests/bdd/GUIDE.md` has a worked example of writing one.

```bash
npm run ears                          # everything
npm run ears -- --only=market         # features whose path contains "market"
npm run ears -- --results=<jest json> # report an existing run without re-running it
npm run ears -- --skip-audit          # verdicts only
```

`.github/workflows/ears.yml` runs the same command on pull requests that touch `src/`, `tests/bdd/` or the EARS scripts, and on demand from the Actions tab; the report is the `ears-report` artifact and the job summary. It is advisory: `bdd-tests` and `spec-audit` in `ci.yml` already gate the same ground.

### The BDD pattern

A Rule states the requirement; the scenario under it describes one case as an HTTP exchange. From `tests/bdd/features/core/0023-market.feature`:

```gherkin
Rule: When current market prices are requested, the Market client shall return each entry with a type_id, and a numeric average_price and an adjusted_price when present.
  The price endpoint is the cheapest way to value an arbitrary item. The two
  prices differ in meaning, so both are carried through rather than collapsed
  into one figure.

  Scenario: Price list returns average and adjusted prices per type
    Given the market system is operational
    When the client requests current market prices
    Then the client shall return price data for all tradeable items
```

The feature is bound by a spec entry at the same path under `tests/bdd/specs/`, whose whole content is `bindFeature(__filename)`. Each step is one file under `tests/bdd/steps/<keyword>/`, named after its pattern, and found by its text from any feature:

<!-- doc-example: no-check contributor example: BDD step files inside this repository, importing tests/bdd/support -->

```typescript
// tests/bdd/steps/given/the-market-system-is-operational.ts
import { marketFixtures, marketPaths } from '../../support/market';
import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

Given('the market system is operational', function () {
  queueResponse({
    match: marketPaths.prices,
    body: marketFixtures.priceList(),
  });
});

// tests/bdd/steps/when/the-client-requests-current-market-prices.ts
import { When } from '../../support/steps';

When('the client requests current market prices', async function () {
  this.result = await this.client.market.getMarketPrices();
});

// tests/bdd/steps/then/the-client-shall-return-price-data-for-all-tradeable-items.ts
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then('the client shall return price data for all tradeable items', function () {
  expect(lastRequest().method).toBe('GET');
  expect(this.result).toEqual([
    { type_id: 34, average_price: 5000000.0, adjusted_price: 5100000.0 },
    { type_id: 35, average_price: 15000000.0, adjusted_price: 15200000.0 },
  ]);
});
```

The Given queues what ESI sends back; the When calls the real client method; the Then asserts on the result and on what went over the wire. The transport is strict: a request with no queued response fails the scenario, and so does a queued response nobody requested. `jest.spyOn` on a client method is rejected by `npm run lint:bdd-seam`, because a scenario that mocks the method it exists to exercise cannot fail for any bug in it. The rules are in [`tests/bdd/README.md`](../tests/bdd/README.md); the long-form walkthrough, including how to choose an EARS pattern, is [`tests/bdd/GUIDE.md`](../tests/bdd/GUIDE.md). Agents follow the `ears-gherkin-dev` skill, which enforces Red before Green (`TEST-01`).

### The legacy step-file migration

Each feature file is run by exactly one of two things, and the audit fails a feature with neither or both. Sixteen domains are converted to spec entries and the global step library (`tests/bdd/specs/core/`, 16 files, plus `step-library.spec.ts`, the dry run). The other 38 features still run through legacy `defineFeature` files in `tests/bdd/step-definitions/`, each listed in `legacyStepFiles` in `scripts/spec/spec-audit-exceptions.json`. That list ratchets against the integration branch: it gains no entry, every entry must exist, and a legacy file not on it fails the audit. Converting a domain moves each step into its own file, moves fixtures and paths into `tests/bdd/support/<domain>.ts`, adds the spec entry, deletes the legacy file and removes its line from the list. The `unconverted` list in the same file, for features not yet in Rule form, is empty.

## Type tests

**Location:** `tests/typetests/` (7 files: `index`, `createClient`, `endpoint-args`, `branded-ids`, `error-guards`, `result-type`, `domain-responses`)
**Run:** `npm run test:types` (tsd)
**CI:** `full-test-suite` in `ci.yml`, through `npm run test:all`

Compile-time assertions on the consumer-facing type surface (`TEST-06`): endpoint argument inference, branded IDs, error guards, the result envelope and domain response types. Half the value of the library is at the type level, and a refactor can break inference without failing a runtime test. The tier's own signal is [type mutation](#type-mutation).

## Properties and fuzz

**Location:** `tests/fuzz/` (read `tests/fuzz/AGENTS.md` first)
**Config:** `config/jest/fuzz.config.cjs`
**Run:** `npm run fuzz` (12 suites, 957 tests, 2026-09-27); `npm run fuzz:properties` for the model-based ones and the SDE schema fuzz
**CI:** `fuzz-tests` in `ci.yml`; `nightly-properties.yml` at 10,000 runs per property

Unit tests check the inputs someone thought of. Properties check invariants across every input fast-check generates, including the ones nobody would write by hand: an object whose `toString` returns an array, a string with an embedded null byte, an integer at `MAX_SAFE_INTEGER`. The first fuzz run found that `validatePathParam` throws a raw `TypeError` rather than an `EsiError` for such an object; that is still open (see [Known gaps](#known-gaps)).

The model-based properties (`*.property.test.ts`) register through `describeProperty` in `support/property.ts`, drive real domain clients against a fake ESI at the fetch seam (`support/fakeEsi.ts`), and must fail against known-bad implementations registered beside them:

| File                                     | Invariant                                                                                                                   |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `circuit-breaker-model.property.test.ts` | `CircuitBreaker` matches a closed/open/half-open reference model under any command sequence, including overlapping calls    |
| `pagination-assembly.property.test.ts`   | Eager, `fetchAll*` and cursor walks return every page once, in order, for any page count, failure pattern and arrival order |
| `cache-key.property.test.ts`             | Cache keys are deterministic, injective, in canonical query order, and scoped to the access token                           |
| `etag-cache-model.property.test.ts`      | The ETag cache predicts every request, If-None-Match, result and stored entry across calls, identities, faults and time     |
| `backoff.property.test.ts`               | `retryDelay` is finite, in `[0, maxDelayMs]` and monotonic in attempt for any jitter value                                  |

The older fuzz files are plain fast-check tests:

| File                                          | Invariant                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parameter-fuzz.test.ts`                      | `validatePathParam()` and `validateQueryParam()`: positive integers pass and return their string form; null, undefined and empty strings are rejected; strings with an unsafe path character (``/\?#@!$&'()*+,;=<>{}\|^` ``) are rejected; NaN and ±Infinity are rejected; objects and arrays never pass                                                          |
| `url-construction-fuzz.test.ts`               | `buildEndpointPath()`: no `{param}` placeholder survives substitution; slashes and the dot segments `.` and `..` are rejected; other special characters are percent-encoded; the body is extracted                                                                                                                                                                |
| `schema-fuzz.test.ts`                         | Every Zod schema in `src/schemas/`: `safeParse()` never throws for any input from `fc.anything()`, and non-object primitives are rejected where an object is expected                                                                                                                                                                                             |
| `pagination-fuzz.test.ts`                     | The page parameter: zero, negative, float, NaN, Infinity, large and numeric-string values are accepted or rejected as the validator says                                                                                                                                                                                                                          |
| `domain-property-fuzz.test.ts`                | Generated military-campaign and corporation-project bodies parse under their schemas                                                                                                                                                                                                                                                                              |
| `response-validation-fault-injection.test.ts` | A body that violates an endpoint's `responseSchema`, served through the BDD transport seam, rejects with an `EsiValidationError` (`direction: 'response'`, status `0`, the request URL) whose Zod issues match the schema's own verdict, after exactly one request; safe mode returns it as `{ ok: false }`; `validateResponse: false` returns the body unchanged |
| `run-settings.test.ts`                        | `FC_NUM_RUNS`, `FC_SEED` and `FC_PATH` fail closed: a malformed value stops the run instead of falling back to the defaults                                                                                                                                                                                                                                       |

A failing property prints the shrunk counter-example, the violated invariant, the seed, the path and the exact replay command (`FC_SEED=... FC_PATH=... npx jest --config config/jest/fuzz.config.cjs --testPathPatterns ...`). A counter-example is committed as a named example test in the same file before the fix; a generator or invariant is never weakened to make one go away.

## Fault injection

**Location:** `tests/faults/` (read `tests/faults/AGENTS.md` first)
**Config:** `config/jest/faults.config.cjs`, `config/jest/faults.nightly.config.cjs`
**Run:** `npm run faults` (2 suites, 148 tests, 2026-09-27), `npm run faults:nightly`
**CI:** `fault-catalogue` in `ci.yml`; `nightly-faults.yml`

This tier owns what the client does when the network misbehaves. It serves faults through the BDD transport seam, so the whole pipeline runs: rate limiter, retry, deduplication, ETag cache, JSON parsing and validation. Timers and `Date` run on Jest's fake clock, driven by the runner, so a 60-second rate-limit block costs nothing and elapsed time is exact.

**The catalogue** (`catalogue.ts`) is a list of named faults, each a transformation of a target's good exchange: truncated, empty or HTML bodies on a 200; the wrong Content-Type; Expires in the past or unparseable; a 304 with no ETag or no cached entry; a reset before the headers, a reset part way through the body, a stalled body, no response before the timeout; 5xx with an HTML body with and without a cached entry; 502 without a reason phrase; 400 and 500 with ESI's error JSON; 420 with and without `X-ESI-Error-Limit-*`; 429 with Retry-After in seconds, as an HTTP date and absent; X-Pages that grows or shrinks between pages; schema violations, `null`, unknown fields and schema-valid absurd values.

Every fault cites the `Rule:` (or guide section) that specifies the answer and asserts the whole outcome: the error class, status or code and an anchored message, or the resolved value and `meta.stale`; the exact request count; what the cache holds afterwards, probed through the transport; the elapsed virtual time; and every warn/error log entry. `npm run faults` applies the catalogue to five targets: `status.getStatus` (public GET), `location.getCharacterLocation` (authenticated GET), `market.getMarketOrders` (X-Pages), `freelanceJobs.getFreelanceJobs` (cursor) and `universe.postNamesAndCategories` (POST).

**The signal.** `catalogue.selftest.test.ts` holds the tier's ratchet: the number of faults without a resolvable Rule or a fully specified outcome stays **0**. It proves the gate with `fixtures/weak-fault.ts`, which must be rejected on every count, and proves the runner by running a real fault with wrong expectations and requiring every broken invariant to be reported. Faults that expose an unfixed bug sit in `known-gaps.json` with their bead; the list only shrinks against `origin/master` (it fails closed without the ref), a listed fault that starts passing fails the run, and the list is empty today.

**Nightly payload fuzz** (`payload-fuzz.nightly.test.ts`) covers every endpoint definition with a `responseSchema`. `zodArbitrary.ts` derives fast-check arbitraries from the Zod schema; each generated body must come back unchanged, and each single-point mutation must either reject with an `EsiValidationError` carrying one Zod issue at the mutated path (a dropped required field, a wrong type, a `null`) or, for an unknown field, resolve with the field preserved. The seed is printed; `FAULTS_SEED` replays it and `FAULTS_RUNS` sets cases per endpoint (default 100). `nightly-faults.yml` runs it with the catalogue and keeps one issue, "Nightly fault tier failing", open while it fails.

Decisions the tier pins, so a change to them is deliberate: Content-Type is not trusted (the body decides); Expires is ignored for freshness; page 1's X-Pages is authoritative; and schema-valid but absurd values (a negative `volume_remain`) pass through unchanged and unlogged, because schemas check shape and ESI is the source of truth.

## Recorded replay

**Location:** `tests/contract/replay/`, fixtures in `tests/contract/fixtures/recorded/`, agent notes in [`tests/contract/AGENTS.md`](../tests/contract/AGENTS.md)
**Config:** `config/jest/contract.replay.config.cjs`
**Run:** `npm run contract:replay` (5 suites, 121 tests, 2026-09-27; no network). One endpoint: `npm run contract:replay -- -t "market.getMarketOrders"`.
**Record:** `ESI_LIVE_TESTS=true npm run contract:record [-- --only=<endpoint key>]` (refuses to run without `ESI_LIVE_TESTS=true`)
**CI:** `contract-replay` in `ci.yml`; `nightly-recorded-payloads.yml` re-records

The live contract checks the spec against the endpoint definitions. This tier checks the other truth: the bodies ESI actually sends. `tests/contract/record.ts` records one sanitised response per public (unauthenticated) GET endpoint definition, calling the real client method with a capturing `fetch` so the URL, `User-Agent` and `X-Compatibility-Date` are the client's own, then sending that request itself one at a time (stopping on a 420, waiting out a 429 once, pausing when the error limit runs low). Each fixture keeps the `ETag`, `Expires`, `Last-Modified`, `Cache-Control`, `Content-Type` and `X-Pages` headers, the compatibility date, the hash of the OpenAPI document served for it and the operation's `x-cache-age`. Arrays, maps and long strings are truncated, every cut is listed in `truncated`, paginated endpoints keep two pages with `X-Pages` rewritten to match and the upstream count kept in `upstreamPages`. Fixtures are capped at 24 KiB each and 256 KiB together (`tests/contract/recorded/policy.ts`); the 86 fixtures take 166 KiB (`cat tests/contract/fixtures/recorded/*.json | wc -c`).

Each replay goes through the BDD transport seam, so the whole pipeline runs, and checks that:

- the endpoint's Zod schema accepts the recorded body;
- the returned value keeps every key path of the recording, and a field added to the body survives validation;
- offset pagination sends one request per recorded page;
- within the recorded `x-cache-age` a second call is served from the cache, and after it the client revalidates with `If-None-Match` set to the recorded ETag.

`coverage.test.ts` fails when a public GET endpoint has neither a fixture nor an entry in `tests/contract/fixtures/unrecordable.json`, when an entry or fixture is stale, when a fixture was recorded under a different compatibility date than the client sends, and when the size budget is exceeded. `unrecordable.json` (one entry: `dogma.getDynamicItemInfo`, which needs a mutated item ID no public endpoint lists) and `known-mismatches.json` (empty) only shrink against `origin/master`, and the check fails closed when no base ref can be read. The failure signal is `tests/contract/fixtures/recorded-negative/status.getStatus.json`, a recording with `players` edited to a string, which the replay must reject with an `EsiValidationError` naming `players`.

`nightly-recorded-payloads.yml` re-records every night, restores fixtures whose shape did not change (`npm run contract:shape-diff -- --revert-unchanged`: status, which cache headers are sent, and the JSON type at each key path; values such as prices, IDs and ETags are ignored), replays the rest and opens a pull request with the shape diff and the replay result. Nothing merges automatically. A failed run keeps an issue labelled `recorded-payloads-check-failed` open.

## Live contract

**Location:** `tests/contract/esi-contract.test.ts`, `tests/contract/esi-snapshot.test.ts`, helpers in `tests/contract/helpers.ts`
**Config:** `config/jest/contract.live.config.cjs` (extends `config/jest/contract.config.cjs` with a global setup that fails unless `ESI_LIVE_TESTS=true`)
**Run:** `ESI_LIVE_TESTS=true npm run contract:live`
**CI:** `contract-tests` in `ci.yml`, soft-skipping on HTTP 503 (`TEST-08`); weekly in `maintenance.yml`

`npm run contract` uses the base config, whose suites skip without `ESI_LIVE_TESTS`; CI runs `contract:live` so that a dropped variable fails instead of passing an empty run. This is the tier that tells the project CCP moved something (`TEST-05`).

**Deep contract** (`esi-contract.test.ts`) extracts every endpoint definition from the `*Endpoints.ts` files and validates it against the live ESI OpenAPI 3.1 document in eight dimensions:

- **Path parameters:** `{param}` names in the spec path match the definition's `pathParams`.
- **Query parameters:** the spec's `required: true` query parameters appear in `queryParams`.
- **Request body:** spec `requestBody` presence matches `hasBody` / `bodyBuilder`.
- **Auth:** spec OAuth security matches `requiresAuth`.
- **HTTP method:** the definition's method matches the spec operation.
- **Response schema coverage** (advisory): GET endpoints with JSON responses have a Zod `responseSchema`.
- **Pagination contract** (advisory): spec `X-Pages` headers align with the pagination metadata.
- **Deprecation sync** (advisory): spec `deprecated: true` matches the definition's `deprecated`.

Known deviations sit in three named exception sets at the top of the file, each entry with its reason. An unknown mismatch hard-fails. The four deviations the first run found are all still listed:

| Endpoint                       | Exception set                  | Mismatch                                                                            |
| ------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------- |
| `getCorporationStarbaseDetail` | `KNOWN_QUERY_PARAM_EXCEPTIONS` | The spec requires query parameter `system_id`; the definition passes it in the path |
| `createFleetWing`              | `KNOWN_BODY_EXCEPTIONS`        | The definition sends an empty body; the spec has no `requestBody`                   |
| `getCorporationHistory`        | `KNOWN_AUTH_EXCEPTIONS`        | The definition sets `requiresAuth: true`; the spec is public                        |
| `getMarketOrdersInStructure`   | `KNOWN_AUTH_EXCEPTIONS`        | The spec requires auth; the definition sets `requiresAuth: false`                   |

**Snapshot comparison** (`esi-snapshot.test.ts`) compares `tests/contract/snapshots/esi-openapi.snapshot.json` with the live spec and reports path additions and removals, schema count changes and cache TTL drift as advisory warnings.

### Spec-drift tools

| Tool         | Command                                                          | What it does                                                                                                                     | Where it runs                                 |
| ------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| oasdiff      | `npm run contract:diff` (Docker)                                 | Breaking changes between the committed snapshot and the live spec                                                                | Weekly, `maintenance.yml`                     |
| Snapshot     | `npm run contract:snapshot` (`scripts/spec/snapshot-openapi.ts`) | Refreshes the committed spec baseline                                                                                            | Weekly, `maintenance.yml`, before oasdiff     |
| Prism        | `npm run mock:esi`                                               | A spec-conformant ESI mock on port 4010                                                                                          | Locally, and under Schemathesis               |
| Schemathesis | `npm run fuzz:api` (`scripts/spec/run-schemathesis.sh`, Docker)  | Downloads the spec, strips security requirements, serves it with Prism and fuzzes it; fails only on failures in its JUnit report | Nightly 01:00 UTC, `nightly-schemathesis.yml` |

Schemathesis is the API fuzz tier. It fuzzes a mock generated from the spec, so it finds contradictions inside the spec, not bugs in this client, and it has no negative fixture proving it can fail. It uploads `schemathesis-report`, and a failed night opens or comments on the issue titled "api-fuzz: nightly Schemathesis run failed", which the next green night closes. Missing endpoints, stale generated types and schema drift are checked nightly by `nightly-spec-drift.yml`, described in [QUALITY-GATES.md](QUALITY-GATES.md#nightly-spec-drift).

## Integration

Integration tests live in `tests/integration/` and run with `config/jest/integration.config.cjs`, outside `npm test`. `npm run test:integration` runs all six files: the mocked suite passes and the live ones skip unless their environment is present (6 suites, 177 tests: 20 pass, 157 skip, 2026-09-27).

| File                         | Tests | Needs                              | What it covers                                                                                                                                                                                                                                         |
| ---------------------------- | ----: | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `full-stack.test.ts`         |    20 | nothing                            | The full request lifecycle with mocked fetch: ETag round trip, circuit breaker trip and recovery, middleware order, 401 refresh and retry, pagination assembly, error propagation, construction patterns, per-client cache isolation                   |
| `live-esi.test.ts`           |    40 | `ESI_LIVE_TESTS=true`              | Real HTTP to 42 public endpoints across status, alliances, market, universe, dogma, wars, industry, insurance, incursions, sovereignty, route, faction warfare and killmails, plus the rate-limit headers; each checks HTTP 200 and the response shape |
| `client-integration.test.ts` |    11 | `ESI_LIVE_TESTS=true`              | The real `EsiClient` against live ESI: ETag round trip, rate-limit tracking, multi-page assembly of `universe/types`, a 404, route calculation, diagnostics                                                                                            |
| `esi-spec-contract.test.ts`  |    10 | `ESI_LIVE_TESTS=true`              | Surface drift against the live spec. Phantom endpoints, method mismatches and type drift warn; cache TTL and scope drift hard-fail, because they mean the generated files need `npm run generate:types`                                                |
| `gated-auth.test.ts`         |    33 | `ESI_GATED_TESTS=true` and a token | Authenticated endpoints with a real OAuth token: location, skills, wallet, assets, characters, clones, contacts, killmails, mail, fittings, industry, market, loyalty, contracts, calendar, search, faction warfare                                    |
| `sde/sde-real-data.test.ts`  |    63 | `sde-data/` on disk                | The SDE provider against a real extracted Static Data Export                                                                                                                                                                                           |

```bash
npm run test:integration                                  # mocked passes, live skips
ESI_LIVE_TESTS=true npm run test:integration              # live smoke, client integration, spec contract
npm run test:integration:live                             # live-esi.test.ts only; fails without ESI_LIVE_TESTS=true
ESI_GATED_TESTS=true ESI_ACCESS_TOKEN=<token> npm run test:integration:gated
npx cross-env ESI_LIVE_TESTS=true npm run test:integration   # Windows (PowerShell)

# One suite
npx jest --config config/jest/integration.config.cjs --testPathPatterns=full-stack
npx jest --config config/jest/integration.config.cjs --testPathPatterns=live-esi
npx jest --config config/jest/integration.config.cjs --testPathPatterns=client-integration
npx jest --config config/jest/integration.config.cjs --testPathPatterns=esi-spec-contract
```

`npm run token:create` writes a PKCE token to `.env`, which `test:integration:gated` reads. Live tests have 30-second timeouts and fail when ESI is down.

**Where they run.** The mocked suite runs on every pull request, inside `full-test-suite` (`npm run test:all`). No workflow runs the live smoke, client integration, spec contract, gated auth or real-SDE suites; they are for a contributor to run by hand. The live checks CI does run are `contract-tests` on pull requests, `maintenance.yml` weekly, and the public examples in `nightly-examples.yml`.

### Why three integration tiers

- **Mocked** (`full-stack.test.ts`) runs on every pull request. It is fast and deterministic and catches orchestration bugs between the client, the pipeline and the cache.
- **Live** (`live-esi`, `client-integration`, `esi-spec-contract`) catches what no mock can: URL construction against the real router, response shapes CCP changed, and real HTTP behaviour such as rate-limit headers.
- **Gated auth** (`gated-auth`) is the only tier that exercises token scoping against real authenticated endpoints. It needs a personal token, so it can never run unattended.

### Why a deep contract as well as a spec contract

`esi-spec-contract.test.ts` checks surface drift: endpoint counts, type field names, and whether the generated TTL and scope files are stale. The deep contract checks each endpoint definition structurally: does `pathParams` match the `{param}` names in the spec path, does the definition require auth where the spec does. Those are harder failures that catch real bugs; the first run found the four mismatches in the table above.

### Examples against live ESI

`examples/` holds runnable scripts against the real API (`npm run example:<name>`; `npm run help -- example` lists them). `nightly-examples.yml` type-checks every example and runs each one tagged `@nightly public` or `@nightly mixed` against live ESI at 04:15 UTC, opening one issue per failing example. `tests/tdd/scripts/examples-nightly.test.ts` fails `npm test` when a public endpoint has no example calling it. Details in [QUALITY-GATES.md](QUALITY-GATES.md#nightly-examples).

## Consumer contract

**Location:** `tests/consumer/` (a private downstream package), driven by `scripts/quality/consumer-contract.ts`, with the matrix checks in `scripts/quality/consumer-contract-core.ts`
**Run:** `npm run test:consumer` (`-- --skip-build` packs the existing `dist/`, `-- --tarball <path>` tests a tarball already packed, `-- --typescript oldest|repo|latest|next|<version>` picks the compiler, `-- --keep` keeps the workspace)
**CI:** `consumer-tarball` packs once, then `consumer-contract` in `ci.yml` installs that tarball on four rows: Node 22 with the oldest supported TypeScript and with npm `latest`, Node 24 with the repository's TypeScript and with `latest`. Both jobs are inside `ci-success`. `consumer-matrix-nightly.yml` adds TypeScript `next` and current Node, `release.yml` runs the four rows against the tarball it signs before anything is published, and `post-publish-canary.yml` installs what the registry serves after a release. Negative fixtures: `tests/tdd/consumer-contract/`, part of `npm test`.

Every other tier imports from `src/`, so none of them sees the package a consumer installs. This one does:

1. Installs the tarball, plus `typescript` at the chosen version, a matching `@types/node` and `esbuild`, into a copy of `tests/consumer/` in a temporary directory outside the repository, so resolution cannot fall back to the repo's `node_modules`.
2. Fails if the packed `exports` map does not list exactly the documented sub-paths (`DOCUMENTED_SUBPATHS`, the list in [SEMVER.md](SEMVER.md)), or if one is not imported by each consumer source (`src/require.cts`, `src/import.mts`, `bundler/index.mts`).
3. Type-checks six cells with `skipLibCheck: false`, so the shipped declarations are checked too. Each cell pairs an ES module or CommonJS consumer with `node16`, `nodenext` or `bundler` resolution, and each one includes a generated probe that imports every documented sub-path. The ES module probe also fails if a namespace type has a `default` member, which is what CommonJS declarations behind the `import` condition produce (esi-23g.29). Every cell runs, and the step summary shows the table.
4. Loads every documented sub-path through `require` and `import` on the running Node, then runs the emitted CommonJS and ES module consumers: a real `EsiClient` against a stubbed `fetch`, a malformed body rejected with `EsiValidationError`, and a 404, both recognised by the classes and guards imported from `./errors`. It also runs schemas, `TestDataFactory` and the SDE providers.
5. `runtime/parity.mjs` loads every sub-path under both `require` and `import`. It fails if the CJS and ESM builds export different names, or if two sub-paths in one build export the same name as different values. A class exported from `.` and `./errors` must be one class, and the root `schemas` namespace is compared with `./schemas`.
6. Bundles `import { isEsiError } from '@lgriffin/esi.ts/errors'` with esbuild. The bundle must not contain an endpoint path from the root entry, must not include `dist/index.mjs`, and must stay under 1,600 B. A bundle of `EsiClient` from `.` is the control and must contain both.
7. `runtime/sde-optional-peers.mjs` covers `js-yaml` and `adm-zip`, the optional peer dependencies of `./sde`. Steps 2 to 6 run without them installed. Before that step, `absent` checks that `./sde` loads and that `fromDirectory` and `fromZip` throw an `SdeError` naming the missing package. At the end the runner installs both, and `present` loads real YAML and ZIP files through the CJS and ESM builds.

The fixture suite writes small dual packages into a temporary `node_modules` and runs the same cell, runtime and tree-shaking checks against them with the repository's TypeScript and esbuild. The correct package must pass every check. Each broken package must be rejected by the check that owns its defect:

- A documented sub-path missing from `exports`: the exports check, every cell and the runtime probe.
- A `.d.mts` with an extensionless relative specifier: the `node16` and `nodenext` ES module cells.
- `import` types pointing at `.d.ts` in a `"type": "commonjs"` package: every ES module cell.
- `require` types pointing at `.d.mts`: the `node16` CommonJS cell.
- A light entry re-exported through the heavy one: the tree-shaking check.

Defects the contract finds are recorded as known issues against their beads: each logs while it reproduces and fails the run once it stops, so the fix has to remove the workaround. There are none open; `esi-v2s.15` (error class identity across sub-paths) and `esi-v2s.16` (`./sde` peer dependencies) were the last two.

## Documentation examples

**Location:** `scripts/docs/doc-examples.ts` and `scripts/docs/doc-examples-core.ts`; prelude and stub fetch in `tests/doc-examples/`; self-tests and fixtures in `tests/tdd/doc-examples/`
**Run:** `npm run test:docs-examples` (`-- --skip-build` packs the existing `dist/`, `-- --keep` keeps the workspace)
**CI:** `doc-examples` in `ci.yml`, Node 22, inside `ci-success`. Not part of `npm test`; the unit suite checks the annotations, the baseline and the fixtures against a stub package.

Packs the library as the consumer contract does and type-checks every fenced `ts`/`typescript` block in `README.md`, `guides/*.md`, `src/sde/README.md` and `src/sde/docs/*.md` as its own module under nodenext and bundler resolution, then runs the blocks marked `runnable` against a stubbed `fetch`. A contributor snippet that imports from `src/` or `tests/`, like the ones in this guide, carries `<!-- doc-example: no-check <reason> -->` on the line above its fence. The convention, the prelude and the shrink-only known-broken baseline (`scripts/docs/doc-examples-baseline.json`, empty) are in [DOCUMENTATION.md](DOCUMENTATION.md#documentation-examples-are-checked).

## Benchmarks and the heap soak

**Location:** `tests/benchmark/` (see [`tests/benchmark/AGENTS.md`](../tests/benchmark/AGENTS.md))
**Run:** `npm run benchmark`, `npm run bench:ab`, `npm run bench:compare`, `npm run soak`
**CI:** `benchmarks` in `ci.yml` (only when a hot path changes); `nightly-benchmarks.yml`

This tier owns one failure class: the client got slower, or started holding memory. Bundle size is owned by the size-limit budgets.

The Jest benchmark suites that used to live here asserted raw wall-clock upper bounds (`expect(elapsed).toBeLessThan(500)`) that sat 10 to 100 times above the real cost. A bound that loose cannot see a 30% regression, and a tighter one flakes on a shared runner, so they were retired rather than converted. No test asserts a latency budget. The specification's performance feature keeps only the time bounds that separate overlapping requests from serial dispatch, each at or above half the serial figure.

**Micro-benchmarks.** `tests/benchmark/tasks.ts` holds 18 tasks over the paths a client pays for on every call: parse and Zod-validate a small object, a 1000-order market page and a nested colony layout; ETag cache hit, miss, write and write-at-capacity; cache-key derivation; the spec TTL lookup; response-header parsing (`ETag`, `Expires`, `X-Pages`, rate-limit headers); the rate limiter's acquire; the circuit breaker's check; `batchFetch`; and two whole-pipeline requests against an instant transport. `harness.ts` runs them with [mitata](https://github.com/evanwashere/mitata), which batches fast operations so a 50 ns call is not lost in timer resolution, forces a collection before each task, and reports per-sample nanoseconds.

**Comparison.** A benchmark number alone means nothing; the question is "slower than what". `npm run bench:ab` bundles the harness for two trees, typically a pull request's base tip and its head, and runs them in alternating processes on one machine, so runner-to-runner noise cancels. The observation per task is one per-process median; `npm run bench:compare` applies a one-sided Mann-Whitney U test per task, Holm-adjusted across tasks at alpha = 0.05, and calls a task regressed only if the ratio of medians is also at least 1.10 and the absolute difference at least 2 ns/op. Improvements are reported. A missing baseline, too few rounds or a dropped task fails closed. The decision logic is unit-tested against synthetic distributions in `tests/tdd/benchmark/`.

**Heap soak.** `tests/benchmark/soak.ts` drives 100,000 requests through a real `EsiClient` against an in-process transport, with a bounded ETag cache and a distinct key per request. Under `--expose-gc` it forces a full collection at 50 sample points and fails when a least-squares fit over the second half projects growth beyond the threshold, when the cache exceeds its bound, or when timers or process listeners survive `shutdown()`. `npm run soak -- --inject-leak --expect-fail` runs the same soak with a response interceptor that retains every response and passes only if the leak is flagged; the unit suite runs that fixture too, so the detector is checked on every pull request.

**Where it runs.** The `benchmarks` job in `ci.yml` runs the A/B comparison (10 rounds) only when `src/core/`, `src/schemas/`, the harness, the bench scripts or the lockfile change, and otherwise reports success with a summary line. `nightly-benchmarks.yml` compares master with a pinned reference commit (15 rounds), runs the soak, publishes the trend to the `bench-data` branch, and keeps one `performance-nightly` issue open while either fails.

## Mutation

Coverage says a line ran. Mutation says a test would notice if the line were wrong. Three runs, each ratcheted (`TEST-07`):

| Run      | Command                                                  | Scope                                             | Floors                                                 | Where                                               |
| -------- | -------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| Unit     | `npm run mutation:pr` (PR), `npm run mutation` (nightly) | `src/core/**`, minus endpoints and interfaces     | `config/mutation/unit-thresholds.json`, 9 directories  | PR `mutation-pr` (changed files); nightly, 5 shards |
| BDD-only | `npm run mutation:bdd`                                   | all of `src/`, step definitions as the only tests | `config/mutation/bdd-thresholds.json`, 15 directories  | Nightly, 9 shards                                   |
| Type     | `npm run test:type-mutation -- --ratchet`                | the built `dist/**/*.d.ts`                        | `config/mutation/type-thresholds.json`, 6 entry points | Nightly                                             |

Every pull request first runs `npm run mutation:fixture`, which must see the known-weak fixture in `tests/mutation-fixture/` leave survivors and lose at least one mutant, so the gate can still go red on a run that measures nothing. A floor may only rise; lowering one fails `mutation-pr` in the pull request that tries. How the pull request run picks its files and baseline, why the nightly is sharded, how the floors were seeded, and today's scores are in **[MUTATION-TESTING.md](MUTATION-TESTING.md)**, the canonical mutation guide.

### Type mutation

**Location:** `scripts/mutation/type-mutation.ts` (CLI), `scripts/mutation/type-mutation-core.ts` (operators, sampling, ratchet), `scripts/mutation/type-mutation-run.ts` (workspaces, tsd)
**Run:** `npm run build && npm run test:type-mutation` (`-- --ratchet` gates, `-- --update` raises floors, `--max`, `--seed`, `--workers`)
**CI:** `type-mutation-testing` in `nightly-mutation.yml`. Not a pull request job.

The tsd suite is only as good as the promises it pins. Type mutation checks that the way Stryker checks the unit suite: it makes one deliberate edit to a copy of the built declarations and runs the tsd tests against it, with their `../../src` imports pointed at the copy. Mutants come from the declarations the `package.json` `exports` entries reach, found with the TypeScript compiler API:

| Operator               | Edit                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `return-unknown`       | A function, method, accessor or call signature returns `unknown`                     |
| `drop-readonly`        | A `readonly` modifier or `readonly T[]` loses `readonly`                             |
| `optional-to-required` | `x?:` becomes `x:` (properties and parameters)                                       |
| `required-to-optional` | `x:` becomes `x?:` (parameters only when nothing required follows)                   |
| `union-drop-member`    | The first, last or a nullish member of a union is dropped                            |
| `widen-literal`        | A literal, or a union of same-kind literals, becomes `string`, `number` or `boolean` |
| `remove-overload`      | One signature of an overload group is removed                                        |
| `constraint-unknown`   | `T extends X` becomes `T extends unknown`                                            |

A mutant is **killed** when tsd reports a failure in a type test, **invalid** when the mutated declarations themselves no longer compile (excluded from the score), and **survives** when tsd passes. A survivor is a missing tsd case. The score per entry point is killed / (killed + survived); the floors in `config/mutation/type-thresholds.json` run from 0 (`./testing`, `./sde`, `./sde/memory`) to 24 (`./errors`), which is the honest measure of how much of the type surface the tsd suite pins today.

About eight thousand candidates exist, so at most 500 run. Entry points take turns picking their next mutant in order of a seeded hash of the mutant's id (built from file, symbol, operator and the mutated text, not offsets), so the same seed and surface always give the same sample, and each mutant a change adds displaces at most one sampled mutant instead of reshuffling the rest. `--ratchet` refuses a non-default `--seed` or `--max`, because the floors were measured on the default sample. The report is `reports/type-mutation/type-mutation.{json,md}`.

`tests/tdd/type-mutation/` holds the negative fixture: a one-interface package whose tsd test pins `Widget.id` and never mentions `Widget.label`. The suite runs the real mutation against it and fails unless making `id` optional is killed and making `label` optional survives.

## How the tests are wired

### Jest configurations

Nine Jest configs (`ls config/jest/*.config.cjs`):

| Config                                    | `testMatch`                                                | Timeout | Notes                                                                   |
| ----------------------------------------- | ---------------------------------------------------------- | ------: | ----------------------------------------------------------------------- |
| `config/jest/unit.config.cjs`             | `tests/tdd/**/*.test.ts`, BDD `*.steps.ts` and `*.spec.ts` | default | `npm test`; coverage floors; setup enables `jest-fetch-mock`            |
| `config/jest/fuzz.config.cjs`             | `tests/fuzz/**/*.test.ts`                                  |    30 s |                                                                         |
| `config/jest/faults.config.cjs`           | `tests/faults/**/*.test.ts` except `*.nightly.test.ts`     |    30 s |                                                                         |
| `config/jest/faults.nightly.config.cjs`   | `tests/faults/**/*.nightly.test.ts`                        |   600 s |                                                                         |
| `config/jest/contract.replay.config.cjs`  | `tests/contract/replay/**/*.test.ts`                       |    30 s | No network                                                              |
| `config/jest/contract.config.cjs`         | `tests/contract/**/*.test.ts` except `replay/`             |    60 s | Suites skip without `ESI_LIVE_TESTS`                                    |
| `config/jest/contract.live.config.cjs`    | as `config/jest/contract.config.cjs`                       |    60 s | Global setup fails unless `ESI_LIVE_TESTS=true`; what CI runs           |
| `config/jest/integration.config.cjs`      | `tests/integration/**/*.test.ts`                           |    30 s | Mocked suite runs; live and gated suites skip without their environment |
| `config/jest/integration.live.config.cjs` | `tests/integration/live-esi.test.ts`                       |    30 s | Global setup fails unless `ESI_LIVE_TESTS=true`                         |

`config/jest/unit.config.cjs` loads `tests/setup/jest.setup.ts` (enables `jest-fetch-mock`, builds a shared `ApiClient` with the rate limiter in test mode, resets both before each test) and the global setup and teardown beside it.

### Mocking

Unit tests mock `fetch` directly with [jest-fetch-mock](https://github.com/jefflau/jest-fetch-mock). The specification, composition, fault, replay and property tiers mock at the transport seam instead: `tests/bdd/support/transport.ts` (and `tests/fuzz/support/fakeEsi.ts` for properties) install a handler on `jest-fetch-mock` that serves queued or computed responses and records every request. No test outside the live tiers makes a real HTTP request.

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
import fetchMock from 'jest-fetch-mock';

fetchMock.mockResponseOnce(JSON.stringify({ name: 'Jita' }));
const result = await universeClient.getSystemById(30000142);
expect(result.name).toBe('Jita');

fetchMock.mockResponseOnce('Not Found', { status: 404 });
await expect(client.getAllianceById(99999999)).rejects.toThrow(
  'Resource not found',
);
```

### Test helpers

**`src/core/util/testHelpers.ts`** provides `getBody()`, which unwraps a client result in TDD tests.

**`src/testing/TestDataFactory.ts`** (the `./testing` sub-path) builds mock data with sensible defaults and optional overrides:

<!-- doc-example: no-check contributor example: a test inside this repository, importing src/ -->

```typescript
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

const alliance = TestDataFactory.createAllianceInfo();
// => { alliance_id: 99005338, name: 'Goonswarm Federation', ticker: 'CONDI', ... }

const custom = TestDataFactory.createAllianceInfo({
  name: 'My Alliance',
  ticker: 'TEST',
});

const notFound = TestDataFactory.createError(404);
// => EsiError { statusCode: 404, message: 'Resource not found' }
```

Available factory methods:

| Method                                 | Returns                        |
| -------------------------------------- | ------------------------------ |
| `createAllianceInfo()`                 | `AllianceInfo`                 |
| `createAllianceContact()`              | `AllianceContact`              |
| `createAllianceContactLabel()`         | `AllianceContactLabel`         |
| `createCharacterInfo()`                | `CharacterInfo`                |
| `createCharacterPortrait()`            | `CharacterPortrait`            |
| `createCharacterAttributes()`          | `CharacterAttributes`          |
| `createCharacterSkill()`               | `CharacterSkill`               |
| `createCharacterRoles()`               | Roles object                   |
| `createCharacterLocation()`            | Location object                |
| `createCharacterSkills()`              | Skills summary                 |
| `createCharacterAsset()`               | Asset object                   |
| `createCharacterMarketOrder()`         | Character market order         |
| `createCharacterOrderHistory()`        | Order history entry            |
| `createCharacterMedal()`               | Medal object                   |
| `createCharacterNotification()`        | Notification object            |
| `createCorporationInfo()`              | `CorporationInfo`              |
| `createCorporationHistoryEntry()`      | Corp history entry             |
| `createCorporationMemberRoles()`       | Member roles object            |
| `createCorporationAsset()`             | Corp asset object              |
| `createCorporationStructure()`         | Structure object               |
| `createCorporationWallet()`            | Wallet division                |
| `createMarketOrder()`                  | `MarketOrder`                  |
| `createMarketPrice()`                  | Price object                   |
| `createMarketHistory()`                | History entry                  |
| `createWalletTransaction()`            | `WalletTransaction`            |
| `createCorporationWalletTransaction()` | `CorporationWalletTransaction` |
| `createWalletJournalEntry()`           | Journal entry                  |
| `createContract()`                     | `Contract`                     |
| `createPublicContract()`               | `PublicContract`               |
| `createFleetInfo()`                    | Fleet object                   |
| `createFleetMember()`                  | Fleet member                   |
| `createFleetWing()`                    | Fleet wing                     |
| `createIndustryJob()`                  | Industry job                   |
| `createCorporationIndustryJob()`       | Corporation industry job       |
| `createBlueprint()`                    | Blueprint object               |
| `createSolarSystem()`                  | System object                  |
| `createStation()`                      | Station object                 |
| `createStructure()`                    | Structure object               |
| `createItemType()`                     | Type object                    |
| `createItemGroup()`                    | Group object                   |
| `createStar()`                         | Star object                    |
| `createPlanet()`                       | Planet object                  |
| `createSearchResults()`                | Search result set              |
| `createEntityName()`                   | Named entity                   |
| `createSovereigntySystem()`            | Sovereignty system (combined)  |
| `createSovereigntyHub()`               | Sovereignty hub                |
| `createOrbitalSkyhook()`               | Orbital skyhook                |
| `createRaidableSkyhook()`              | Raidable skyhook               |
| `createMercenaryDen()`                 | Mercenary den                  |
| `createMercenaryTacticalOperation()`   | Mercenary tactical operation   |
| `createAccessListEntry()`              | Access list entry              |
| `createError(statusCode)`              | `EsiError`                     |
| `createTestScenarios()`                | Full test scenario set         |
| `createPerformanceTestData(size)`      | Bulk test data                 |
| `createRealisticTestData()`            | Linked alliance/corp/character |

Every payload builder's default output passes the Zod schema its endpoint is validated with. `tests/tdd/testing/TestDataFactory.schemas.test.ts` enforces this, so a new builder must be added to its map. The same test checks that builders leave out fields ESI never sends (an entity's own ID on its detail route, for example) and include the fields its spec marks required.

## Schema validation, level by level

Zod validation is tested at four levels, each owning a different question:

| Level       | Where                                                                                          | Question                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Schema      | `tests/tdd/schemas/` (`schemaRejection.test.ts` and others)                                    | Does each schema accept a valid body, reject a wrong type and preserve an extra field?                |
| Property    | `tests/fuzz/schema-fuzz.test.ts`                                                               | Does `safeParse()` never throw, whatever it is given?                                                 |
| Pipeline    | `tests/fuzz/response-validation-fault-injection.test.ts`, the fault catalogue, recorded replay | What does a consumer receive when ESI sends a body the schema rejects, or a real body it must accept? |
| Requirement | `tests/bdd/features/core/0053-runtime-validation.feature`, `npm run validate:spec-consistency` | What does the specification promise, and does every Rule agree with the schema about optional fields? |

## Testing your application

An application's own tests run without ESI by handing the runtime a mock transport. `createMockTransport()` from `@lgriffin/esi.ts/testing` is an `HttpTransport`: it answers requests from a table of routes and records every request it saw. Everything between the application's call and the transport is the SDK's real pipeline (URL building, headers, retries, the cache, pagination, response validation), so a test written against it can fail for a bug in the SDK as well as in the application. The specification is [`0057-mock-transport.feature`](../tests/bdd/features/core/0057-mock-transport.feature).

```typescript
import { createEsi, identityFromToken } from '@lgriffin/esi.ts/client';
import { createMockTransport } from '@lgriffin/esi.ts/testing';

const transport = createMockTransport()
  .respond({
    method: 'GET',
    path: '/status',
    body: {
      players: 12,
      server_version: '1',
      start_time: '2026-09-16T11:00:00Z',
      vip: false,
    },
  })
  .respond({
    method: 'GET',
    path: '/characters/{character_id}/wallet',
    body: 1234567.89,
    times: 1,
  })
  .respond({
    method: 'POST',
    path: /\/universe\/names/,
    status: 200,
    body: [],
  });

const esi = createEsi({ userAgent: 'my-app/1.0 (you@example.com)', transport });
const wallet = await esi
  .as(identityFromToken(token))
  .character(characterId)
  .wallet.get();

transport.sent[0]?.headers['authorization']; // "Bearer <token>"
transport.unrouted; // [] when every request had a route
transport.reset(); // forget the routes and the record, keep the runtime
```

A route is one `respond()` call:

| Field     | Meaning                                                                                                                                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `method`  | The HTTP method, compared without regard to case. Omitted, any method.                                                                                                                                      |
| `path`    | The ESI path template as the spec writes it (`{character_id}` stands for one segment, a trailing slash is ignored, the query string is not compared), or a regular expression tested against the whole URL. |
| `status`  | 200 to 599. Default 200.                                                                                                                                                                                    |
| `headers` | Response headers, such as `x-pages` for a paginated route or `etag`.                                                                                                                                        |
| `body`    | An object, array, number or boolean is JSON-encoded as `application/json`; a string is sent verbatim; omitted, no body.                                                                                     |
| `times`   | How many matching requests the route answers before it is retired. Omitted, every one.                                                                                                                      |

Routes are tried in the order added and the first match answers. A request no route answers is rejected with an `EsiConfigurationError` (code `CONFIGURATION_ERROR`) naming the request and the route table. The pipeline passes an `EsiError` a transport throws through unchanged, so the call fails at once under that name, without a retry and without falling back to a stale cache entry as an HTTP 5xx would; the transport lists the request under `unrouted`. `sent` holds every request in order, header names in lower case, the body as a string or `undefined`.

`reset()` empties the route table and the record, not the runtime built over the transport: once a route answered with an `etag` header, the runtime's response cache serves that request again without reaching the transport. A test file that repeats a request across a reset builds a runtime per test, or passes `enableETagCache: false` to `createEsi`.

`TestDataFactory`, from the same entry, builds response bodies the schemas accept ([Test helpers](#test-helpers)).

## Adding tests

1. **A behaviour change** starts with an EARS Rule and a scenario that fails before the implementation exists (`TEST-01`). Add the Rule to the right feature under `tests/bdd/features/`, bind a new feature with a spec entry under `tests/bdd/specs/`, and add one file per new step under `tests/bdd/steps/<keyword>/`. Queue HTTP at the transport seam. Confirm red, implement, confirm green, run `npm run spec:audit`. Never add a legacy step file.
2. **A unit test** goes in `tests/tdd/<area>/`. Mock fetch, call the method, assert the result; add `describeClientErrors` to a new client's file.
3. **An invariant** that no example can cover goes in `tests/fuzz/` as a `*.property.test.ts`, with a known-bad implementation it must fail against.
4. **A network fault** goes in the catalogue in `tests/faults/`, citing the Rule that specifies the outcome.
5. **A new public GET endpoint** needs a recorded fixture (`ESI_LIVE_TESTS=true npm run contract:record -- --only=<key>`) or an `unrecordable.json` entry with a reason, and a `public` or `mixed` example that calls it.
6. **Test data** goes in `src/testing/TestDataFactory.ts` and in the schema map of `TestDataFactory.schemas.test.ts`.
7. **A live test** goes in `tests/integration/`, gated with `LIVE ? describe : describe.skip` (never a committed `.skip`), idempotent and read-only against ESI (`TEST-08`).

Before pushing, `npm run check:local` runs every offline tier CI will.

## CI schedule

Every pull request to `master` runs `ci.yml`, whose single required check is `ci-success`. Every push to any branch runs `ci-fast.yml`. The scheduled runs, in UTC:

| Workflow                        | When                                                       | What it runs                                                                                                                                                         | On failure                                                                 |
| ------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `ci-fast.yml`                   | Every push                                                 | `lint`, `lint:layers`, `lint:bdd-seam`, `lint:suite-health`, `format:check`, `build`, `typecheck`, `typecheck:examples`, `typecheck:isolated`, `npm test` on Node 22 | Status only                                                                |
| `ci.yml`                        | Every pull request                                         | Every tier marked PR in [the tier table](#the-tiers); `ci-success` fans in all of its jobs                                                                           | Blocks the merge                                                           |
| `ears.yml`                      | Pull requests touching the specification or `src/`; manual | `npm run ears`                                                                                                                                                       | Status; advisory                                                           |
| `nightly-schemathesis.yml`      | Daily 01:00                                                | `npm run fuzz:api` equivalent against a Prism mock                                                                                                                   | Artifact; issue "api-fuzz: nightly Schemathesis run failed"                |
| `nightly-mutation.yml`          | Daily 02:00                                                | Unit mutation (5 shards), BDD-only mutation (9 shards), type mutation; each ratcheted                                                                                | Fails the run; issue "mutation: nightly run failed"                        |
| `nightly-mutation-retry.yml`    | When `nightly-mutation.yml` fails on its first attempt     | Re-runs the failed shards once                                                                                                                                       | Status only                                                                |
| `nightly-no-retry.yml`          | Daily 03:00                                                | `npm test` in random order with a fresh seed; fails if any test ran more than once                                                                                   | Fails the run; `no-retry-report` artifact                                  |
| `nightly-properties.yml`        | Daily 03:30                                                | `npm run fuzz:properties` with `FC_NUM_RUNS=10000` and a seed per night                                                                                              | Issue "Nightly property run failed"                                        |
| `nightly-interleave.yml`        | Daily 03:30                                                | The composition tier with four calls in seeded random order                                                                                                          | Fails the run                                                              |
| `nightly-faults.yml`            | Daily 03:30                                                | `npm run faults:nightly` and `npm run faults`                                                                                                                        | Issue "Nightly fault tier failing"                                         |
| `nightly-examples.yml`          | Daily 04:15; PRs touching `examples/`                      | Type-checks every example; runs the `public` and `mixed` ones against live ESI                                                                                       | One issue per failing example                                              |
| `nightly-benchmarks.yml`        | Daily 04:30                                                | Benchmarks against a pinned reference; the heap soak and its injected leak                                                                                           | `performance-nightly` issue                                                |
| `consumer-matrix-nightly.yml`   | Daily 04:45                                                | The consumer contract on TypeScript `next`/`latest` and current Node                                                                                                 | Fails the run                                                              |
| `nightly-audit.yml`             | Daily 05:00                                                | `npm audit` against the accepted-advisory list                                                                                                                       | `security-audit` issue                                                     |
| `nightly-sde.yml`               | Daily 05:15                                                | CCP's current SDE export: `tests/integration/sde` with `SDE_REQUIRE_DATA=1`, `sde:drift`, the `sde` examples                                                         | Issue "sde: nightly real-data run failed or the export drifted"            |
| `nightly-spec-drift.yml`        | Daily 06:00                                                | Missing endpoints, generated-type freshness, schema drift, against the newest compatibility date                                                                     | `spec-drift` issue                                                         |
| `nightly-recorded-payloads.yml` | Daily 06:30                                                | `contract:record`, `contract:shape-diff -- --revert-unchanged`, `contract:replay`                                                                                    | A pull request with the shape diff; `recorded-payloads-check-failed` issue |
| `maintenance.yml`               | Mondays 09:00                                              | `contract:snapshot`, `contract:live`, `contract:diff` (oasdiff), outdated, audit, coverage                                                                           | Artifacts only                                                             |
| `post-publish-canary.yml`       | A GitHub release is published                              | Installs the published version from the registry, verifies provenance, loads every sub-path, calls ESI once                                                          | `release-verification` issue                                               |

Nothing runs the live smoke, client integration, spec contract or gated auth suites on a schedule; the real-SDE integration suite runs nightly in `nightly-sde.yml`. Every workflow, its jobs and what blocks where are in [QUALITY-GATES.md](QUALITY-GATES.md).

## Known gaps

| Gap                          | Severity | Notes                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contract deviations          | Medium   | Four SDK-to-spec mismatches in the deep contract's exception sets ([Live contract](#live-contract)), unfixed since the first run                                                                                                                                                                                                                                                                     |
| Non-primitive path parameter | Low      | `validatePathParam` throws a raw `TypeError`, not an `EsiError`, for an object whose `toString` returns a non-primitive (the template literal in `src/core/util/validation.ts`), and accepts other non-primitives by their string form (a plain object as `[object Object]`); the fuzz properties in `tests/fuzz/parameter-fuzz.test.ts` hold only that what it returns is a safe, non-empty segment |
| Type drift                   | Medium   | Fields in the spec not yet in hand-written types, reported as warnings by `esi-spec-contract.test.ts`; schema drift is ratcheted in `scripts/spec/schema-drift-baseline.json`                                                                                                                                                                                                                        |
| Live suites unscheduled      | Medium   | No workflow runs `live-esi`, `client-integration`, `esi-spec-contract`, `gated-auth` or `sde-real-data`; the last skips wherever `sde-data/` is absent                                                                                                                                                                                                                                               |
| Corporate auth endpoints     | Medium   | Gated tests cover character-level auth, not corporation director endpoints                                                                                                                                                                                                                                                                                                                           |
| DNS and TLS failures         | Low      | The fault tier covers resets, stalls and timeouts; DNS and TLS failures reach the client as the same `fetch failed` and are not told apart                                                                                                                                                                                                                                                           |
| Mutation flakiness           | Medium   | Mutants that time out on one runner and survive on another ([#382](https://github.com/lgriffin/ESI.ts/issues/382)); stale incremental results ([#380](https://github.com/lgriffin/ESI.ts/issues/380))                                                                                                                                                                                                |
| API fuzz has no signal       | Low      | Schemathesis has no negative fixture, so a green night does not prove it can fail                                                                                                                                                                                                                                                                                                                    |

## Debugging

```bash
# One test file
npx jest --config config/jest/unit.config.cjs tests/tdd/alliances/AllianceClient.test.ts

# Tests matching a name
npx jest --config config/jest/unit.config.cjs --testNamePattern="should return valid alliance"

# One path pattern (Jest 30 spells it --testPathPatterns)
npx jest --config config/jest/unit.config.cjs --testPathPatterns=composition

# Replay a nightly no-retry order
npx jest --config config/jest/unit.config.cjs --randomize --seed=<seed>

# Node inspector
node --inspect-brk node_modules/.bin/jest --config config/jest/unit.config.cjs --runInBand
```

## File reference

| Path                                                                                                                         | Purpose                                                           |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `config/jest/*.config.cjs`                                                                                                   | The nine Jest configs ([table](#jest-configurations))             |
| `tests/setup/jest.setup.ts`                                                                                                  | Enables `jest-fetch-mock`, shared `ApiClient`, rate-limiter reset |
| `tests/tdd/helpers/clientErrorTests.ts`                                                                                      | `describeClientErrors`, the five HTTP error cases                 |
| `tests/bdd/support/transport.ts`                                                                                             | The transport seam: `queueResponse`, `queueError`, `sentRequests` |
| `tests/bdd/support/binder.ts`                                                                                                | Binds a feature to the step library under Jest                    |
| `scripts/spec/spec-audit.ts`                                                                                                 | The EARS and Gherkin audit                                        |
| `scripts/spec/spec-audit-exceptions.json`                                                                                    | `unconverted` (empty) and `legacyStepFiles` (38), shrink-only     |
| `scripts/quality/bdd-report.ts`                                                                                              | The execution check and the JUnit report                          |
| `scripts/quality/ears.ts`                                                                                                    | The standalone EARS check                                         |
| `tests/fuzz/support/property.ts`                                                                                             | `describeProperty`, run settings and known-bad registration       |
| `tests/faults/catalogue.ts`                                                                                                  | The named transport faults                                        |
| `tests/contract/record.ts`                                                                                                   | The payload recorder                                              |
| `tests/contract/esi-contract.test.ts`                                                                                        | Deep contract, with the known exception sets                      |
| `tests/contract/snapshots/esi-openapi.snapshot.json`                                                                         | The committed spec baseline                                       |
| `scripts/spec/run-schemathesis.sh`                                                                                           | Prism and Schemathesis runner                                     |
| `scripts/quality/consumer-contract.ts`                                                                                       | The consumer contract driver                                      |
| `scripts/docs/doc-examples.ts`                                                                                               | The documentation example checker                                 |
| `scripts/bench/bench-ab.ts`, `scripts/bench/bench-compare-core.ts`                                                           | Alternating runs; Mann-Whitney U, Holm, the verdict               |
| `scripts/bench/soak-core.ts`                                                                                                 | Heap trend, cache bound, timer and listener checks                |
| `scripts/quality/verify-local-core.ts`                                                                                       | The `check:local` tier list and its written exclusions            |
| `config/mutation/stryker.config.mjs`, `config/mutation/stryker.bdd.config.mjs`, `config/mutation/stryker.fixture.config.mjs` | Unit, BDD-only and fixture mutation configs                       |
| `src/testing/TestDataFactory.ts`                                                                                             | Mock data factory                                                 |
