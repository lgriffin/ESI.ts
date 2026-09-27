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
import { EsiTokenManager, FileTokenStorage, isTokenRevoked } from '../src';
import { createEsi } from '../src/client';

const esi = createEsi({
  userAgent: 'esi.ts-examples/1.0 (https://github.com/lgriffin/ESI.ts)',
});

const tokens = new EsiTokenManager({
  clientId: process.env.ESI_SSO_CLIENT_ID ?? '',
  clientSecret: process.env.ESI_SSO_CLIENT_SECRET,
  storage: new FileTokenStorage('./tokens.example.json'),
});

async function main() {
  console.log('Many characters, one runtime');
  console.log('='.repeat(50));

  if (!process.env.ESI_SSO_CLIENT_ID) {
    console.log('Set ESI_SSO_CLIENT_ID to run this example.');
    return;
  }

  // The public view needs no token and is never attributed to a character.
  const status = await esi.public.status.get();
  console.log(`\nTranquility: ${status.players} players online`);

  const characters = (await tokens.listCharacters()).filter((c) => !c.revoked);
  if (characters.length === 0) {
    console.log('\nNo stored characters. Run example:token-manager first.');
    return;
  }

  // One view per character over the same runtime. The manager keeps each
  // token fresh; a 401 refreshes through SSO and the request is retried.
  console.log(`\nWallets of ${characters.length} character(s):`);
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
    console.log(
      isk === null
        ? `  ${name}: token revoked, log in again`
        : `  ${name}: ${isk.toLocaleString('en-US', { maximumFractionDigits: 2 })} ISK`,
    );
  }

  // The second read of the status is served from the shared cache while the
  // spec TTL (30 s) holds: no request goes out.
  await esi.public.status.get();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
