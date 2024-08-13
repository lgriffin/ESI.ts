import { GetCharacterMailApi } from '../../../src/api/mail/getCharacterMail';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterMailApi = new GetCharacterMailApi(client);

describe('GetCharacterMailApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return a mail', async () => {
        const mockResponse = {
            mail_id: 1,
            subject: "Test Mail",
            from: 12345,
            to: {
                recipients: [12345],
                mailing_list_ids: []
            },
            timestamp: "2024-07-01T12:00:00Z",
            body: "This is a test mail."
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await getBody(() => characterMailApi.getMail(123456, 1));

        expect(result).toHaveProperty('mail_id');
        expect(typeof result.mail_id).toBe('number');
        expect(result).toHaveProperty('subject');
        expect(typeof result.subject).toBe('string');
        expect(result).toHaveProperty('from');
        expect(typeof result.from).toBe('number');
        expect(result).toHaveProperty('to');
        expect(Array.isArray(result.to.recipients)).toBe(true);
        expect(Array.isArray(result.to.mailing_list_ids)).toBe(true);
        expect(result).toHaveProperty('timestamp');
        expect(typeof result.timestamp).toBe('string');
        expect(result).toHaveProperty('body');
        expect(typeof result.body).toBe('string');
    });
});
