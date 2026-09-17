# Compliant fixture

Every block here must pass: `doc-examples.test.ts` checks it against the stub
package in `stub-package/`, and `npm run test:docs-examples` against the packed
library.

## A fragment that uses the prelude

```ts
const status = await client.status.getStatus();
const players: number = status.players;
```

## An exported sub-path

```typescript
import { isNotFound } from '@lgriffin/esi.ts/errors';

const missing: boolean = isNotFound(new Error('not an ESI error'));
```

## A skipped block with a reason

<!-- doc-example: no-check a signature listing, not a statement -->

```ts
getStatus(): Promise<ServerStatus>
```

## A runnable block

```ts runnable
import { EsiClient } from '@lgriffin/esi.ts';

const esi = new EsiClient({ clientId: 'doc-examples-fixture' });
try {
  const status = await esi.status.getStatus();
  if (status.players !== 23456) {
    throw new Error(`stub fetch not used: ${status.players} players`);
  }
} finally {
  await esi.shutdown();
}
```
