import { GetContactNotificationsApi } from '../../../src/api/characters/getContactNotifications';
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

const contactNotificationsApi = new GetContactNotificationsApi(client);

describe('GetContactNotificationsApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for contact notifications', async () => {
        const mockResponse = [
            {
                notification_id: 1,
                sender_character_id: 123456,
                standing_level: 10.0
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => contactNotificationsApi.getContactNotifications(123456));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((notification: {notification_id: number, sender_character_id: number, standing_level: number}) => {
            expect(notification).toHaveProperty('notification_id');
            expect(notification).toHaveProperty('sender_character_id');
            expect(notification).toHaveProperty('standing_level');
        });
    });
});
