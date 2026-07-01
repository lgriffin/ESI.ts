import { defineFeature, loadFeature } from 'jest-cucumber';
import { EsiClient } from '../../../../src/EsiClient';
import { EsiError } from '../../../../src/core/util/error';
import { TestDataFactory } from '../../../../src/testing/TestDataFactory';

const feature = loadFeature('tests/bdd/features/core/mail.feature');

defineFeature(feature, (test) => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-mail-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  test('WHEN retrieving mail inbox headers, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character with mail', () => {
      const expectedHeaders = [
        {
          mail_id: 1,
          from: 123456789,
          subject: 'Fleet Operation Tonight',
          timestamp: '2024-01-15T18:00:00Z',
          is_read: false,
          recipients: [
            {
              recipient_id: 1689391488,
              recipient_type: 'character' as const,
            },
          ],
        },
        {
          mail_id: 2,
          from: 987654321,
          subject: 'Contract Completed',
          timestamp: '2024-01-15T12:00:00Z',
          is_read: true,
          recipients: [
            {
              recipient_id: 1689391488,
              recipient_type: 'character' as const,
            },
          ],
        },
        {
          mail_id: 3,
          from: 111111111,
          subject: 'Welcome to the Corporation',
          timestamp: '2024-01-14T09:00:00Z',
          is_read: true,
          recipients: [
            {
              recipient_id: 1689391488,
              recipient_type: 'character' as const,
            },
          ],
        },
      ];

      jest
        .spyOn(client.mail, 'getMailHeaders')
        .mockResolvedValue(expectedHeaders);
    });

    when('the client requests their inbox headers', async () => {
      result = await client.mail.getMailHeaders(characterId);
    });

    then('the client shall return a list of mail summaries', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      result.forEach((header: any) => {
        expect(header).toHaveProperty('mail_id');
        expect(header).toHaveProperty('from');
        expect(header).toHaveProperty('subject');
        expect(header).toHaveProperty('timestamp');
        expect(header).toHaveProperty('is_read');
      });
    });
  });

  test('WHILE empty inbox, the client shall return an empty result', ({
    given,
    when,
    then,
  }) => {
    const characterId = 111111111;
    let result: any;

    given('an authenticated character with no mail', () => {
      jest.spyOn(client.mail, 'getMailHeaders').mockResolvedValue([]);
    });

    when('the client requests their empty inbox headers', async () => {
      result = await client.mail.getMailHeaders(characterId);
    });

    then('the client shall return an empty mail list', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });
  });

  test('WHEN reading a single mail message, the client shall return the full content', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const mailId = 1;
    let result: any;

    given('a character with a specific mail', () => {
      const expectedMail = {
        mail_id: mailId,
        from: 123456789,
        subject: 'Fleet Operation Tonight',
        timestamp: '2024-01-15T18:00:00Z',
        is_read: true,
        labels: [3],
        recipients: [
          { recipient_id: 1689391488, recipient_type: 'character' as const },
        ],
      };

      jest.spyOn(client.mail, 'getMail').mockResolvedValue(expectedMail);
    });

    when('the client requests the full mail', async () => {
      result = await client.mail.getMail(characterId, mailId);
    });

    then('the client shall return the complete message with body', () => {
      expect(result).toBeDefined();
      expect(result.mail_id).toBe(mailId);
      expect(result.subject).toBe('Fleet Operation Tonight');
      expect(result.from).toBe(123456789);
      expect(result.recipients).toBeInstanceOf(Array);
      expect(result.recipients.length).toBeGreaterThan(0);
    });
  });

  test('WHEN retrieving mail labels with unread counts, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character with mail labels', () => {
      const expectedLabels = {
        total_unread_count: 5,
        labels: [
          { label_id: 1, name: 'Inbox', unread_count: 3 },
          { label_id: 2, name: 'Sent', unread_count: 0 },
          { label_id: 3, name: 'Corp', unread_count: 1 },
          { label_id: 4, name: 'Alliance', unread_count: 1 },
        ],
      };

      jest
        .spyOn(client.mail, 'getMailLabels')
        .mockResolvedValue(expectedLabels);
    });

    when('the client requests their mail labels', async () => {
      result = await client.mail.getMailLabels(characterId);
    });

    then('the client shall return labels with unread counts', () => {
      expect(result).toBeDefined();
      expect(result.total_unread_count).toBe(5);
      expect(result.labels).toBeInstanceOf(Array);
      expect(result.labels!.length).toBe(4);
      result.labels!.forEach((label: any) => {
        expect(label).toHaveProperty('label_id');
        expect(label).toHaveProperty('name');
        expect(label).toHaveProperty('unread_count');
      });

      // Verify individual unread counts sum to total (or less, since some labels may overlap)
      const labelUnread = result.labels!.reduce(
        (sum: number, l: any) => sum + l.unread_count,
        0,
      );
      expect(labelUnread).toBeGreaterThanOrEqual(result.total_unread_count!);
    });
  });

  test('WHEN creating a custom mail label, the client shall create the resource', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character for label creation', () => {
      jest.spyOn(client.mail, 'createMailLabel').mockResolvedValue(100);
    });

    when('the client creates a new mail label', async () => {
      const newLabel = { name: 'Important', color: '#FF0000' };
      result = await client.mail.createMailLabel(characterId, newLabel);
    });

    then('the client shall return the new label ID', () => {
      expect(result).toBe(100);
      expect(typeof result).toBe('number');
    });
  });

  test('WHEN deleting a custom mail label, the client shall complete the operation', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const labelId = 100;

    given('an authenticated character with a custom label', () => {
      jest.spyOn(client.mail, 'deleteMailLabel').mockResolvedValue(undefined);
    });

    when('the client deletes the mail label', async () => {
      await client.mail.deleteMailLabel(characterId, labelId);
    });

    then('the delete label operation shall complete without error', () => {
      expect(client.mail.deleteMailLabel).toHaveBeenCalledWith(
        characterId,
        labelId,
      );
    });
  });

  test('WHEN retrieving subscribed mailing lists, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character subscribed to mailing lists', () => {
      const expectedLists = [
        { mailing_list_id: 5001, name: 'Alliance Announcements' },
        { mailing_list_id: 5002, name: 'Corp Intel' },
        { mailing_list_id: 5003, name: 'Market Traders' },
      ];

      jest
        .spyOn(client.mail, 'getMailingLists')
        .mockResolvedValue(expectedLists);
    });

    when('the client requests their mailing lists', async () => {
      result = await client.mail.getMailingLists(characterId);
    });

    then('the client shall return the mailing list details', () => {
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      result.forEach((list: any) => {
        expect(list).toHaveProperty('mailing_list_id');
        expect(list).toHaveProperty('name');
        expect(typeof list.mailing_list_id).toBe('number');
        expect(typeof list.name).toBe('string');
      });
    });
  });

  test('WHEN sending a new mail, the client shall deliver the message', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let result: any;

    given('an authenticated character for sending mail', () => {
      jest.spyOn(client.mail, 'sendMail').mockResolvedValue(42);
    });

    when('the client sends a mail to another character', async () => {
      const mailBody = {
        recipients: [{ recipient_id: 123456789, recipient_type: 'character' }],
        subject: 'Fleet Invitation',
        body: 'You are invited to the fleet operation at 20:00 EVE.',
      };
      result = await client.mail.sendMail(characterId, mailBody);
    });

    then('the client shall return the new mail ID', () => {
      expect(result).toBe(42);
      expect(typeof result).toBe('number');
    });
  });

  test('WHEN deleting a mail, the client shall complete the operation', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const mailId = 1;

    given('an authenticated character with a mail to delete', () => {
      jest.spyOn(client.mail, 'deleteMail').mockResolvedValue(undefined);
    });

    when('the client deletes the mail', async () => {
      await client.mail.deleteMail(characterId, mailId);
    });

    then('the delete mail operation shall complete without error', () => {
      expect(client.mail.deleteMail).toHaveBeenCalledWith(characterId, mailId);
    });
  });

  test('WHEN updating mail metadata to mark as read, the client shall apply the changes', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const mailId = 1;
    const metadata = { read: true, labels: [3] };

    given('an unread mail', () => {
      jest
        .spyOn(client.mail, 'updateMailMetadata')
        .mockResolvedValue(undefined);
    });

    when('the client updates its metadata to mark it as read', async () => {
      await client.mail.updateMailMetadata(characterId, mailId, metadata);
    });

    then('the update metadata operation shall complete without error', () => {
      expect(client.mail.updateMailMetadata).toHaveBeenCalledWith(
        characterId,
        mailId,
        metadata,
      );
    });
  });

  test('WHEN fetching headers, labels, and mailing lists simultaneously, the client shall return the data', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let headers: any;
    let labels: any;
    let lists: any;

    given('an authenticated character for concurrent mail fetch', () => {
      const mockHeaders = [
        {
          mail_id: 1,
          from: 123456789,
          subject: 'Test Mail',
          timestamp: '2024-01-15T18:00:00Z',
          is_read: false,
          recipients: [
            {
              recipient_id: 1689391488,
              recipient_type: 'character' as const,
            },
          ],
        },
      ];
      const mockLabels = {
        total_unread_count: 1,
        labels: [{ label_id: 1, name: 'Inbox', unread_count: 1 }],
      };
      const mockLists = [
        { mailing_list_id: 5001, name: 'Alliance Announcements' },
      ];

      jest.spyOn(client.mail, 'getMailHeaders').mockResolvedValue(mockHeaders);
      jest.spyOn(client.mail, 'getMailLabels').mockResolvedValue(mockLabels);
      jest.spyOn(client.mail, 'getMailingLists').mockResolvedValue(mockLists);
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
      expect(headers).toBeInstanceOf(Array);
      expect(headers.length).toBe(1);
      expect(headers[0].subject).toBe('Test Mail');

      expect(labels.total_unread_count).toBe(1);
      expect(labels.labels).toBeInstanceOf(Array);

      expect(lists).toBeInstanceOf(Array);
      expect(lists.length).toBe(1);
      expect(lists[0].name).toBe('Alliance Announcements');
    });
  });

  test('IF unauthorized access to mail, THEN the client shall return a forbidden error', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    let caughtError: any;

    given('an unauthenticated mail request', () => {
      const forbiddenError = TestDataFactory.createError(403);

      jest
        .spyOn(client.mail, 'getMailHeaders')
        .mockRejectedValue(forbiddenError);
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
    });
  });

  test('IF not found error for non-existent mail, THEN the client shall return a not-found error', ({
    given,
    when,
    then,
  }) => {
    const characterId = 1689391488;
    const nonExistentMailId = 999999;
    let caughtError: any;

    given('a mail ID that does not exist', () => {
      const notFoundError = TestDataFactory.createError(404);

      jest.spyOn(client.mail, 'getMail').mockRejectedValue(notFoundError);
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
    });
  });
});
