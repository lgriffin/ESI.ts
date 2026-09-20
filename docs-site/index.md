---
layout: home

hero:
  name: ESI.ts
  text: EVE Online ESI API Client
  tagline: Production-grade TypeScript SDK with runtime validation, intelligent caching, and full endpoint coverage.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Explore Endpoints
      link: /explorer/
    - theme: alt
      text: GitHub
      link: https://github.com/lgriffin/ESI.ts

features:
  - icon: 🛡️
    title: Runtime Validation
    details: Every GET response validated via Zod schemas. Schema mismatches throw immediately — no silent data corruption when CCP changes a field.
  - icon: ⚡
    title: Three-Tier Caching
    details: Spec-aware TTL (zero HTTP calls), ETag conditional GETs, and stale-on-error fallback. Write operations auto-invalidate related caches.
  - icon: 🔄
    title: Resilience Built In
    details: Exponential backoff with jitter, per-endpoint circuit breaker, automatic 401 token refresh with concurrent coalescing.
  - icon: 📊
    title: 235 Endpoints
    details: 206 from the public ESI spec plus 29 for newer EVE features. All validated against live Tranquility with 52 runnable examples.
  - icon: 🚀
    title: Streaming Pagination
    details: 73+ AsyncGenerator streaming methods across 21 clients. Process market orders, assets, and contracts page-by-page without loading everything into memory.
  - icon: 🎯
    title: Rate Limit Groups
    details: 36 per-group token buckets extracted from the ESI spec at build time. Market requests never starve wallet requests.
---

<script setup>
import { VPTeamMembers } from 'vitepress/theme';
</script>

## Quick Start

Install the package and make your first API call in under a minute:

```bash
npm install @lgriffin/esi.ts
```

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();

// Public data — no auth required
const status = await client.status.getStatus();
console.log(`${status.players} pilots online`);

const character = await client.characters.getCharacterPublicInfo(1689391488);
console.log(character.name);

// Authenticated — set ESI_ACCESS_TOKEN env var
const authedClient = new EsiClient({ accessToken: 'your-token' });
const wallet = await authedClient.wallet.getCharacterWallet(characterId);

await client.shutdown();
```

<div class="feature-grid">
  <div class="feature-card">
    <h3>Type Safe</h3>
    <p>Full TypeScript types for every endpoint, response, and configuration option. Branded ID types prevent mixing character IDs with corporation IDs.</p>
  </div>
  <div class="feature-card">
    <h3>Tree Shakeable</h3>
    <p>Sub-path exports for schemas, errors, testing, and SDE. Use <code>EsiClientBuilder</code> to load only the domain clients you need.</p>
  </div>
  <div class="feature-card">
    <h3>Spec Accurate</h3>
    <p>Every endpoint tested against live ESI. Wire format bugs in the OpenAPI spec (query params vs body, field naming) are caught and fixed.</p>
  </div>
  <div class="feature-card">
    <h3>Battle Tested</h3>
    <p>167 test suites, 4,730 tests across 9 tiers including property-based fuzzing, mutation testing, and contract tests against the live spec.</p>
  </div>
</div>

## Why Not Just Generate a Client?

Tools like `openapi-typescript` can produce a typed client from the ESI spec in minutes. But they stop at type generation. ESI.ts handles the problems you hit _after_ the types compile:

|                   | Generated Client        | ESI.ts                                |
| ----------------- | ----------------------- | ------------------------------------- |
| **Validation**    | Types erased at runtime | Zod schemas on every GET              |
| **Caching**       | You build it            | Three-tier, automatic                 |
| **Rate Limiting** | You build it            | 36 per-group buckets                  |
| **Pagination**    | You write the loop      | Automatic + streaming                 |
| **Retry**         | You build it            | Exponential backoff + circuit breaker |
| **Spec Bugs**     | Faithfully reproduced   | Tested and fixed                      |
