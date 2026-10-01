# ESI.ts

[![npm version](https://badge.fury.io/js/%40lgriffin%2Fesi.ts.svg)](https://badge.fury.io/js/%40lgriffin%2Fesi.ts)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue)](https://www.typescriptlang.org/)
[![CI/CD Pipeline](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml/badge.svg)](https://github.com/lgriffin/ESI.ts/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-97.8%25-brightgreen)](guides/TESTING.md#where-the-suite-stands)
[![Mutation score](https://img.shields.io/badge/mutation%20score-84%25%20core-brightgreen)](guides/TESTING.md#where-the-scores-stand)
[![Tests](https://img.shields.io/badge/tests-10%2C045%20offline-brightgreen)](guides/TESTING.md#where-the-suite-stands)
[![EARS requirements](https://img.shields.io/badge/EARS%20requirements-566-blue)](tests/bdd/README.md)
[![npm downloads](https://img.shields.io/npm/dm/%40lgriffin/esi.ts)](https://www.npmjs.com/package/@lgriffin/esi.ts)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/lgriffin/ESI.ts/badge)](https://scorecard.dev/viewer/?uri=github.com/lgriffin/ESI.ts)

A TypeScript client for the [EVE Online ESI API](https://esi.evetech.net/), built as an engineered product rather than a generated wrapper. It covers every operation in the ESI OpenAPI specification. Every response is validated at runtime, and caching, rate limiting, retry and pagination follow the rules ESI actually enforces. The claims on this page are backed by a test suite that is itself tested.

**Documentation site: [lgriffin.github.io/ESI.ts](https://lgriffin.github.io/ESI.ts/)**, with these guides, a page for every runnable example, and the [API reference](https://lgriffin.github.io/ESI.ts/api/) generated from the TSDoc.

> **Release line.** Version <!-- metric:version -->11.1.1<!-- /metric --> <!-- x-release-please-version -->
> is current on npm, released on 2026-09-28. It raises the floor to Node 22.12 and adds a new client built on one shared runtime, with typed public and per-character views. The 10.x line stays available for Node 18 and 20. [What 11.0 changes](guides/USAGE.md#9-what-1100-changes) · [Changelog](CHANGELOG.md)

## Install

```bash
npm install @lgriffin/esi.ts
```

You need Node.js 22.12 or later; on Node 18 or 20, stay on 10.x. TypeScript projects need TypeScript 5.4 or later, under `node16`, `nodenext` or `bundler` module resolution. The consumer contract checks every one of those combinations against the published tarball, as ES module and CommonJS.

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

### Multiple characters

An application that acts for many characters has one relationship with ESI, so `@lgriffin/esi.ts/client` builds one runtime and a view per identity. The views share the rate limiter, the error budget and the ETag cache; each identity's authenticated entries stay apart. `esi.public` is typed so that an authenticated call does not compile.

```typescript
import { createEsi } from '@lgriffin/esi.ts/client';

const esi = createEsi({ userAgent: 'my-app/1.0 (you@example.com)' });
const status = await esi.public.status.get();
const wallet = await esi
  .as(tokens.identity(characterId))
  .character(characterId)
  .wallet.get();
```

[Many characters](guides/MULTI-CHARACTER.md) has the identities (`EsiTokenManager`, a raw token, a `TokenProvider`), what the views share, and the move from `tokens.createClient`.

### Testing your application without ESI

`createMockTransport()` from `@lgriffin/esi.ts/testing` answers requests from a table of routes and records what your code sent. Everything between your call and the transport is the real pipeline, so this runs as written:

```typescript runnable
import { createEsi, identityFromToken } from '@lgriffin/esi.ts/client';
import { createMockTransport } from '@lgriffin/esi.ts/testing';

const transport = createMockTransport().respond({
  method: 'GET',
  path: '/characters/{character_id}/wallet',
  body: 1234567.89,
});
const esi = createEsi({
  userAgent: 'my-app/1.0 (you@example.com)',
  transport,
});
try {
  const view = esi.as(identityFromToken('an-access-token'));
  const wallet = await view.character(2114794365).wallet.get();
  console.log(wallet); // 1234567.89
  console.log(transport.sent[0]?.headers['authorization']); // Bearer an-access-token
} finally {
  esi.shutdown();
}
```

A request no route answers is rejected with an `EsiConfigurationError` naming the request, without a retry, and appears in `transport.unrouted`. [Testing](guides/TESTING.md#testing-your-application) has the route options and the record.

## What you get

| Capability              | What ESI.ts does                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Full coverage**       | <!-- metric:clients -->39<!-- /metric --> domain clients and <!-- metric:routes -->235<!-- /metric --> routes. They cover all <!-- metric:operations -->233<!-- /metric --> operations in the ESI specification at compatibility date <!-- metric:compatibilityDate -->2026-08-18<!-- /metric -->, plus the specification documents themselves. `spec:coverage` fails the build if one is missing. |
| **Runtime validation**  | Every GET response is checked against a hand-written Zod schema. Unknown fields pass through, so an additive change from CCP never breaks you. A changed shape throws `EsiValidationError` instead of corrupting your data quietly.                                                                                                                                                                |
| **Caching**             | A GET inside ESI's cache window makes no HTTP call. Older entries are revalidated with ETags, and a 5xx serves the stale copy. A write invalidates the reads it affects. Keys are hashed per token.                                                                                                                                                                                                |
| **Rate limiting**       | One bucket per ESI rate-limit group: 46 of them, generated from the spec. The limiter learns from ESI's headers and honours `Retry-After`. A 420 or 429 blocks only its own group.                                                                                                                                                                                                                 |
| **Resilience**          | Exponential backoff with jitter, a single coalesced token refresh on 401, deduplication of identical in-flight GETs, and an opt-in circuit breaker. Each one is an interface you can replace.                                                                                                                                                                                                      |
| **Pagination**          | Offset and cursor paging. `stream*` yields one validated page at a time, and `fetchAll*` fetches pages concurrently. `batch` and `batchPost` handle fan-out.                                                                                                                                                                                                                                       |
| **Authentication**      | EVE SSO with PKCE, and a token manager that handles storage, proactive refresh, rotation, revocation and bulk refresh for many characters.                                                                                                                                                                                                                                                         |
| **Static data**         | `./sde` answers offline queries over CCP's Static Data Export: 99 typed lookups with no database. It shares no code with the HTTP pipeline, and a lint rule enforces that.                                                                                                                                                                                                                         |
| **Correct wire format** | Where the specification is wrong about how ESI reads a request (parameters in the query rather than the body, undocumented length limits), the definitions follow ESI. The specification documents this and live validation proved it.                                                                                                                                                             |

## The engineering stance

The project is run to a written [engineering charter](guides/CHARTER.md). It has <!-- metric:charterRequirements -->62<!-- /metric --> numbered requirements, each in the same EARS form as the test specification, and each with a status that says whether a machine enforces it: <!-- metric:charterEnforced -->46<!-- /metric --> are **Enforced**, <!-- metric:charterPractised -->6<!-- /metric --> Practised, <!-- metric:charterPartial -->9<!-- /metric --> Partial and <!-- metric:charterGap -->1<!-- /metric --> Gap. A gap is recorded, never hidden. Seven positions explain most of the choices:

1. **The OpenAPI spec is upstream.** Types, cache TTLs, rate-limit groups, scopes and <!-- metric:operations -->233<!-- /metric --> typed operations are generated from it, and CI fails when they go stale.
2. **Hand-write where judgement matters.** Method names, argument shapes and validation strictness are product decisions. Drift reports keep them honest against the spec.
3. **Tolerate additive change.** New fields and enum members from CCP never break a consumer. A removal is a breaking change.
4. **Resilience is pluggable.** Retry, rate limiting, circuit breaking, deduplication, caching and transport are interfaces, not imports.
5. **Secure by construction.** HTTPS and a host allowlist are checked at construction, tokens are attached only where a scope is declared, URLs are redacted in every error, and cache keys are hashed per token. Each control is a test.
6. **The specification executes.** Behaviour is written as EARS requirements in Gherkin, one per `Rule:`, and verified by scenarios that mock only the transport. The audit fails a pull request that weakens the wording.
7. **Verifiable supply chain.** Every action is SHA-pinned and every token least-privilege. Releases carry npm provenance, a signed SBOM, cosign signatures and checksums.

### By the numbers

Measured on `master` at `9486fe2c` on 2026-09-28 with the commands shown; the mutation and Scorecard rows cite the run that produced them. [TESTING.md](guides/TESTING.md) has the full breakdown.

| Measure                   | Value                                                                                                                                                                                                                                                                   | Reproduce                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Tests run offline         | 10,045 tests in 319 suites; 9,837 run, 0 failing (208 live tests skip without credentials or an SDE export)                                                                                                                                                             | `npm test`, `fuzz`, `faults`, `contract:replay`, `test:integration`         |
| Unit, BDD and composition | 291 suites, 8,308 tests in about two and a half minutes                                                                                                                                                                                                                 | `npm test`                                                                  |
| Coverage                  | 97.8% statements, 95.9% branches, 93.6% functions, 97.9% lines                                                                                                                                                                                                          | `npm run coverage` (floors 90 / 80 / 75 / 90)                               |
| Executable specification  | <!-- metric:requirements -->576<!-- /metric --> EARS requirements, <!-- metric:scenarios -->739<!-- /metric --> scenarios, <!-- metric:featureFiles -->76<!-- /metric --> feature files                                                                                 | `npm run ears`                                                              |
| Property and fuzz tests   | 1,240 tests; 10,000 runs a property nightly                                                                                                                                                                                                                             | `npm run fuzz`                                                              |
| Transport fault catalogue | 148 faults through the real pipeline                                                                                                                                                                                                                                    | `npm run faults`                                                            |
| Recorded ESI payloads     | 121 replay tests, re-recorded nightly with a drift PR                                                                                                                                                                                                                   | `npm run contract:replay`                                                   |
| Mutation score            | 84.1% of 1,355 mutants in `src/core` killed by the unit suite ([nightly of 2026-09-27](https://github.com/lgriffin/ESI.ts/actions/runs/36307924185)); 100% in `middleware`, `pagination` and `util`; floors per directory, ratcheted nightly, changed files on every PR | `npm run mutation:ratchet`                                                  |
| CI                        | One required check (`ci-success`) over the full matrix; 28 workflows, 17 of them scheduled                                                                                                                                                                              | [QUALITY-GATES.md](guides/QUALITY-GATES.md)                                 |
| OpenSSF Scorecard         | 8.3 / 10 on 2026-09-28; the checks still open need settings only the maintainer can change                                                                                                                                                                              | [SECURITY.md](guides/SECURITY.md#5-settings-only-the-maintainer-can-change) |

Every tier has to prove it can fail: a negative fixture, a killed mutant or a caught fault. Every floor is a one-way ratchet.

## Packages in the box

| Import                        | What it holds                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `@lgriffin/esi.ts`            | `EsiClient`, `EsiClientBuilder`, `EsiApiFactory`, domain clients, auth, errors, generated types and scopes   |
| `@lgriffin/esi.ts/schemas`    | The Zod response schemas                                                                                     |
| `@lgriffin/esi.ts/errors`     | Error classes and type guards, including the auth errors                                                     |
| `@lgriffin/esi.ts/testing`    | `createMockTransport` and `TestDataFactory` for your own tests                                               |
| `@lgriffin/esi.ts/client`     | `createEsi`: one shared runtime, `esi.public` (authenticated calls do not compile) and `esi.as(identity)`    |
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

| Using ESI.ts                                       |                                                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [Using the client](guides/USAGE.md)                | Construction, configuration, every domain client, metadata, batching, examples, what 11.0 changes    |
| [Authentication](guides/AUTHENTICATION.md)         | Tokens, refresh on 401, SSO with PKCE, the multi-character token manager                             |
| [Many characters](guides/MULTI-CHARACTER.md)       | One runtime, `esi.public`, `esi.as(identity)`, what the views share, moving from `createClient`      |
| [Pagination](guides/PAGINATION.md)                 | Offset and cursor paging, `stream*`, `fetchAll*`, failure behaviour                                  |
| [Errors](guides/ERRORS.md)                         | Error classes, type guards, retryability, safe mode                                                  |
| [Runtime validation](guides/RUNTIME-VALIDATION.md) | Zod response and request validation                                                                  |
| [Logging](guides/LOGGING.md)                       | `ILogger`, per-client loggers, pino, `ESI_LOG_LEVEL`                                                 |
| [Static data (SDE)](guides/SDE.md)                 | The offline Static Data Export module: its role, isolation, API ([module README](src/sde/README.md)) |

| How it is built                                        |                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| [Engineering charter](guides/CHARTER.md)               | The requirements the project holds itself to, with status and gap register      |
| [Roadmap to 11.0.0](guides/ROADMAP.md)                 | Phases, definitions of done, the SDE programme, the release gate                |
| [Lean decisions](guides/LEAN-DECISIONS.md)             | Why it is run this way: every decision since v7, with value stream maps         |
| [Architecture](guides/ARCHITECTURE.md)                 | Layers, ports, the request path, caching, retry, rate limiting, circuit breaker |
| [Design rules](guides/DESIGN-RULES.md)                 | Naming, schemas, adding an endpoint or a client, generated files                |
| [Testing](guides/TESTING.md)                           | Every test tier, what it proves, how to run it                                  |
| [Mutation testing](guides/TESTING.md#mutation-testing) | Stryker shards, floors and the ratchet                                          |
| [Quality gates](guides/QUALITY-GATES.md)               | What runs at commit, push, PR, nightly and release; every workflow              |
| [Security](guides/SECURITY.md)                         | Runtime defences and supply-chain controls ([policy](SECURITY.md))              |
| [Semantic versioning](guides/SEMVER.md)                | What is public; major, minor or patch; breaking-change commits                  |
| [Release](guides/RELEASE.md)                           | Cutting a release, changelog, provenance, signatures, support window            |
| [Audit](guides/AUDIT.md)                               | The Phase 0 measured baseline for 11.0                                          |
| [OKF bundle](guides/OKF.md)                            | The generated Open Knowledge Format catalogue of ESI                            |
| [Documentation](guides/DOCUMENTATION.md)               | Documentation surfaces, checked examples, TypeDoc                               |
| [Beads](guides/BEADS.md)                               | Issue tracking workflow                                                         |

## Examples

`examples/` has <!-- metric:examples -->58<!-- /metric --> runnable scripts, each with an npm script. The public ones run against live ESI every night, and a failure opens an issue.

```bash
npm run example:status      # quickest smoke test, no token
npm run example:market      # prices and history
npm run example:streaming   # stream* over a large region
npm run example             # full character profile (ESI_ACCESS_TOKEN)
```

The full list is in [USAGE.md](guides/USAGE.md#8-examples), and the [examples showcase](https://lgriffin.github.io/ESI.ts/examples/) has a page for each with its source, what it needs and the command that runs it.

## Contributing

```bash
git clone https://github.com/lgriffin/ESI.ts.git && cd ESI.ts
npm ci
npm run check:local -- --fast   # every offline CI tier, minus the build
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Every behaviour change starts with an EARS requirement and a failing scenario. Every commit is a conventional commit classified by [SEMVER.md](guides/SEMVER.md). No floor is ever lowered. Work is tracked in GitHub issues labelled by release and phase, mirrored in [beads](guides/BEADS.md).

## License

GPL-3.0-or-later. See [LICENSE](LICENSE) for the licence text and [NOTICE](NOTICE) for the copyright line and CCP's trademark notice; EVE Online is the property of CCP hf. and this project is not affiliated with or endorsed by them.

---

**o7**
