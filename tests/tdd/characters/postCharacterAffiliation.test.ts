import { PostCharacterAffiliationApi } from '../../../src/api/characters/postCharacterAffiliations';
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

const characterAffiliationApi = new PostCharacterAffiliationApi(client);

describe('PostCharacterAffiliationApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character affiliation', async () => {
        const mockResponse = [
            {
                character_id: 123456,
                corporation_id: 654321,
                alliance_id: 987654,
                faction_id: 123123
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const body = {
            characters: [1234567890, 1234567891]
        };

        const result = await characterAffiliationApi.postCharacterAffiliation(body);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((affiliation: { character_id: number, corporation_id: number, alliance_id: number, faction_id: number }) => {
            expect(affiliation).toHaveProperty('character_id');
            expect(affiliation).toHaveProperty('corporation_id');
            expect(affiliation).toHaveProperty('alliance_id');
            expect(affiliation).toHaveProperty('faction_id');
        });
    });
});
