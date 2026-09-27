---
marp: true
theme: gaia
class: invert
paginate: true
size: 16:9
---

# ESI.ts

### The History & Evolution of a TypeScript EVE Online ESI Client

`@lgriffin/esi.ts` · created **19 June 2024** · 58 commits on `main` · 243 merged PRs · v10.2.1

---

## Repository at a Glance

| Metric | Value |
|---|---|
| First commit | 2024-06-19 ("Initial Structure") |
| Commits on main | **58** |
| Authors | 1 (Leigh Griffin) |
| Merged PRs | **243** (of 285 total) |
| Open PRs / closed unmerged | 1 / 41 |
| Open issues | 50 |
| Local branches | **189** (94 remote) |
| Tags | **20** (v4 → v10.2.1) |
| Stars / forks | 13 / 3 |
| Language | TypeScript (CommonJS → dual ESM/CJS) |
| License | GPL-3.0-or-later |

---

## The Timeline

```
2024-06  repo created — auth flow, client builder, 1st stable release
2024-07  rapid API build-out: characters, contracts, mail, sov, fleets
         market, killmails, industry — v1.0.0 (Aug 2)
2024-08  handler redesign, small refactors
2024-09  pagination added, npm rename (@lgriffin/esi.ts)
2024-10  docs integrated (PR #1)
         ── quiet period ──
2025-09  major refactor (PR #2), ETag caching, CI overhaul
2025-10  universe route added
         ── quiet period ──
2026-03 → 2026-09  the industrial era: release-please, mutation
         testing, contract fuzzing, BDD overhaul, v4 → v10
```

---

## Phase 1 — Foundation (Jun–Aug 2024)

- **Jun 19:** "Initial Structure" — repo born
- **Jun 27:** first stable release with a working **OAuth auth flow**
- **Jun–Jul:** client-builder refactor; 20+ ESI domains added in ~4 weeks
  (alliances, characters, corporations, contracts, mail, skills, PI, sov, fleets, fittings, killmails, industry, market, dogma, route, status…)
- **Aug 2:** **v1.0.0 complete**
- Style: direct commits, one author, tests fixed as they went

---

## Phase 2 — Hardening (Sep 2024 – Oct 2025)

- **Pagination** added (Sep 2024) + **npm rename** to `@lgriffin/esi.ts`
- **Docs integrated** into the build (Oct 2024, PR #1)
- **Sep 2025:** the "Major Refactor" (PR #2, *director* branch):
  - **ETag / 304 caching** for bandwidth savings
  - CI/CD modernization, version-bump automation
- Oct 2025: universe route — last commit of the era

---

## Phase 3 — The Industrial Era (2026)

A change of scale: PRs per month explode.

| Month | PRs |
|---|---|
| 2026-03 | 5 |
| 2026-04 | 14 |
| 2026-05 | 5 |
| 2026-06 | 46 |
| 2026-07 | 38 |
| 2026-08 | **78** |
| 2026-09 | **95** |

Themes: `ci(mutation)`, `test(contract)`, `fix(dedupe)`, `feat(release)`,
`chore(master): release x.y.z` — a **conventional-commit, release-please** workflow with 200+ agent-driven branches (`worktree-agent-*`, `feat/phase-*`, `test/*`).

---

## The Numbers That Matter

```
 243  merged PRs          189  local branches
  58  commits on main      50  open issues
 20   release tags         575  test cases (it/test)
213   endpoint files       290  test files
  1   author               370  exported symbols
```

---

## Architecture

**Layered, DI-based clean architecture** under `src/`:

```
src/
├── api/          213 endpoint modules in 32 domain folders
│                 (alliances, characters, market, universe, …)
├── clients/      32 facade clients (AllianceClient, MarketClient, …)
├── core/
│   ├── ApiClient / ApiClientBuilder / EsiClientBuilder
│   ├── ApiRequestHandler   → axios transport, status mapping (420, 429, …)
│   ├── cache/ETagCacheManager  → 304 responses, bandwidth savings
│   ├── container/Container     → dependency injection
│   ├── errors/ApiError         → typed error surface (./errors)
│   └── logger/  winston → Loggly bulk transport
├── builders/     client composition (EsiApiFactory, CustomEsiClient)
├── testing/      TestDataFactory, TestScenarios, TestAssertions (exported!)
└── types/        API response contracts
```

Four construction styles: **full `EsiClient`**, `CustomEsiClient` (selected
domains), **builder pattern**, and per-domain standalone clients.

---

## Error Handling

- `ApiError` hierarchy with **typed error categories** (`NOT_FOUND_ERROR`,
  `NETWORK_ERROR`, …) and an explicit `./errors` package surface — pinned by
  **type-level mutation tests** so the public error contract can't silently change
- HTTP status → message mapping table (201/204/304/400/401/403/404/420/422/429/5xx)
- **Retry logic** with injectable strategy, **circuit breaker**, and
  per-group rate limiting — 5 defects in this layer were *found by model-based
  property tests* and fixed (PR #340)
- In-flight request dedupe, later extended to key by **identity + endpoint**
  and detach reads when a write changes a path (PRs #355, #360)

---

## Testing Strategy — a 9-Tier System

1. **TDD / unit** — 575 test cases, 290 test files, jest + ts-jest
2. **BDD** — Given/When/Then scenario tests; every scenario must execute,
   JUnit cases named by Rule, `@bug` links to tracker (PR #333)
3. **Improved / resilient** — retry, concurrency, error-recovery scenarios
4. **Contract** — recorded live ESI payloads replayed through the client
   pipeline; shape changes fail loudly (PRs #334, #370, #386)
5. **Property / model-based** — caught 5 real defects (circuit breaker,
   pagination cache, backoff)
6. **Mutation testing** — Stryker, **sharded nightly** + **incremental PR gate**;
   floors recorded from nightlies, PRs must not regress (PRs #344, #351, #359, #371)
7. **Fault injection + fuzzing** — transport fault catalogue, Schemathesis API fuzz
8. **Consumer matrix** — Node × TypeScript × resolution (CJS/ESM) compatibility
9. **Benchmarks** — statistical comparison + heap soak, nightly

---

## CI/CD — 20 Workflows

```
PR gate:       CI Fast · CodeQL · zizmor (local) · mutation (changed files only)
Nightly:       Mutation Testing · Mutation Retry · Fault Tier · Property Run
               Schemathesis Fuzz · ESI Spec Drift · Recorded Payloads
               Interleaving · No-Retry Run · Benchmarks & Heap Soak · Security Audit
Release:       Release Please · Release Pipeline · SBOM (signed CycloneDX)
               Post-publish Canary · "verify what npm serves"
Quality:       OSSF Scorecard · Dependabot · Maintenance & Security
```

Latest 30 runs: **25 success · 2 failure · 1 skipped · 2 action-required**.

---

## Release & Security Posture

- **20 tags, v4.0.0 → v10.2.1** — release-please driven, semver rules pinned against drift
- **Signed SBOM** (CycloneDX) attached to every release (PR #372)
- **Publish-the-tested-tarball**: verify the artifact npm actually serves (PRs #364, #365)
- **Post-publish canary** validates a real consumer install
- **zizmor** workflow audit + OSSF Scorecard improvements + workflow hardening
- Pinned dependencies, lockfile sync, provenance checks

---

## Evolution in One Slide

```
2024   "make it work"        → 20+ ESI domains in 4 weeks, v1.0.0
2025   "make it solid"       → major refactor, ETag caching, CI
2026   "make it provable"    → 9-tier testing, mutation floors,
                               contract replay, signed SBOM, v10.x
```

The same 307 source files. A very different guarantee.

---

# Questions?

**ESI.ts** — `npm install @lgriffin/esi.ts`

58 commits, 243 PRs, 9 test tiers, 1 obsessive author.
