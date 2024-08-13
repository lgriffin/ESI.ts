import { GetCorporationStructuresApi } from '../../../src/api/corporations/getCorporationStructures';
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

const api = new GetCorporationStructuresApi(client);

describe('GetCorporationStructuresApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation structures', async () => {
        const mockResponse = [
            {
                structure_id: 1234567890,
                type_id: 12345,
                system_id: 67890,
                starbase_id: 112233,
                state: 'online',
                fuel_expires: '2024-01-01T00:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => api.getCorporationStructures(123456));

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(structure => {
            expect(structure).toHaveProperty('structure_id');
            expect(typeof structure.structure_id).toBe('number');
            expect(structure).toHaveProperty('type_id');
            expect(typeof structure.type_id).toBe('number');
            expect(structure).toHaveProperty('system_id');
            expect(typeof structure.system_id).toBe('number');
            expect(structure).toHaveProperty('starbase_id');
            expect(typeof structure.starbase_id).toBe('number');
            expect(structure).toHaveProperty('state');
            expect(typeof structure.state).toBe('string');
            expect(structure).toHaveProperty('fuel_expires');
            expect(typeof structure.fuel_expires).toBe('string');
        });
    });
});
