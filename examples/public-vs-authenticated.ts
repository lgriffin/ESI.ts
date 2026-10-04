/**
 * ESI.ts Example: Public versus authenticated, at the type level
 *
 * `esi.public` is a `PublicScopeTree`: the operations that need no SSO scope.
 * An authenticated operation on it is a compile error, not a 401 at runtime.
 * `esi.as(identity)` is the full `ScopeTree` for one character.
 * See guides/MULTI-CHARACTER.md and issue #183.
 *
 * Runs without a token: the public calls go to ESI and the authenticated
 * call is only shown, never sent, unless ESI_ACCESS_TOKEN is set.
 *
 * Usage: npm run example:public-vs-authenticated
 *
 * @nightly public
 */
import { createEsi, identityFromToken } from '../src/client';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const JITA = 30000142;
const THE_FORGE = 10000002;

const esi = createEsi({
  logger: esiLog,
  userAgent: 'esi.ts-examples/1.0 (https://github.com/lgriffin/ESI.ts)',
});

async function main() {
  log.info('Public versus authenticated');
  log.info('='.repeat(50));

  // Public: no token anywhere.
  const jita = await esi.public.universe.systems(JITA).get();
  log.info(`\n${jita.name}: security ${jita.security_status.toFixed(2)}`);

  let sellOrders = 0;
  for await (const order of esi.public
    .market(THE_FORGE)
    .orders.get({ order_type: 'sell', type_id: 34 })) {
    sellOrders += order.volume_remain > 0 ? 1 : 0;
  }
  log.info(`Tritanium sell orders in The Forge: ${sellOrders}`);

  // Authenticated: does not compile on the public view.
  // @ts-expect-error the wallet needs esi-wallet.read_character_wallet.v1
  esi.public.character(1).wallet;

  const token = process.env.ESI_ACCESS_TOKEN;
  if (!token) {
    log.info('\nSet ESI_ACCESS_TOKEN to read a wallet through esi.as().');
    return;
  }
  const characterId = Number(process.env.ESI_CHARACTER_ID);
  const view = esi.as(identityFromToken(token));
  const balance = await view.character(characterId).wallet.get();
  log.info(`\nWallet: ${balance.toLocaleString('en-US')} ISK`);
}

main().catch((err) => {
  log.error('Request failed', { error: err });
  process.exitCode = 1;
});
