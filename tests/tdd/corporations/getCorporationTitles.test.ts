import { GetCorporationTitlesApi } from '../../../src/api/corporations/getCorporationTitles';
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

const api = new GetCorporationTitlesApi(client);

describe('GetCorporationTitlesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation titles', async () => {
        const mockResponse = [
            {
                title_id: 1,
                name: 'Director',
                roles: ['role1', 'role2'],
                grantable_roles: ['role3'],
                roles_at_hq: ['role4'],
                grantable_roles_at_hq: ['role5'],
                roles_at_base: ['role6'],
                grantable_roles_at_base: ['role7'],
                roles_at_other: ['role8'],
                grantable_roles_at_other: ['role9']
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await api.getCorporationTitles(123456);

        expect(Array.isArray(result)).toBe(true);
        (result as any[]).forEach(title => {
            expect(title).toHaveProperty('title_id');
            expect(typeof title.title_id).toBe('number');
            expect(title).toHaveProperty('name');
            expect(typeof title.name).toBe('string');
            expect(title).toHaveProperty('roles');
            expect(Array.isArray(title.roles)).toBe(true);
            expect(title).toHaveProperty('grantable_roles');
            expect(Array.isArray(title.grantable_roles)).toBe(true);
            expect(title).toHaveProperty('roles_at_hq');
            expect(Array.isArray(title.roles_at_hq)).toBe(true);
            expect(title).toHaveProperty('grantable_roles_at_hq');
            expect(Array.isArray(title.grantable_roles_at_hq)).toBe(true);
            expect(title).toHaveProperty('roles_at_base');
            expect(Array.isArray(title.roles_at_base)).toBe(true);
            expect(title).toHaveProperty('grantable_roles_at_base');
            expect(Array.isArray(title.grantable_roles_at_base)).toBe(true);
            expect(title).toHaveProperty('roles_at_other');
            expect(Array.isArray(title.roles_at_other)).toBe(true);
            expect(title).toHaveProperty('grantable_roles_at_other');
            expect(Array.isArray(title.grantable_roles_at_other)).toBe(true);
        });
    });
});
