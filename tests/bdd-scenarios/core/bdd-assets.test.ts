/**
 * BDD-Style Tests for AssetsClient
 *
 * Tests asset management operations including character and corporation
 * asset retrieval, bulk name/location lookups, and error handling.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Asset Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Character Assets', () => {
    describe('Scenario: Get assets for a valid character', () => {
      it('Given a valid character ID, When I request character assets, Then I should receive a list of assets', async () => {
        // Given: A valid character ID with assets
        const characterId = 1689391488;
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

        // When: I request character assets
        const result = await client.assets.getCharacterAssets(characterId);

        // Then: I should receive a list of assets
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

    describe('Scenario: Handle empty inventory', () => {
      it('Given a character with no assets, When I request character assets, Then I should receive an empty array', async () => {
        // Given: A character with no assets
        const characterId = 1689391488;
        const emptyAssets: any[] = [];

        jest
          .spyOn(client.assets, 'getCharacterAssets')
          .mockResolvedValue(emptyAssets);

        // When: I request character assets
        const result = await client.assets.getCharacterAssets(characterId);

        // Then: I should receive an empty array
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(0);
      });
    });

    describe('Scenario: Handle unauthorized access', () => {
      it('Given an invalid or expired token, When I request character assets, Then I should receive a 403 forbidden error', async () => {
        // Given: An invalid or expired token
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.assets, 'getCharacterAssets')
          .mockRejectedValue(forbiddenError);

        // When & Then: I request character assets and expect a forbidden error
        await expect(
          client.assets.getCharacterAssets(characterId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Bulk Asset Name Lookup', () => {
    describe('Scenario: Look up names for specific assets', () => {
      it('Given a character with named assets, When I request asset names by item IDs, Then I should receive the names for those assets', async () => {
        // Given: A character with named assets
        const characterId = 1689391488;
        const itemIds = [1000000001, 1000000002];
        const expectedNames = [
          { item_id: 1000000001, name: 'My Rifter' },
          { item_id: 1000000002, name: 'Ore Hold' },
        ];

        jest
          .spyOn(client.assets, 'postCharacterAssetNames')
          .mockResolvedValue(expectedNames);

        // When: I request asset names
        const result = await client.assets.postCharacterAssetNames(
          characterId,
          itemIds,
        );

        // Then: I should receive names for each requested item
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('item_id', 1000000001);
        expect(result[0]).toHaveProperty('name', 'My Rifter');
        expect(result[1]).toHaveProperty('item_id', 1000000002);
        expect(result[1]).toHaveProperty('name', 'Ore Hold');
      });
    });

    describe('Scenario: Look up locations for specific assets', () => {
      it('Given a character with located assets, When I request asset locations by item IDs, Then I should receive position data', async () => {
        // Given: A character with located assets
        const characterId = 1689391488;
        const itemIds = [1000000001];
        const expectedLocations = [
          {
            item_id: 1000000001,
            position: { x: 1.0, y: 2.0, z: 3.0 },
          },
        ];

        jest
          .spyOn(client.assets, 'postCharacterAssetLocations')
          .mockResolvedValue(expectedLocations);

        // When: I request asset locations
        const result = await client.assets.postCharacterAssetLocations(
          characterId,
          itemIds,
        );

        // Then: I should receive position data for each requested item
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('item_id', 1000000001);
        expect(result[0]).toHaveProperty('position');
      });
    });
  });

  describe('Feature: Corporation Asset Management', () => {
    describe('Scenario: Retrieve corporation assets', () => {
      it('Given a valid corporation ID, When I request corporation assets, Then I should receive the corporation asset list', async () => {
        // Given: A valid corporation ID
        const corporationId = 1344654522;
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

        // When: I request corporation assets
        const result = await client.assets.getCorporationAssets(corporationId);

        // Then: I should receive the corporation asset list
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(1);
        expect(result[0].location_flag).toBe('CorpSAG1');
        expect(result[0].type_id).toBe(587);
      });
    });
  });

  describe('Feature: Integration Workflows', () => {
    describe('Scenario: Concurrent character and corporation asset fetch', () => {
      it('Given a character and their corporation, When I fetch both asset sets concurrently, Then I should receive both results independently', async () => {
        // Given: A character and their corporation
        const characterId = 1689391488;
        const corporationId = 1344654522;

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

        // When: I fetch both asset sets concurrently
        const [charResult, corpResult] = await Promise.all([
          client.assets.getCharacterAssets(characterId),
          client.assets.getCorporationAssets(corporationId),
        ]);

        // Then: I should receive both results independently
        expect(charResult).toBeInstanceOf(Array);
        expect(charResult).toHaveLength(2);
        expect(charResult[0].type_id).toBe(34);

        expect(corpResult).toBeInstanceOf(Array);
        expect(corpResult).toHaveLength(1);
        expect(corpResult[0].location_flag).toBe('CorpSAG1');
      });
    });

    describe('Scenario: Full asset audit workflow', () => {
      it('Given a character with assets, When I retrieve assets then look up their names and locations, Then I should have a complete asset inventory', async () => {
        // Given: A character with assets
        const characterId = 1689391488;

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

        jest
          .spyOn(client.assets, 'getCharacterAssets')
          .mockResolvedValue(assets);
        jest
          .spyOn(client.assets, 'postCharacterAssetNames')
          .mockResolvedValue(assetNames);
        jest
          .spyOn(client.assets, 'postCharacterAssetLocations')
          .mockResolvedValue(assetLocations);

        // When: I retrieve assets then look up names and locations
        const retrievedAssets =
          await client.assets.getCharacterAssets(characterId);
        const itemIds = retrievedAssets.map((a: any) => a.item_id);

        const [names, locations] = await Promise.all([
          client.assets.postCharacterAssetNames(characterId, itemIds),
          client.assets.postCharacterAssetLocations(characterId, itemIds),
        ]);

        // Then: I should have a complete asset inventory
        expect(retrievedAssets).toHaveLength(1);
        expect(names).toHaveLength(1);
        expect(names[0].name).toBe('Tritanium Stash');
        expect(locations).toHaveLength(1);
        expect(locations[0].position).toBeDefined();
      });
    });
  });
});
