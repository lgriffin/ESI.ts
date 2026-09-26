# Generator spike: in-repo emitter

Phase 0 question from the Road to Done plan: write our own operation emitter, or
template over `@hey-api/openapi-ts`? This spike builds the first option for five
operations and checks the output against the compiler flags the plan wants.

## What was built

| File                      | Role                                                                          |
| ------------------------- | ----------------------------------------------------------------------------- |
| `emit.ts`                 | About 150 lines. Reads the vendored spec and writes `operations.generated.ts` |
| `transport.ts`            | The one seam every operation calls: `request` and `paginate`                  |
| `operations.generated.ts` | Output for the five operations below                                          |
| `usage.check.ts`          | Consumer-side compile check, including one `@ts-expect-error` case            |

Regenerate with `npx ts-node --transpile-only docs/spikes/generator/emit.ts`.

| Operation                               | Why it was picked                               |
| --------------------------------------- | ----------------------------------------------- |
| `GET /status`                           | Public, no parameters                           |
| `GET /markets/{region_id}/orders`       | Paginated by `page`, enum query parameter       |
| `GET /characters/{character_id}/wallet` | Authenticated, one SSO scope, scalar response   |
| `GET /universe/types/{type_id}`         | Nested objects and arrays, many optional fields |
| `POST /universe/names`                  | Request body                                    |

## Results

- The output compiles under `strict`, `exactOptionalPropertyTypes`,
  `noUncheckedIndexedAccess` and `isolatedDeclarations`.
- Every emitted operation carries its operationId, method, path, required SSO
  scopes and pagination flag as a `*Meta` constant. That's the data a
  `spec:coverage` gate and a scope-typed client need.
- Response types come out `readonly`, with optional fields optional, enums as
  literal unions and the spec summary as JSDoc.
- Paginated operations return `AsyncIterable` of the element type, so a
  consumer writes `for await (const order of getMarketsRegionIdOrders(...))`.
- The consumer check caught a real emitter bug on the first run. The iterator
  yielded whole pages instead of orders. That argues for keeping a usage type
  test beside the snapshot test in Phase 1.

## What Phase 1 still has to solve

1. **Branded IDs.** The spec names some ID schemas (`CharacterID` is a `$ref`),
   but most IDs are inline `integer` with `format: int64`. Mapping parameters
   onto the existing branded types needs a small name-to-brand table.
2. **Shared header parameters.** Compatibility date, tenant, `If-None-Match`
   and language are `$ref` parameters. The spike leaves them to the pipeline,
   which is where the plan wants them.
3. **Cursor pagination.** The spike only recognises `page`. The `before` and
   `after` routes need a second iterator shape.
4. **Runtime validation.** The spike emits types only. Replacing the 37
   hand-written Zod schemas means emitting validators or keeping a schema:drift
   check, which is the plan's "validate option" decision.
5. **Naming and scopes.** The spike uses camel-cased operationIds
   (`getCharactersCharacterIdWallet`). Deriving `esi.character(id).wallet()`
   from path prefixes is the Phase 2 scope-tree work.
6. **Non-object shapes.** `oneOf`, nullable fields and error responses aren't
   exercised by these five operations.

## Recommendation

Use the in-repo emitter. It adds no dependency, it slots next to
`scripts/generate-esi-types.ts` (which already parses this spec), and every
decision the plan cares about is a few lines we control: scope tree, branded
IDs, pagination shape and `*Meta` for coverage.

`@hey-api/openapi-ts` wasn't trialled. Adding it is a new dependency, which
needs the maintainer's go-ahead. It's worth a comparison only if Phase 1 runs
into schema features the emitter can't handle cheaply.
