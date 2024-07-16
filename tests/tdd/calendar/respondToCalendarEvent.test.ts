import fetchMock from 'jest-fetch-mock';
import { RespondToCalendarEventApi } from '../../../src/api/calendar/respondToCalendarEvent';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

fetchMock.enableMocks();

describe('RespondToCalendarEventApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    const respondToCalendarEventApi = new RespondToCalendarEventApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should respond to a calendar event', async () => {
        const mockResponse = { success: true };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await respondToCalendarEventApi.respondToCalendarEvent(12345, 67890, 'accepted');
        expect(result).toEqual(mockResponse);
    });
});
