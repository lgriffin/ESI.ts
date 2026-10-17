import fetchMock from 'jest-fetch-mock';
import { ContractsClient } from '../../../src/clients/ContractsClient';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { EsiParseError } from '../../../src/core/util/error';

fetchMock.enableMocks();

// The public contract bid and item routes answer an expired or accepted
// contract with no content: a 204, or a 200 with Content-Length 0. The
// direct calls read that as an empty list; so do the page helpers, through
// the same emptyWhenNoContent flag createEsi's operations carry.
describe('ContractsClient public contract pages answered with no content', () => {
  const client = new ApiClientBuilder()
    .setClientId('contracts-no-content-test')
    .setLink('https://esi.evetech.net')
    .build();
  const contracts = new ContractsClient(client);

  const BID = {
    bid_id: 1,
    amount: 1_000_000,
    date_bid: '2026-10-01T12:00:00Z',
  };
  const ITEM = {
    record_id: 1,
    type_id: 34,
    quantity: 100,
    is_included: true,
  };

  const emptyOk = () =>
    fetchMock.mockResponseOnce('', {
      status: 200,
      headers: { 'content-length': '0' },
    });
  const noContent = () =>
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  const page = (body: unknown, pages = 1) =>
    fetchMock.mockResponseOnce(JSON.stringify(body), {
      status: 200,
      headers: { 'x-pages': String(pages) },
    });

  async function streamed<T>(
    pages: AsyncIterable<{ data: T[] }>,
  ): Promise<T[]> {
    const out: T[] = [];
    for await (const p of pages) out.push(...p.data);
    return out;
  }

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('streams no bids when ESI answers with an empty 200', async () => {
    emptyOk();
    await expect(
      streamed(contracts.streamPublicContractBids(214_400_001)),
    ).resolves.toEqual([]);
    expect(fetchMock.mock.calls).toHaveLength(1);
    expect(String(fetchMock.mock.calls[0]![0])).toContain(
      'contracts/public/bids/214400001',
    );
  });

  it('streams no items when ESI answers with 204 No Content', async () => {
    noContent();
    await expect(
      streamed(contracts.streamPublicContractItems(214_400_001)),
    ).resolves.toEqual([]);
    expect(String(fetchMock.mock.calls[0]![0])).toContain(
      'contracts/public/items/214400001',
    );
  });

  it('collects no bids when ESI answers with 204 No Content', async () => {
    noContent();
    await expect(
      contracts.fetchAllPublicContractBids(214_400_001),
    ).resolves.toEqual([]);
  });

  it('collects no items when ESI answers with an empty 200', async () => {
    emptyOk();
    await expect(
      contracts.fetchAllPublicContractItems(214_400_001),
    ).resolves.toEqual([]);
  });

  it('honours the flag when the generic page helpers are called by endpoint name', async () => {
    emptyOk();
    await expect(
      streamed(contracts.streamEndpoint('getPublicContractBids', 214_400_001)),
    ).resolves.toEqual([]);
    noContent();
    await expect(
      contracts.fetchAllEndpoint('getPublicContractItems', [214_400_001]),
    ).resolves.toEqual([]);
  });

  it('collects every page of bids when ESI has some', async () => {
    page([BID], 2);
    page([{ ...BID, bid_id: 2 }], 2);
    const bids = await contracts.fetchAllPublicContractBids(214_400_001, 1);
    expect(bids.map((b) => b.bid_id)).toEqual([1, 2]);
  });

  it('streams every page of items when ESI has some', async () => {
    page([ITEM]);
    await expect(
      streamed(contracts.streamPublicContractItems(214_400_001)),
    ).resolves.toEqual([ITEM]);
  });

  it('reads a later page answered with no content as an empty page in the direct call', async () => {
    page([BID], 2);
    noContent();
    await expect(contracts.getPublicContractBids(214_400_001)).resolves.toEqual(
      [BID],
    );
  });

  it('still rejects an empty 200 on a paged route that does not document no content', async () => {
    emptyOk();
    await expect(
      streamed(contracts.streamPublicContracts(10_000_002)),
    ).rejects.toBeInstanceOf(EsiParseError);
  });
});
