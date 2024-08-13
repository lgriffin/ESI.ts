import fetchMock from 'jest-fetch-mock';
import { GetEventAttendeesApi } from '../../../src/api/calendar/getEventAttendees';
import { ApiClientBuilder } from '../../../src/core/ApiClientBuilder';
import { getConfig } from '../../../src/config/configManager';

fetchMock.enableMocks();

describe('GetEventAttendeesApi', () => {
    const config = getConfig();
    const client = new ApiClientBuilder()
        .setClientId(config.projectName)
        .setLink(config.link)
        .setAccessToken(config.authToken || undefined)
        .build();

    const getEventAttendeesApi = new GetEventAttendeesApi(client);

    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return event attendees', async () => {
        const mockResponse = [{ character_id: 123, event_response: 'accepted' }];
        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => getEventAttendeesApi.getEventAttendees(12345, 67890));
        expect(result).toEqual(mockResponse);
    });
});
