import { GetCorporationMemberRolesApi } from '../../../src/api/corporations/getCorporationMemberRoles';
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

const corporationMemberRolesApi = new GetCorporationMemberRolesApi(client);

describe('GetCorporationMemberRolesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation member roles', async () => {
        const mockResponse = [
            {
                character_id: 12345,
                roles: ['Director', 'Accountant']
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationMemberRolesApi.getCorporationMemberRoles(12345));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((memberRole: { character_id: number, roles: string[] }) => {
            expect(memberRole).toHaveProperty('character_id');
            expect(typeof memberRole.character_id).toBe('number');
            expect(memberRole).toHaveProperty('roles');
            expect(Array.isArray(memberRole.roles)).toBe(true);
            memberRole.roles.forEach(role => {
                expect(typeof role).toBe('string');
            });
        });
    });
});
