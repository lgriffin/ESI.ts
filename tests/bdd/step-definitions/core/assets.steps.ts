import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0005-assets.feature');

/**
 * Match a URL whose path ends exactly at `path`, so `/assets/` does not also
 * serve `/assets/names/`.
 */
function exactPath(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https://esi\\.evetech\\.net${escaped}(\\?|$)`);
}

const BEARER = 'Bearer bdd-access-token';

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Asset listing for a character holding two stacks', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a valid character ID with assets', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/assets/`),
        headers: { 'x-pages': '1' },
        body: [
          TestDataFactory.createCharacterAsset({
            item_id: 1000000001,
            type_id: 34,
            quantity: 1000000,
            location_id: 60003760,
            location_flag: 'Hangar',
            location_type: 'station',
            is_singleton: false,
          }),
          TestDataFactory.createCharacterAsset({
            item_id: 1000000002,
            type_id: 35,
            quantity: 500000,
            location_id: 60003760,
            location_flag: 'Hangar',
            location_type: 'station',
            is_singleton: false,
          }),
        ],
      });
    });

    when('the client requests character assets', async () => {
      result = await client.assets.getCharacterAssets(characterId);
    });

    then('the client shall return a list of assets', () => {
      expect(lastRequest().method).toBe('GET');
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/assets/`,
      );
      expect(lastRequest().headers.authorization).toBe(BEARER);
      expect(result).toEqual([
        {
          item_id: 1000000001,
          type_id: 34,
          quantity: 1000000,
          location_id: 60003760,
          location_flag: 'Hangar',
          location_type: 'station',
          is_singleton: false,
        },
        {
          item_id: 1000000002,
          type_id: 35,
          quantity: 500000,
          location_id: 60003760,
          location_flag: 'Hangar',
          location_type: 'station',
          is_singleton: false,
        },
      ]);
    });
  });

  test('Character holding an empty hangar', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with no assets', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/assets/`),
        headers: { 'x-pages': '1' },
        body: [],
      });
    });

    when(
      'the client requests character assets for the empty inventory',
      async () => {
        result = await client.assets.getCharacterAssets(characterId);
      },
    );

    then('the client shall return an empty array', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/assets/`,
      );
      expect(result).toEqual([]);
    });
  });

  test('Expired token on the character assets endpoint rejects the request', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let error: any;

    given('an invalid or expired token for assets', () => {
      queueError(403, 'token not valid for scope', {
        match: exactPath(`/characters/${characterId}/assets/`),
      });
    });

    when(
      'the client requests character assets without authorization',
      async () => {
        try {
          await client.assets.getCharacterAssets(characterId);
        } catch (e) {
          error = e;
        }
      },
    );

    then('the client shall return a 403 forbidden error', () => {
      expect(error).toBeInstanceOf(EsiError);
      expect((error as EsiError).statusCode).toBe(403);
      // 403 is not retried.
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().headers.authorization).toBe(BEARER);
    });
  });

  test('Name lookup for two named items', ({ given, when, then }) => {
    const characterId = 1689391488;
    const itemIds = [1000000001, 1000000002];
    let result: any;

    given('a character with named assets', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/assets/names/`),
        body: [
          { item_id: 1000000001, name: 'My Rifter' },
          { item_id: 1000000002, name: 'Ore Hold' },
        ],
      });
    });

    when('the client requests asset names by item IDs', async () => {
      result = await client.assets.postCharacterAssetNames(
        characterId,
        itemIds,
      );
    });

    then('the client shall return the names for those assets', () => {
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/assets/names/`,
      );
      expect(request.headers.authorization).toBe(BEARER);
      expect(JSON.parse(request.body!)).toEqual(itemIds);
      expect(result).toEqual([
        { item_id: 1000000001, name: 'My Rifter' },
        { item_id: 1000000002, name: 'Ore Hold' },
      ]);
    });
  });

  test('Position lookup for one item in space', ({ given, when, then }) => {
    const characterId = 1689391488;
    const itemIds = [1000000001];
    let result: any;

    given('a character with located assets', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/assets/locations/`),
        body: [
          {
            item_id: 1000000001,
            position: { x: 1.0e12, y: -2.5e10, z: 3.75e11 },
          },
        ],
      });
    });

    when('the client requests asset locations by item IDs', async () => {
      result = await client.assets.postCharacterAssetLocations(
        characterId,
        itemIds,
      );
    });

    then('the client shall return position data', () => {
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/assets/locations/`,
      );
      expect(JSON.parse(request.body!)).toEqual(itemIds);
      expect(result).toEqual([
        {
          item_id: 1000000001,
          position: { x: 1.0e12, y: -2.5e10, z: 3.75e11 },
        },
      ]);
    });
  });

  test('Asset listing for a corporation hangar division', ({
    given,
    when,
    then,
  }) => {
    const corporationId = 1344654522;
    let result: any;

    given('a valid corporation ID with assets', () => {
      queueResponse({
        match: exactPath(`/corporations/${corporationId}/assets/`),
        headers: { 'x-pages': '1' },
        body: [
          TestDataFactory.createCharacterAsset({
            item_id: 2000000001,
            type_id: 587,
            quantity: 1,
            location_id: 60003760,
            location_flag: 'CorpSAG1',
            location_type: 'station',
            is_singleton: true,
          }),
          TestDataFactory.createCharacterAsset({
            item_id: 2000000002,
            type_id: 34,
            quantity: 250000,
            location_id: 60003760,
            location_flag: 'CorpSAG3',
            location_type: 'station',
            is_singleton: false,
          }),
        ],
      });
    });

    when('the client requests corporation assets', async () => {
      result = await client.assets.getCorporationAssets(corporationId);
    });

    then('the client shall return the corporation asset list', () => {
      expect(lastRequest().url.pathname).toBe(
        `/corporations/${corporationId}/assets/`,
      );
      expect(lastRequest().headers.authorization).toBe(BEARER);
      expect(
        result.map((a: any) => [a.item_id, a.type_id, a.location_flag]),
      ).toEqual([
        [2000000001, 587, 'CorpSAG1'],
        [2000000002, 34, 'CorpSAG3'],
      ]);
    });
  });

  test('Character listing and corporation listing fetched at once', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const corporationId = 1344654522;
    let charResult: any;
    let corpResult: any;

    given('a character and their corporation', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/assets/`),
        headers: { 'x-pages': '1' },
        // Answer the character listing last, so a mix-up cannot hide behind
        // response ordering.
        delayMs: 20,
        body: [
          TestDataFactory.createCharacterAsset({
            item_id: 1000000001,
            type_id: 34,
            quantity: 1000000,
            is_singleton: false,
          }),
          TestDataFactory.createCharacterAsset({
            item_id: 1000000002,
            type_id: 35,
            quantity: 500000,
            is_singleton: false,
          }),
        ],
      });
      queueResponse({
        match: exactPath(`/corporations/${corporationId}/assets/`),
        headers: { 'x-pages': '1' },
        body: [
          TestDataFactory.createCharacterAsset({
            item_id: 2000000001,
            type_id: 587,
            quantity: 50,
            location_flag: 'CorpSAG1',
            is_singleton: false,
          }),
        ],
      });
    });

    when('the client fetches both asset sets concurrently', async () => {
      [charResult, corpResult] = await Promise.all([
        client.assets.getCharacterAssets(characterId),
        client.assets.getCorporationAssets(corporationId),
      ]);
    });

    then('the client shall return both results independently', () => {
      expect(sentRequests()).toHaveLength(2);
      expect(charResult.map((a: any) => a.item_id)).toEqual([
        1000000001, 1000000002,
      ]);
      expect(charResult.map((a: any) => a.type_id)).toEqual([34, 35]);
      expect(corpResult.map((a: any) => a.item_id)).toEqual([2000000001]);
      expect(corpResult[0].location_flag).toBe('CorpSAG1');
    });
  });

  test('Listing feeding name and location lookups for its own item IDs', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let retrievedAssets: any;
    let names: any;
    let locations: any;

    given('a character with assets for audit', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/assets/`),
        headers: { 'x-pages': '1' },
        body: [
          TestDataFactory.createCharacterAsset({
            item_id: 1000000001,
            type_id: 34,
            quantity: 1000000,
            is_singleton: false,
          }),
          TestDataFactory.createCharacterAsset({
            item_id: 1000000007,
            type_id: 587,
            quantity: 1,
            location_id: 30000142,
            location_type: 'solar_system',
            location_flag: 'AutoFit',
            is_singleton: true,
          }),
        ],
      });
      queueResponse({
        match: exactPath(`/characters/${characterId}/assets/names/`),
        body: [
          { item_id: 1000000001, name: 'Tritanium Stash' },
          { item_id: 1000000007, name: 'Scout Rifter' },
        ],
      });
      queueResponse({
        match: exactPath(`/characters/${characterId}/assets/locations/`),
        body: [
          { item_id: 1000000001, position: { x: 0, y: 0, z: 0 } },
          { item_id: 1000000007, position: { x: 100.0, y: 200.0, z: 300.0 } },
        ],
      });
    });

    when(
      'the client retrieves assets then look up their names and locations',
      async () => {
        retrievedAssets = await client.assets.getCharacterAssets(characterId);
        const itemIds = retrievedAssets.map((a: any) => a.item_id);

        [names, locations] = await Promise.all([
          client.assets.postCharacterAssetNames(characterId, itemIds),
          client.assets.postCharacterAssetLocations(characterId, itemIds),
        ]);
      },
    );

    then('the client shall have a complete asset inventory', () => {
      const requests = sentRequests();
      expect(requests).toHaveLength(3);
      expect(requests[0].method).toBe('GET');
      const lookups = requests.slice(1);
      expect(lookups.map((r) => r.method)).toEqual(['POST', 'POST']);
      // Both lookups carry the item IDs the listing returned.
      for (const lookup of lookups) {
        expect(JSON.parse(lookup.body!)).toEqual([1000000001, 1000000007]);
      }

      expect(retrievedAssets.map((a: any) => a.item_id)).toEqual([
        1000000001, 1000000007,
      ]);
      expect(names).toEqual([
        { item_id: 1000000001, name: 'Tritanium Stash' },
        { item_id: 1000000007, name: 'Scout Rifter' },
      ]);
      expect(locations).toEqual([
        { item_id: 1000000001, position: { x: 0, y: 0, z: 0 } },
        { item_id: 1000000007, position: { x: 100.0, y: 200.0, z: 300.0 } },
      ]);
    });
  });
});
