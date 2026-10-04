/**
 * ESI.ts Example: Many characters, one runtime
 *
 * Reads the wallet balance of every character an EsiTokenManager holds,
 * through one shared runtime: one rate limiter, one error budget and one
 * ETag cache for the whole application, and an immutable view per character.
 * See guides/MULTI-CHARACTER.md.
 *
 * REQUIRES stored tokens: run `npm run example:token-manager` first, which
 * logs a character in and stores it in ./tokens.example.json. Set
 * ESI_SSO_CLIENT_ID (and ESI_SSO_CLIENT_SECRET for a confidential client).
 *
 * Usage: npm run example:multi-character
 *
 * @nightly auth
 */
import {
  createConsoleLogger,
  EsiTokenManager,
  FileTokenStorage,
  isTokenRevoked,
} from '../src';
import { createEsi } from '../src/client';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const esi = createEsi({
  logger: esiLog,
  userAgent: 'esi.ts-examples/1.0 (https://github.com/lgriffin/ESI.ts)',
});

const tokens = new EsiTokenManager({
  logger: esiLog,
  clientId: process.env.ESI_SSO_CLIENT_ID ?? '',
  clientSecret: process.env.ESI_SSO_CLIENT_SECRET,
  storage: new FileTokenStorage('./tokens.example.json'),
});

async function main() {
  log.info('Many characters, one runtime');
  log.info('='.repeat(50));

  if (!process.env.ESI_SSO_CLIENT_ID) {
    log.info('Set ESI_SSO_CLIENT_ID to run this example.');
    return;
  }

  // The public view needs no token and is never attributed to a character.
  const status = await esi.public.status.get();
  log.info(`\nTranquility: ${status.players} players online`);

  const characters = (await tokens.listCharacters()).filter((c) => !c.revoked);
  if (characters.length === 0) {
    log.info('\nNo stored characters. Run example:token-manager first.');
    return;
  }

  // One view per character over the same runtime. The manager keeps each
  // token fresh; a 401 refreshes through SSO and the request is retried.
  log.info(`\nWallets of ${characters.length} character(s):`);
  const balances = await Promise.all(
    characters.map(async (c) => {
      const view = esi.as(tokens.identity(c.characterId));
      try {
        const isk = await view.character(c.characterId).wallet.get();
        return { name: c.characterName, isk };
      } catch (err) {
        if (isTokenRevoked(err)) {
          return { name: c.characterName, isk: null };
        }
        throw err;
      }
    }),
  );
  for (const { name, isk } of balances) {
    log.info(
      isk === null
        ? `  ${name}: token revoked, log in again`
        : `  ${name}: ${isk.toLocaleString('en-US', { maximumFractionDigits: 2 })} ISK`,
    );
  }

  // The second read of the status is served from the shared cache while the
  // spec TTL (30 s) holds: no request goes out.
  await esi.public.status.get();
  log.info('\nDone.');
  esi.shutdown();
}

main().catch((err) => {
  log.error('Request failed', { error: err });
  process.exitCode = 1;
});
