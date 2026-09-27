# ESI.ts

[![npm version](https://badge.fury.io/js/%40lgriffin%2Fesi.ts.svg)](https://badge.fury.io/js/%40lgriffin%2Fesi.ts)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue)](https://www.typescriptlang.org/)
[![CI/CD Pipeline](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-97%25-brightgreen)](guides/TESTING.md)
[![npm downloads](https://img.shields.io/npm/dm/%40lgriffin/esi.ts)](https://www.npmjs.com/package/@lgriffin/esi.ts)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/lgriffin/ESI.ts/badge)](https://scorecard.dev/viewer/?uri=github.com/lgriffin/ESI.ts)

A TypeScript client for the [EVE Online ESI API](https://esi.evetech.net/), built as an engineered product rather than a generated wrapper. It covers every operation in the ESI OpenAPI specification. Every response is validated at runtime, and caching, rate limiting, retry and pagination follow the rules ESI actually enforces. The claims on this page are backed by a test suite that is itself tested.

> **Release line.** `10.2.3` is current on npm and supports Node 18 and later. **11.0.0 is in progress.** It raises the floor to Node 22 and adds a new client built on one shared runtime, with typed public and per-character views. Nothing documented here is removed in 11.0. [What 11.0 changes](guides/USAGE.md#9-what-1100-changes) · [Roadmap and release gate](guides/ROADMAP.md)

## Install

```bash
npm install @lgriffin/esi.ts
```

You need Node.js 18 or later (22 from 11.0.0). TypeScript projects need TypeScript 5.4 or later, under `node16`, `nodenext` or `bundler` module resolution. The consumer contract checks every one of those combinations against the published tarball, as ES module and CommonJS.

## Quick start

```typescript runnable
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient({ userAgent: 'my-app/1.0 (you@example.com)' });
try {
  const status = await client.status.getStatus();
  console.log(`${status.players} pilots online`);
} finally {
  client.shutdown();
}
```

Public data needs no token. For character data, pass an EVE SSO access token, or set `ESI_ACCESS_TOKEN`, and the client attaches it only to the calls that declare a scope:

```typescript
const character = await client.characters.getCharacterPublicInfo(characterId);
const prices = await client.market.getMarketPrices();

const authed = new EsiClient({ accessToken: token });
const wallet = await authed.wallet.getCharacterWallet(characterId);
```

Next: [Using the client](guides/USAGE.md) for configuration and every domain client, and [Authentication](guides/AUTHENTICATION.md) for SSO, refresh and many characters.

## What you get

| Capability              | What ESI.ts does                                                                                                                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Full coverage**       | 39 domain clients and 235 routes. They cover all 233 operations in the ESI specification at compatibility date 2026-08-18, plus the specification documents themselves. `spec:coverage` fails the build if one is missing.             |
| **Runtime validation**  | Every GET response is checked against a hand-written Zod schema. Unknown fields pass through, so an additive change from CCP never breaks you. A changed shape throws `EsiValidationError` instead of corrupting your data quietly.    |
| **Caching**             | A GET inside ESI's cache window makes no HTTP call. Older entries are revalidated with ETags, and a 5xx serves the stale copy. A write invalidates the reads it affects. Keys are hashed per token.                                    |
| **Rate limiting**       | One bucket per ESI rate-limit group: 46 of them, generated from the spec. The limiter learns from ESI's headers and honours `Retry-After`. A 420 or 429 blocks only its own group.                                                     |
| **Resilience**          | Exponential backoff with jitter, a single coalesced token refresh on 401, deduplication of identical in-flight GETs, and an opt-in circuit breaker. Each one is an interface you can replace.                                          |
| **Pagination**          | Offset and cursor paging. `stream*` yields one validated page at a time, and `fetchAll*` fetches pages concurrently. `batch` and `batchPost` handle fan-out.                                                                           |
| **Authentication**      | EVE SSO with PKCE, and a token manager that handles storage, proactive refresh, rotation, revocation and bulk refresh for many characters.                                                                                             |
| **Static data**         | `./sde` answers offline queries over CCP's Static Data Export: 99 typed lookups with no database. It shares no code with the HTTP pipeline, and a lint rule enforces that.                                                             |
| **Correct wire format** | Where the specification is wrong about how ESI reads a request (parameters in the query rather than the body, undocumented length limits), the definitions follow ESI. The specification documents this and live validation proved it. |

## The engineering stance

The project is run to a written [engineering charter](guides/CHARTER.md). It has 58 numbered requirements, each in the same EARS form as the test specification, and each with a status that says whether a machine enforces it: 32 are **Enforced**, 5 Practised, 13 Partial and 8 Gap. A gap is recorded, never hidden. Seven positions explain most of the choices:

1. **The OpenAPI spec is upstream.** Types, cache TTLs, rate-limit groups, scopes and 233 typed operations are generated from it, and CI fails when they go stale.
2. **Hand-write where judgement matters.** Method names, argument shapes and validation strictness are product decisions. Drift reports keep them honest against the spec.
3. **Tolerate additive change.** New fields and enum members from CCP never break a consumer. A removal is a breaking change.
4. **Resilience is pluggable.** Retry, rate limiting, circuit breaking, deduplication, caching and transport are interfaces, not imports.
5. **Secure by construction.** HTTPS and a host allowlist are checked at construction, tokens are attached only where a scope is declared, URLs are redacted in every error, and cache keys are hashed per token. Each control is a test.
6. **The specification executes.** Behaviour is written as EARS requirements in Gherkin, one per `Rule:`, and verified by scenarios that mock only the transport. The audit fails a pull request that weakens the wording.
7. **Verifiable supply chain.** Every action is SHA-pinned and every token least-privilege. Releases carry npm provenance, a signed SBOM, cosign signatures and checksums.

### By the numbers

Measured on `master` on 2026-09-27 with the commands shown. [TESTING.md](guides/TESTING.md) has the full breakdown.

| Measure                   | Value                                                                                      | Reproduce                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Tests run offline         | 8,444 passing, 0 failing                                                                   | `npm test`, `fuzz`, `faults`, `contract:replay`, `test:integration` |
| Unit, BDD and composition | 244 suites, 7,198 tests in about two and a half minutes                                    | `npm test`                                                          |
| Coverage                  | 97.2% statements, 95.5% branches, 91.3% functions, 97.3% lines                             | `npm run coverage` (floors 90 / 80 / 75 / 90)                       |
| Executable specification  | 405 EARS requirements, 496 scenarios, 54 feature files                                     | `npm run ears`                                                      |
| Property and fuzz tests   | 957 tests; 10,000 runs a property nightly                                                  | `npm run fuzz`                                                      |
| Transport fault catalogue | 148 faults through the real pipeline                                                       | `npm run faults`                                                    |
| Recorded ESI payloads     | 121 replay tests, re-recorded nightly with a drift PR                                      | `npm run contract:replay`                                           |
| Mutation testing          | Per-directory floors, ratcheted nightly, changed files on every PR                         | `npm run mutation:ratchet`                                          |
| CI                        | One required check (`ci-success`) over the full matrix; 24 workflows, 15 of them scheduled | [QUALITY-GATES.md](guides/QUALITY-GATES.md)                         |

Every tier has to prove it can fail: a negative fixture, a killed mutant or a caught fault. Every floor is a one-way ratchet.

## Packages in the box

| Import                        | What it holds                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `@lgriffin/esi.ts`            | `EsiClient`, `EsiClientBuilder`, `EsiApiFactory`, domain clients, auth, errors, generated types and scopes   |
| `@lgriffin/esi.ts/schemas`    | The Zod response schemas                                                                                     |
| `@lgriffin/esi.ts/errors`     | Error classes and type guards, including the auth errors                                                     |
| `@lgriffin/esi.ts/testing`    | `TestDataFactory` for your own tests                                                                         |
| `@lgriffin/esi.ts/sde`        | `SdeDataProvider` (YAML and ZIP, through the optional peers `js-yaml` and `adm-zip`) and `MemorySdeProvider` |
| `@lgriffin/esi.ts/sde/memory` | `MemorySdeProvider` alone, with no file-system or parser code, for browsers and bundles                      |

```typescript
import { MarketOrderSchema } from '@lgriffin/esi.ts/schemas';
import { EsiError, isRetryable } from '@lgriffin/esi.ts/errors';
import { SdeDataProvider } from '@lgriffin/esi.ts/sde';

const sdeData = SdeDataProvider.fromDirectory('./sde-data');
console.log(sdeData.getType(34)?.name); // "Tritanium"
sdeData.close();
```

## Guides

The README orients and the guides are canonical. Each guide opens with the charter requirements it implements.

| Using ESI.ts                                       |                                                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [Using the client](guides/USAGE.md)                | Construction, configuration, every domain client, metadata, batching, examples, what 11.0 changes |
| [Authentication](guides/AUTHENTICATION.md)         | Tokens, refresh on 401, SSO with PKCE, the multi-character token manager                          |
| [Pagination](guides/PAGINATION.md)                 | Offset and cursor paging, `stream*`, `fetchAll*`, failure behaviour                               |
| [Errors](guides/ERRORS.md)                         | Error classes, type guards, retryability, safe mode                                               |
| [Runtime validation](guides/RUNTIME-VALIDATION.md) | Zod response and request validation                                                               |
| [Logging](guides/LOGGING.md)                       | `ILogger`, per-client loggers, pino, `ESI_LOG_LEVEL`                                              |
| [Static data (SDE)](src/sde/README.md)             | The offline Static Data Export module and its full API                                            |

| How it is built                                |                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| [Engineering charter](guides/CHARTER.md)       | The requirements the project holds itself to, with status and gap register      |
| [Roadmap to 11.0.0](guides/ROADMAP.md)         | Phases, definitions of done, the SDE programme, the release gate                |
| [Architecture](guides/ARCHITECTURE.md)         | Layers, ports, the request path, caching, retry, rate limiting, circuit breaker |
| [Design rules](guides/DESIGN-RULES.md)         | Naming, schemas, adding an endpoint or a client, generated files                |
| [Testing](guides/TESTING.md)                   | Every test tier, what it proves, how to run it                                  |
| [Mutation testing](guides/MUTATION-TESTING.md) | Stryker shards, floors and the ratchet                                          |
| [Quality gates](guides/QUALITY-GATES.md)       | What runs at commit, push, PR, nightly and release; every workflow              |
| [Security](guides/SECURITY.md)                 | Runtime defences and supply-chain controls ([policy](SECURITY.md))              |
| [Semantic versioning](guides/SEMVER.md)        | What is public; major, minor or patch; breaking-change commits                  |
| [Release](guides/RELEASE.md)                   | Cutting a release, changelog, provenance, signatures, support window            |
| [Audit](guides/AUDIT.md)                       | The Phase 0 measured baseline for 11.0                                          |
| [OKF bundle](guides/OKF.md)                    | The generated Open Knowledge Format catalogue of ESI                            |
| [Documentation](guides/DOCUMENTATION.md)       | Documentation surfaces, checked examples, TypeDoc                               |
| [Beads](guides/BEADS.md)                       | Issue tracking workflow                                                         |

## Examples

`examples/` has 56 runnable scripts, each with an npm script. The public ones run against live ESI every night, and a failure opens an issue.

```bash
npm run example:status      # quickest smoke test, no token
npm run example:market      # prices and history
npm run example:streaming   # stream* over a large region
npm run example             # full character profile (ESI_ACCESS_TOKEN)
```

The full list is in [USAGE.md](guides/USAGE.md#8-examples).

## Contributing

```bash
git clone https://github.com/lgriffin/ESI.ts.git && cd ESI.ts
npm ci
npm run check:local -- --fast   # every offline CI tier, minus the build
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Every behaviour change starts with an EARS requirement and a failing scenario. Every commit is a conventional commit classified by [SEMVER.md](guides/SEMVER.md). No floor is ever lowered. Work is tracked in GitHub issues labelled by release and phase, mirrored in [beads](guides/BEADS.md).

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).

---

**o7**
