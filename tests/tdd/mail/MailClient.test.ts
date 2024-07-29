import { MailClient } from '../../../src/clients/MailClient';
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

const mailClient = new MailClient(client);

describe('MailClient', () => {
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should return mail headers', async () => {
        const mockResponse = [
            {
                mail_id: 1,
                subject: 'Test Mail',
                from: 123456,
                timestamp: '2024-01-01T00:00:00Z'
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await mailClient.getMailHeaders(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((mail: { mail_id: number, subject: string, from: number, timestamp: string }) => {
            expect(mail).toHaveProperty('mail_id');
            expect(typeof mail.mail_id).toBe('number');
            expect(mail).toHaveProperty('subject');
            expect(typeof mail.subject).toBe('string');
            expect(mail).toHaveProperty('from');
            expect(typeof mail.from).toBe('number');
            expect(mail).toHaveProperty('timestamp');
            expect(typeof mail.timestamp).toBe('string');
        });
    });

    it('should send a new mail', async () => {
        const mockResponse = {
            mail_id: 1
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const body = {
            recipients: [{ recipient_id: 123, recipient_type: 'character' }],
            subject: 'Test Mail',
            body: 'This is a test mail'
        };

        const result = await mailClient.sendMail(123456, body);

        expect(result).toHaveProperty('mail_id');
        expect(typeof result.mail_id).toBe('number');
    });

    it('should delete a mail', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await mailClient.deleteMail(123456, 1);

        expect(result).toEqual({ error: 'no content' });
    });

    it('should return a mail', async () => {
        const mockResponse = {
            mail_id: 1,
            subject: 'Test Mail',
            body: 'This is a test mail',
            from: 123456,
            timestamp: '2024-01-01T00:00:00Z'
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await mailClient.getMail(123456, 1);

        expect(result).toHaveProperty('mail_id');
        expect(typeof result.mail_id).toBe('number');
        expect(result).toHaveProperty('subject');
        expect(typeof result.subject).toBe('string');
        expect(result).toHaveProperty('body');
        expect(typeof result.body).toBe('string');
        expect(result).toHaveProperty('from');
        expect(typeof result.from).toBe('number');
        expect(result).toHaveProperty('timestamp');
        expect(typeof result.timestamp).toBe('string');
    });

    it('should update mail metadata', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const body = {
            labels: [1, 2],
            read: true
        };

        const result = await mailClient.updateMailMetadata(123456, 1, body);

        expect(result).toEqual({ error: 'no content' });
    });

    it('should return mail labels and unread counts', async () => {
        const mockResponse = {
            labels: [
                {
                    label_id: 1,
                    name: "Label 1",
                    unread_count: 5
                }
            ],
            total_unread_count: 5
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await mailClient.getMailLabels(123456789);

        expect(result).toHaveProperty('labels');
        expect(Array.isArray(result.labels)).toBe(true);
        result.labels.forEach((label: { label_id: number, name: string, unread_count: number }) => {
            expect(label).toHaveProperty('label_id');
            expect(typeof label.label_id).toBe('number');
            expect(label).toHaveProperty('name');
            expect(typeof label.name).toBe('string');
            expect(label).toHaveProperty('unread_count');
            expect(typeof label.unread_count).toBe('number');
        });
        expect(result).toHaveProperty('total_unread_count');
        expect(typeof result.total_unread_count).toBe('number');
    });

    it('should create a mail label', async () => {
        const mockResponse = {
            label_id: 1
        };

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const body = {
            name: "New Label"
        };

        const result = await mailClient.createMailLabel(123456, body);

        expect(result).toHaveProperty('label_id');
        expect(typeof result.label_id).toBe('number');
    });

    it('should delete a mail label', async () => {
        fetchMock.mockResponseOnce('', { status: 204 });

        const result = await mailClient.deleteMailLabel(123456, 1);

        expect(result).toEqual({ error: 'no content' });
    });

    it('should return mailing list subscriptions', async () => {
        const mockResponse = [
            {
                mailing_list_id: 1,
                name: "Test List"
            }
        ];

        fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await mailClient.getMailingLists(123456789);

        expect(Array.isArray(result)).toBe(true);
        result.forEach((list: { mailing_list_id: number, name: string }) => {
            expect(list).toHaveProperty('mailing_list_id');
            expect(typeof list.mailing_list_id).toBe('number');
            expect(list).toHaveProperty('name');
            expect(typeof list.name).toBe('string');
        });
    });
});
