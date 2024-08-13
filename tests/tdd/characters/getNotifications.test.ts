import { GetNotificationsApi } from '../../../src/api/characters/getNotifications';
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

const notificationsApi = new GetNotificationsApi(client);

describe('GetNotificationsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for notifications', async () => {
        const mockResponse = [
            {
                notification_id: 1,
                type: 'WarDeclared',
                is_read: true
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => notificationsApi.getNotifications(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((notification: {notification_id: number, type: String, is_read: Boolean}) => {
            expect(notification).toHaveProperty('notification_id');
            expect(notification).toHaveProperty('type');
            expect(notification).toHaveProperty('is_read');
        });
    });
});
