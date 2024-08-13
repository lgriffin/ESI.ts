import { PostCharacterFittingApi } from '../../../src/api/fittings/postCharacterFittings';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

const characterFittingApi = new PostCharacterFittingApi(client);

describe('PostCharacterFittingApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should create a character fitting', async () => {
        const mockResponse = {
            fitting_id: 1
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const fittingData = {
            name: 'Test Fitting',
            description: 'Test Description',
            ship_type_id: 123,
            items: [
                {
                    flag: 'HIGH_SLOT_1',
                    quantity: 1,
                    type_id: 456
                }
            ]
        };

        const result = await getBody(() => characterFittingApi.createFitting(123456, fittingData));

        expect(result).toHaveProperty('fitting_id');
        expect(typeof result.fitting_id).toBe('number');
    });
});
