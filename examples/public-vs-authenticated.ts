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

const JITA = 30000142;
const THE_FORGE = 10000002;

const esi = createEsi({
  userAgent: 'esi.ts-examples/1.0 (https://github.com/lgriffin/ESI.ts)',
});

async function main() {
  console.log('Public versus authenticated');
  console.log('='.repeat(50));

  // Public: no token anywhere.
  const jita = await esi.public.universe.systems(JITA).get();
  console.log(`\n${jita.name}: security ${jita.security_status.toFixed(2)}`);

  let sellOrders = 0;
  for await (const order of esi.public
    .market(THE_FORGE)
    .orders.get({ order_type: 'sell', type_id: 34 })) {
    sellOrders += order.volume_remain > 0 ? 1 : 0;
  }
  console.log(`Tritanium sell orders in The Forge: ${sellOrders}`);

  // Authenticated: does not compile on the public view.
  // @ts-expect-error the wallet needs esi-wallet.read_character_wallet.v1
  esi.public.character(1).wallet;

  const token = process.env.ESI_ACCESS_TOKEN;
  if (!token) {
    console.log('\nSet ESI_ACCESS_TOKEN to read a wallet through esi.as().');
    return;
  }
  const characterId = Number(process.env.ESI_CHARACTER_ID);
  const view = esi.as(identityFromToken(token));
  const balance = await view.character(characterId).wallet.get();
  console.log(`\nWallet: ${balance.toLocaleString('en-US')} ISK`);
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
