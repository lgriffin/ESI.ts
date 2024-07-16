import { CalendarClient } from '../../../src/clients/CalendarClient';
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

const calendarClient = new CalendarClient(client);

describe('CalendarClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return valid structure for getCalendarEvents', async () => {
        const mockResponse = [
            {
                event_id: 1,
                event_date: '2024-07-01T12:00:00Z',
                title: 'Event Title',
                importance: 1
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result: { event_id: number; event_date: string; title: string; importance: number }[] = await calendarClient.getCalendarEvents(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((event) => {
            expect(event).toHaveProperty('event_id');
            expect(typeof event.event_id).toBe('number');
            expect(event).toHaveProperty('event_date');
            expect(typeof event.event_date).toBe('string');
            expect(event).toHaveProperty('title');
            expect(typeof event.title).toBe('string');
            expect(event).toHaveProperty('importance');
            expect(typeof event.importance).toBe('number');
        });
    });

    it('should return valid structure for getCalendarEventById', async () => {
        const mockResponse = {
            event_id: 1,
            event_date: '2024-07-01T12:00:00Z',
            title: 'Event Title',
            description: 'Event Description'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result: { event_id: number; event_date: string; title: string; description: string } = await calendarClient.getCalendarEventById(123456789, 1);

        expect(result).toHaveProperty('event_id');
        expect(typeof result.event_id).toBe('number');
        expect(result).toHaveProperty('event_date');
        expect(typeof result.event_date).toBe('string');
        expect(result).toHaveProperty('title');
        expect(typeof result.title).toBe('string');
        expect(result).toHaveProperty('description');
        expect(typeof result.description).toBe('string');
    });

    it('should handle respondToCalendarEvent correctly', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const response = await calendarClient.respondToCalendarEvent(123456789, 1, 'accepted');

        expect(response).toBeUndefined();
    });

    it('should return valid structure for getEventAttendees', async () => {
        const mockResponse = [
            {
                character_id: 123,
                response: 'accepted'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result: { character_id: number; response: string }[] = await calendarClient.getEventAttendees(123456789, 1);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((attendee) => {
            expect(attendee).toHaveProperty('character_id');
            expect(typeof attendee.character_id).toBe('number');
            expect(attendee).toHaveProperty('response');
            expect(typeof attendee.response).toBe('string');
        });
    });
});
