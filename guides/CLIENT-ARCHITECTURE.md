# Client architecture

**Implements:** posture 1, `ARCH-14` and `ARCH-08` · see [CHARTER.md](CHARTER.md) Parts 1 and 2. **Checked by:** `tests/tdd/scripts/custom-client-identity.test.ts`. **Decided:** 2026-10-17 in [#664](https://github.com/lgriffin/ESI.ts/issues/664), option D.

ESI.ts is a library of hand-written, curated custom clients. The code that is generated from the ESI OpenAPI document is the foundation underneath them, not a replacement for them. This page records that decision and the plan that follows from it.

---

## The decision

> "D please. The core identity of the project is the custom approach and we should never give that up. This needs enshrined in the charter" (the maintainer, on #664)

- **The custom clients are the product.** `EsiClient`, `EsiClientBuilder` → `CustomEsiClient`, `EsiApiFactory.createClient(type)` and the <!-- metric:clients -->39<!-- /metric --> domain clients in `src/clients/`, over the endpoint maps in `src/core/endpoints/` and the Zod schemas in `src/schemas/`. Method names, argument order, body builders, wire fixes and validation strictness are product decisions, made by people.
- **Generation serves them.** The generated operations (`src/generated/operations.generated.ts`) and their `*Meta` supply paths, scopes, schemas and coverage. They never replace a custom client.
- **`createEsi()` from `@lgriffin/esi.ts/client` is the spec-shaped low-level surface.** It stays documented for anyone who wants calls that mirror the URL and the spec's parameters exactly (`esi.public`, `esi.as(identity)`, [MULTI-CHARACTER.md](MULTI-CHARACTER.md)), and it becomes the engine under the custom clients. It needs no feature parity with them.
- **Changing this is a charter amendment first.** ARCH-14 fails a change that deprecates or removes a custom-client construction surface, or replaces one with the generated surface.

### What 12.2.0 changes

12.1.0 marked the custom clients `@deprecated` for removal in 13.0.0, following a plan to make `createEsi()` the only surface. 12.2.0 lifts those deprecations. That is a compatible change: no name, signature or behaviour changes.

| Surface                                                                                           | 12.1.0                                | 12.2.0                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EsiClient`, `getDefaultClient`, `EsiClientBuilder`, `CustomEsiClient`                            | Deprecated, removed in 13.0.0         | Supported                                                                                                                                                                          |
| `EsiApiFactory` and `EsiApiFactory.createClient(type)`                                            | Deprecated, removed in 13.0.0         | Supported                                                                                                                                                                          |
| `EsiApiFactory`'s nine named factories (`createMarketClient` and the rest)                        | Deprecated since 11.0.0               | Still deprecated, in favour of `createClient(type)` or `EsiClientBuilder` (`createEsi()` as the spec-shaped alternative). Removal needs a future major release; none is scheduled. |
| `EsiTokenManager.createClient`                                                                    | Deprecated since 11.0.0               | Still deprecated, in favour of `esi.as(tokens.identity(id))`. Removal needs a future major release; none is scheduled.                                                             |
| `BaseEsiClient`, the 39 domain clients, `ApiClientType`, `RouteOptions`, `ApiClientBuilder`       | Deprecated, removed in 13.0.0         | Supported                                                                                                                                                                          |
| `ApiClient`, `configureApiClient`, the page, cursor and batch helpers, diagnostics, and 25 in all | Deprecated re-exports                 | Exported from their declarations again; every name and type unchanged                                                                                                              |
| The 194 hand-written response types in `src/types`, `TestDataFactory`, the `./schemas` entry      | Deprecated, removed in 13.0.0         | Supported                                                                                                                                                                          |
| `DeprecationInfo` on endpoint definitions                                                         | Unchanged: per-call warnings from ESI | Unchanged                                                                                                                                                                          |

No 13.0 is planned.

---

## The plan

Each step is additive or internal, so each can ship in a 12.x minor release. A future major would only be for clean-up chosen later, such as dropping setters that identity views make redundant.

1. **Lift the deprecations** (12.2.0, this page). Posture 1 and ARCH-14 go into the charter.
2. **Derive the endpoint maps from the generated `*Meta`.** Path, method, scopes, pagination kind and headers come from the spec. The hand-written part shrinks to what a custom client adds: the method name, argument order, `bodyBuilder`, and the wire fixes the spec gets wrong (query versus body for `addContacts`, comma-joined ids, `read` rather than `is_read`), kept in one overlay. `spec:coverage` then also proves every custom method points at a real operation. A spike on two domains comes before converting all 39.
3. **Generate the baseline schemas, hand-write the overrides.** The generated response schemas become the baseline, and a hand-written schema stays only where ESI's wire differs from the spec. Schema drift becomes a generator diff instead of an audit.
4. **Identity views for the custom clients.** A shared runtime with per-identity views, along the lines of `client.as(identity)` returning the same custom clients bound to one character over one cache, rate-limit budget and breaker, and a public-only builder whose types omit authenticated methods. Custom-client users get the multi-character model without learning a new call style.
   - **Public-only builder** (12.x): `EsiClientBuilder.buildPublic()` returns a `PublicCustomEsiClient` that holds no token. `PublicClient<K>` omits the methods listed in the generated `src/clients/authenticatedMethods.generated.ts`, which `npm run generate:public-clients` builds by running every method on a token-less client, so aliases and helpers that delegate to another client's endpoints are classified by what they call.
5. **Close runtime gaps once, in the shared runtime.** Parallel page collection, response metadata and safe mode, diagnostics, swappable middleware and nameable response types are built where both surfaces see them, not twice.
   - **Response metadata and safe mode** (12.x): one reader, `buildResponseMeta` in `src/core/responseMeta.ts`, serves each domain client's `withMetadata()`, the new `EsiClient.withMetadata()` / `withSafeMode()` and `CustomEsiClient.withMetadata()` / `withSafeMode()` (every domain from one call), and `esi.withMetadata()` / `esi.withSafeMode()`.
   - **Diagnostics** (12.x): `EsiDiagnostics` backs `EsiClient.diagnostics`, the new `CustomEsiClient.diagnostics` and its shortcuts, and `esi.diagnostics`. Since [#677](https://github.com/lgriffin/ESI.ts/issues/677) every domain client has `diagnostics` and `shutdown()` too: one built by `EsiApiFactory.createClient` reads and stops the pipeline it owns, and one reached through `EsiClient` or `CustomEsiClient` returns its parent's diagnostics object and leaves the shared pipeline to the parent (`src/core/pipelineOwnership.ts`).
   - **Swappable middleware** (12.x): `cache`, `rateLimiter`, `circuitBreaker`, `deduplicator` and `clock` are `EsiClientConfig` fields that `configureApiClient` installs, so `EsiClient`, the builder, `EsiApiFactory.createClient` and `createEsi` (whose `EsiOptions` carry the same five) take them the same way.

### Shared already

A feature the generated layer gains reaches the custom clients through the same pipeline code, not a copy of it:

| Feature                                | Custom clients                                                                                                                                       | `createEsi()`                                                             | One implementation                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Deprecation warnings                   | `DeprecationInfo` on the endpoint definition: `Endpoint '<method>' is deprecated. …`                                                                 | `OperationMeta.deprecation`: `Operation '<operationId>' is deprecated. …` | `src/core/endpoints/deprecationWarning.ts`                                                           |
| The OpenAPI document, as JSON and YAML | `meta.getOpenApiJson()`, `meta.getOpenApiYaml()`                                                                                                     | `meta.openapiJson.get()`, `meta.openapiYaml.get()`                        | `textResponse` through `handleRequest`; the same Accept header and the same JSON schema              |
| An empty answer on a public contract   | `getPublicContractBids/Items`, `fetchAllPublicContractBids/Items`, `streamPublicContractBids/Items`, and `streamEndpoint`/`fetchAllEndpoint` by name | `contracts.public.bids(id).get()`, `contracts.public.items(id).get()`     | `answeredWithNoContent` and `emptyListWhenNoContent` in `src/core/requestPipeline/statusHandling.ts` |

The endpoint maps stay hand-written and `src/core` may not import the generated layer, so `tests/tdd/core/endpointOperationParity.test.ts` holds the two in step: it fails when an endpoint definition and its generated operation disagree about deprecation (with the message and sunset date from `scripts/spec/operation-overlay.json`), a text response and its Accept header, or reading no content as an empty list. Step 2 of the plan derives these facts instead of checking them.

---

## Where things live

| Layer                  | Where                                                         | Role                                                                     |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Custom clients         | `src/EsiClient.ts`, `src/EsiClientBuilder.ts`, `src/clients/` | The product: named methods, curated arguments, helpers                   |
| Endpoint maps, schemas | `src/core/endpoints/*Endpoints.ts`, `src/schemas/`            | What each method calls and how its answer is validated                   |
| Request pipeline       | `src/core/`                                                   | Cache, retry, rate limiter, breaker, deduplicator, pagination; shared    |
| Generated operations   | `src/generated/`, `src/adapters/`                             | One typed function and `*Meta` per spec operation; the foundation        |
| Spec-shaped surface    | `src/client/` (`./client`)                                    | `createEsi()`, `esi.public`, `esi.as(identity)` over the generated layer |

[ARCHITECTURE.md](ARCHITECTURE.md) walks a request through the pipeline, and [SEMVER.md](SEMVER.md) says how each kind of change is released.
