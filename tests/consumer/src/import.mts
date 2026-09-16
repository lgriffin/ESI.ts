/**
 * An ES module consumer. tsc type-checks this file under `module: nodenext`
 * (so every import resolves through the `import` condition of `exports` and
 * its `types`), emits `out/import.mjs`, and the runner executes it with node.
 *
 * Every sub-path in the package's `exports` map must be imported here; the
 * runner fails if one is missing.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import {
  EsiClient,
  EsiError as RootEsiError,
  isValidationError,
  schemas,
  type ServerStatus,
} from '@lgriffin/esi.ts';
import {
  EsiError,
  EsiValidationError,
  isEsiError,
  isNotFound,
  isRetryable,
  isValidationError as isValidationErrorFromErrors,
} from '@lgriffin/esi.ts/errors';
import {
  CharacterInfoSchema,
  ServerStatusSchema,
} from '@lgriffin/esi.ts/schemas';
import { TestDataFactory } from '@lgriffin/esi.ts/testing';
import { MemorySdeProvider, type EveType } from '@lgriffin/esi.ts/sde';
import { MemorySdeProvider as MemoryOnlyProvider } from '@lgriffin/esi.ts/sde/memory';

const require = createRequire(import.meta.url);
const pkg = require('@lgriffin/esi.ts/package.json') as { version: string };

const STATUS = {
  players: 12345,
  server_version: '2345678',
  start_time: '2026-09-16T11:00:00Z',
};

function stubFetch(body: unknown, status = 200): void {
  globalThis.fetch = async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
}

assert.equal(typeof pkg.version, 'string');

// The root entry: a real client, its pipeline and response validation.
const client = new EsiClient({
  clientId: 'consumer-contract',
  logLevel: 'error',
});
try {
  stubFetch(STATUS);
  const status: ServerStatus = await client.status.getStatus();
  const players: number = status.players;
  assert.equal(players, STATUS.players);

  stubFetch({ players: 'not a number' });
  client.clearCache();
  const failure = await client.status.getStatus().then(
    () => assert.fail('a malformed body should be rejected'),
    (err: unknown) => err,
  );
  assert.ok(isValidationError(failure), 'root isValidationError');
  assert.ok(failure instanceof RootEsiError, 'instanceof the root EsiError');
  // ./errors shares its classes and guards with the root entry, so they
  // recognise what the root client throws (esi-v2s.15).
  assert.equal(
    EsiError,
    RootEsiError,
    './errors EsiError is the root EsiError',
  );
  assert.ok(isEsiError(failure), './errors isEsiError on a client error');
  assert.ok(failure instanceof EsiError, 'instanceof the ./errors EsiError');
  assert.ok(
    isValidationErrorFromErrors(failure),
    './errors isValidationError on a client error',
  );

  stubFetch({ error: 'Not found' }, 404);
  client.clearCache();
  const notFound = await client.status.getStatus().then(
    () => assert.fail('a 404 should be rejected'),
    (err: unknown) => err,
  );
  assert.ok(isNotFound(notFound), './errors isNotFound on a client 404');
  assert.ok(!isRetryable(notFound), './errors isRetryable on a client 404');
} finally {
  client.shutdown();
}

// ./errors
const validation = new EsiValidationError('https://esi.evetech.net/status', {});
assert.ok(validation instanceof EsiError);
assert.equal(validation.direction, 'response');

// ./schemas, and the same schemas through the root namespace
const character = TestDataFactory.createCharacterInfo();
assert.ok(CharacterInfoSchema.safeParse(character).success);
assert.ok(schemas.ServerStatusSchema.safeParse(STATUS).success);
assert.ok(!ServerStatusSchema.safeParse({}).success);

// ./sde and ./sde/memory
const type = {
  typeId: 587,
  groupId: 25,
  mass: 1_067_000,
  name: 'Rifter',
  portionSize: 1,
  published: true,
  packagedVolume: 2500,
  volume: 27_289,
  radius: 31,
  description: null,
} as EveType;
assert.equal(
  new MemorySdeProvider({ types: [type] }).getType(587)?.name,
  'Rifter',
);
assert.equal(
  new MemoryOnlyProvider({ types: [type] }).getType(587)?.name,
  'Rifter',
);

console.log(`import: @lgriffin/esi.ts ${pkg.version} OK`);
