---
layout: home

hero:
  name: ESI.ts
  text: The EVE Online ESI API, typed and validated
  tagline: A TypeScript client built as an engineered product rather than a generated wrapper. Caching, rate limiting, retry and pagination follow the rules ESI actually enforces.
  image:
    src: /logo.svg
    alt: ESI.ts
  actions:
    - theme: brand
      text: Get started
      link: /guide/usage
    - theme: alt
      text: Browse the examples
      link: /examples/
    - theme: alt
      text: API reference
      link: /api/
      target: _self

features:
  - title: Every ESI operation, typed
    details: Domain clients cover every operation in the ESI OpenAPI specification, and spec:coverage fails the build if one goes missing. Types, cache TTLs, rate-limit groups and scopes are generated from the spec.
    link: /guide/usage
    linkText: Using the client
  - title: Runtime validation
    details: Every GET response is checked against a Zod schema. Unknown fields pass through, so an additive change from CCP never breaks you; a changed shape throws EsiValidationError instead of corrupting your data.
    link: /guide/runtime-validation
    linkText: Runtime validation
  - title: Caching with ETags
    details: A GET inside ESI's cache window makes no HTTP call. Older entries are revalidated with ETags, a 5xx serves the stale copy, and a write invalidates the reads it affects. Keys are hashed per token.
    link: /guide/architecture
    linkText: How the cache works
  - title: Rate limits per group
    details: One bucket per ESI rate-limit group, generated from the spec. The limiter learns from ESI's headers and honours Retry-After, and a 420 or 429 blocks only its own group.
    link: /guide/architecture
    linkText: Architecture
  - title: Retry and circuit breaker
    details: Exponential backoff with jitter, one coalesced token refresh on 401, deduplication of identical in-flight GETs and an opt-in circuit breaker. Each is an interface you can replace.
    link: /guide/errors
    linkText: Errors and retryability
  - title: Pagination and streaming
    details: Offset and cursor paging. stream* yields one validated page at a time, fetchAll* fetches pages concurrently, and batch and batchPost handle fan-out.
    link: /guide/pagination
    linkText: Pagination
  - title: SSO and many characters
    details: EVE SSO with PKCE, a token manager for storage, proactive refresh and revocation, and createEsi() — one shared runtime with a typed public view and a view per character.
    link: /guide/multi-character
    linkText: Many characters
  - title: Offline static data
    details: The ./sde sub-path answers typed queries over CCP's Static Data Export with no database, and shares no code with the HTTP pipeline.
    link: /guide/sde
    linkText: Static data (SDE)
  - title: Tested to the spec
    details: Behaviour is written as EARS requirements with Gherkin scenarios, backed by property tests, a transport fault catalogue, recorded ESI payloads and mutation testing with ratcheted floors.
    link: /guide/testing
    linkText: Testing
---

## Quick start

```bash
npm install @lgriffin/esi.ts
```

```ts
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient({ userAgent: 'my-app/1.0 (you@example.com)' });
try {
  const status = await client.status.getStatus();
  console.log(`${status.players} pilots online`);
} finally {
  client.shutdown();
}
```

For many characters over one runtime, `@lgriffin/esi.ts/client` gives a public view in which an authenticated call does not compile, and a view per identity:

```ts
import { createEsi, identityFromToken } from '@lgriffin/esi.ts/client';

const esi = createEsi({ userAgent: 'my-app/1.0 (you@example.com)' });
const status = await esi.public.status.get();

// An access token from your SSO flow. An EsiTokenManager's
// tokens.identity(characterId) gives a refreshing identity instead.
const characterId = 2114794365;
const wallet = await esi
  .as(identityFromToken(process.env.ESI_ACCESS_TOKEN ?? ''))
  .character(characterId)
  .wallet.get();
```

<div class="feature-grid">
  <div class="feature-card">
    <h3><a href="./guide/">Guides</a></h3>
    <p>Construction, configuration, authentication, pagination, errors, logging and the SDE, plus the engineering charter, architecture and quality gates the project runs to.</p>
  </div>
  <div class="feature-card">
    <h3><a href="./examples/">Examples</a></h3>
    <p>Every runnable program in <code>examples/</code>, type-checked in CI; the ones that need no token run against live ESI every night.</p>
  </div>
  <div class="feature-card">
    <h3><a href="./api/" target="_self">API reference</a></h3>
    <p>The TypeDoc reference generated from the TSDoc in <code>src/</code>: every client, method, option, error and response type.</p>
  </div>
</div>
