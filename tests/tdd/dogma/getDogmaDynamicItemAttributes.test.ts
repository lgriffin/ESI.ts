import { DogmaDynamicItemApi } from '../../../src/api/dogma/getDogmaDynamicItemAttributes';
import { ApiClient } from '../../../src/core/ApiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('DogmaDynamicItemApi', () => {
    const apiClient = new ApiClient('test', 'https://esi.evetech.net/latest');
    const dogmaDynamicItemApi = new DogmaDynamicItemApi(apiClient);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should get dynamic item info', async () => {
        const mockResponse = { item_id: 1, type_id: 1, dogma: [] };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await dogmaDynamicItemApi.getDynamicItemInfo(1, 1);
        expect(result).toEqual(mockResponse);
    });
});
