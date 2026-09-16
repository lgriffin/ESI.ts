import { defineFeature, loadFeature } from 'jest-cucumber';
import fetchMock from 'jest-fetch-mock';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import {
  createSeamClient,
  lastRequest,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0006-calendar.feature');

/**
 * Match a URL whose path ends exactly at `path`, so `/calendar/` does not also
 * serve `/calendar/{event_id}/`.
 */
function exactPath(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^https://esi\\.evetech\\.net${escaped}(\\?|$)`);
}

const BEARER = 'Bearer bdd-access-token';

/**
 * Local workaround for a seam gap: transport.ts encodes a body-less response
 * as an empty string, and the Response constructor rejects any body on 204.
 * ESI answers calendar responses with 204 No Content, so rebuild that one
 * response with a null body. The seam has already recorded the request and
 * consumed the queued entry by the time the constructor throws, so its
 * strictness is unaffected. Must be registered after useHttpTransport().
 */
function allowNoContentResponses(): void {
  beforeEach(() => {
    const serve = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input, init) => {
      try {
        return await serve(input, init);
      } catch (error) {
        if (/Invalid response status code 204/.test(String(error))) {
          return new Response(null, { status: 204 });
        }
        throw error;
      }
    });
  });
}

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();
  allowNoContentResponses();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Event list holding an accepted event and an unanswered event', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with upcoming events', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/calendar/`),
        body: [
          {
            event_id: 1000001,
            event_date: '2024-02-01T19:00:00Z',
            title: 'Fleet Op: Jita Defense',
            importance: 0,
            event_response: 'accepted',
          },
          {
            event_id: 1000002,
            event_date: '2024-02-03T21:00:00Z',
            title: 'Corp Meeting',
            importance: 1,
            event_response: 'not_responded',
          },
        ],
      });
    });

    when('the client requests calendar events', async () => {
      result = await client.calendar.getCalendarEvents(characterId);
    });

    then('the client shall return a list of events', () => {
      expect(lastRequest().method).toBe('GET');
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/calendar/`,
      );
      expect(lastRequest().headers.authorization).toBe(BEARER);
      expect(result).toEqual([
        {
          event_id: 1000001,
          event_date: '2024-02-01T19:00:00Z',
          title: 'Fleet Op: Jita Defense',
          importance: 0,
          event_response: 'accepted',
        },
        {
          event_id: 1000002,
          event_date: '2024-02-03T21:00:00Z',
          title: 'Corp Meeting',
          importance: 1,
          event_response: 'not_responded',
        },
      ]);
    });
  });

  test('Character with an empty calendar', ({ given, when, then }) => {
    const characterId = 1689391488;
    let result: any;

    given('a character with no upcoming events', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/calendar/`),
        body: [],
      });
    });

    when(
      'the client requests calendar events for the empty calendar',
      async () => {
        result = await client.calendar.getCalendarEvents(characterId);
      },
    );

    then('the client shall return an empty array', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/calendar/`,
      );
      expect(result).toEqual([]);
    });
  });

  test('Expired token on the events endpoint rejects the request', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let error: any;

    given('an invalid or expired token for calendar', () => {
      queueError(403, 'token not valid for scope', {
        match: exactPath(`/characters/${characterId}/calendar/`),
      });
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
      expect((error as EsiError).statusCode).toBe(403);
      // 403 is not retried.
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().headers.authorization).toBe(BEARER);
    });
  });

  test('Detail record for a corporation-owned fleet operation', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const eventId = 1000001;
    let result: any;

    given('a valid event ID', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/calendar/${eventId}/`),
        body: {
          event_id: eventId,
          date: '2024-02-01T19:00:00Z',
          duration: 60,
          title: 'Fleet Op: Jita Defense',
          text: 'Form up in staging, doctrine ships required.',
          owner_id: 1344654522,
          owner_name: 'GoonWaffe',
          owner_type: 'corporation',
          importance: 0,
          response: 'accepted',
        },
      });
    });

    when('the client requests event details', async () => {
      result = await client.calendar.getCalendarEventById(characterId, eventId);
    });

    then('the client shall return complete event information', () => {
      expect(lastRequest().method).toBe('GET');
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/calendar/${eventId}/`,
      );
      expect(result).toEqual({
        event_id: eventId,
        date: '2024-02-01T19:00:00Z',
        duration: 60,
        title: 'Fleet Op: Jita Defense',
        text: 'Form up in staging, doctrine ships required.',
        owner_id: 1344654522,
        owner_name: 'GoonWaffe',
        owner_type: 'corporation',
        importance: 0,
        response: 'accepted',
      });
    });
  });

  test('Unknown event ID rejects the request', ({ given, when, then }) => {
    const characterId = 1689391488;
    const invalidEventId = 999999999;
    let error: any;

    given('an invalid event ID', () => {
      queueError(404, 'Event not found', {
        match: exactPath(
          `/characters/${characterId}/calendar/${invalidEventId}/`,
        ),
      });
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
      expect((error as EsiError).statusCode).toBe(404);
      // 404 is not retried.
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/calendar/${invalidEventId}/`,
      );
    });
  });

  test('Accepting an invitation', ({ given, when, then }) => {
    const characterId = 1689391488;
    const eventId = 1000001;

    given('a pending event invitation to accept', () => {
      // ESI answers a response submission with 204 No Content.
      queueResponse({
        match: exactPath(`/characters/${characterId}/calendar/${eventId}/`),
        status: 204,
      });
    });

    when('the client accepts the event', async () => {
      await client.calendar.respondToCalendarEvent(
        characterId,
        eventId,
        'accepted',
      );
    });

    then('the acceptance response shall be recorded successfully', () => {
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('PUT');
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/calendar/${eventId}/`,
      );
      expect(request.headers.authorization).toBe(BEARER);
      expect(JSON.parse(request.body!)).toEqual({ response: 'accepted' });
    });
  });

  test('Declining an invitation', ({ given, when, then }) => {
    const characterId = 1689391488;
    const eventId = 1000002;

    given('a pending event invitation to decline', () => {
      queueResponse({
        match: exactPath(`/characters/${characterId}/calendar/${eventId}/`),
        status: 204,
      });
    });

    when('the client declines the event', async () => {
      await client.calendar.respondToCalendarEvent(
        characterId,
        eventId,
        'declined',
      );
    });

    then('the decline response shall be recorded', () => {
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('PUT');
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/calendar/${eventId}/`,
      );
      expect(JSON.parse(request.body!)).toEqual({ response: 'declined' });
    });
  });

  test('Attendee list spanning accepted, tentative, and declined responses', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const eventId = 1000001;
    let result: any;

    given('an event with attendees', () => {
      queueResponse({
        match: exactPath(
          `/characters/${characterId}/calendar/${eventId}/attendees/`,
        ),
        body: [
          { character_id: 1689391488, event_response: 'accepted' },
          { character_id: 123456789, event_response: 'tentative' },
          { character_id: 111111111, event_response: 'declined' },
        ],
      });
    });

    when('the client requests the attendee list', async () => {
      result = await client.calendar.getEventAttendees(characterId, eventId);
    });

    then(
      'the client shall return attendees with their response statuses',
      () => {
        expect(lastRequest().url.pathname).toBe(
          `/characters/${characterId}/calendar/${eventId}/attendees/`,
        );
        expect(result).toEqual([
          { character_id: 1689391488, event_response: 'accepted' },
          { character_id: 123456789, event_response: 'tentative' },
          { character_id: 111111111, event_response: 'declined' },
        ]);
      },
    );
  });

  test('Detail read, response, and attendee read for one event', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const eventId = 1000001;
    const eventPath = `/characters/${characterId}/calendar/${eventId}/`;
    let detail: any;
    let attendees: any;

    given('an upcoming event for lifecycle test', () => {
      queueResponse({
        match: exactPath(eventPath),
        body: {
          event_id: eventId,
          date: '2024-02-01T19:00:00Z',
          duration: 60,
          title: 'Fleet Op: Jita Defense',
          text: 'Form up in staging.',
          owner_id: 1344654522,
          owner_name: 'GoonWaffe',
          owner_type: 'corporation',
          importance: 0,
          response: 'not_responded',
        },
      });
      queueResponse({ match: exactPath(eventPath), status: 204 });
      queueResponse({
        match: exactPath(`${eventPath}attendees/`),
        body: [
          { character_id: 1689391488, event_response: 'accepted' },
          { character_id: 123456789, event_response: 'accepted' },
        ],
      });
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
      expect(sentRequests().map((r) => [r.method, r.url.pathname])).toEqual([
        ['GET', eventPath],
        ['PUT', eventPath],
        ['GET', `${eventPath}attendees/`],
      ]);
      expect(JSON.parse(sentRequests()[1].body!)).toEqual({
        response: 'accepted',
      });

      expect(detail.event_id).toBe(eventId);
      expect(detail.title).toBe('Fleet Op: Jita Defense');
      expect(detail.response).toBe('not_responded');

      expect(attendees).toEqual([
        { character_id: 1689391488, event_response: 'accepted' },
        { character_id: 123456789, event_response: 'accepted' },
      ]);
    });
  });
});
