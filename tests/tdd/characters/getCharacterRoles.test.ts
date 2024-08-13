import { GetCharacterRolesApi } from '../../../src/api/characters/getCharacterRoles';
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

const characterRolesApi = new GetCharacterRolesApi(client);

describe('GetCharacterRolesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character roles', async () => {
        const mockResponse = {
            roles: ['role1', 'role2']
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => characterRolesApi.getCharacterRoles(123456));

        expect(result).toHaveProperty('roles');
        expect(Array.isArray(result.roles)).toBe(true);
    });
});
