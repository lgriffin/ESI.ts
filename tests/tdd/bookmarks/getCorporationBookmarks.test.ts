import { CorporationBookmarksApi } from '../../../src/api/bookmarks/getCorporationBookmarks';
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


const corporationBookmarksApi = new CorporationBookmarksApi(client);

describe('GetCorporationBookmarksApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for corporation bookmarks', async () => {
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

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await corporationBookmarksApi.getCorporationBookmarks(123456);

        console.log('API response:', result); // Log the result for debugging

        expect(Array.isArray(result)).toBe(true);
        result.forEach((bookmark: { bookmark_id: number, coordinates: { x: number, y: number, z: number }, created: string, creator_id: number, folder_id: number, item: { item_id: number, type_id: number }, location_id: number, memo: string, note: string }) => {
            expect(bookmark).toHaveProperty('bookmark_id');
            expect(bookmark).toHaveProperty('coordinates');
            expect(bookmark.coordinates).toHaveProperty('x');
            expect(bookmark.coordinates).toHaveProperty('y');
            expect(bookmark.coordinates).toHaveProperty('z');
            expect(bookmark).toHaveProperty('created');
            expect(bookmark).toHaveProperty('creator_id');
            expect(bookmark).toHaveProperty('folder_id');
            expect(bookmark).toHaveProperty('item');
            expect(bookmark.item).toHaveProperty('item_id');
            expect(bookmark.item).toHaveProperty('type_id');
            expect(bookmark).toHaveProperty('location_id');
            expect(bookmark).toHaveProperty('memo');
            expect(bookmark).toHaveProperty('note');
        });
    });
});
