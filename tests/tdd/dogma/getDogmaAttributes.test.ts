import { DogmaAttributesApi } from '../../../src/api/dogma/getDogmaAttributes';
import { ApiClient } from '../../../src/core/ApiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('DogmaAttributesApi', () => {
    const apiClient = new ApiClient('test', 'https://esi.evetech.net/latest');
    const dogmaAttributesApi = new DogmaAttributesApi(apiClient);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should get attributes', async () => {
        const mockResponse = [{ attribute_id: 1, name: 'test_attribute' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => dogmaAttributesApi.getAttributes());
        expect(result).toEqual(mockResponse);
    });
});
