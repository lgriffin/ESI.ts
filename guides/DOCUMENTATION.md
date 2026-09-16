# ESI.ts Documentation Guide

## Local Documentation

The complete API documentation is automatically generated from the TypeScript source code using TypeDoc.

- **Locally**: Run `npm run docs:serve` to serve docs at `http://localhost:8080`

## Documentation Structure

### Main Sections

1. **Classes** - All API clients and core classes
   - `EsiClient` - Main client with all 35 domain APIs
   - `CustomEsiClient` - Lightweight client with selected APIs via `EsiClientBuilder`
   - Individual clients (`CharacterClient`, `MarketClient`, `SkyhooksClient`, etc.)

2. **Interfaces** - TypeScript interfaces and contracts
   - Configuration interfaces (`EsiClientConfig`)
   - API response types (33 domain-specific type files)
   - Client contracts (`ICache`, `IRateLimiter`, `ILogger`)

3. **Functions** - Utility functions and helpers
   - Request handlers
   - Validation utilities
   - Test helpers

4. **Types** - Type aliases and custom types

### Key Documentation Pages

- **EsiClient** - Main client class with all domain accessors
- **EsiClientBuilder** - Builder pattern for custom clients
- **EsiDiagnostics** - Cache/circuit-breaker stats accessor
- **RequestDeduplicator** - Concurrent request coalescing
- **CircuitBreaker** - Fault tolerance with state machine
- **ETagCacheManager** - ETag-based response caching
- **RateLimiter** - ESI rate limit compliance

## Documentation Commands

```bash
# Generate documentation
npm run docs

# Watch for changes and regenerate docs
npm run docs:watch

# Serve documentation locally at http://localhost:8080
npm run docs:serve

# Clean documentation folder
npm run clean:docs

# Clean all build artifacts (including docs)
npm run clean
```

## Documentation examples are checked

A README example that does not compile costs more trust than a bug. `npm run test:docs-examples` finds every fenced `ts` or `typescript` block in `README.md`, `guides/*.md`, `src/sde/README.md` and `src/sde/docs/*.md`, and checks it against the packed package, the way a reader who copies it sees it:

1. Builds and packs the library as the consumer contract does, and installs the tarball into a scratch consumer outside the repository.
2. Writes each block to its own ES module next to a shared prelude, and type-checks all of them with `strict` under `moduleResolution: nodenext` and `bundler`. An import of a sub-path the package's `exports` map does not list fails here.
3. Runs each block marked `runnable` with node, with `fetch` replaced by a stub.

CI runs it in the `doc-examples` job, inside `ci-success`. `npm test` checks the annotations and the baseline without packing.

### Fragments and the prelude

Most blocks are fragments: they use a `client` built in an earlier block, or a `characterId` the reader supplies. [`tests/doc-examples/prelude.d.ts`](../tests/doc-examples/prelude.d.ts) declares those names as typed globals, so a fragment type-checks as written. A block that declares or imports a name itself shadows the global. When a new fragment needs a name the prelude lacks, add it there with the type a reader would have; do not type it `any`.

### Annotations

A block is type-checked unless it says otherwise. Two annotations exist, and anything else is an error, so a typo cannot switch a check off:

| Annotation                                | Where                                                                | Effect                                                                                                                                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runnable`                                | The fence (` ```ts runnable `) or a comment                          | Type-checked, then run against the stub transport in [`tests/doc-examples/stub-fetch.mjs`](../tests/doc-examples/stub-fetch.mjs). The block must build everything it uses: prelude names do not exist at runtime |
| `<!-- doc-example: no-check <reason> -->` | A comment on the line above the fence (blank lines between are fine) | Not checked. The reason is required                                                                                                                                                                              |

Use `no-check` for blocks that are not consumer code: method signature listings, fragments of a class body, and contributor examples that import from `src/`. Do not use it to silence an example that is wrong; fix the example.

### Known-broken examples

When an example exposes a real mismatch that cannot be fixed in the docs alone, mark it `no-check` with a reason that names the bead tracking it, for example `<!-- doc-example: no-check esi-abc.1 getFoo was removed; decide the replacement -->`, and list its key in [`scripts/doc-examples-baseline.json`](../scripts/doc-examples-baseline.json). The key is the file, the nearest heading, and the block's position under that heading: `README.md#Quick Start [1]`.

The baseline only shrinks. The run fails when a `no-check` names a bead but is not listed, when a listed block no longer exists or no longer names a bead (remove the entry once the example is fixed), and when an entry is not on `origin/master` already. Without `origin/master` to compare with, the run fails closed; CI fetches it first.

### Negative fixtures

`tests/tdd/doc-examples/fixtures/` holds a compliant file and three that must be rejected: a block calling a method that does not exist, an import of `@lgriffin/esi.ts/dist/errors` (present in the tarball but not exported), and a `no-check` without a reason. `tests/tdd/doc-examples/doc-examples.test.ts` puts them through the checker against a small stub package, and `npm run test:docs-examples` puts them through again against the packed library. If a fixture stops being rejected, both fail.

## Documentation Features

### What's Included

- **Complete API Coverage** - All classes, methods, and properties
- **Type Information** - Full TypeScript type definitions
- **Source Links** - Direct links to GitHub source code
- **Search Functionality** - Built-in search across all documentation
- **Inheritance Hierarchy** - Class inheritance relationships
- **Cross-References** - Links between related classes and methods
- **Examples** - Code examples from README and comments

### Navigation Tips

1. **Search Box** - Use the search box in the top-right to find specific classes or methods
2. **Module Tree** - Navigate through the organized module structure
3. **Class Hierarchy** - View inheritance relationships
4. **Source Links** - Click "Defined in" links to view source code on GitHub

## Quick Start Examples

The documentation includes comprehensive examples for:

- **Basic Usage** - Simple API calls (status, character lookup, universe)
- **Authentication** - Working with authenticated endpoints (wallet, skills, assets, mail)
- **Error Handling** - Proper error management with `EsiError`
- **Custom Clients** - Building lightweight clients with `EsiClientBuilder`
- **ETag Caching** - Performance optimization with `Cache-Control` TTL
- **Builder Pattern** - Fluent client construction
- **Cursor Pagination** - Freelance Jobs and future cursor-based routes
- **ESI Scopes** - Required SSO scopes documented per endpoint
- **Rate Limiting** - Configurable rate limit compliance
- **Token Refresh** - Automatic 401 retry with token provider

## Documentation Quality

- **Coverage**: 100% of public APIs documented
- **Type Safety**: Full TypeScript type information
- **Examples**: Practical usage examples
- **Search**: Full-text search capability
- **Mobile Friendly**: Responsive design for all devices

## Keeping Documentation Updated

The documentation is automatically regenerated from source code, ensuring it's always current with the latest API changes. CI generates and uploads documentation as a build artifact on every push.
