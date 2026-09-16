# ESI.ts Design Rules

**Implements:** DES-01 · DES-02 · DES-03 · DES-04 · DES-05 · DES-06 · DES-07 · DES-08. The requirements themselves, their status and how each is verified live in [CHARTER.md](CHARTER.md) Part 3; this guide explains how to meet them.

The conventions that make every domain client read as if one author wrote it, and the two walkthroughs a contributor needs most: adding an endpoint and adding a domain client. How the request pipeline executes a definition is covered in [ARCHITECTURE.md](ARCHITECTURE.md); how to specify and test the change is covered in [TESTING.md](TESTING.md).

---

## 1 · Conventions

| Thing          | Convention                                                               | Example                                                |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| Interface      | `I` prefix                                                               | `ICache`, `IRetryStrategy`, `ILogger`                  |
| Zod schema     | `Schema` suffix, `z.looseObject`, one file per domain in `src/schemas/`  | `MarketOrderSchema` in `src/schemas/market.ts`         |
| Response type  | Same name without the suffix, `z.infer` of the schema, in `src/types/`   | `type MarketOrder = z.infer<typeof MarketOrderSchema>` |
| Endpoint map   | `Endpoints` suffix, `as const satisfies EndpointMap`                     | `allianceEndpoints`                                    |
| Domain client  | `Client` suffix, extends `BaseEsiClient<typeof xEndpoints>`              | `AllianceClient`                                       |
| Registry key   | camelCase, equal to the `EsiClient` getter name                          | `'paragonHub'` → `client.paragonHub`                   |
| Generated file | `.generated.ts` suffix, header comment, never hand-edited                | `esi-scopes.generated.ts`                              |
| Config object  | `Config` suffix, every field optional                                    | `CircuitBreakerConfig`, `RetryConfig`                  |
| Wire format    | snake_case in types and schemas; camelCase in method and path parameters | `alliance_id` in the body, `allianceId` in the call    |
| Enum from ESI  | `esiEnum([...])`: known members plus an open string                      | `esiEnum(['character', 'corporation'])`                |

Two long-standing exceptions are kept for compatibility: the `skills` registry key maps to `CharacterSkillsClient`, and endpoint map files use the singular domain (`assetEndpoints.ts`) while the client uses the plural (`AssetsClient`). Do not copy either into new code.

### Schemas tolerate additive change (DES-01)

Response validation replaces the body with `safeParse().data`. A strict `z.object` strips any field it does not name, so a field CCP adds tomorrow would silently disappear from every consumer. Hand-written response schemas therefore use `z.looseObject`, which keeps unknown keys:

```ts
import { z } from 'zod';
import { esiEnum } from './esiEnum';

export const AccessListEntrySchema = z.looseObject({
  entity_id: z.number(),
  entity_type: esiEnum(['character', 'corporation', 'alliance']),
});
```

The same reasoning applies to enums. `esiEnum` is a union of `z.enum(values)` and `z.string()`, so the inferred type still autocompletes the known members while a new member from ESI validates instead of throwing. Use a closed `z.enum` only where the library itself branches on the value.

The only `z.object` calls in `src/` are internal helpers in `src/schemas/common.ts` that never wrap an ESI body. See [RUNTIME-VALIDATION.md](RUNTIME-VALIDATION.md) for the validation switches and the error a failure produces.

### Types come from schemas (DES-02)

`createClient` infers each method's return type from `responseSchema`. A definition without one compiles, but the method returns `Promise<unknown>`, which is a silent regression for every caller. Every new definition that returns a body ships a schema; only an operation whose success is `204 No Content` may omit it. Some older mutations that do return a body (for example `postCharacterAffiliation`, `createFitting`, `sendMail`) still lack one and should not be copied. The matching exported type is a `z.infer` alias rather than a second hand-written interface. The spec-derived interfaces in `src/types/generated/` are exported separately under the `EsiSpec` namespace for reference; they are not what the clients return.

### Immutability (DES-06)

Error classes declare their fields `readonly`. Merges copy: `EsiClientBuilder.withConfig` spreads into a new object rather than assigning into the caller's. Bucket and circuit records inside the rate limiter and breaker are the intentional exception because they are counters. When you add a config type, keep its fields optional and treat a received config as read-only.

### Compiler settings (DES-07)

`tsconfig.json` sets `strict`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noImplicitOverride` and `noFallthroughCasesInSwitch`. The tuple arithmetic in `EndpointArgs` and `InferEndpointResult` only holds under these settings. `tsconfig.test.json` relaxes `noUncheckedIndexedAccess` for tests and nothing else. Index access in `src/` therefore needs a guard or a justified non-null assertion, as `BaseEsiClient` does with `this._endpoints[endpointName]!`.

### Logging from a client

Clients log through the per-client helpers in `src/core/logger/clientLog.ts`, passing `this._client` so the line is attributed to the owning `ApiClient`:

```ts
logWarn(this._client, 'AllianceClient.getContacts() is deprecated.', {
  allianceId,
});
```

Do not import the global logger in a client. [LOGGING.md](LOGGING.md) covers resolution order and custom loggers.

---

## 2 · The endpoint definition

`src/core/endpoints/EndpointDefinition.ts` is the whole contract:

| Field              | Type                                   | Purpose                                                                              |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------------------ |
| `path`             | `string`                               | Template with camelCase placeholders, e.g. `'alliances/{allianceId}/icons/'`         |
| `method`           | `'GET' \| 'POST' \| 'PUT' \| 'DELETE'` | HTTP method                                                                          |
| `requiresAuth`     | `boolean`                              | Attach the bearer token. Must agree with the generated scope map (DES-04)            |
| `pathParams`       | `readonly string[]`                    | Placeholder names in method-argument order                                           |
| `queryParams`      | `Record<string, string>`               | Method parameter name → query key, e.g. `{ orderType: 'order_type' }`                |
| `hasBody`          | `boolean`                              | The argument after the path and query parameters is sent as the body                 |
| `bodyBuilder`      | `(...args) => unknown`                 | Build the body from the remaining arguments; its parameter types become the method's |
| `cursorPagination` | `boolean`                              | Use `before`/`after` cursors; the return type becomes `CursorResult<T>`              |
| `deprecated`       | `DeprecationInfo`                      | `message`, `replacedBy`, `sunsetDate`; `createClient` logs a warning on each call    |
| `responseSchema`   | `z.ZodType`                            | Validates the response and drives the inferred return type                           |
| `requestSchema`    | `z.ZodType`                            | Validates the body when `validateRequest` is on                                      |

Arguments are consumed positionally by `buildEndpointPath`: path parameters, then query parameters in declaration order (an `undefined` query argument is omitted), then the body. Offset pagination is not declared; the pipeline follows `x-pages` whenever ESI returns it. See [PAGINATION.md](PAGINATION.md).

A representative map, adapted from `src/core/endpoints/marketEndpoints.ts` and `contactEndpoints.ts`:

```ts
import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { MarketOrderSchema } from '../../schemas/market';

export const exampleEndpoints = {
  getMarketOrders: {
    path: 'markets/{regionId}/orders/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    queryParams: { orderType: 'order_type' },
    responseSchema: z.array(MarketOrderSchema),
  },
  addContacts: {
    path: 'characters/{characterId}/contacts',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { standing: 'standing' },
    bodyBuilder: (contactIds: number[]) => contactIds,
    requestSchema: z.array(z.number().int()),
    responseSchema: z.array(z.number()),
  },
} as const satisfies EndpointMap;
```

`as const` preserves the literal `pathParams` tuple so `EndpointArgs` can compute the argument list; `satisfies` checks the shape without widening it. Dropping either one degrades every method on the map to loose types.

Reference a named `*Schema` export in `responseSchema`, optionally wrapped in `z.array(...)`. `npm run schema:drift` finds schemas by that pattern; an inline object literal is invisible to it.

---

## 3 · Walkthrough: add an endpoint

The unit of work is one ESI operation wired end to end. Behaviour comes first: follow the `ears-gherkin-dev` skill and write the EARS rule and a failing scenario before the definition exists (TEST-01, see [TESTING.md](TESTING.md)).

### 3.1 Find the operation

```bash
npm run generate:endpoints
```

`scripts/generate-endpoint-scaffold.ts` downloads the OpenAPI document and writes `etc/endpoint-scaffold.generated.reference.ts`: one scaffold map per ESI tag with `path`, `method`, `requiresAuth` (from the operation's `security` block) and `pathParams` filled in, and a `// responseSchema: TODO` placeholder. It is a reference to diff against, not a file to import; it never overwrites `src/core/endpoints/`.

The scaffold is pinned to the compatibility date in the script (`ESI_OPENAPI_URL`). An operation newer than that date does not appear; read it from the live spec, or run the nightly drift check (`scripts/check-spec-drift.ts`, described in [QUALITY-GATES.md](QUALITY-GATES.md)) which lists what is missing against the latest date.

### 3.2 Write or reuse the schema

Add the response schema to the domain file in `src/schemas/`, using `z.looseObject` and `esiEnum`. Every domain file is re-exported from `src/schemas/index.ts`, which is the `@lgriffin/esi.ts/schemas` entry point. Add the `z.infer` alias beside the others in `src/types/<domain>.ts`; `src/types/api-responses.ts` re-exports it.

### 3.3 Add the definition

Copy the scaffold entry into the domain's `*Endpoints.ts` map, then:

1. Rename the key to the method name the client will expose (`getMarketOrders`, not `GetMarketsRegionIdOrders`).
2. Keep `pathParams` in camelCase and in URL order.
3. Add `queryParams`, `hasBody` or `bodyBuilder` as the operation needs.
4. Add `responseSchema`, and `requestSchema` for a body.
5. Set `cursorPagination: true` if the operation takes `before`/`after`.

### 3.4 Check authentication against the scope map (DES-04)

```bash
npm run validate:auth-scopes
```

`scripts/validate-auth-scopes.ts` normalises each definition to `METHOD:snake_case_path` and compares it with `src/core/endpoints/esi-scopes.generated.ts`:

| Definition            | Scope map entry | Result                                                       |
| --------------------- | --------------- | ------------------------------------------------------------ |
| `requiresAuth: false` | present         | **Error**, exit 1. The token is never sent and ESI refuses.  |
| `requiresAuth: true`  | absent          | Warning. The token is sent but the scope list is incomplete. |

A genuine mismatch in the generated map (a path ESI spells differently, or a scope newer than the generated file) is recorded in `scripts/auth-scope-exceptions.json` with a `reason`. Never flip `requiresAuth` to make the script pass; the bearer header is attached only when that flag is set.

### 3.5 Check the schema against the spec

```bash
npm run schema:drift
```

Reports missing fields, extra fields and type mismatches between the named schema and the OpenAPI response. An accepted deviation goes in `scripts/schema-drift-exceptions.json` keyed by schema name. CI runs the `--ci` variant, which fails on drift.

### 3.6 Deprecation (DES-05)

When ESI deprecates an operation, keep the definition and add the field rather than a comment:

```ts
getOldThing: {
  path: 'old/thing/',
  method: 'GET',
  requiresAuth: false,
  responseSchema: OldThingSchema,
  deprecated: {
    message: 'ESI is retiring this route.',
    replacedBy: 'getNewThing',
    sunsetDate: '2027-01-01',
  },
},
```

`createClient` logs one warning per call through the owning client's logger. When a hand-written client method is itself deprecated (a method that moved to another client), mark it `@deprecated` in JSDoc and call `logWarn(this._client, …)`, as `AllianceClient.getContacts()` does.

### 3.7 Expose it on the client

Every key in the map is already callable through `this.api`. Add a named, documented method on the domain client so it appears in the public surface with camelCase arguments and a JSDoc block:

```ts
/**
 * Retrieves all active market orders in a region.
 *
 * @param regionId - The ID of the region to fetch orders for
 * @returns A list of all active market orders in the region
 */
getMarketOrders(regionId: number): Promise<MarketOrder[]> {
  return this.api.getMarketOrders(regionId, 'all');
}
```

For an offset-paginated operation, also add the `stream*` and `fetchAll*` wrappers over `streamEndpoint` and `fetchAllEndpoint`, and mark `@requires Authentication` in the JSDoc where `requiresAuth` is set. Wrapper semantics are in [PAGINATION.md](PAGINATION.md).

### 3.8 Prove it

| Check                   | Command                                    |
| ----------------------- | ------------------------------------------ |
| Scenario and unit tests | `npm run bdd:<domain>`, `npm test`         |
| Path and method vs spec | `npm run validate:esi`, `npm run contract` |
| Inferred types          | `npm run test:types`                       |
| Public surface          | `npm run build && npm run api-report`      |

Unit tests live in `tests/tdd/<domain>/`; `tests/tdd/helpers/clientErrorTests.ts` provides the shared HTTP-error cases. Scenarios live in `tests/bdd/features/core/NNNN-<domain>.feature` with one step per file in `tests/bdd/steps/` and a spec entry in `tests/bdd/specs/core/`, and mock at the transport seam (TEST-03). Commit the updated `etc/esi.ts.api.md`; CI fails if it is stale (GATE-03).

---

## 4 · Walkthrough: add a domain client

Needed only when ESI adds a tag that no existing client covers. Every step below is required; the compiler catches some omissions and a unit test catches others.

1. **Schemas.** `src/schemas/<domain>.ts`, re-exported from `src/schemas/index.ts`.
2. **Types.** `src/types/<domain>.ts` with `z.infer` aliases, re-exported from `src/types/api-responses.ts`.
3. **Endpoint map.** `src/core/endpoints/<domain>Endpoints.ts`, following section 3.
4. **Client class.** `src/clients/<Domain>Client.ts`:

   ```ts
   import { ApiClient } from '../core/ApiClient';
   import { BaseEsiClient } from './BaseEsiClient';
   import { allianceEndpoints } from '../core/endpoints/allianceEndpoints';
   import { AllianceInfo } from '../types/api-responses';

   export class AllianceClient extends BaseEsiClient<typeof allianceEndpoints> {
     constructor(client: ApiClient) {
       super(client, allianceEndpoints);
     }

     getAllianceById(allianceId: number): Promise<AllianceInfo> {
       return this.api.getAllianceById(allianceId);
     }
   }
   ```

   `BaseEsiClient` supplies `this.api` (built by `createClient`), `streamEndpoint`, `fetchAllEndpoint`, `withMetadata()` and `withSafeMode()`. A client that also fronts another map (as `AllianceClient` fronts contact routes) builds a second `createClient(client, otherEndpoints)` in its constructor. The client holds no HTTP knowledge of its own.

5. **Registry.** In `src/core/ClientRegistry.ts` add the key to `ApiClientType`, the class to `ClientInstance`, an entry to `clientFactories`, and the class to the re-export list. `tests/tdd/core/ClientRegistry.test.ts` types its expectations as `Record<ApiClientType, …>`, so it stops compiling until you add the class there too.
6. **`EsiClient` getter.** In `src/EsiClient.ts`, `get <key>(): <Domain>Client { return this.getClient('<key>'); }`. Clients are created lazily on first access.
7. **`CustomEsiClient` getter.** In `src/EsiClientBuilder.ts`, the same getter returning `<Domain>Client | undefined`. Nothing enforces this yet, and several recent clients are missing (ARCH-08); do not add to that gap.
8. **`EsiApiFactory`.** `EsiApiFactory.createClient('<key>', config)` works from the registry with no change. Named factory methods (`createMarketClient` and so on) exist for a handful of common domains only; add one only if the domain is equally common.
9. **Root export.** `export { <Domain>Client } from './clients/<Domain>Client';` in `src/index.ts`.
10. **Specification and tests.** A new numbered feature file, step definitions, unit tests and a `tests/typetests/domain-responses.test-d.ts` assertion for at least one method, as in section 3.8.
11. **API report.** `npm run build && npm run api-report`, and commit `etc/esi.ts.api.md`.

The README's client table is still maintained by hand; update it until the counts and tables are generated (DOC-04).

---

## 5 · Generated files (DES-03)

Generated output is committed so a diff shows exactly what CCP changed. It is never edited by hand: the next run overwrites the edit and hides the real change. Prettier ignores `*.generated.ts` and `etc/*.api.md`.

| File or folder                                          | Regenerate with              | Source                              | Freshness check                                  |
| ------------------------------------------------------- | ---------------------------- | ----------------------------------- | ------------------------------------------------ |
| `src/types/generated/esi-spec.generated.ts`             | `npm run generate:types`     | OpenAPI schemas                     | CI and release `git diff --exit-code`            |
| `src/core/endpoints/esi-cache-ttls.generated.ts`        | `npm run generate:types`     | `x-cached-seconds`                  | CI and release `git diff --exit-code`            |
| `src/core/endpoints/esi-rate-limit-groups.generated.ts` | `npm run generate:types`     | Rate-limit extensions               | Not diffed in CI                                 |
| `src/core/endpoints/esi-scopes.generated.ts`            | `npm run generate:types`     | Operation `security` blocks         | Not diffed in CI; read by `validate:auth-scopes` |
| `etc/endpoint-scaffold.generated.reference.ts`          | `npm run generate:endpoints` | Operations                          | None; reference only                             |
| `tests/contract/snapshots/esi-openapi.snapshot.json`    | `npm run contract:snapshot`  | Whole document                      | Contract tests fall back to it                   |
| `okf/`                                                  | `npm run generate:okf`       | Operations and schemas              | None                                             |
| `etc/esi.ts.api.md`                                     | `npm run api-report`         | `dist/index.d.ts` via api-extractor | CI API Surface Check                             |

`npm run generate:all` runs types, OKF, the contract snapshot, schema drift and `validate:esi` in sequence. `generate:types` defaults to the compatibility date in `scripts/generate-esi-types.ts` and accepts `--latest` or `--compatibility-date=YYYY-MM-DD`. The OKF bundle is described in [OKF.md](OKF.md).

The hand-written counterparts are not generated and are not exempt from review: endpoint maps, Zod schemas, clients and the exception files under `scripts/` are product decisions, and the drift reports exist to keep them honest.

---

## 6 · Pagination rules (DES-08)

Pagination helpers take the caller's HTTP method and must not return a truncated result as if it were complete. Two places do not meet this yet, tracked as gap register row 8: the single-page offset path assumes GET when building its retry context, and `CursorPaginationHandler.fetchAll` returns the pages it has after three consecutive failures. New pagination code passes `def.method` through, as `BaseEsiClient.streamEndpoint` and `fetchAllEndpoint` already do, and throws rather than truncates. See [PAGINATION.md](PAGINATION.md).
