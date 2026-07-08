# ESI.ts

TypeScript wrapper for the EVE Online ESI (EVE Swagger Interface) API. Published as `@lgriffin/esi.ts`.

## Commands

```bash
npm run build          # TypeScript compile to dist/
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
npm run test:types     # Type tests (tsd)
npm run test:all       # All test suites
npm run mutation       # Mutation testing (Stryker)
```

Coverage thresholds: branches 80%, functions 75%, lines 90%, statements 90%.

### Code Generation

```bash
npm run generate:types   # Generate TS interfaces + metadata from live ESI OpenAPI spec
npm run schema:drift     # Check hand-written Zod schemas against OpenAPI spec
npm run api-report       # Update API surface report (etc/esi.ts.api.md)
```

CI verifies generated types are fresh via `git diff --exit-code`.

## Project Structure

- `src/clients/` — 35 domain clients (Alliance, Character, Market, etc.) extending `BaseEsiClient`
- `src/core/` — ApiRequestHandler, rate limiter, circuit breaker, caching, pagination
- `src/core/endpoints/` — Endpoint definitions (`*Endpoints.ts`) + generated metadata
- `src/schemas/` — 33 hand-written Zod v4 schemas for runtime validation
- `src/types/` — Hand-written response types + `generated/esi-spec.generated.ts`
- `tests/tdd/` — Unit tests
- `tests/bdd/` — BDD features + step definitions (jest-cucumber)
- `tests/integration/` — Integration tests (live ESI optional)
- `tests/contract/` — Contract tests against live OpenAPI spec
- `tests/fuzz/` — Property-based fuzz tests (fast-check)
- `tests/typetests/` — Type-level tests (tsd)

## Key Patterns

- **Zod schemas** use `z.looseObject({})` (not `z.object()`) so extra fields from ESI are preserved. Named `*Schema` (e.g., `MarketOrderSchema`).
- **Endpoint definitions** in `src/core/endpoints/*Endpoints.ts` wire path, method, auth, and `responseSchema` together.
- **Conventional commits** enforced by commitlint + husky. Types: feat, fix, chore, docs, test, refactor, perf.
- **Generated files** (`*.generated.ts`) are auto-generated from the ESI OpenAPI spec. Re-generate with `npm run generate:types`, do not edit manually.

## Do Not Edit

- `src/types/generated/` — auto-generated from OpenAPI spec
- `src/core/endpoints/esi-*.generated.ts` — auto-generated cache TTLs, rate limits, scopes
- `dist/` — build output
- `etc/esi.ts.api.md` — auto-generated API surface report
