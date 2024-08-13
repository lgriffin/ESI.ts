import { DogmaEffectByIdApi } from '../../../src/api/dogma/getDogmaEffectById';
import { ApiClient } from '../../../src/core/ApiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('DogmaEffectByIdApi', () => {
    const apiClient = new ApiClient('test', 'https://esi.evetech.net/latest');
    const dogmaEffectByIdApi = new DogmaEffectByIdApi(apiClient);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should get effect by id', async () => {
        const mockResponse = { effect_id: 1, name: 'test_effect' };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => dogmaEffectByIdApi.getEffectById(1));
        expect(result).toEqual(mockResponse);
    });
});
