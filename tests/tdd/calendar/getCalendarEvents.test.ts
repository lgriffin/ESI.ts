import fetchMock from 'jest-fetch-mock';
import { GetCalendarEventsApi } from '../../../src/api/calendar/getCalendarEvents';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

fetchMock.enableMocks();

describe('GetCalendarEventsApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    const getCalendarEventsApi = new GetCalendarEventsApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return calendar events', async () => {
        const mockResponse = [{ event_id: 1, title: 'Event 1' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getCalendarEventsApi.getCalendarEvents(12345);
        expect(result).toEqual(mockResponse);
    });
});
