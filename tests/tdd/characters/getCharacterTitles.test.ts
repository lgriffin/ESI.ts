import { GetCharacterTitlesApi } from '../../../src/api/characters/getCharacterTitles'
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

const characterTitlesApi = new GetCharacterTitlesApi(client);

describe('GetCharacterTitlesApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for character titles', async () => {
        const mockResponse = [
            {
                title_id: 1,
                name: 'CEO'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => characterTitlesApi.getCharacterTitles(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((title: { title_id: number, name: string }) => {
            expect(title).toHaveProperty('title_id');
            expect(title).toHaveProperty('name');
        });
    });
});
