import { GetCorporationMemberRolesHistoryApi } from '../../../src/api/corporations/getCorporationMemberRolesHistory';
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

const corporationMemberRolesHistoryApi = new GetCorporationMemberRolesHistoryApi(client);

describe('GetCorporationMemberRolesHistoryApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation member roles history', async () => {
        const mockResponse = [
            {
                character_id: 12345,
                changed_at: '2024-07-01T12:00:00Z',
                issuer_id: 67890,
                role_type: 'role_type',
                old_roles: ['old_role1', 'old_role2'],
                new_roles: ['new_role1', 'new_role2']
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationMemberRolesHistoryApi.getCorporationMemberRolesHistory(12345));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((history: { character_id: number, changed_at: string, issuer_id: number, role_type: string, old_roles: string[], new_roles: string[] }) => {
            expect(history).toHaveProperty('character_id');
            expect(typeof history.character_id).toBe('number');
            expect(history).toHaveProperty('changed_at');
            expect(typeof history.changed_at).toBe('string');
            expect(history).toHaveProperty('issuer_id');
            expect(typeof history.issuer_id).toBe('number');
            expect(history).toHaveProperty('role_type');
            expect(typeof history.role_type).toBe('string');
            expect(history).toHaveProperty('old_roles');
            expect(Array.isArray(history.old_roles)).toBe(true);
            history.old_roles.forEach(role => {
                expect(typeof role).toBe('string');
            });
            expect(history).toHaveProperty('new_roles');
            expect(Array.isArray(history.new_roles)).toBe(true);
            history.new_roles.forEach(role => {
                expect(typeof role).toBe('string');
            });
        });
    });
});
