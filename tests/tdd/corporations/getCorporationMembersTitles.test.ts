import { GetCorporationMembersTitlesApi } from '../../../src/api/corporations/getCorporationMembersTitles';
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

const corporationMembersTitlesApi = new GetCorporationMembersTitlesApi(client);

describe('GetCorporationMembersTitlesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation members titles', async () => {
        const mockResponse = [
            {
                character_id: 12345,
                titles: [1, 2, 3]
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => corporationMembersTitlesApi.getCorporationMembersTitles(12345));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((memberTitle: { character_id: number, titles: number[] }) => {
            expect(memberTitle).toHaveProperty('character_id');
            expect(typeof memberTitle.character_id).toBe('number');
            expect(memberTitle).toHaveProperty('titles');
            expect(Array.isArray(memberTitle.titles)).toBe(true);
            memberTitle.titles.forEach(title => {
                expect(typeof title).toBe('number');
            });
        });
    });
});
