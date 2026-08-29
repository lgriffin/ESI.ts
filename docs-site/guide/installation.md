# Installation

## Package Install

```bash
npm install @lgriffin/esi.ts
```

Requires Node.js 18 or later.

## Sub-path Exports

ESI.ts provides targeted imports to reduce bundle size:

```typescript
// Main — clients, types, errors, middleware, utilities
import { EsiClient } from '@lgriffin/esi.ts';

// Zod schemas for runtime validation
import { MarketOrderSchema } from '@lgriffin/esi.ts/schemas';

// Error classes and type guards
import { EsiError, isCircuitOpen } from '@lgriffin/esi.ts/errors';

// Test utilities
import { TestDataFactory } from '@lgriffin/esi.ts/testing';

// Static Data Export (SQLite-backed)
import { SdeDataProvider } from '@lgriffin/esi.ts/sde';

// In-memory SDE provider
import { MemorySdeProvider } from '@lgriffin/esi.ts/sde/memory';
```

## Building from Source

```bash
git clone https://github.com/lgriffin/ESI.ts.git
cd ESI.ts
npm install        # installs dependencies and compiles via the prepare script
```

Recompile after changes:

```bash
npm run build
```

Verify everything works:

```bash
npm run example:status   # quick smoke test — checks ESI is reachable
npm test                 # full test suite (167 suites, 4,730 tests)
```

## Dual CJS/ESM Build

The package ships both CommonJS and ES Module bundles:

- `dist/index.js` — CommonJS (via `require()`)
- `dist/index.mjs` — ES Module (via `import`)
- `dist/index.d.ts` — TypeScript declarations

The `exports` field in `package.json` ensures bundlers and Node.js resolve to the correct format automatically.
