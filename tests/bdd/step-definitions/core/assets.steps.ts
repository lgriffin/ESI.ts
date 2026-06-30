import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/assets.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('Get assets for a valid character', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a valid character ID with assets', () => {
      const expectedAssets = [
        TestDataFactory.createCharacterAsset({
          item_id: 1000000001,
          type_id: 34,
          quantity: 1000000,
          location_id: 60003760,
          location_flag: 'Hangar',
          location_type: 'station',
        }),
        TestDataFactory.createCharacterAsset({
          item_id: 1000000002,
          type_id: 35,
          quantity: 500000,
          location_id: 60003760,
          location_flag: 'Hangar',
          location_type: 'station',
        }),
      ];

      jest
        .spyOn(client.assets, 'getCharacterAssets')
        .mockResolvedValue(expectedAssets);
    });

    when('I request character assets', async () => {
      result = await client.assets.getCharacterAssets(characterId);
    });

    then('I should receive a list of assets', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('item_id');
      expect(result[0]).toHaveProperty('type_id');
      expect(result[0]).toHaveProperty('quantity');
      expect(result[0]).toHaveProperty('location_id');
      expect(result[0]).toHaveProperty('location_flag');
      expect(result[0]).toHaveProperty('location_type');
      expect(result[0].quantity).toBe(1000000);
    });
  });

  test('Handle empty inventory', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with no assets', () => {
      const emptyAssets: any[] = [];

      jest
        .spyOn(client.assets, 'getCharacterAssets')
        .mockResolvedValue(emptyAssets);
    });

    when('I request character assets for the empty inventory', async () => {
      result = await client.assets.getCharacterAssets(characterId);
    });

    then('I should receive an empty array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });

  test('Handle unauthorized access', ({ given, when, then }) => {
    const characterId = 1689391488;
    let error: any;

    given('an invalid or expired token for assets', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.assets, 'getCharacterAssets')
        .mockRejectedValue(forbiddenError);
    });

    when('I request character assets without authorization', async () => {
      try {
        await client.assets.getCharacterAssets(characterId);
      } catch (e) {
        error = e;
      }
    });

    then('I should receive a 403 forbidden error', () => {
      expect(error).toBeInstanceOf(EsiError);
    });
  });

  test('Look up names for specific assets', ({ given, when, then }) => {
    const characterId = 1689391488;
    const itemIds = [1000000001, 1000000002];
    let result: any;

    given('a character with named assets', () => {
      const expectedNames = [
        { item_id: 1000000001, name: 'My Rifter' },
        { item_id: 1000000002, name: 'Ore Hold' },
      ];

      jest
        .spyOn(client.assets, 'postCharacterAssetNames')
        .mockResolvedValue(expectedNames);
    });

    when('I request asset names by item IDs', async () => {
      result = await client.assets.postCharacterAssetNames(
        characterId,
        itemIds,
      );
    });

    then('I should receive the names for those assets', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('item_id', 1000000001);
      expect(result[0]).toHaveProperty('name', 'My Rifter');
      expect(result[1]).toHaveProperty('item_id', 1000000002);
      expect(result[1]).toHaveProperty('name', 'Ore Hold');
    });
  });

  test('Look up locations for specific assets', ({ given, when, then }) => {
    const characterId = 1689391488;
    const itemIds = [1000000001];
    let result: any;

    given('a character with located assets', () => {
      const expectedLocations = [
        {
          item_id: 1000000001,
          position: { x: 1.0, y: 2.0, z: 3.0 },
        },
      ];

      jest
        .spyOn(client.assets, 'postCharacterAssetLocations')
        .mockResolvedValue(expectedLocations);
    });

    when('I request asset locations by item IDs', async () => {
      result = await client.assets.postCharacterAssetLocations(
        characterId,
        itemIds,
      );
    });

    then('I should receive position data', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('item_id', 1000000001);
      expect(result[0]).toHaveProperty('position');
    });
  });

  test('Retrieve corporation assets', ({ given, when, then }) => {
    const corporationId = 1344654522;
    let result: any;

    given('a valid corporation ID with assets', () => {
      const expectedAssets = [
        TestDataFactory.createCharacterAsset({
          item_id: 2000000001,
          type_id: 587,
          quantity: 100,
          location_id: 60003760,
          location_flag: 'CorpSAG1',
          location_type: 'station',
        }),
      ];

      jest
        .spyOn(client.assets, 'getCorporationAssets')
        .mockResolvedValue(expectedAssets);
    });

    when('I request corporation assets', async () => {
      result = await client.assets.getCorporationAssets(corporationId);
    });

    then('I should receive the corporation asset list', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0].location_flag).toBe('CorpSAG1');
      expect(result[0].type_id).toBe(587);
    });
  });

  test('Concurrent character and corporation asset fetch', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const corporationId = 1344654522;
    let charResult: any;
    let corpResult: any;

    given('a character and their corporation', () => {
      const characterAssets = [
        TestDataFactory.createCharacterAsset({
          item_id: 1000000001,
          type_id: 34,
          quantity: 1000000,
        }),
        TestDataFactory.createCharacterAsset({
          item_id: 1000000002,
          type_id: 35,
          quantity: 500000,
        }),
      ];

      const corporationAssets = [
        TestDataFactory.createCharacterAsset({
          item_id: 2000000001,
          type_id: 587,
          quantity: 50,
          location_flag: 'CorpSAG1',
        }),
      ];

      jest
        .spyOn(client.assets, 'getCharacterAssets')
        .mockResolvedValue(characterAssets);
      jest
        .spyOn(client.assets, 'getCorporationAssets')
        .mockResolvedValue(corporationAssets);
    });

    when('I fetch both asset sets concurrently', async () => {
      [charResult, corpResult] = await Promise.all([
        client.assets.getCharacterAssets(characterId),
        client.assets.getCorporationAssets(corporationId),
      ]);
    });

    then('I should receive both results independently', () => {
      expect(charResult).toBeInstanceOf(Array);
      expect(charResult).toHaveLength(2);
      expect(charResult[0].type_id).toBe(34);

      expect(corpResult).toBeInstanceOf(Array);
      expect(corpResult).toHaveLength(1);
      expect(corpResult[0].location_flag).toBe('CorpSAG1');
    });
  });

  test('Full asset audit workflow', ({ given, when, then }) => {
    const characterId = 1689391488;
    let retrievedAssets: any;
    let names: any;
    let locations: any;

    given('a character with assets for audit', () => {
      const assets = [
        TestDataFactory.createCharacterAsset({
          item_id: 1000000001,
          type_id: 34,
          quantity: 1000000,
        }),
      ];
      const assetNames = [{ item_id: 1000000001, name: 'Tritanium Stash' }];
      const assetLocations = [
        {
          item_id: 1000000001,
          position: { x: 100.0, y: 200.0, z: 300.0 },
        },
      ];

      jest.spyOn(client.assets, 'getCharacterAssets').mockResolvedValue(assets);
      jest
        .spyOn(client.assets, 'postCharacterAssetNames')
        .mockResolvedValue(assetNames);
      jest
        .spyOn(client.assets, 'postCharacterAssetLocations')
        .mockResolvedValue(assetLocations);
    });

    when(
      'I retrieve assets then look up their names and locations',
      async () => {
        retrievedAssets = await client.assets.getCharacterAssets(characterId);
        const itemIds = retrievedAssets.map((a: any) => a.item_id);

        [names, locations] = await Promise.all([
          client.assets.postCharacterAssetNames(characterId, itemIds),
          client.assets.postCharacterAssetLocations(characterId, itemIds),
        ]);
      },
    );

    then('I should have a complete asset inventory', () => {
      expect(retrievedAssets).toHaveLength(1);
      expect(names).toHaveLength(1);
      expect(names[0].name).toBe('Tritanium Stash');
      expect(locations).toHaveLength(1);
      expect(locations[0].position).toBeDefined();
    });
  });
});
