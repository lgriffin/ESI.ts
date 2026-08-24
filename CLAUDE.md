# ESI.ts

TypeScript wrapper for the EVE Online ESI (EVE Swagger Interface) API. Published as `@lgriffin/esi.ts`.

## Commands

```bash
npm run build          # Dual CJS/ESM bundle (tsup) + declarations (tsc)
npm run typecheck      # Type-check without emitting (tsc --noEmit)
npm run clean          # Remove dist/, coverage/, docs/
npm run lint           # ESLint (src/)
npm run format:check   # Prettier check
npm run validate       # lint + format + build + coverage + knip
npm run check:all      # validate + ESI endpoint validation + spec lint + version check
```

### Testing

```bash
npm test               # Unit + BDD tests (jest.unit.config.cjs)
npm run coverage       # Unit tests with coverage
npm run bdd            # All BDD scenario tests
npm run bdd:<domain>   # Single BDD suite (e.g., bdd:market, bdd:character)
npm run test:integration  # Integration tests
npm run contract       # Contract tests against live ESI spec
npm run fuzz           # Property-based fuzz tests (fast-check)
npm run fuzz:api       # Schemathesis API fuzzing (requires Docker)
npm run benchmark      # Performance benchmark tests (jest.benchmark.config.cjs)
npm run test:types     # Type tests (tsd)
npm run test:all       # All test suites
npm run mutation       # Mutation testing (Stryker)
```

Coverage thresholds: branches 80%, functions 75%, lines 90%, statements 90%.

### Code Generation

```bash
npm run generate:types      # Generate TS interfaces + metadata from live ESI OpenAPI spec
npm run generate:okf        # Generate OKF v0.2 knowledge bundle from live ESI OpenAPI spec
npm run generate:endpoints  # Generate endpoint definition scaffold (etc/endpoint-scaffold.generated.ts)
npm run generate:all        # Run all generation + validation in sequence
npm run schema:drift        # Check hand-written Zod schemas against OpenAPI spec
npm run api-report          # Update API surface report (etc/esi.ts.api.md)
```

CI verifies generated types are fresh via `git diff --exit-code`.

## Project Structure

- `src/clients/` — 39 hand-written domain clients (Alliance, Character, Cosmetics, Market, ParagonHub, etc.) extending `BaseEsiClient`
- `src/core/` — ApiRequestHandler, rate limiter, circuit breaker, caching, pagination, retry strategy
- `src/core/endpoints/` — Endpoint definitions (`*Endpoints.ts`) + generated metadata
- `src/core/circuitBreaker/` — Circuit breaker implementation + `ICircuitBreaker` interface
- `src/schemas/` — 37 hand-written Zod v4 schemas for runtime validation
- `src/types/` — Hand-written response types + `generated/esi-spec.generated.ts`
- `tests/tdd/` — Unit tests
- `tests/tdd/helpers/` — Shared test utilities (e.g., `clientErrorTests.ts`)
- `tests/benchmark/` — Performance benchmark tests
- `tests/bdd/` — BDD features + step definitions (jest-cucumber)
- `tests/integration/` — Integration tests (live ESI optional)
- `tests/contract/` — Contract tests against live OpenAPI spec
- `tests/fuzz/` — Property-based fuzz tests (fast-check)
- `tests/typetests/` — Type-level tests (tsd)
- `okf/` — Generated OKF v0.2 knowledge bundle (per-endpoint + per-schema concepts)

## Key Patterns

- **Zod schemas** use `z.looseObject({})` (not `z.object()`) so extra fields from ESI are preserved. Named `*Schema` (e.g., `MarketOrderSchema`).
- **Endpoint definitions** in `src/core/endpoints/*Endpoints.ts` wire path, method, auth, and `responseSchema` together.
- **Strategy pattern** for retry (`RetryStrategy`), circuit breaker (`ICircuitBreaker`), and deduplication (`IDeduplicator`) — all swappable via `ApiClient` setters.
- **Dual CJS/ESM build** via tsup (esbuild) for JS bundles + tsc for declaration files.
- **Logging** via pino behind the `ILogger` interface. Level controlled by `ESI_LOG_LEVEL` env var (default: `warn`).
- **Conventional commits** enforced by commitlint + husky. Types: feat, fix, chore, docs, test, refactor, perf.
- **Generated files** (`*.generated.ts`) are auto-generated from the ESI OpenAPI spec. Re-generate with `npm run generate:types`, do not edit manually.

## Architecture

### Request Pipeline

`Client method` → `BaseEsiClient.api` → `createClient()` → `handleRequest()` → `RetryStrategy.execute()` → `executeRequest()` → `fetch()`

Key middleware in the pipeline:

- **Rate limiter** — per-group token bucket with ESI error limit tracking
- **Circuit breaker** — per-endpoint, state machine (closed → open → half-open → closed)
- **Request deduplication** — in-flight coalescing for identical GET requests
- **Retry** — exponential backoff with jitter, 401 token refresh, non-retryable error bypass
- **ETag caching** — spec-aware TTL cache + conditional requests via `If-None-Match`
- **Pagination** — offset-based (PaginationHandler) and cursor-based (CursorPaginationHandler)

### CI Workflows

- **ci-fast.yml** — runs on all pushes: lint, format, build, typecheck, unit tests (Node 20)
- **ci.yml** — runs on PRs to master: full matrix (Node 18/20/22), BDD, contract, fuzz, coverage with PR comment, quality gate
- **nightly-mutation.yml** — runs nightly: mutation testing (Stryker) with 4-hour timeout

## Do Not Edit

- `src/types/generated/` — auto-generated from OpenAPI spec
- `src/core/endpoints/esi-*.generated.ts` — auto-generated cache TTLs, rate limits, scopes
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
