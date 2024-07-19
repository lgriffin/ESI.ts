import { GetCorporationMembersApi } from '../../../src/api/corporations/getCorporationMembers';
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

const corporationMembersApi = new GetCorporationMembersApi(client);

describe('GetCorporationMembersApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation members', async () => {
        const mockResponse = [123456, 789012, 345678];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationMembersApi.getCorporationMembers(12345);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((memberId: number) => {
            expect(typeof memberId).toBe('number');
        });
    });
});
