import { CharacterBookmarksApi } from '../../../src/api/bookmarks/getCharacterBookmarks';
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

describe('CharacterBookmarksApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character bookmarks', async () => {
        const mockResponse = [/* Mock data here */];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const api = new CharacterBookmarksApi(client);
        const result = await api.getCharacterBookmarks(12345);

        expect(result).toEqual(mockResponse);
    });
});
