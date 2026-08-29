# Why ESI.ts?

Tools like `openapi-typescript` or `openapi-generator` can produce a typed client from the ESI OpenAPI spec in minutes. They're a reasonable starting point — but they stop at type generation. ESI.ts handles the problems you hit _after_ the types compile.

## What Generators Give You

- TypeScript interfaces from the OpenAPI spec
- Basic request/response typing
- A thin HTTP wrapper

## What ESI.ts Gives You On Top

| Capability             | Generated Client                                                         | ESI.ts                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Runtime validation** | Types erased at runtime. If CCP changes a field, silent data corruption. | Every GET response validated via Zod schemas. Mismatches throw `EsiValidationError` immediately.                         |
| **Caching**            | You build your own.                                                      | Three-tier: spec-aware TTL (zero HTTP calls), ETag conditional GETs, stale-on-error fallback. Write ops auto-invalidate. |
| **Rate limiting**      | You build your own.                                                      | 36 per-group token buckets from the ESI spec. Market requests can't starve wallet requests.                              |
| **Pagination**         | You write the page loop.                                                 | Automatic offset pagination, cursor-based pagination, and streaming `AsyncGenerator` for large datasets.                 |
| **Retry & resilience** | None.                                                                    | Exponential backoff with jitter, circuit breaker, automatic 401 token refresh with concurrent coalescing.                |
| **Wire format**        | Generates from spec, reproducing spec bugs.                              | Every endpoint tested against live ESI. Wire format bugs are caught and fixed.                                           |
| **Batch operations**   | None.                                                                    | `batch()` with bounded concurrency, `batchPost()` with auto-chunking.                                                    |
| **Domain knowledge**   | Generic HTTP client.                                                     | 39 domain clients with typed methods, JSDoc, and input validation.                                                       |
| **Streaming**          | None.                                                                    | 73+ `stream*` methods via `AsyncGenerator` across 21 clients.                                                            |
| **Testing**            | Whatever you write.                                                      | 167 suites, 4,730 tests across 9 tiers including fuzzing, mutation testing, and contract tests.                          |

## The Spec Bug Problem

The ESI OpenAPI spec is not a perfect source of truth. During live endpoint validation, ESI.ts discovered:

- `addContacts`, `editContacts`, and 4 UI endpoints document parameters as request body when ESI actually expects query parameters
- `deleteCharacterContacts` expects comma-separated contact IDs as a query param, not a JSON body
- Fleet wing/squad names have a 10-character limit not documented in the spec
- The `updateMailMetadata` endpoint uses the field name `read`, not `is_read`

A generated client faithfully reproduces these spec bugs. ESI.ts fixes them.

## When to Use a Generated Client Instead

If you need:

- A quick prototype with no production requirements
- Only a handful of endpoints with simple request/response patterns
- Full control over the HTTP layer with no middleware opinions
- To avoid adding a dependency

A generated client or raw fetch calls may be the better fit. ESI.ts shines when you need production resilience, correct wire formats, and don't want to rebuild caching/rate-limiting/pagination yourself.
