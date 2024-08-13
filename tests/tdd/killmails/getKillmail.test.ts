import { GetKillmailApi } from '../../../src/api/killmails/getKillmail';
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

const killmailApi = new GetKillmailApi(client);

describe('GetKillmailApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return a killmail', async () => {
        const mockResponse = {
            killmail_id: 12345,
            killmail_hash: 'abcdef1234567890',
            killmail_time: '2024-01-01T00:00:00Z',
            victim: { character_id: 67890 },
            attackers: [{ character_id: 54321 }]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => killmailApi.getKillmail(12345, 'abcdef1234567890'));

        expect(result).toHaveProperty('killmail_id');
        expect(typeof result.killmail_id).toBe('number');
        expect(result).toHaveProperty('killmail_hash');
        expect(typeof result.killmail_hash).toBe('string');
        expect(result).toHaveProperty('killmail_time');
        expect(typeof result.killmail_time).toBe('string');
        expect(result).toHaveProperty('victim');
        expect(result.victim).toHaveProperty('character_id');
        expect(typeof result.victim.character_id).toBe('number');
        expect(result).toHaveProperty('attackers');
        expect(Array.isArray(result.attackers)).toBe(true);
    });
});
