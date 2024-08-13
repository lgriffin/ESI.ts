import { GetClonesApi } from '../../../src/api/clones/getClones';
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

const getClonesApi = new GetClonesApi(client);

describe('GetClonesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for clones', async () => {
        const mockResponse = {
            home_location: {
                location_id: 123456,
                location_type: 'station'
            },
            jump_clones: [
                {
                    implants: [1, 2, 3],
                    location_id: 654321,
                    location_type: 'station'
                }
            ]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => getClonesApi.getClones(123456789));

        expect(result).toHaveProperty('home_location');
        expect(result.home_location).toHaveProperty('location_id');
        expect(result.home_location).toHaveProperty('location_type');
        expect(result).toHaveProperty('jump_clones');
        expect(Array.isArray(result.jump_clones)).toBe(true);
    });
});
