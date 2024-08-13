import { WarKillmailsApi } from '../../../src/api/wars/getWarKillmails';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('WarKillmailsApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();
    const warKillmailsApi = new WarKillmailsApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getWarKillmails', async () => {
        const mockResponse = [{ killmail_id: 1, killmail_time: '2023-01-01' }, { killmail_id: 2, killmail_time: '2023-01-02' }];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => warKillmailsApi.getWarKillmails(1));
        expect(Array.isArray(result)).toBe(true);
        result.forEach((killmail: any) => {
            expect(killmail).toHaveProperty('killmail_id');
            expect(killmail).toHaveProperty('killmail_time');
        });
    });
});
