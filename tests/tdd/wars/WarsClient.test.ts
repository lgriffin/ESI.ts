import { WarsClient } from '../../../src/clients/WarsClient';
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

const warsClient = new WarsClient(client);

describe('WarsClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid wars', async () => {
        const mockResponse = [
            {
                war_id: 1,
                declared: '2024-06-25T00:00:00Z',
                finished: null,
                mutual: false,
                open_for_allies: true,
                retracted: null,
                started: '2024-06-26T00:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => warsClient.getWars());

        expect(Array.isArray(result)).toBe(true);
        result.forEach((war: any) => {
            expect(war).toHaveProperty('war_id');
            expect(typeof war.war_id).toBe('number');
            expect(war).toHaveProperty('declared');
            expect(typeof war.declared).toBe('string');
            expect(war).toHaveProperty('started');
            expect(typeof war.started).toBe('string');
        });
    });

    it('should return valid war by ID', async () => {
        const mockResponse = {
            war_id: 1,
            declared: '2024-06-25T00:00:00Z',
            finished: null,
            mutual: false,
            open_for_allies: true,
            retracted: null,
            started: '2024-06-26T00:00:00Z'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => warsClient.getWarById(1));

        expect(result).toHaveProperty('war_id');
        expect(result.war_id).toBe(1);
        expect(result).toHaveProperty('declared');
        expect(typeof result.declared).toBe('string');
        expect(result).toHaveProperty('started');
        expect(typeof result.started).toBe('string');
    });

    it('should return valid war killmails', async () => {
        const mockResponse = [
            {
                killmail_hash: 'abc123',
                killmail_id: 12345
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => warsClient.getWarKillmails(1));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((killmail: any) => {
            expect(killmail).toHaveProperty('killmail_hash');
            expect(typeof killmail.killmail_hash).toBe('string');
            expect(killmail).toHaveProperty('killmail_id');
            expect(typeof killmail.killmail_id).toBe('number');
        });
    });
});
