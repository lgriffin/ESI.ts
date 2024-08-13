import { GetCorporationRecentKillmailsApi } from '../../../src/api/killmails/getCorporationRecentKillmails';
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

const corporationRecentKillmailsApi = new GetCorporationRecentKillmailsApi(client);

describe('GetCorporationRecentKillmailsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return recent killmails for a corporation', async () => {
        const mockResponse = [
            {
                killmail_id: 12345,
                killmail_hash: 'abcdef1234567890',
                killmail_time: '2024-01-01T00:00:00Z',
                victim: { character_id: 67890 },
                attackers: [{ character_id: 54321 }]
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationRecentKillmailsApi.getCorporationRecentKillmails(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((killmail: any) => {
            expect(killmail).toHaveProperty('killmail_id');
            expect(typeof killmail.killmail_id).toBe('number');
            expect(killmail).toHaveProperty('killmail_hash');
            expect(typeof killmail.killmail_hash).toBe('string');
            expect(killmail).toHaveProperty('killmail_time');
            expect(typeof killmail.killmail_time).toBe('string');
            expect(killmail).toHaveProperty('victim');
            expect(killmail.victim).toHaveProperty('character_id');
            expect(typeof killmail.victim.character_id).toBe('number');
            expect(killmail).toHaveProperty('attackers');
            expect(Array.isArray(killmail.attackers)).toBe(true);
        });
    });
});
