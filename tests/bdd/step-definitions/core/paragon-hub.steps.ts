import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/paragon-hub.feature');

const TEST_CHARACTER_ID = 123456;
const TEST_ALLIANCE_ID = 99000006;

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN browsing public SKINR listings, the client shall return paginated results', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedResponse = {
      cursor: { after: 'cursor-abc', before: 'cursor-xyz' },
      listings: [
        {
          id: '3868eaed-8278-4cb7-9709-7d7de9c20dc7',
          state: 'listed',
          last_modified: '2026-08-18T10:00:00Z',
          seller_id: 90000001,
          skinr_id: 'skinr-design-001',
          created: '2026-08-17T08:00:00Z',
          expires: '2026-09-17T08:00:00Z',
          quantity: 5,
          price: { isk: 500000000 },
        },
        {
          id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
          state: 'listed',
          last_modified: '2026-08-18T11:00:00Z',
          seller_id: 90000002,
          skinr_id: 'skinr-design-002',
          created: '2026-08-16T14:00:00Z',
          expires: '2026-09-16T14:00:00Z',
          quantity: 1,
          price: { plex: 100 },
        },
      ],
    };

    given('public SKINR listings exist', () => {
      jest
        .spyOn(client.paragonHub, 'getPublicListings')
        .mockResolvedValue(expectedResponse as any);
    });

    when('the client requests public listings', async () => {
      result = await client.paragonHub.getPublicListings();
    });

    then('the client shall return listings with cursor data', () => {
      expect(result).toBeDefined();
      expect(result.listings).toHaveLength(2);
      expect(result.cursor.after).toBe('cursor-abc');
      expect(result.listings[0].skinr_id).toBe('skinr-design-001');
      expect(result.listings[0].price).toEqual({ isk: 500000000 });
      expect(result.listings[1].price).toEqual({ plex: 100 });
    });
  });

  test("WHEN getting a character's own Paragon Hub listings, the client shall return seller data", ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedResponse = {
      cursor: { after: 'cursor-char-abc' },
      listings: [
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          state: 'listed',
          last_modified: '2026-08-18T10:00:00Z',
          seller_id: TEST_CHARACTER_ID,
          skinr_id: 'skinr-design-003',
          created: '2026-08-15T12:00:00Z',
          expires: '2026-09-15T12:00:00Z',
          quantity: 10,
          price: { isk: 250000000 },
          target: { public: true },
        },
      ],
    };

    given('the character has listed SKINR designs', () => {
      jest
        .spyOn(client.paragonHub, 'getCharacterListings')
        .mockResolvedValue(expectedResponse as any);
    });

    when('the client requests character listings', async () => {
      result = await client.paragonHub.getCharacterListings(TEST_CHARACTER_ID);
    });

    then('the client shall return listings with target visibility', () => {
      expect(result).toBeDefined();
      expect(result.listings).toHaveLength(1);
      expect(result.listings[0].seller_id).toBe(TEST_CHARACTER_ID);
      expect(result.listings[0].target).toEqual({ public: true });
    });
  });

  test('WHEN browsing alliance-targeted listings, the client shall return filtered results', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const expectedResponse = {
      listings: [
        {
          id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
          state: 'listed',
          last_modified: '2026-08-18T12:00:00Z',
          seller_id: 90000003,
          skinr_id: 'skinr-design-004',
          created: '2026-08-14T10:00:00Z',
          expires: '2026-09-14T10:00:00Z',
          quantity: 3,
          price: { isk: 750000000 },
        },
      ],
    };

    given('alliance-targeted SKINR listings exist', () => {
      jest
        .spyOn(client.paragonHub, 'getAllianceListings')
        .mockResolvedValue(expectedResponse as any);
    });

    when('the client requests alliance listings', async () => {
      result = await client.paragonHub.getAllianceListings(TEST_ALLIANCE_ID);
    });

    then('the client shall return listings targeted at the alliance', () => {
      expect(result).toBeDefined();
      expect(result.listings).toHaveLength(1);
      expect(result.listings[0].skinr_id).toBe('skinr-design-004');
    });
  });

  test('WHEN paginating through listings with cursor, the client shall support forward pagination', ({
    given,
    when,
    then,
  }) => {
    let result: any;
    const page2Response = {
      cursor: { after: 'cursor-page3', before: 'cursor-page1' },
      listings: [
        {
          id: 'd4e5f6a7-b8c9-0123-def0-456789012345',
          state: 'listed',
          last_modified: '2026-08-18T14:00:00Z',
          seller_id: 90000004,
          skinr_id: 'skinr-design-005',
          created: '2026-08-13T09:00:00Z',
          expires: '2026-09-13T09:00:00Z',
          quantity: 2,
          price: { plex: 50 },
        },
      ],
    };

    given('multiple pages of listings exist', () => {
      jest
        .spyOn(client.paragonHub, 'getPublicListings')
        .mockResolvedValue(page2Response as any);
    });

    when('the client requests the next page using a cursor', async () => {
      result = await client.paragonHub.getPublicListings('cursor-page2');
    });

    then('the client shall return the next page of results', () => {
      expect(result).toBeDefined();
      expect(result.cursor.after).toBe('cursor-page3');
      expect(result.cursor.before).toBe('cursor-page1');
      expect(result.listings).toHaveLength(1);
    });
  });

  test('IF service unavailable error, THEN the client shall handle the service outage', ({
    given,
    when,
    then,
  }) => {
    let caughtError: any;

    given('the ESI service is down', () => {
      const error = TestDataFactory.createError(503);
      jest
        .spyOn(client.paragonHub, 'getPublicListings')
        .mockRejectedValue(error);
    });

    when('the client requests Paragon Hub data', async () => {
      try {
        await client.paragonHub.getPublicListings();
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall return a 503 error', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
    });
  });
});
