import { GetFleetMembersApi } from '../../../src/api/fleets/getFleetMembers';
import fetchMock from 'jest-fetch-mock';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

const config = getConfig();
const client = new ApiClientBuilder()
    .setClientId(config.projectName)
    .setLink(config.link)
    .setAccessToken(config.authToken || undefined)
    .build();

fetchMock.enableMocks();

const fleetMembersApi = new GetFleetMembersApi(client);

describe('GetFleetMembersApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid fleet members', async () => {
        const mockResponse: Array<{ character_id: number; role: string; join_time: string }> = [
            {
                character_id: 1234567890,
                role: 'squad_member',
                join_time: '2024-01-01T00:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await fleetMembersApi.getFleetMembers(1234567890);

        expect(Array.isArray(result)).toBe(true);
        (result as Array<{ character_id: number; role: string; join_time: string }>).forEach(member => {
            expect(member).toHaveProperty('character_id');
            expect(typeof member.character_id).toBe('number');
            expect(member).toHaveProperty('role');
            expect(typeof member.role).toBe('string');
            expect(member).toHaveProperty('join_time');
            expect(typeof member.join_time).toBe('string');
        });
    });
});
