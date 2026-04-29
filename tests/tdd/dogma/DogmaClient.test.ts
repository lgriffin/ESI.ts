import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { DogmaClient } from '../../../src/clients/DogmaClient';
import { getConfig } from '../../../src/config/configManager';
import { getBody } from '../../../src/core/util/testHelpers';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('DogmaClient', () => {
  let dogmaClient: DogmaClient;

  beforeEach(() => {
    fetchMock.resetMocks();

    const config = getConfig();
    const client = new ApiClientBuilder()
      .setClientId(config.projectName)
      .setLink(config.link)
      .build();

    dogmaClient = new DogmaClient(client);
  });

  describe('getAttributes', () => {
    it('should return an array of attribute IDs', async () => {
      const mockResponse = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await getBody(() => dogmaClient.getAttributes());

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(10);
      result.forEach((id: number) => {
        expect(typeof id).toBe('number');
      });
    });

    it('should handle empty attributes list', async () => {
      fetchMock.mockResponseOnce(JSON.stringify([]));

      const result = await getBody(() => dogmaClient.getAttributes());

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('getAttributeById', () => {
    it('should return detailed attribute information', async () => {
      const attributeId = 20;
      const mockResponse = {
        attribute_id: attributeId,
        name: 'powerOutput',
        description: 'The amount of power available.',
        icon_id: 1060,
        default_value: 0,
        published: true,
        display_name: 'Powergrid Output',
        unit_id: 14,
        stackable: false,
        high_is_good: true,
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await getBody(() =>
        dogmaClient.getAttributeById(attributeId),
      );

      expect(result.attribute_id).toBe(attributeId);
      expect(result.name).toBe('powerOutput');
      expect(result.description).toBe('The amount of power available.');
      expect(result.published).toBe(true);
      expect(result.display_name).toBe('Powergrid Output');
      expect(result.high_is_good).toBe(true);
    });

    it('should throw on non-existent attribute', async () => {
      fetchMock.mockResponseOnce('Not Found', { status: 404 });

      await expect(dogmaClient.getAttributeById(999999)).rejects.toThrow(
        'Resource not found',
      );
    });
  });

  describe('getEffects', () => {
    it('should return an array of effect IDs', async () => {
      const mockResponse = [11, 12, 13, 16, 18];

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await getBody(() => dogmaClient.getEffects());

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
      result.forEach((id: number) => {
        expect(typeof id).toBe('number');
      });
    });
  });

  describe('getEffectById', () => {
    it('should return detailed effect information', async () => {
      const effectId = 11;
      const mockResponse = {
        effect_id: effectId,
        name: 'lowPower',
        description: 'Requires a low power slot.',
        published: true,
        display_name: 'Low Power',
        effect_category: 0,
        is_assistance: false,
        is_offensive: false,
        is_warp_safe: true,
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await getBody(() => dogmaClient.getEffectById(effectId));

      expect(result.effect_id).toBe(effectId);
      expect(result.name).toBe('lowPower');
      expect(result.published).toBe(true);
      expect(result.is_warp_safe).toBe(true);
      expect(result.is_offensive).toBe(false);
    });

    it('should throw on non-existent effect', async () => {
      fetchMock.mockResponseOnce('Not Found', { status: 404 });

      await expect(dogmaClient.getEffectById(999999)).rejects.toThrow(
        'Resource not found',
      );
    });
  });

  describe('getDynamicItemInfo', () => {
    it('should return dynamic item dogma information', async () => {
      const typeId = 47740;
      const itemId = 1234567890;
      const mockResponse = {
        created_by: 2112625428,
        dogma_attributes: [
          { attribute_id: 9, value: 1.0 },
          { attribute_id: 20, value: 125.0 },
        ],
        dogma_effects: [
          { effect_id: 11, is_default: false },
          { effect_id: 12, is_default: true },
        ],
        mutator_type_id: 47842,
        source_type_id: 2048,
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await getBody(() =>
        dogmaClient.getDynamicItemInfo(typeId, itemId),
      );

      expect(result.created_by).toBe(2112625428);
      expect(result.mutator_type_id).toBe(47842);
      expect(result.source_type_id).toBe(2048);
      expect(Array.isArray(result.dogma_attributes)).toBe(true);
      expect(result.dogma_attributes).toHaveLength(2);
      expect(result.dogma_attributes[0].attribute_id).toBe(9);
      expect(Array.isArray(result.dogma_effects)).toBe(true);
      expect(result.dogma_effects).toHaveLength(2);
      expect(result.dogma_effects[0].effect_id).toBe(11);
    });

    it('should throw on non-existent dynamic item', async () => {
      fetchMock.mockResponseOnce('Not Found', { status: 404 });

      await expect(
        dogmaClient.getDynamicItemInfo(999999, 999999),
      ).rejects.toThrow('Resource not found');
    });
  });
});
