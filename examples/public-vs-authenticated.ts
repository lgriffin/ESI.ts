/**
 * ESI.ts Example: Public versus authenticated, at the type level
 *
 * `EsiClientBuilder.buildPublic()` returns custom clients that hold no token
 * and whose types leave out every method that needs one, so an authenticated
 * call is a compile error, not a 401 at runtime. `client.as(identity)` is the
 * same domain clients sending as one character. The spec-shaped `createEsi()`
 * surface has the same split (`esi.public`, `esi.as(identity)`), shown last.
 * See guides/USAGE.md and guides/MULTI-CHARACTER.md.
 *
 * Runs without a token: the public calls go to ESI and the authenticated
 * call is only shown, never sent, unless ESI_ACCESS_TOKEN is set.
 *
 * Usage: npm run example:public-vs-authenticated
 *
 * @nightly public
 */
import {
  createConsoleLogger,
  EsiClient,
  EsiClientBuilder,
  identityFromToken,
} from '../src';
import { createEsi } from '../src/client';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const USER_AGENT = 'esi.ts-examples/1.0 (https://github.com/lgriffin/ESI.ts)';
const JITA = 30000142;
const THE_FORGE = 10000002;
const TRITANIUM = 34;

async function main() {
  log.info('Public versus authenticated');
  log.info('='.repeat(50));

  // Public: a client that never sends a token, whatever the environment says.
  const pub = new EsiClientBuilder()
    .addClients(['universe', 'market'])
    .withConfig({ logger: esiLog, userAgent: USER_AGENT })
    .buildPublic();
  try {
    const jita = await pub.universe!.getSystemById(JITA);
    log.info(`\n${jita.name}: security ${jita.security_status.toFixed(2)}`);

    const history = await pub.market!.getMarketHistory(THE_FORGE, TRITANIUM);
    const latest = history.at(-1);
    if (latest) {
      log.info(
        `Tritanium in The Forge on ${latest.date}: ${latest.average} ISK`,
      );
    }

    // Authenticated: does not compile on the public client.
    // @ts-expect-error getCharacterOrders needs esi-markets.read_character_orders.v1
    void pub.market!.getCharacterOrders;
  } finally {
    pub.shutdown();
  }

  const token = process.env.ESI_ACCESS_TOKEN;
  if (!token) {
    log.info('\nSet ESI_ACCESS_TOKEN to read a wallet through client.as().');
    return;
  }
  const characterId = Number(process.env.ESI_CHARACTER_ID);

  // Authenticated: the same domain clients, sending as one character.
  const client = new EsiClient({ logger: esiLog, userAgent: USER_AGENT });
  try {
    const pilot = client.as(identityFromToken(token));
    const balance = await pilot.wallet.getCharacterWallet(characterId);
    log.info(`\nWallet: ${balance.toLocaleString('en-US')} ISK`);
  } finally {
    client.shutdown();
  }

  // The spec-shaped surface: calls that mirror the URL, on the same engine.
  const esi = createEsi({ logger: esiLog, userAgent: USER_AGENT });
  try {
    // @ts-expect-error the wallet needs esi-wallet.read_character_wallet.v1
    void esi.public.character(1).wallet;
    const viaSpec = await esi
      .as(identityFromToken(token))
      .character(characterId)
      .wallet.get();
    log.info(
      `Wallet through createEsi: ${viaSpec.toLocaleString('en-US')} ISK`,
    );
  } finally {
    esi.shutdown();
  }
}

main().catch((err) => {
  log.error('Request failed', { error: err });
  process.exitCode = 1;
});
