import { defineFeature, loadFeature } from 'jest-cucumber';
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

const feature = loadFeature('tests/bdd/features/core/0022-mail.feature');

/** Matches the headers listing, not /mail/labels/, /mail/lists/ or /mail/{id}/. */
const mailHeadersPath = (characterId: number) =>
  new RegExp(`/characters/${characterId}/mail/(\\?|$)`);

const requestBody = () => {
  const body = lastRequest().body;
  return body === undefined ? undefined : JSON.parse(body);
};

defineFeature(feature, (test) => {
  let client: EsiClient;

  useHttpTransport();

  beforeEach(() => {
    client = createSeamClient();
  });

  test('Inbox holding three messages returns a summary for each', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const expectedHeaders = [
      {
        mail_id: 1,
        from: 123456789,
        subject: 'Fleet Operation Tonight',
        timestamp: '2024-01-15T18:00:00Z',
        is_read: false,
        labels: [1],
        recipients: [
          { recipient_id: characterId, recipient_type: 'character' },
        ],
      },
      {
        mail_id: 2,
        from: 987654321,
        subject: 'Contract Completed',
        timestamp: '2024-01-15T12:00:00Z',
        is_read: true,
        labels: [1],
        recipients: [
          { recipient_id: characterId, recipient_type: 'character' },
        ],
      },
      {
        mail_id: 3,
        from: 111111111,
        subject: 'Welcome to the Corporation',
        timestamp: '2024-01-14T09:00:00Z',
        is_read: true,
        labels: [1, 3],
        recipients: [
          { recipient_id: characterId, recipient_type: 'character' },
        ],
      },
    ];
    let result: any;

    given('an authenticated character with mail', () => {
      queueResponse({
        match: mailHeadersPath(characterId),
        body: expectedHeaders,
      });
    });

    when('the client requests their inbox headers', async () => {
      result = await client.mail.getMailHeaders(characterId);
    });

    then('the client shall return a list of mail summaries', () => {
      const request = lastRequest();
      expect(request.method).toBe('GET');
      expect(request.url.pathname).toBe(`/characters/${characterId}/mail/`);
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(result).toEqual(expectedHeaders);
      expect(
        result.map((h: any) => [
          h.mail_id,
          h.from,
          h.subject,
          h.timestamp,
          h.is_read,
        ]),
      ).toEqual([
        [
          1,
          123456789,
          'Fleet Operation Tonight',
          '2024-01-15T18:00:00Z',
          false,
        ],
        [2, 987654321, 'Contract Completed', '2024-01-15T12:00:00Z', true],
        [
          3,
          111111111,
          'Welcome to the Corporation',
          '2024-01-14T09:00:00Z',
          true,
        ],
      ]);
    });
  });

  test('Character with no mail returns no summaries', ({
    given,
    when,
    then,
  }) => {
    const characterId = 111111111;
    let result: any;

    given('an authenticated character with no mail', () => {
      queueResponse({ match: mailHeadersPath(characterId), body: [] });
    });

    when('the client requests their empty inbox headers', async () => {
      result = await client.mail.getMailHeaders(characterId);
    });

    then('the client shall return an empty mail list', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/mail/`,
      );
      expect(result).toEqual([]);
    });
  });

  test('Requesting a mail by ID returns its sender and recipients', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const mailId = 331477591;
    let result: any;

    given('a character with a specific mail', () => {
      queueResponse({
        match: `/characters/${characterId}/mail/${mailId}/`,
        body: {
          subject: 'Fleet Operation Tonight',
          from: 123456789,
          timestamp: '2024-01-15T18:00:00Z',
          read: true,
          labels: [3],
          body: '<font size="12">Form up in Jita at 19:00.</font>',
          recipients: [
            { recipient_id: characterId, recipient_type: 'character' },
            { recipient_id: 99005338, recipient_type: 'alliance' },
          ],
          mail_id: mailId,
        },
      });
    });

    when('the client requests the full mail', async () => {
      result = await client.mail.getMail(characterId, mailId);
    });

    then(
      'the client shall return the complete message with its recipients',
      () => {
        expect(lastRequest().url.pathname).toBe(
          `/characters/${characterId}/mail/${mailId}/`,
        );
        expect(result.mail_id).toBe(mailId);
        expect(result.subject).toBe('Fleet Operation Tonight');
        expect(result.from).toBe(123456789);
        expect(result.recipients).toEqual([
          { recipient_id: characterId, recipient_type: 'character' },
          { recipient_id: 99005338, recipient_type: 'alliance' },
        ]);
      },
    );
  });

  test('Four labels are returned with unread counts and an inbox total', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const expectedLabels = [
      { label_id: 1, name: '[Inbox]', color: '#ffffff', unread_count: 3 },
      { label_id: 2, name: '[Sent]', color: '#ffffff', unread_count: 0 },
      { label_id: 4, name: '[Corp]', color: '#ffffff', unread_count: 1 },
      { label_id: 8, name: '[Alliance]', color: '#ffffff', unread_count: 2 },
    ];
    let result: any;

    given('an authenticated character with mail labels', () => {
      queueResponse({
        match: `/characters/${characterId}/mail/labels/`,
        body: { labels: expectedLabels, total_unread_count: 5 },
      });
    });

    when('the client requests their mail labels', async () => {
      result = await client.mail.getMailLabels(characterId);
    });

    then('the client shall return labels with unread counts', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/mail/labels/`,
      );
      expect(result.total_unread_count).toBe(5);
      expect(
        result.labels.map((l: any) => [l.label_id, l.name, l.unread_count]),
      ).toEqual([
        [1, '[Inbox]', 3],
        [2, '[Sent]', 0],
        [4, '[Corp]', 1],
        [8, '[Alliance]', 2],
      ]);

      // One unread message can carry several labels, so the per-label counts
      // sum to at least the total.
      const labelUnread = result.labels.reduce(
        (sum: number, l: any) => sum + l.unread_count,
        0,
      );
      expect(labelUnread).toBeGreaterThanOrEqual(result.total_unread_count);
    });
  });

  test('Created label returns its assigned numeric ID', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const newLabel = { name: 'Important', color: '#ff6600' };
    let result: any;

    given('an authenticated character for label creation', () => {
      queueResponse({
        match: `/characters/${characterId}/mail/labels/`,
        status: 201,
        body: 128,
      });
    });

    when('the client creates a new mail label', async () => {
      result = await client.mail.createMailLabel(characterId, newLabel);
    });

    then('the client shall return the new label ID', () => {
      const request = lastRequest();
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/mail/labels/`,
      );
      expect(requestBody()).toEqual(newLabel);
      expect(result).toBe(128);
    });
  });

  test('Deleting a custom label forwards the character and label IDs', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const labelId = 128;

    given('an authenticated character with a custom label', () => {
      queueResponse({
        match: `/characters/${characterId}/mail/labels/${labelId}/`,
        status: 204,
      });
    });

    when('the client deletes the mail label', async () => {
      await client.mail.deleteMailLabel(characterId, labelId);
    });

    then('the delete label operation shall complete without error', () => {
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('DELETE');
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/mail/labels/${labelId}/`,
      );
      expect(request.headers.authorization).toBe('Bearer bdd-access-token');
      expect(request.body).toBeUndefined();
    });
  });

  test('Subscribed mailing lists return numeric IDs and names', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const expectedLists = [
      { mailing_list_id: 145156367, name: 'Alliance Announcements' },
      { mailing_list_id: 145156368, name: 'Corp Intel' },
      { mailing_list_id: 145156369, name: 'Market Traders' },
    ];
    let result: any;

    given('an authenticated character subscribed to mailing lists', () => {
      queueResponse({
        match: `/characters/${characterId}/mail/lists/`,
        body: expectedLists,
      });
    });

    when('the client requests their mailing lists', async () => {
      result = await client.mail.getMailingLists(characterId);
    });

    then('the client shall return the mailing list details', () => {
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/mail/lists/`,
      );
      expect(result).toEqual(expectedLists);
      result.forEach((list: any) => {
        expect(typeof list.mailing_list_id).toBe('number');
        expect(typeof list.name).toBe('string');
      });
    });
  });

  test('Sent mail returns its assigned numeric ID', ({ given, when, then }) => {
    const characterId = 1689391488;
    const mailBody = {
      approved_cost: 0,
      recipients: [{ recipient_id: 123456789, recipient_type: 'character' }],
      subject: 'Fleet Invitation',
      body: 'You are invited to the fleet operation at 20:00 EVE.',
    };
    let result: any;

    given('an authenticated character for sending mail', () => {
      queueResponse({
        match: mailHeadersPath(characterId),
        status: 201,
        body: 331477592,
      });
    });

    when('the client sends a mail to another character', async () => {
      result = await client.mail.sendMail(characterId, mailBody);
    });

    then('the client shall return the new mail ID', () => {
      const request = lastRequest();
      expect(sentRequests()).toHaveLength(1);
      expect(request.method).toBe('POST');
      expect(request.url.pathname).toBe(`/characters/${characterId}/mail/`);
      expect(requestBody()).toEqual(mailBody);
      expect(result).toBe(331477592);
    });
  });

  test('Deleting a message forwards the character and mail IDs', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const mailId = 331477591;

    given('an authenticated character with a mail to delete', () => {
      queueResponse({
        match: `/characters/${characterId}/mail/${mailId}/`,
        status: 204,
      });
    });

    when('the client deletes the mail', async () => {
      await client.mail.deleteMail(characterId, mailId);
    });

    then('the delete mail operation shall complete without error', () => {
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('DELETE');
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/mail/${mailId}/`,
      );
      expect(request.body).toBeUndefined();
    });
  });

  test('Marking a mail as read forwards the metadata payload', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const mailId = 331477591;
    const metadata = { read: true, labels: [1, 4] };

    given('an unread mail', () => {
      queueResponse({
        match: `/characters/${characterId}/mail/${mailId}/`,
        status: 204,
      });
    });

    when('the client updates its metadata to mark it as read', async () => {
      await client.mail.updateMailMetadata(characterId, mailId, metadata);
    });

    then('the update metadata operation shall complete without error', () => {
      expect(sentRequests()).toHaveLength(1);
      const request = lastRequest();
      expect(request.method).toBe('PUT');
      expect(request.url.pathname).toBe(
        `/characters/${characterId}/mail/${mailId}/`,
      );
      expect(requestBody()).toEqual(metadata);
    });
  });

  test('Headers, labels, and mailing lists fetched in parallel each resolve', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const mockHeaders = [
      {
        mail_id: 1,
        from: 123456789,
        subject: 'Test Mail',
        timestamp: '2024-01-15T18:00:00Z',
        is_read: false,
        recipients: [
          { recipient_id: characterId, recipient_type: 'character' },
        ],
      },
    ];
    const mockLabels = {
      total_unread_count: 1,
      labels: [{ label_id: 1, name: '[Inbox]', unread_count: 1 }],
    };
    const mockLists = [
      { mailing_list_id: 145156367, name: 'Alliance Announcements' },
    ];
    let headers: any;
    let labels: any;
    let lists: any;

    given('an authenticated character for concurrent mail fetch', () => {
      // Each response is delayed differently so they settle out of request
      // order; a client that mixed them up would hand back the wrong payload.
      queueResponse({
        match: mailHeadersPath(characterId),
        body: mockHeaders,
        delayMs: 30,
      });
      queueResponse({
        match: `/characters/${characterId}/mail/labels/`,
        body: mockLabels,
        delayMs: 15,
      });
      queueResponse({
        match: `/characters/${characterId}/mail/lists/`,
        body: mockLists,
      });
    });

    when(
      'the client fetches headers, labels, and lists concurrently',
      async () => {
        [headers, labels, lists] = await Promise.all([
          client.mail.getMailHeaders(characterId),
          client.mail.getMailLabels(characterId),
          client.mail.getMailingLists(characterId),
        ]);
      },
    );

    then('all three mail requests shall resolve successfully', () => {
      expect(
        sentRequests()
          .map((r) => r.url.pathname)
          .sort(),
      ).toEqual(
        [
          `/characters/${characterId}/mail/`,
          `/characters/${characterId}/mail/labels/`,
          `/characters/${characterId}/mail/lists/`,
        ].sort(),
      );
      expect(headers).toEqual(mockHeaders);
      expect(labels).toEqual(mockLabels);
      expect(lists).toEqual(mockLists);
    });
  });

  test('Unauthenticated header request is rejected with 403', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an unauthenticated mail request', () => {
      queueError(403, 'token not valid for scope(s): esi-mail.read_mail.v1', {
        match: mailHeadersPath(characterId),
      });
    });

    when('the client requests mail headers without auth', async () => {
      try {
        await client.mail.getMailHeaders(characterId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 403 forbidden error for mail', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(403);
      // 403 is not retryable: one request, no second attempt.
      expect(sentRequests()).toHaveLength(1);
    });
  });

  test('Unknown mail ID is rejected with 404', ({ given, when, then }) => {
    const characterId = 1689391488;
    const nonExistentMailId = 999999;
    let caughtError: any;

    given('a mail ID that does not exist', () => {
      queueError(404, 'Mail not found', {
        match: `/characters/${characterId}/mail/${nonExistentMailId}/`,
      });
    });

    when('the client requests the non-existent mail', async () => {
      try {
        await client.mail.getMail(characterId, nonExistentMailId);
      } catch (error) {
        caughtError = error;
      }
    });

    then('the client shall return a 404 not found error for mail', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      expect(sentRequests()).toHaveLength(1);
      expect(lastRequest().url.pathname).toBe(
        `/characters/${characterId}/mail/${nonExistentMailId}/`,
      );
    });
  });
});
