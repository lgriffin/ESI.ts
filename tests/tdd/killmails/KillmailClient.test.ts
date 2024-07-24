import { KillmailsClient } from '../../../src/clients/KillmailsClient';
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

const killmailsClient = new KillmailsClient(client);

describe('KillmailsClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getCharacterRecentKillmails', async () => {
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

        const result = await killmailsClient.getCharacterRecentKillmails(123456);

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

    it('should return valid structure for getCorporationRecentKillmails', async () => {
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

        const result = await killmailsClient.getCorporationRecentKillmails(123456);

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

    it('should return valid structure for getKillmail', async () => {
        const mockResponse = {
            killmail_id: 12345,
            killmail_hash: 'abcdef1234567890',
            killmail_time: '2024-01-01T00:00:00Z',
            victim: { character_id: 67890 },
            attackers: [{ character_id: 54321 }]
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await killmailsClient.getKillmail(12345, 'abcdef1234567890');

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
