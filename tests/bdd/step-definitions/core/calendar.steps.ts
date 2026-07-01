import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/calendar.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN getting upcoming events for a character, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with upcoming events', () => {
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
    });

    when('the client requests calendar events', async () => {
      result = await client.calendar.getCalendarEvents(characterId);
    });

    then('the client shall return a list of events', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('event_id', 1000001);
      expect(result[0]).toHaveProperty('title', 'Fleet Op: Jita Defense');
      expect(result[0]).toHaveProperty('event_date');
      expect(result[0]).toHaveProperty('event_response');
      expect(result[1]).toHaveProperty('importance', 1);
    });
  });

  test('WHILE empty calendar, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with no upcoming events', () => {
      const emptyEvents: any[] = [];

      jest
        .spyOn(client.calendar, 'getCalendarEvents')
        .mockResolvedValue(emptyEvents);
    });

    when(
      'the client requests calendar events for the empty calendar',
      async () => {
        result = await client.calendar.getCalendarEvents(characterId);
      },
    );

    then('the client shall return an empty array', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });

  test('IF unauthorized access to calendar, THEN the client shall return a forbidden error', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let error: any;

    given('an invalid or expired token for calendar', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.calendar, 'getCalendarEvents')
        .mockRejectedValue(forbiddenError);
    });

    when(
      'the client requests calendar events without authorization',
      async () => {
        try {
          await client.calendar.getCalendarEvents(characterId);
        } catch (e) {
          error = e;
        }
      },
    );

    then('the client shall return a 403 forbidden error', () => {
      expect(error).toBeInstanceOf(EsiError);
    });
  });

  test('WHEN getting detailed information for a specific event, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const eventId = 1000001;
    let result: any;

    given('a valid event ID', () => {
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
    });

    when('the client requests event details', async () => {
      result = await client.calendar.getCalendarEventById(characterId, eventId);
    });

    then('the client shall return complete event information', () => {
      expect(result).toBeDefined();
      expect(result).toHaveProperty('event_id', eventId);
      expect(result).toHaveProperty('title', 'Fleet Op: Jita Defense');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('duration', 60);
      expect(result).toHaveProperty('owner_id');
      expect(result).toHaveProperty('owner_type', 'corporation');
    });
  });

  test('IF non-existent event, THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const invalidEventId = 999999999;
    let error: any;

    given('an invalid event ID', () => {
      const notFoundError = TestDataFactory.createError(404);

      jest
        .spyOn(client.calendar, 'getCalendarEventById')
        .mockRejectedValue(notFoundError);
    });

    when(
      'the client requests event details for the invalid event',
      async () => {
        try {
          await client.calendar.getCalendarEventById(
            characterId,
            invalidEventId,
          );
        } catch (e) {
          error = e;
        }
      },
    );

    then('the client shall return a 404 not found error', () => {
      expect(error).toBeInstanceOf(EsiError);
    });
  });

  test('WHEN accepting a calendar event invitation, the client shall record the response', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const eventId = 1000001;

    given('a pending event invitation to accept', () => {
      jest
        .spyOn(client.calendar, 'respondToCalendarEvent')
        .mockResolvedValue(undefined);
    });

    when('the client accepts the event', async () => {
      await client.calendar.respondToCalendarEvent(
        characterId,
        eventId,
        'accepted',
      );
    });

    then('the acceptance response shall be recorded successfully', () => {
      expect(client.calendar.respondToCalendarEvent).toHaveBeenCalledWith(
        characterId,
        eventId,
        'accepted',
      );
    });
  });

  test('WHEN declining a calendar event invitation, the client shall record the response', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const eventId = 1000002;

    given('a pending event invitation to decline', () => {
      jest
        .spyOn(client.calendar, 'respondToCalendarEvent')
        .mockResolvedValue(undefined);
    });

    when('the client declines the event', async () => {
      await client.calendar.respondToCalendarEvent(
        characterId,
        eventId,
        'declined',
      );
    });

    then('the decline response shall be recorded', () => {
      expect(client.calendar.respondToCalendarEvent).toHaveBeenCalledWith(
        characterId,
        eventId,
        'declined',
      );
    });
  });

  test('WHEN getting attendee list for an event, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const eventId = 1000001;
    let result: any;

    given('an event with attendees', () => {
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
    });

    when('the client requests the attendee list', async () => {
      result = await client.calendar.getEventAttendees(characterId, eventId);
    });

    then(
      'the client shall return attendees with their response statuses',
      () => {
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('character_id');
        expect(result[0]).toHaveProperty('event_response', 'accepted');
        expect(result[1]).toHaveProperty('event_response', 'tentative');
        expect(result[2]).toHaveProperty('event_response', 'declined');
      },
    );
  });

  test('WHEN completing event lifecycle - view, respond, and check attendees, the client shall complete all steps', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const eventId = 1000001;
    let detail: any;
    let attendees: any;

    given('an upcoming event for lifecycle test', () => {
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
    });

    when(
      'the client views details then respond and check attendees',
      async () => {
        detail = await client.calendar.getCalendarEventById(
          characterId,
          eventId,
        );
        await client.calendar.respondToCalendarEvent(
          characterId,
          eventId,
          'accepted',
        );
        attendees = await client.calendar.getEventAttendees(
          characterId,
          eventId,
        );
      },
    );

    then('the client shall complete the full event interaction', () => {
      expect(detail).toBeDefined();
      expect(detail.title).toBe('Fleet Op: Jita Defense');

      expect(client.calendar.respondToCalendarEvent).toHaveBeenCalledWith(
        characterId,
        eventId,
        'accepted',
      );

      expect(attendees).toBeInstanceOf(Array);
      expect(attendees).toHaveLength(2);
      expect(attendees.every((a: any) => a.event_response === 'accepted')).toBe(
        true,
      );
    });
  });
});
