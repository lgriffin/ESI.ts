/**
 * What ESI's mail endpoints send back in 0022-mail.feature, and where.
 * Step files queue these; they do not build payloads or URLs themselves.
 */
import { lastRequest } from './transport';

export const MAIL_CHARACTER_ID = 1689391488;
export const EMPTY_INBOX_CHARACTER_ID = 111111111;
export const MAIL_ID = 331477591;
export const SENT_MAIL_ID = 331477592;
export const UNKNOWN_MAIL_ID = 999999;
export const CUSTOM_LABEL_ID = 128;

export const mailPaths = {
  headers: (characterId: number) => `/characters/${characterId}/mail/`,
  mail: (characterId: number, mailId: number) =>
    `/characters/${characterId}/mail/${mailId}/`,
  labels: (characterId: number) => `/characters/${characterId}/mail/labels/`,
  label: (characterId: number, labelId: number) =>
    `/characters/${characterId}/mail/labels/${labelId}/`,
  lists: (characterId: number) => `/characters/${characterId}/mail/lists/`,
};

/** Matches the headers listing, not /mail/labels/, /mail/lists/ or /mail/{id}/. */
export const mailHeadersMatch = (characterId: number) =>
  new RegExp(`/characters/${characterId}/mail/(\\?|$)`);

/** The JSON body of the last request, parsed; undefined when it had none. */
export const lastRequestBody = () => {
  const body = lastRequest().body;
  return body === undefined ? undefined : JSON.parse(body);
};

const toCharacter = (characterId: number) => ({
  recipient_id: characterId,
  recipient_type: 'character',
});

export const mailFixtures = {
  inboxHeaders: () => [
    {
      mail_id: 1,
      from: 123456789,
      subject: 'Fleet Operation Tonight',
      timestamp: '2024-01-15T18:00:00Z',
      is_read: false,
      labels: [1],
      recipients: [toCharacter(MAIL_CHARACTER_ID)],
    },
    {
      mail_id: 2,
      from: 987654321,
      subject: 'Contract Completed',
      timestamp: '2024-01-15T12:00:00Z',
      is_read: true,
      labels: [1],
      recipients: [toCharacter(MAIL_CHARACTER_ID)],
    },
    {
      mail_id: 3,
      from: 111111111,
      subject: 'Welcome to the Corporation',
      timestamp: '2024-01-14T09:00:00Z',
      is_read: true,
      labels: [1, 3],
      recipients: [toCharacter(MAIL_CHARACTER_ID)],
    },
  ],

  message: () => ({
    subject: 'Fleet Operation Tonight',
    from: 123456789,
    timestamp: '2024-01-15T18:00:00Z',
    read: true,
    labels: [3],
    body: '<font size="12">Form up in Jita at 19:00.</font>',
    recipients: [
      toCharacter(MAIL_CHARACTER_ID),
      { recipient_id: 99005338, recipient_type: 'alliance' },
    ],
  }),

  labels: () => ({
    labels: [
      { label_id: 1, name: '[Inbox]', color: '#ffffff', unread_count: 3 },
      { label_id: 2, name: '[Sent]', color: '#ffffff', unread_count: 0 },
      { label_id: 4, name: '[Corp]', color: '#ffffff', unread_count: 1 },
      { label_id: 8, name: '[Alliance]', color: '#ffffff', unread_count: 2 },
    ],
    total_unread_count: 5,
  }),

  mailingLists: () => [
    { mailing_list_id: 145156367, name: 'Alliance Announcements' },
    { mailing_list_id: 145156368, name: 'Corp Intel' },
    { mailing_list_id: 145156369, name: 'Market Traders' },
  ],

  newLabel: () => ({ name: 'Important', color: '#ff6600' }),

  outgoingMail: () => ({
    approved_cost: 0,
    recipients: [toCharacter(123456789)],
    subject: 'Fleet Invitation',
    body: 'You are invited to the fleet operation at 20:00 EVE.',
  }),

  readMetadata: () => ({ read: true, labels: [1, 4] }),

  singleHeader: () => [
    {
      mail_id: 1,
      from: 123456789,
      subject: 'Test Mail',
      timestamp: '2024-01-15T18:00:00Z',
      is_read: false,
      recipients: [toCharacter(MAIL_CHARACTER_ID)],
    },
  ],

  singleLabel: () => ({
    total_unread_count: 1,
    labels: [{ label_id: 1, name: '[Inbox]', unread_count: 1 }],
  }),

  singleMailingList: () => [
    { mailing_list_id: 145156367, name: 'Alliance Announcements' },
  ],
};
