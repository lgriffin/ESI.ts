import { GetCharacterAssetsApi } from '../../../src/api/assets/getCharacterAssets';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

describe('GetCharacterAssetsApi', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('should return valid structure for character assets', async () => {
    const mockResponse = [
      {
        type_id: 123,
        item_id: 456,
        location_id: 789,
        location_type: 'station',
      },
    ];

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const getCharacterAssetsApi = new GetCharacterAssetsApi(getClient());
    const result = await getBody(() => getCharacterAssetsApi.getCharacterAssets(123456789));

    expect(Array.isArray(result)).toBe(true);
    result.forEach((asset: any) => {
      expect(asset).toHaveProperty('type_id');
      expect(asset).toHaveProperty('item_id');
      expect(asset).toHaveProperty('location_id');
      expect(asset).toHaveProperty('location_type');
    });
  });
});
