import { DogmaEffectsApi } from '../../../src/api/dogma/getDogmaEffects';
import { ApiClient } from '../../../src/core/ApiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('DogmaEffectsApi', () => {
    const apiClient = new ApiClient('test', 'https://esi.evetech.net/latest');
    const dogmaEffectsApi = new DogmaEffectsApi(apiClient);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should get effects', async () => {
        const mockResponse = [{ effect_id: 1, name: 'test_effect' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await dogmaEffectsApi.getEffects();
        expect(result).toEqual(mockResponse);
    });
});
