/**
 * The committed scope tree (src/generated/operations.generated.ts) driven
 * through PipelineTransport and a mocked fetch, as the client tree will be.
 */
import fetchMock from 'jest-fetch-mock';
import { PipelineTransport } from '../../../src/adapters/PipelineTransport';
import { ApiClient } from '../../../src/core/ApiClient';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import {
  createScopeTree,
  type PublicScopeTree,
  type ScopeTree,
} from '../../../src/generated/operations.generated';

fetchMock.enableMocks();

function tree(token?: string): ScopeTree {
  const client = new ApiClient(
    'scope-tree-test',
    'https://esi.evetech.net',
    token,
  );
  const limiter = new RateLimiter();
  limiter.setTestMode(true);
  client.setRateLimiter(limiter);
  return createScopeTree(new PipelineTransport(client));
}

const sent = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i]!;
  return { url: new URL(String(url)), init: init! };
};

describe('the generated scope tree', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('reaches a public root operation', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ players: 1 }));

    const status = await tree().status.get();

    expect(status.players).toBe(1);
    expect(sent().url.pathname).toBe('/status');
  });

  it('binds a factory argument into the path of a scoped operation', async () => {
    fetchMock.mockResponseOnce('1234.5');

    const balance = await tree('token').character(90000001).wallet.get();

    expect(balance).toBe(1234.5);
    expect(sent().url.pathname).toBe('/characters/90000001/wallet');
    expect(new Headers(sent().init.headers).get('authorization')).toBe(
      'Bearer token',
    );
  });

  it('binds arguments at two levels and sends a body', async () => {
    fetchMock.mockResponseOnce('{}');

    await tree('token')
      .character(90000001)
      .mail(7)
      .put({ read: true, labels: [1] });

    expect(sent().url.pathname).toBe('/characters/90000001/mail/7');
    expect(sent().init.method).toBe('PUT');
    expect(JSON.parse(String(sent().init.body))).toEqual({
      read: true,
      labels: [1],
    });
  });

  it('passes consecutive path parameters from one call', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ killmail_id: 1 }));

    await tree().killmail(1, 'abc').get();

    expect(sent().url.pathname).toBe('/killmails/1/abc');
  });

  it('pages a page-paginated leaf and passes its query parameters', async () => {
    fetchMock.mockResponses(
      [
        JSON.stringify([{ order_id: 1 }, { order_id: 2 }]),
        { headers: { 'x-pages': '2' } },
      ],
      [JSON.stringify([{ order_id: 3 }]), { headers: { 'x-pages': '2' } }],
    );

    const ids: number[] = [];
    for await (const order of tree()
      .market(10000002)
      .orders.get({ order_type: 'sell' })) {
      ids.push(order.order_id);
    }

    expect(ids).toEqual([1, 2, 3]);
    expect(sent(0).url.pathname).toBe('/markets/10000002/orders');
    expect(sent(0).url.searchParams.get('order_type')).toBe('sell');
    expect(sent(1).url.searchParams.get('page')).toBe('2');
  });

  it('keeps a nested collection callable and a namespace at once', async () => {
    fetchMock.mockResponses(JSON.stringify([]), JSON.stringify({}));
    const character = tree('token').character(90000001);

    await character.mail.get();
    await character.mail(7).get();

    expect(sent(0).url.pathname).toBe('/characters/90000001/mail');
    expect(sent(1).url.pathname).toBe('/characters/90000001/mail/7');
  });

  it('gives the public view only scope-less operations', () => {
    const view: PublicScopeTree = tree();
    const typeErrors = (): void => {
      // @ts-expect-error the wallet needs a scope
      void view.character(1).wallet;
      // @ts-expect-error order_type is required
      void view.market(1).orders.get({});
      void view.character(1).portrait.get();
    };
    expect(typeErrors).toBeInstanceOf(Function);
  });
});
