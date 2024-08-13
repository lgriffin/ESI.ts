import { DogmaAPIBuilder } from '../../../src/builders/DogmaApiBuilder';
import { ApiClient } from '../../../src/core/ApiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const apiClient = new ApiClient('test', 'https://esi.evetech.net/latest');
const dogmaClient = new DogmaAPIBuilder(apiClient).build();

describe('DogmaClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should get attributes', async () => {
        const mockResponse = [{ attribute_id: 1, name: 'test_attribute' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => dogmaClient.getAttributes());
        expect(result).toEqual(mockResponse);
    });

    it('should get attribute by id', async () => {
        const mockResponse = { attribute_id: 1, name: 'test_attribute' };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => dogmaClient.getAttributeById(1));
        expect(result).toEqual(mockResponse);
    });

    it('should get dynamic item info', async () => {
        const mockResponse = { item_id: 1, type_id: 1, dogma: [] };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => dogmaClient.getDynamicItemInfo(1, 1));
        expect(result).toEqual(mockResponse);
    });

    it('should get effects', async () => {
        const mockResponse = [{ effect_id: 1, name: 'test_effect' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => dogmaClient.getEffects());
        expect(result).toEqual(mockResponse);
    });

    it('should get effect by id', async () => {
        const mockResponse = { effect_id: 1, name: 'test_effect' };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => dogmaClient.getEffectById(1));
        expect(result).toEqual(mockResponse);
    });
});
