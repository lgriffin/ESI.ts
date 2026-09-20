// Additions to tests/bdd/step-definitions/core/market.steps.ts for the
// getMarketTypes Rules. Responses are queued at the transport seam, so the
// request pipeline, pagination and schema validation all really execute.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { queueResponse } from '../../support';

const feature = loadFeature('tests/bdd/features/core/0023-market.feature');

const THE_FORGE = 10000002;

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-market-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Single-page region returns its traded type IDs', ({
    given,
    when,
    then,
  }) => {
    let result: number[];

    given('a region whose traded type IDs fit on one page', () => {
      queueResponse({
        status: 200,
        headers: { 'X-Pages': '1' },
        body: [34, 35, 36],
      });
    });

    when('the client requests the traded type IDs of the region', async () => {
      result = await client.market.getMarketTypes(THE_FORGE);
    });

    then('the client shall return those type IDs as integers', () => {
      expect(result).toEqual([34, 35, 36]);
      expect(result.every(Number.isInteger)).toBe(true);
    });
  });

  test('Three-page region returns the type IDs of every page', ({
    given,
    when,
    then,
  }) => {
    let result: number[];

    given('a region whose traded type IDs span three pages', () => {
      queueResponse({ status: 200, headers: { 'X-Pages': '3' }, body: [34] });
      queueResponse({ status: 200, headers: { 'X-Pages': '3' }, body: [35] });
      queueResponse({ status: 200, headers: { 'X-Pages': '3' }, body: [36] });
    });

    when('the client requests the traded type IDs of the region', async () => {
      result = await client.market.getMarketTypes(THE_FORGE);
    });

    then(
      'the client shall return the type IDs of all three pages in page order',
      () => {
        expect(result).toEqual([34, 35, 36]);
      },
    );
  });

  test('Unknown region is rejected with a 404 EsiError', ({
    given,
    when,
    then,
  }) => {
    let error: unknown;

    given('ESI reports the region as not found', () => {
      queueResponse({ status: 404, body: { error: 'Region not found' } });
    });

    when(
      'the client requests the traded type IDs of the region expecting an error',
      async () => {
        error = await client.market.getMarketTypes(99999999).catch((e) => e);
      },
    );

    then('the client shall reject with an EsiError of status 404', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect((error as EsiError).statusCode).toBe(404);
    });
  });
});
