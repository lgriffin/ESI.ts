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
| Vendored spec `tests/contract/snapshots/esi-openapi.snapshot.json` |        218 |
| of which require auth                                              |        137 |
| of which take a page or cursor parameter                           |         45 |
| Endpoint definitions in `src/core/endpoints`                       |        234 |

Findings, re-checked on 2026-09-26 after Phase 1 re-vendored the spec at
2026-05-19 (the date the client sends) through
`.github/workflows/spec-refresh.yml`:

1. **Resolved: the vendored spec now matches the date the client sends.** It
   was pinned to 2025-12-16 (208 operations); `scripts/snapshot-openapi.ts`
   now defaults to `COMPATIBILITY_DATE`. `npm run spec:coverage` checks the
   generated operations against it in CI.
2. **Every spec operation has a definition.** `GET /sovereignty/map` and
   `GET /sovereignty/structures`, missing before, are covered at 2026-05-19.
3. **16 definitions are not in the spec at 2026-05-19, all intentional.**
   SKINR cosmetics (3), Paragon Hub (5) and military campaigns (6) are beta
   routes ESI enabled after that compatibility date
   ([SKINR on ESI](https://developers.eveonline.com/blog/skinr-on-esi-color-outside-the-lines));
   the client supports them on purpose. `/meta/openapi.json` and `/meta/name`
   are meta routes outside the spec. Phase 2 has to keep these reachable even
   though the generator, which reads the vendored spec, does not emit them.
4. No operation in the vendored spec is marked `deprecated`.

## Mutation baseline

Per-directory floors enforced by the nightly ratchet (`scripts/mutation-ratchet.ts`).
Stryker's global `break` is `null`; the gate is per directory. A dash means the
file sets no floor for that directory.

| Directory                  | Unit (`mutation-thresholds.json`) | BDD-only (`mutation-bdd-thresholds.json`) |
| -------------------------- | --------------------------------: | ----------------------------------------: |
| `src`                      |                                 — |                                      15.5 |
| `src/auth`                 |                                 — |                                      23.4 |
| `src/clients`              |                                 — |                                      12.1 |
| `src/core`                 |                              81.8 |                                      28.8 |
| `src/core/cache`           |                              65.3 |                                      22.3 |
| `src/core/circuitBreaker`  |                              77.7 |                                      37.3 |
| `src/core/endpoints`       |                                 — |                                      24.5 |
| `src/core/logger`          |                              55.5 |                                      21.7 |
| `src/core/middleware`      |                             100.0 |                                      26.0 |
| `src/core/pagination`      |                              73.9 |                                      12.6 |
| `src/core/rateLimiter`     |                              77.9 |                                      11.7 |
| `src/core/requestPipeline` |                              75.2 |                                      38.5 |
| `src/core/util`            |                              95.4 |                                      42.8 |
| `src/schemas`              |                                 — |                                       0.0 |
| `src/sde`                  |                                 — |                                      10.6 |

The plan's target is 90 on the hand-written core and 80 repo-wide. Only
`src/core/middleware` and `src/core/util` meet 90 today; `src/core/logger`
(55.5) and `src/core/cache` (65.3) are furthest away.

## Plan gates today

| Gate           | State   | Evidence and gap                                                                                                                                                   |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Route coverage | Partial | `spec:coverage` checks every spec operation has a generated function; mapping them onto client scopes is Phase 2                                                   |
| Spec drift     | Partial | `nightly-spec-drift.yml` and `schema:drift` exist; the vendored snapshot is at the sent date and `spec-refresh.yml` re-vendors it                                  |
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
| `X-Pages` pagination                                  | Done (offset and cursor handlers); open defect esi-l38.1                                         |
| Error-limit tracking                                  | Done (`src/core/rateLimiter/RateLimiter.ts`)                                                     |
| Surface `Warning` headers                             | Done as warn logs; not yet a typed event                                                         |
