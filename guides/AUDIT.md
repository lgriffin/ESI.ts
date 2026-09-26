# Phase 0 Audit

A snapshot of ESI.ts at 10.2.3 (master, 2026-09-26), taken as Phase 0 of the
"Road to Done" plan. It records what is hand-written, what is generated, which
ESI operations the client covers, and the mutation baseline, so the later phases
start from measured facts. Re-run the numbers rather than editing them by hand;
the commands are listed with each table.

## Code inventory

Line counts exclude `*.generated.ts`.

| Area                 | Files | Lines | Origin                                                          |
| -------------------- | ----: | ----: | --------------------------------------------------------------- |
| `src/clients`        |    40 |  4965 | Hand-written: 39 domain clients plus `BaseEsiClient`            |
| `src/core/endpoints` |    42 |  2501 | Hand-written endpoint definitions (234 path and method entries) |
| `src/core` (rest)    |    46 |  4909 | Hand-written pipeline, cache, retry, rate limiter, pagination   |
| `src/schemas`        |    39 |  2571 | Hand-written Zod schemas, checked by `npm run schema:drift`     |
| `src/types`          |    40 |  1437 | Hand-written response types, branded IDs                        |
| `src/auth`           |     9 |  1399 | Hand-written SSO and token handling                             |
| `src/sde`            |    18 |  6289 | Hand-written SDE ingestion and query (separate sub-path export) |
| `src/config`         |     4 |    88 | Hand-written                                                    |
| `src/testing`        |     2 |  1054 | Hand-written test helpers (public sub-path)                     |

Generated from the ESI spec at compatibility date 2026-05-19 (`npm run generate:types`):

| File                                                    | Lines | Holds                                     |
| ------------------------------------------------------- | ----: | ----------------------------------------- |
| `src/types/generated/esi-spec.generated.ts`             |  2383 | Response interfaces                       |
| `src/core/endpoints/esi-scopes.generated.ts`            |   218 | `EsiScope` union (72), scope per endpoint |
| `src/core/endpoints/esi-rate-limit-groups.generated.ts` |   168 | Rate-limit group per endpoint (156)       |
| `src/core/endpoints/esi-cache-ttls.generated.ts`        |   142 | Cache TTL per endpoint (136)              |

Today only types and per-route metadata are generated. Every operation is
reached through a hand-written endpoint definition, client method and Zod
schema, about 10,000 hand-written lines that Phase 1 would move to the
generator.

## Operation coverage

Counted by matching `METHOD path` between the spec and every
`src/core/endpoints/*Endpoints.ts` definition, with path parameters normalised.

| Source                                                             | Operations |
| ------------------------------------------------------------------ | ---------: |
| Vendored spec `tests/contract/snapshots/esi-openapi.snapshot.json` |        208 |
| of which require auth                                              |        127 |
| of which take a page or cursor parameter                           |         45 |
| Endpoint definitions in `src/core/endpoints`                       |        234 |

Findings:

1. **The vendored spec is older than the date the client sends.**
   `scripts/snapshot-openapi.ts` fetches `compatibility_date=2025-12-16`, while
   `COMPATIBILITY_DATE` in `src/core/constants.ts` and the generated files are
   at 2026-05-19. The plan's "types built from the date the SDK sends" gate is
   not met for the contract snapshot. Re-snapshotting at the constant is the
   first Phase 1 task.
2. **Two spec operations have no definition:** `GET /sovereignty/map` and
   `GET /sovereignty/structures`. Neither appears in the 2026-05-19 generated
   metadata, so ESI probably removed them after 2025-12-16 (inferred, not
   checked against the live spec).
3. **28 definitions are not in the vendored spec.** 12 are explained by the
   newer date: they appear in the 2026-05-19 generated metadata (access lists,
   mercenary dens and tactical operations, skyhooks, sovereignty hubs,
   `/sovereignty/systems`). The other 16 appear in neither: SKINR cosmetics
   (3), Paragon Hub (5), military campaigns (6), `/meta/openapi.json` and
   `/meta/name`. The meta routes are expected outside the spec. The SKINR,
   Paragon Hub and military-campaign routes need checking against the spec at
   2026-05-19 or later before the coverage gate can count them.
4. No operation in the vendored spec is marked `deprecated`.

The audit sandbox could not reach `esi.evetech.net`, so findings 2 and 3 are
inferred from the generated metadata. A `spec:coverage` script (Phase 1) should
replace this section with a CI-checked count.

## Mutation baseline

Per-directory floors enforced by the nightly ratchet (`scripts/mutation-ratchet.ts`).
Stryker's global `break` is `null`; the gate is per directory.

| Directory                  | Unit (`mutation-thresholds.json`) | BDD-only (`mutation-bdd-thresholds.json`) |
| -------------------------- | --------------------------------: | ----------------------------------------: |
| `src/core`                 |                              81.8 |                                      28.8 |
| `src/core/cache`           |                              65.3 |                                      22.3 |
| `src/core/circuitBreaker`  |                              77.7 |                                      37.3 |
| `src/core/logger`          |                              55.5 |                                      21.7 |
| `src/core/middleware`      |                             100.0 |                                      26.0 |
| `src/core/pagination`      |                              73.9 |                                      12.6 |
| `src/core/rateLimiter`     |                              77.9 |                                      11.7 |
| `src/core/requestPipeline` |                              75.2 |                                      38.5 |
| `src/core/util`            |                              95.4 |                                      42.8 |

The plan's target is 90 on the hand-written core and 80 repo-wide. Only
`src/core/middleware` and `src/core/util` meet 90 today; `src/core/logger`
(55.5) and `src/core/cache` (65.3) are furthest away.

## Plan gates today

| Gate           | State   | Evidence and gap                                                                                                                                                   |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Route coverage | Not met | No generator for operations and no `spec:coverage` job; coverage is by hand (above)                                                                                |
| Spec drift     | Partial | `nightly-spec-drift.yml` and `schema:drift` exist; the vendored snapshot is pinned to 2025-12-16, not the sent date                                                |
| Public API     | Met     | `etc/esi.ts.api.md` committed, API Surface Check and API SemVer Gate in CI                                                                                         |
| Type safety    | Partial | `strict` and `noUncheckedIndexedAccess` on; `exactOptionalPropertyTypes` and `isolatedDeclarations` off; tsd type tests exist                                      |
| Tests          | Partial | Unit, BDD, contract replay, fuzz, faults and consumer tiers all run; mutation floors below the plan's 90/80                                                        |
| Security       | Partial | Provenance on publish, CodeQL, Scorecard, zizmor, SHA-pinned actions; publishing still uses `NPM_TOKEN`, not trusted publishing; `pino` and `zod` are runtime deps |
| Package health | Partial | publint, attw, size budgets and the consumer matrix run; `engines.node` is `>=18`; no `sideEffects` field; no Bun, Deno or browser matrix                          |
| Docs           | Partial | README and guide examples are type-checked; the VitePress site in `docs-site/` is not deployed (esi-06b)                                                           |
| Release        | Partial | release-please, commitlint and the SBOM script exist; the release pipeline has open P1 defects (esi-l38.5)                                                         |
| Live health    | Not met | Nightly recorded-payload and Schemathesis jobs exist, but there is no nightly smoke against Tranquility with an authenticated route                                |

## Transport rules from the plan

| Rule                                                  | State                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Send `X-Compatibility-Date` on every request          | Done (`src/core/requestPipeline/headers.ts`)                                                     |
| Send `X-Tenant`                                       | Missing: no request sets it                                                                      |
| Descriptive `User-Agent`, refuse to build without one | Partial: `X-User-Agent` carries `clientId`, which defaults to `esi-client` and is never required |
| ETag, `If-None-Match`, 304 as a hit                   | Done (spec-aware TTL cache)                                                                      |
| `X-Pages` pagination                                  | Done (offset and cursor handlers); open defects esi-l38.1, esi-l38.2, esi-l38.3                  |
| Error-limit tracking                                  | Done (`src/core/rateLimiter/RateLimiter.ts`)                                                     |
| Surface `Warning` headers                             | Done as warn logs; not yet a typed event                                                         |
