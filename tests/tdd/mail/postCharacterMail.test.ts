import { PostCharacterMailApi } from '../../../src/api/mail/postCharacterMail';
import { getClient } from '../../../src/config/jest/jest.setup';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const client = getClient();
const characterMailApi = new PostCharacterMailApi(client);

describe('PostCharacterMailApi', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should send a mail', async () => {
        const mockResponse = {
            mail_id: 12345
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const body = {
            recipients: [
                {
                    recipient_id: 123456789,
                    recipient_type: 'character'
                }
            ],
            subject: 'Test Mail',
            body: 'This is a test mail.',
            approved_cost: 0,
            labels: []
        };

        const result = await characterMailApi.sendMail(123456, body);

        expect(result).toHaveProperty('mail_id');
        expect(typeof result.mail_id).toBe('number');
    });
});
