import { GetJumpFatigueApi } from '../../../src/api/characters/getJumpFatigue';
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

const jumpFatigueApi = new GetJumpFatigueApi(client);

describe('GetJumpFatigueApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for jump fatigue', async () => {
        const mockResponse = {
            jump_fatigue_expire_date: '2024-01-01T00:00:00Z',
            last_jump_date: '2024-01-01T00:00:00Z',
            last_update_date: '2024-01-01T00:00:00Z'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => jumpFatigueApi.getJumpFatigue(123456));

        expect(result).toHaveProperty('jump_fatigue_expire_date');
        expect(result).toHaveProperty('last_jump_date');
        expect(result).toHaveProperty('last_update_date');
    });
});
