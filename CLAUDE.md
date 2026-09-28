# ESI.ts

TypeScript wrapper for the EVE Online ESI (EVE Swagger Interface) API. Published as `@lgriffin/esi.ts`.

## Commands

```bash
npm run build          # Dual CJS/ESM bundle (tsup) + declarations (tsc)
npm run typecheck      # Type-check without emitting (tsc --noEmit)
npm run typecheck:examples  # Type-check examples/ against src (tsconfig.examples.json)
npm run typecheck:isolated  # isolatedDeclarations over the exposed layers only (tsconfig.isolated.json; schemas and endpoint maps stay inferred)
npm run clean          # Remove dist/, coverage/ and the generated docs (TypeDoc, site pages, site build)
npm run docs:site      # Build the documentation site (TypeDoc, guides, examples) into docs-site/.vitepress/dist; needs `npm ci --prefix docs-site` once
npm run lint           # ESLint (src/ and tests/; test relaxations declared in eslint.config.mjs)
npm run lint:bdd-seam  # BDD scenarios mock only at the transport seam (tests/bdd)
npm run lint:determinism  # Time/timers/Math.random in src/ only via the clock module (shrink-only baseline)
npm run lint:layers    # Imports in src/ point inward: core, ports, generated (shrink-only baseline)
npm run lint:suite-health  # tests/: no .only/.skip/.todo, no assertion-free tests or Then steps, no swallowed assertions or unrestored console mocks
npm run lint:package   # publint + attw on the npm pack tarball (known findings: scripts/package/package-lint-baseline.json)
npm run size           # size-limit budget per exports sub-path, ESM and CJS (.size-limit.cjs; build first)
npm run format:check   # Prettier check
npm run validate       # lint + format + build + coverage + knip
npm run check:all      # validate + ESI endpoint validation + spec lint + version check + EARS spec audit
npm run check:local    # Every CI tier that runs offline, in one go (--fast: no build; --all: adds type mutation)
```

### Testing

```bash
npm test               # Unit + BDD tests (config/jest/unit.config.cjs)
npm run coverage       # Unit tests with coverage
npm run bdd            # All BDD scenario tests
npm run bdd:<domain>   # Single BDD suite (e.g., bdd:market, bdd:character)
npm run bdd:steps      # BDD dry run: every step matches one definition, none unused
npm run spec:response-schemas  # Every endpoint definition returning a JSON body declares a responseSchema (DES-02)
npm run spec:audit     # EARS/Gherkin specification audit (feature files)
npm run charter:audit  # CHARTER.md requirement blocks: one shall, a named system, EARS form; Enforced rows name a mechanism (PROC-06)
npm run ears           # Standalone EARS check: audit + scenarios, one verdict per requirement (reports/ears/; --only=<domain>)
npm run test:integration  # Integration tests
npm run contract       # Contract tests against live ESI spec
npm run fuzz           # Property-based fuzz tests (fast-check)
npm run fuzz:api       # Schemathesis API fuzzing (requires Docker)
npm run benchmark      # Benchmark HEAD against a reference commit (scripts/bench/bench-ab.ts); see bench:compare, bench:trend, soak
npm run test:types     # Type tests (tsd)
npm run test:export-coverage  # Public exports no test references (--ci gates against scripts/package/export-coverage-baseline.json)
npm run test:type-mutation  # Mutate built dist/*.d.ts, run tsd per mutant; -- --ratchet gates (nightly)
npm run test:consumer  # Pack, install into a clean consumer, type-check + run CJS/ESM/sub-paths (not in npm test)
npm run test:docs-examples  # Type-check every ts block in README/guides/SDE docs against the packed package (not in npm test)
npm run examples:nightly    # Run the @nightly public/mixed examples against live ESI (--only <file>, --json <path>)
npm run test:all       # All test suites
npm run mutation       # Mutation testing (Stryker)
npm run mutation:bdd   # BDD-only mutation run, sharded by BDD_MUTATION_SHARD (config/mutation/bdd-shards.json)
npm run mutation:bdd:merge    # Rebuild one report from the shard reports; refuses an incomplete run
npm run mutation:bdd:ratchet  # Gate per-directory scores against config/mutation/bdd-thresholds.json
```

Coverage thresholds: branches 80%, functions 75%, lines 90%, statements 90%.

### Code Generation

```bash
npm run generate:types      # Generate TS interfaces + metadata from live ESI OpenAPI spec
npm run generate:okf        # Generate OKF v0.2 knowledge bundle from live ESI OpenAPI spec
npm run generate:endpoints  # Generate endpoint definition scaffold (etc/endpoint-scaffold.generated.reference.ts)
npm run generate:all        # Run all generation + validation in sequence
npm run schema:drift        # Check hand-written Zod schemas against OpenAPI spec
npm run api-report          # Update API surface report (etc/esi.ts.api.md)
npm run api-report:semver   # Fail if the report lost a line without a feat!/BREAKING CHANGE commit
```

CI verifies generated types are fresh via `git diff --exit-code`.

## Project Structure

- `src/EsiClient.ts`, `src/EsiClientBuilder.ts` — the construction surfaces: `EsiClient`, `EsiClientBuilder` → `CustomEsiClient`, `EsiApiFactory`; `src/index.ts` is the root entry
- `src/clients/` — 39 hand-written domain clients (Alliance, Character, Cosmetics, Market, ParagonHub, etc.) extending `BaseEsiClient`
- `src/core/` — the pipeline: `ApiClient`, `ApiRequestHandler`, `configureApiClient`, rate limiter, circuit breaker, ETag cache, deduplicator, retry strategy, pagination, `clock.ts` (the only module allowed to read time; `lint:determinism`)
- `src/core/requestPipeline/` — the single-purpose modules `ApiRequestHandler` coordinates: headers, cache policy, status handling, fetch execution, pagination orchestration, middleware bridge, dependency resolution. Area notes in its `AGENTS.md`
- `src/core/endpoints/` — 39 endpoint maps (`*Endpoints.ts`), `createClient()`, and the generated TTL, rate-limit-group and scope tables
- `src/core/circuitBreaker/` — Circuit breaker implementation + `ICircuitBreaker` interface
- `src/core/ports/` — six type-only ports (`CacheStore`, `Clock`, `HttpTransport`, `Logger`, `OperationTransport`, `TokenProvider`). They import nothing; not exported until the 11.0 builder (ROADMAP Phase 2 PR 11)
- `src/adapters/` — `PipelineTransport`, which implements `OperationTransport` over the existing pipeline. Not exported yet
- `src/generated/` — `operations.generated.ts`: 233 typed operations, `ScopeTree`, `PublicScopeTree` and `createScopeTree`, generated from the vendored spec. Imports only the ports. Not exported yet
- `src/auth/` — `EveSsoClient` (OAuth2 + PKCE), `EsiTokenManager` (multi-character tokens and refresh), `MemoryTokenStorage` / `FileTokenStorage`, auth errors
- `src/errors.ts` — the `./errors` sub-path entry
- `src/schemas/` — hand-written Zod v4 schemas: 36 domain modules plus `common.ts` and `esiEnum.ts`
- `src/types/` — Hand-written response types + `generated/esi-spec.generated.ts`
- `src/sde/` — Static Data Export side module (`./sde`, `./sde/memory`); shares no code with the pipeline, enforced both ways by `lint:layers`
- `src/testing/` — `TestDataFactory` and helpers, the `./testing` sub-path
- `tests/tdd/` — Unit tests
- `tests/tdd/helpers/` — Shared test utilities (e.g., `clientErrorTests.ts`)
- `tests/benchmark/` — Performance benchmark tests
- `tests/bdd/` — BDD features + step definitions, run by Jest. Converted domains have one step per file in `tests/bdd/steps/` and a spec entry in `tests/bdd/specs/`; the rest still use legacy `defineFeature` files in `tests/bdd/step-definitions/`. Feature files are an EARS specification: one atomic `shall` requirement per `Rule:` block, scenarios nested beneath the rule they verify. See `tests/bdd/README.md` for the rules and `tests/bdd/GUIDE.md` for how to write them; enforced by `npm run spec:audit`.
- `tests/integration/` — Integration tests (live ESI optional)
- `tests/contract/` — Contract tests against live OpenAPI spec
- `tests/fuzz/` — Property-based fuzz tests (fast-check)
- `tests/typetests/` — Type-level tests (tsd)
- `tests/consumer/` — Consumer contract package driven by `scripts/quality/consumer-contract.ts` against the packed tarball
- `tests/doc-examples/` — Prelude and stub fetch for `npm run test:docs-examples`; annotations in `guides/DOCUMENTATION.md`
- `okf/` — Generated OKF v0.2 knowledge bundle (per-endpoint + per-schema concepts)

## Key Patterns

- **Zod schemas** use `z.looseObject({})` (not `z.object()`) so extra fields from ESI are preserved. Named `*Schema` (e.g., `MarketOrderSchema`).
- **Endpoint definitions** in `src/core/endpoints/*Endpoints.ts` wire path, method, auth, and `responseSchema` together.
- **Strategy pattern** for retry (`RetryStrategy`), circuit breaker (`ICircuitBreaker`), and deduplication (`IDeduplicator`) — all swappable via `ApiClient` setters.
- **Dual CJS/ESM build** via tsup (esbuild) for JS bundles + tsc for declaration files.
- **Logging** via pino behind the `ILogger` interface. Level controlled by `ESI_LOG_LEVEL` env var (default: `warn`).
- **Conventional commits** enforced by commitlint + husky. Types: feat, fix, chore, docs, test, refactor, perf. The type and `!` decide the released version; see Semantic Versioning below.
- **Generated files** (`*.generated.ts`) are auto-generated from the ESI OpenAPI spec. Re-generate with `npm run generate:types` (types, TTLs, rate-limit groups, scopes) or `npm run spec:generate` (`src/generated/operations.generated.ts`, from the vendored snapshot); do not edit manually.
- **Layers** point inward: `npm run lint:layers` (`config/eslint/layers.rules.cjs`) forbids core importing the layers above it, ports importing anything, and generated code importing anything but the ports. Its `BASELINE` only shrinks. See `guides/DESIGN-RULES.md` §7.

## Architecture

### Request Pipeline

`Client method` → `createClient()` closure → `handleRequest()` (spec-TTL cache check) → `RetryStrategy.execute()` (each attempt re-checks the spec-TTL cache) → deduplicator (GET without body) → `executeRequest()` → `executeSingleFetch()` (headers, request interceptors, circuit breaker, rate limiter, `fetch` with timeout) → status handling, cache write, pagination, response interceptors → Zod validation in `createClient()`. Full walkthrough: `guides/ARCHITECTURE.md` §2.

Key middleware in the pipeline:

- **Rate limiter** — per-group token bucket with ESI error limit tracking
- **Circuit breaker** — per-endpoint, state machine (closed → open → half-open → closed)
- **Request deduplication** — in-flight coalescing for identical GET requests
- **Retry** — exponential backoff with jitter, 401 token refresh, non-retryable error bypass
- **ETag caching** — spec-aware TTL cache + conditional requests via `If-None-Match`
- **Pagination** — offset-based (PaginationHandler) and cursor-based (CursorPaginationHandler)

### CI Workflows

- **ci-fast.yml** — runs on every push (Node 22): `lint`, `lint:layers`, `lint:bdd-seam`, `lint:suite-health`, format check, build, typecheck, `typecheck:examples`, `typecheck:isolated`, unit tests
- **ci.yml** — runs on pull requests to master: unit tests on Node 22/24, consumer contract on Node 22 and 24, BDD, spec audit, contract, fuzz, coverage, API surface, doc examples and more. `ci-success` is the single required check and fails when any job fails or is skipped
- **nightly-mutation.yml** — runs nightly: unit mutation testing (Stryker) with a 4-hour timeout, the BDD-only run as one job per shard, and type mutation
- **nightly-examples.yml** — runs nightly and on PRs touching examples: type-checks every example, runs the public ones against live ESI, opens/closes one issue per failing example
- **nightly-sde.yml** — runs nightly: downloads CCP's current SDE export (cached per build), runs the real-data integration suite, `sde:drift` against the registry and schemas, and the SDE examples; keeps one issue open while red
- **skill-eval.yml** — runs on PRs touching `.claude/skills/**`: skill eval suite with thresholds and a cost budget
- **spec-refresh.yml** — on push to `spec-refresh/**` or manual dispatch: re-vendors the ESI OpenAPI document at `COMPATIBILITY_DATE` and regenerates every generated file from it

These are the ones an agent meets most. `.github/workflows/` holds 27 workflow files; `guides/QUALITY-GATES.md` lists every one and what it gates.

## Semantic Versioning (enforced)

Every change is classified by [`guides/SEMVER.md`](guides/SEMVER.md) before it is committed. These rules are mandatory for humans and agents:

- **Classify before committing.** A change that touches the public contract (any `package.json` `exports` entry, types they export, documented runtime behaviour, error classes, Zod response schemas, defaults, `engines`, public or peer dependencies) is major, minor or patch per the tables in SEMVER.md. When the classification is unclear, ask the user rather than guessing.
- **Never introduce a breaking change without the user's explicit approval.** Propose a compatible alternative first: an optional parameter, a new method next to the old one, or a deprecation.
- **Mark breaking changes on the commit that introduces them:** `type!:` in the subject **and** a `BREAKING CHANGE:` footer that tells a consumer how to migrate. Never hide a break in `chore:`, `refactor:` or `test:`, and never add `!` "to be safe".
- **Deprecate before removing.** Removals ship in a major release only, after `@deprecated` JSDoc (and `DeprecationInfo` for endpoints) in an earlier minor release, unless ESI has already removed the endpoint.
- **Keep the API report honest.** When an exported shape changes, run `npm run api-report` and commit `etc/esi.ts.api.md`. If the report loses a line but the change is compatible, add an `API-Compatible: <why>` trailer.
- **Pull request titles are conventional commits.** A squash merge of several commits uses the title as the commit release-please reads, so it carries `!` whenever any commit in the pull request is breaking. Prefer a merge commit when a pull request mixes `fix:`/`feat:` with other types.
- **These rules live in CLAUDE.md and AGENTS.md both.** `tests/tdd/scripts/agent-docs.test.ts` fails if the two copies drift, so an agent cannot read a stale one and ship a break under `fix:`. Edit both, or neither.

## Knowledge Graph

For architecture questions (which modules import the logger, how a request flows to `fetch()`, which tests reach a given source file), use the graphify knowledge graph first when `graphify-out/` exists:

```bash
graphify query "<question>" --graph graphify-out/graph.json
graphify path "<symbolA>" "<symbolB>" --graph graphify-out/graph.json --undirected
graphify god-nodes --graph graphify-out/graph.json
```

The graph is built in a clean worktree; regenerate with `graphify extract <worktree> --code-only` and `graphify cluster-only <worktree> --no-label`. The commit the graph was built from is recorded in `graphify-out/GRAPH_REPORT.md` — check it is current before trusting the answer.

## Reviewing

Review against the checklist and severities in `AGENTS.md` (Reviewer Checklist). Area notes: `tests/bdd/AGENTS.md`, `src/core/requestPipeline/AGENTS.md`.

## Do Not Edit

- `src/types/generated/` — auto-generated from OpenAPI spec
- `src/core/endpoints/esi-*.generated.ts` — auto-generated cache TTLs, rate limits, scopes
- `src/generated/operations.generated.ts` — generated operations and scope tree (`npm run spec:generate`)
- `dist/` — build output
- `etc/esi.ts.api.md` — auto-generated API surface report
- `okf/` — auto-generated OKF knowledge bundle from OpenAPI spec

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:6cd5cc61 -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**

- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.

<!-- END BEADS INTEGRATION -->
