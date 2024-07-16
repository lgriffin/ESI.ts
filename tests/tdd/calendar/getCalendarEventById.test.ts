import fetchMock from 'jest-fetch-mock';
import { GetCalendarEventByIdApi } from '../../../src/api/calendar/getCalendarEventById';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

fetchMock.enableMocks();

describe('GetCalendarEventByIdApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    const getCalendarEventByIdApi = new GetCalendarEventByIdApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return a calendar event by ID', async () => {
        const mockResponse = { event_id: 1, title: 'Event 1' };
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getCalendarEventByIdApi.getCalendarEventById(12345, 67890);
        expect(result).toEqual(mockResponse);
    });
});
