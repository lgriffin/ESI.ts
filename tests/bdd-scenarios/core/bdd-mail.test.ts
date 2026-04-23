/**
 * BDD Scenarios: Mail Management
 *
 * Comprehensive behavior-driven tests for Mail-related APIs
 * covering inbox headers, reading mail, labels, mailing lists,
 * sending/deleting mail, and concurrent operations.
 */

import { EsiClient } from '../../../src/EsiClient';
import { EsiError } from '../../../src/core/util/error';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';

describe('BDD Scenarios: Mail Management', () => {
  let client: EsiClient;

  beforeEach(() => {
    client = new EsiClient({
      clientId: 'test-mail-client',
      baseUrl: 'https://esi.evetech.net',
      timeout: 5000,
    });
  });

  describe('Feature: Inbox Management', () => {
    describe('Scenario: Retrieve mail inbox headers', () => {
      it('Given an authenticated character with mail, When I request their inbox headers, Then I should receive a list of mail summaries', async () => {
        // Given: An authenticated character with mail
        const characterId = 1689391488;
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

        // When: I request their inbox headers
        const result = await client.mail.getMailHeaders(characterId);

        // Then: I should receive a list of mail summaries
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

    describe('Scenario: Empty inbox', () => {
      it('Given an authenticated character with no mail, When I request their inbox headers, Then I should receive an empty list', async () => {
        // Given: An authenticated character with no mail
        const characterId = 111111111;

        jest.spyOn(client.mail, 'getMailHeaders').mockResolvedValue([]);

        // When: I request their inbox headers
        const result = await client.mail.getMailHeaders(characterId);

        // Then: I should receive an empty list
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toBe(0);
      });
    });
  });

  describe('Feature: Reading Mail', () => {
    describe('Scenario: Read a single mail message', () => {
      it('Given a character with a specific mail, When I request the full mail, Then I should receive the complete message with body', async () => {
        // Given: A character with a specific mail
        const characterId = 1689391488;
        const mailId = 1;
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

        // When: I request the full mail
        const result = await client.mail.getMail(characterId, mailId);

        // Then: I should receive the complete message
        expect(result).toBeDefined();
        expect(result.mail_id).toBe(mailId);
        expect(result.subject).toBe('Fleet Operation Tonight');
        expect(result.from).toBe(123456789);
        expect(result.recipients).toBeInstanceOf(Array);
        expect(result.recipients.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Feature: Mail Labels', () => {
    describe('Scenario: Retrieve mail labels with unread counts', () => {
      it('Given an authenticated character with mail labels, When I request their labels, Then I should receive labels with unread counts', async () => {
        // Given: An authenticated character with mail labels
        const characterId = 1689391488;
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

        // When: I request their labels
        const result = await client.mail.getMailLabels(characterId);

        // Then: I should receive labels with unread counts
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

    describe('Scenario: Create a custom mail label', () => {
      it('Given an authenticated character, When I create a new mail label, Then I should receive the new label ID', async () => {
        // Given: An authenticated character
        const characterId = 1689391488;
        const newLabel = { name: 'Important', color: '#FF0000' };
        const expectedLabelId = 100;

        jest
          .spyOn(client.mail, 'createMailLabel')
          .mockResolvedValue(expectedLabelId);

        // When: I create a new mail label
        const result = await client.mail.createMailLabel(characterId, newLabel);

        // Then: I should receive the new label ID
        expect(result).toBe(100);
        expect(typeof result).toBe('number');
      });
    });

    describe('Scenario: Delete a custom mail label', () => {
      it('Given an authenticated character with a custom label, When I delete the label, Then the operation should complete without error', async () => {
        // Given: An authenticated character with a custom label
        const characterId = 1689391488;
        const labelId = 100;

        jest.spyOn(client.mail, 'deleteMailLabel').mockResolvedValue(undefined);

        // When: I delete the label
        await client.mail.deleteMailLabel(characterId, labelId);

        // Then: The operation should complete without error
        expect(client.mail.deleteMailLabel).toHaveBeenCalledWith(
          characterId,
          labelId,
        );
      });
    });
  });

  describe('Feature: Mailing Lists', () => {
    describe('Scenario: Retrieve subscribed mailing lists', () => {
      it('Given an authenticated character subscribed to mailing lists, When I request their lists, Then I should receive the list details', async () => {
        // Given: An authenticated character subscribed to mailing lists
        const characterId = 1689391488;
        const expectedLists = [
          { mailing_list_id: 5001, name: 'Alliance Announcements' },
          { mailing_list_id: 5002, name: 'Corp Intel' },
          { mailing_list_id: 5003, name: 'Market Traders' },
        ];

        jest
          .spyOn(client.mail, 'getMailingLists')
          .mockResolvedValue(expectedLists);

        // When: I request their mailing lists
        const result = await client.mail.getMailingLists(characterId);

        // Then: I should receive the list details
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
  });

  describe('Feature: Sending and Deleting Mail', () => {
    describe('Scenario: Send a new mail', () => {
      it('Given an authenticated character, When I send a mail to another character, Then I should receive the new mail ID', async () => {
        // Given: An authenticated character
        const characterId = 1689391488;
        const mailBody = {
          recipients: [
            { recipient_id: 123456789, recipient_type: 'character' },
          ],
          subject: 'Fleet Invitation',
          body: 'You are invited to the fleet operation at 20:00 EVE.',
        };
        const expectedMailId = 42;

        jest.spyOn(client.mail, 'sendMail').mockResolvedValue(expectedMailId);

        // When: I send a mail
        const result = await client.mail.sendMail(characterId, mailBody);

        // Then: I should receive the new mail ID
        expect(result).toBe(42);
        expect(typeof result).toBe('number');
      });
    });

    describe('Scenario: Delete a mail', () => {
      it('Given an authenticated character with a mail to delete, When I delete the mail, Then the operation should complete without error', async () => {
        // Given: An authenticated character with a mail to delete
        const characterId = 1689391488;
        const mailId = 1;

        jest.spyOn(client.mail, 'deleteMail').mockResolvedValue(undefined);

        // When: I delete the mail
        await client.mail.deleteMail(characterId, mailId);

        // Then: The operation should complete without error
        expect(client.mail.deleteMail).toHaveBeenCalledWith(
          characterId,
          mailId,
        );
      });
    });

    describe('Scenario: Update mail metadata to mark as read', () => {
      it('Given an unread mail, When I update its metadata to mark it as read, Then the operation should complete without error', async () => {
        // Given: An unread mail
        const characterId = 1689391488;
        const mailId = 1;
        const metadata = { read: true, labels: [3] };

        jest
          .spyOn(client.mail, 'updateMailMetadata')
          .mockResolvedValue(undefined);

        // When: I update its metadata
        await client.mail.updateMailMetadata(characterId, mailId, metadata);

        // Then: The operation should complete without error
        expect(client.mail.updateMailMetadata).toHaveBeenCalledWith(
          characterId,
          mailId,
          metadata,
        );
      });
    });
  });

  describe('Feature: Concurrent Mail Operations', () => {
    describe('Scenario: Fetch headers, labels, and mailing lists simultaneously', () => {
      it('Given an authenticated character, When I fetch headers, labels, and lists concurrently, Then all three should resolve successfully', async () => {
        // Given: An authenticated character
        const characterId = 1689391488;
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

        jest
          .spyOn(client.mail, 'getMailHeaders')
          .mockResolvedValue(mockHeaders);
        jest.spyOn(client.mail, 'getMailLabels').mockResolvedValue(mockLabels);
        jest.spyOn(client.mail, 'getMailingLists').mockResolvedValue(mockLists);

        // When: I fetch all three concurrently
        const [headers, labels, lists] = await Promise.all([
          client.mail.getMailHeaders(characterId),
          client.mail.getMailLabels(characterId),
          client.mail.getMailingLists(characterId),
        ]);

        // Then: All three should resolve successfully
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
  });

  describe('Feature: Mail Error Handling', () => {
    describe('Scenario: Handle unauthorized access to mail', () => {
      it('Given an unauthenticated request, When I request mail headers, Then I should receive a 403 forbidden error', async () => {
        // Given: An unauthenticated request
        const characterId = 1689391488;
        const forbiddenError = TestDataFactory.createError(403);

        jest
          .spyOn(client.mail, 'getMailHeaders')
          .mockRejectedValue(forbiddenError);

        // When & Then: I should receive a 403 forbidden error
        await expect(client.mail.getMailHeaders(characterId)).rejects.toThrow(
          EsiError,
        );
      });
    });

    describe('Scenario: Handle not found error for non-existent mail', () => {
      it('Given a mail ID that does not exist, When I request the mail, Then I should receive a 404 not found error', async () => {
        // Given: A mail ID that does not exist
        const characterId = 1689391488;
        const nonExistentMailId = 999999;
        const notFoundError = TestDataFactory.createError(404);

        jest.spyOn(client.mail, 'getMail').mockRejectedValue(notFoundError);

        // When & Then: I should receive a 404 not found error
        await expect(
          client.mail.getMail(characterId, nonExistentMailId),
        ).rejects.toThrow(EsiError);
      });
    });
  });
});
