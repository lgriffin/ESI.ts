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

    const mockResponse: Array<{bookmark_id: number, coordinates: {x: number, y: number, z: number}, created: string, creator_id: number, folder_id: number, item: {item_id: number, type_id: number}, location_id: number, memo: string, note: string}> = [
        {
            bookmark_id: 1,
            coordinates: { x: 1.0, y: 2.0, z: 3.0 },
            created: '2024-01-01T00:00:00Z',
            creator_id: 1001,
            folder_id: 2001,
            item: { item_id: 3001, type_id: 4001 },
            location_id: 5001,
            memo: 'Test memo',
            note: 'Test note'
        }
    ];
describe('CharacterBookmarksApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return character bookmarks', async () => {
     
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const api = new CharacterBookmarksApi(client);
        const result = await api.getCharacterBookmarks(12345);

        expect(result).toEqual(mockResponse);
    });
});
