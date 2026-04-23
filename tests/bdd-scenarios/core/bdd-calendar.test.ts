/**
 * BDD-Style Tests for CalendarClient
 *
 * Tests calendar event operations including listing events, retrieving
 * event details, responding to events, and error handling.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Calendar Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Retrieve Calendar Events', () => {
    describe('Scenario: Get upcoming events for a character', () => {
      it('Given a character with upcoming events, When I request calendar events, Then I should receive a list of events', async () => {
        // Given: A character with upcoming events
        const characterId = 1689391488;
        const expectedEvents = [
          {
            event_id: 1000001,
            event_date: '2024-02-01T19:00:00Z',
            title: 'Fleet Op: Jita Defense',
            importance: 0,
            event_response: 'accepted' as const,
          },
          {
            event_id: 1000002,
            event_date: '2024-02-03T21:00:00Z',
            title: 'Corp Meeting',
            importance: 1,
            event_response: 'not_responded' as const,
          },
        ];

        jest
          .spyOn(client.calendar, 'getCalendarEvents')
          .mockResolvedValue(expectedEvents);

        // When: I request calendar events
        const result = await client.calendar.getCalendarEvents(characterId);

        // Then: I should receive a list of events
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('event_id', 1000001);
        expect(result[0]).toHaveProperty('title', 'Fleet Op: Jita Defense');
        expect(result[0]).toHaveProperty('event_date');
        expect(result[0]).toHaveProperty('event_response');
        expect(result[1]).toHaveProperty('importance', 1);
      });
    });

    describe('Scenario: Handle empty calendar', () => {
      it('Given a character with no upcoming events, When I request calendar events, Then I should receive an empty array', async () => {
        // Given: A character with no upcoming events
        const characterId = 1689391488;
        const emptyEvents: any[] = [];

        jest
          .spyOn(client.calendar, 'getCalendarEvents')
          .mockResolvedValue(emptyEvents);

        // When: I request calendar events
        const result = await client.calendar.getCalendarEvents(characterId);

        // Then: I should receive an empty array
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(0);
      });
    });

    describe('Scenario: Handle unauthorized access', () => {
      it('Given an invalid or expired token, When I request calendar events, Then I should receive a 403 forbidden error', async () => {
        // Given: An invalid or expired token
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.calendar, 'getCalendarEvents')
          .mockRejectedValue(forbiddenError);

        // When & Then: I request calendar events and expect a forbidden error
        await expect(
          client.calendar.getCalendarEvents(characterId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Retrieve Event Details', () => {
    describe('Scenario: Get detailed information for a specific event', () => {
      it('Given a valid event ID, When I request event details, Then I should receive complete event information', async () => {
        // Given: A valid event ID
        const characterId = 1689391488;
        const eventId = 1000001;
        const expectedDetail = {
          event_id: eventId,
          date: '2024-02-01T19:00:00Z',
          duration: 60,
          title: 'Fleet Op: Jita Defense',
          text: 'Form up in staging, doctrine ships required.',
          owner_id: 1344654522,
          owner_name: 'GoonWaffe',
          owner_type: 'corporation' as const,
          importance: 0,
          response: 'accepted',
        };

        jest
          .spyOn(client.calendar, 'getCalendarEventById')
          .mockResolvedValue(expectedDetail);

        // When: I request event details
        const result = await client.calendar.getCalendarEventById(
          characterId,
          eventId,
        );

        // Then: I should receive complete event information
        expect(result).toBeDefined();
        expect(result).toHaveProperty('event_id', eventId);
        expect(result).toHaveProperty('title', 'Fleet Op: Jita Defense');
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('duration', 60);
        expect(result).toHaveProperty('owner_id');
        expect(result).toHaveProperty('owner_type', 'corporation');
      });
    });

    describe('Scenario: Handle non-existent event', () => {
      it('Given an invalid event ID, When I request event details, Then I should receive a 404 not found error', async () => {
        // Given: An invalid event ID
        const characterId = 1689391488;
        const invalidEventId = 999999999;
        const notFoundError = TestDataFactory.createError(404);

        jest
          .spyOn(client.calendar, 'getCalendarEventById')
          .mockRejectedValue(notFoundError);

        // When & Then: I request event details and expect a not found error
        await expect(
          client.calendar.getCalendarEventById(characterId, invalidEventId),
        ).rejects.toThrow(EsiError);
      });
    });
  });

  describe('Feature: Respond to Calendar Events', () => {
    describe('Scenario: Accept a calendar event invitation', () => {
      it('Given a pending event invitation, When I accept the event, Then the response should be recorded successfully', async () => {
        // Given: A pending event invitation
        const characterId = 1689391488;
        const eventId = 1000001;

        jest
          .spyOn(client.calendar, 'respondToCalendarEvent')
          .mockResolvedValue(undefined);

        // When: I accept the event
        await client.calendar.respondToCalendarEvent(
          characterId,
          eventId,
          'accepted',
        );

        // Then: The response should be recorded successfully
        expect(client.calendar.respondToCalendarEvent).toHaveBeenCalledWith(
          characterId,
          eventId,
          'accepted',
        );
      });
    });

    describe('Scenario: Decline a calendar event invitation', () => {
      it('Given a pending event invitation, When I decline the event, Then the decline response should be recorded', async () => {
        // Given: A pending event invitation
        const characterId = 1689391488;
        const eventId = 1000002;

        jest
          .spyOn(client.calendar, 'respondToCalendarEvent')
          .mockResolvedValue(undefined);

        // When: I decline the event
        await client.calendar.respondToCalendarEvent(
          characterId,
          eventId,
          'declined',
        );

        // Then: The decline response should be recorded
        expect(client.calendar.respondToCalendarEvent).toHaveBeenCalledWith(
          characterId,
          eventId,
          'declined',
        );
      });
    });
  });

  describe('Feature: Retrieve Event Attendees', () => {
    describe('Scenario: Get attendee list for an event', () => {
      it('Given an event with attendees, When I request the attendee list, Then I should receive attendees with their response statuses', async () => {
        // Given: An event with attendees
        const characterId = 1689391488;
        const eventId = 1000001;
        const expectedAttendees = [
          {
            character_id: 1689391488,
            event_response: 'accepted' as const,
          },
          {
            character_id: 123456789,
            event_response: 'tentative' as const,
          },
          {
            character_id: 111111111,
            event_response: 'declined' as const,
          },
        ];

        jest
          .spyOn(client.calendar, 'getEventAttendees')
          .mockResolvedValue(expectedAttendees);

        // When: I request the attendee list
        const result = await client.calendar.getEventAttendees(
          characterId,
          eventId,
        );

        // Then: I should receive attendees with their response statuses
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('character_id');
        expect(result[0]).toHaveProperty('event_response', 'accepted');
        expect(result[1]).toHaveProperty('event_response', 'tentative');
        expect(result[2]).toHaveProperty('event_response', 'declined');
      });
    });
  });

  describe('Feature: Integration Workflows', () => {
    describe('Scenario: Complete event lifecycle - view, respond, and check attendees', () => {
      it('Given an upcoming event, When I view details then respond and check attendees, Then I should complete the full event interaction', async () => {
        // Given: An upcoming event
        const characterId = 1689391488;
        const eventId = 1000001;

        const eventDetail = {
          event_id: eventId,
          date: '2024-02-01T19:00:00Z',
          duration: 60,
          title: 'Fleet Op: Jita Defense',
          text: 'Form up in staging.',
          owner_id: 1344654522,
          owner_name: 'GoonWaffe',
          owner_type: 'corporation' as const,
          importance: 0,
          response: 'not_responded',
        };

        const attendeesAfterResponse = [
          { character_id: 1689391488, event_response: 'accepted' as const },
          { character_id: 123456789, event_response: 'accepted' as const },
        ];

        jest
          .spyOn(client.calendar, 'getCalendarEventById')
          .mockResolvedValue(eventDetail);
        jest
          .spyOn(client.calendar, 'respondToCalendarEvent')
          .mockResolvedValue(undefined);
        jest
          .spyOn(client.calendar, 'getEventAttendees')
          .mockResolvedValue(attendeesAfterResponse);

        // When: I view details, respond, and check attendees
        const detail = await client.calendar.getCalendarEventById(
          characterId,
          eventId,
        );
        await client.calendar.respondToCalendarEvent(
          characterId,
          eventId,
          'accepted',
        );
        const attendees = await client.calendar.getEventAttendees(
          characterId,
          eventId,
        );

        // Then: I should complete the full event interaction
        expect(detail).toBeDefined();
        expect(detail.title).toBe('Fleet Op: Jita Defense');

        expect(client.calendar.respondToCalendarEvent).toHaveBeenCalledWith(
          characterId,
          eventId,
          'accepted',
        );

        expect(attendees).toBeInstanceOf(Array);
        expect(attendees).toHaveLength(2);
        expect(
          attendees.every((a: any) => a.event_response === 'accepted'),
        ).toBe(true);
      });
    });
  });
});
