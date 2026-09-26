// Compile-time check of the emitted surface; not run.
import type { Transport } from './transport';
import {
  getMarketsRegionIdOrders,
  getCharactersCharacterIdWallet,
  postUniverseNames,
} from './operations.generated';

export async function usage(t: Transport): Promise<void> {
  for await (const order of getMarketsRegionIdOrders(t, {
    region_id: 10000002,
    order_type: 'sell',
  })) {
    const price: number = order.price;
    void price;
  }
  const balance: number = await getCharactersCharacterIdWallet(t, {
    character_id: 90000001,
  });
  const [first] = await postUniverseNames(t, [30000142]);
  const category: 'solar_system' | string | undefined = first?.category;
  void balance;
  void category;
  // @ts-expect-error order_type only accepts buy, sell or all
  getMarketsRegionIdOrders(t, { region_id: 1, order_type: 'both' });
}
