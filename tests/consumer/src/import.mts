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

/**
 * A defect this contract found and a bead tracks. It logs while the defect
 * reproduces and fails once it does not, so the fix has to remove the call.
 */
function knownIssue(bead: string, holds: boolean, expectation: string): void {
  if (holds) {
    throw new Error(
      `Known issue ${bead} no longer reproduces (${expectation}). Remove the knownIssue() call.`,
    );
  }
  console.warn(`known issue ${bead} still reproduces: ${expectation} is false`);
}

const STATUS = {
  players: 12345,
  server_version: '2345678',
  start_time: '2026-09-16T11:00:00Z',
};

function stubFetch(body: unknown): void {
  globalThis.fetch = async () =>
    new Response(JSON.stringify(body), {
      status: 200,
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
  knownIssue(
    'esi-v2s.15',
    isEsiError(failure),
    'isEsiError from ./errors recognises an error thrown by the root client',
  );
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
