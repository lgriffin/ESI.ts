import { DogmaAttributeByIdApi } from '../../../src/api/dogma/getDogmaAttributeById';
import { ApiClient } from '../../../src/core/ApiClient';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('DogmaAttributeByIdApi', () => {
    const apiClient = new ApiClient('test', 'https://esi.evetech.net/latest');
    const dogmaAttributeByIdApi = new DogmaAttributeByIdApi(apiClient);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should get attribute by id', async () => {
        const mockResponse = { attribute_id: 1, name: 'test_attribute' };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => dogmaAttributeByIdApi.getAttributeById(1));
        expect(result).toEqual(mockResponse);
    });
});
