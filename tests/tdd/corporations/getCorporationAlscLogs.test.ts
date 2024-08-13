import { GetCorporationAlscLogsApi } from '../../../src/api/corporations/getCorporationAlscLogs';
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

const corporationAlscLogsApi = new GetCorporationAlscLogsApi(client);

describe('GetCorporationAlscLogsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation ALSC logs', async () => {
        const mockResponse = [
            {
                action: 'lock',
                character_id: 12345,
                container_id: 67890,
                location_flag: 'CorpSAG1',
                logged_at: '2023-01-01T00:00:00Z',
                new_config: 1,
                old_config: 0
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationAlscLogsApi.getCorporationAlscLogs(12345));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(log => {
            expect(log).toHaveProperty('action');
            expect(typeof log.action).toBe('string');
            expect(log).toHaveProperty('character_id');
            expect(typeof log.character_id).toBe('number');
            expect(log).toHaveProperty('container_id');
            expect(typeof log.container_id).toBe('number');
            expect(log).toHaveProperty('location_flag');
            expect(typeof log.location_flag).toBe('string');
            expect(log).toHaveProperty('logged_at');
            expect(typeof log.logged_at).toBe('string');
            expect(log).toHaveProperty('new_config');
            expect(typeof log.new_config).toBe('number');
            expect(log).toHaveProperty('old_config');
            expect(typeof log.old_config).toBe('number');
        });
    });
});
