import { GetCharacterMailHeadersApi } from '../../../src/api/mail/getCharacterMailHeaders';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const mailHeadersApi = new GetCharacterMailHeadersApi(client);

describe('GetCharacterMailHeadersApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return mail headers', async () => {
        const mockResponse = [
            {
                mail_id: 1,
                subject: "Test Mail",
                from: 12345,
                to: {
                    recipients: [12345],
                    mailing_list_ids: []
                },
                timestamp: "2024-07-01T12:00:00Z",
                is_read: false,
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => mailHeadersApi.getCharacterMailHeaders(123456789));

        expect(Array.isArray(result)).toBe(true);
        result.forEach((mailHeader: { mail_id: number, subject: string, from: number, to: { recipients: number[], mailing_list_ids: number[] }, timestamp: string, is_read: boolean }) => {
            expect(mailHeader).toHaveProperty('mail_id');
            expect(typeof mailHeader.mail_id).toBe('number');
            expect(mailHeader).toHaveProperty('subject');
            expect(typeof mailHeader.subject).toBe('string');
            expect(mailHeader).toHaveProperty('from');
            expect(typeof mailHeader.from).toBe('number');
            expect(mailHeader).toHaveProperty('to');
            expect(Array.isArray(mailHeader.to.recipients)).toBe(true);
            expect(Array.isArray(mailHeader.to.mailing_list_ids)).toBe(true);
            expect(mailHeader).toHaveProperty('timestamp');
            expect(typeof mailHeader.timestamp).toBe('string');
            expect(mailHeader).toHaveProperty('is_read');
            expect(typeof mailHeader.is_read).toBe('boolean');
        });
    });
});
