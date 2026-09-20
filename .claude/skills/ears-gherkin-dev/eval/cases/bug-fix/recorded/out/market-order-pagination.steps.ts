// Additions to tests/bdd/step-definitions/core/market.steps.ts for esi-4kq.
// The scenarios queue pages at the transport seam and assert on the requests
// that actually left the client, so they fail until the paginator keeps the
// order_type query on follow-up pages.
import { defineFeature, loadFeature } from 'jest-cucumber';
import fetchMock from 'jest-fetch-mock';
import { EsiClient } from '../../../../src/EsiClient';
import { queueResponse } from '../../support';

const feature = loadFeature('tests/bdd/features/core/0023-market.feature');

const THE_FORGE = 10000002;

const sellOrder = (orderId: number) => ({
  order_id: orderId,
  type_id: 34,
  location_id: 60003760,
  system_id: 30000142,
  volume_total: 100,
  volume_remain: 100,
  min_volume: 1,
  price: 5.5,
  is_buy_order: false,
  duration: 90,
  issued: '2026-09-01T00:00:00Z',
  range: 'region',
});

const requestedUrls = (): string[] =>
  fetchMock.mock.calls.map(([input]) => String(input));

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    fetchMock.resetMocks();
    client = new EsiClient({
      clientId: 'test-market-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Sell filter is sent on each page of a three-page order book', ({
    given,
    when,
    then,
  }) => {
    given(
      'a sell-filtered order book for The Forge that spans three pages',
      () => {
        for (const orderId of [1, 2, 3]) {
          queueResponse({
            status: 200,
            headers: { 'X-Pages': '3' },
            body: [sellOrder(orderId)],
          });
        }
      },
    );

    when('the client requests the sell orders of The Forge', async () => {
      await client.market.getMarketOrders(THE_FORGE, 'sell');
    });

    then('every page request shall carry the sell filter', () => {
      const urls = requestedUrls();
      expect(urls).toHaveLength(3);
      for (const url of urls) {
        expect(url).toContain('order_type=sell');
      }
    });
  });

  test('Sell filter on a single-page order book issues one filtered request', ({
    given,
    when,
    then,
  }) => {
    given(
      'a sell-filtered order book for The Forge that fits on one page',
      () => {
        queueResponse({
          status: 200,
          headers: { 'X-Pages': '1' },
          body: [sellOrder(1)],
        });
      },
    );

    when('the client requests the sell orders of The Forge', async () => {
      await client.market.getMarketOrders(THE_FORGE, 'sell');
    });

    then('exactly one filtered request shall be sent', () => {
      const urls = requestedUrls();
      expect(urls).toHaveLength(1);
      expect(urls[0]).toContain('order_type=sell');
    });
  });
});
