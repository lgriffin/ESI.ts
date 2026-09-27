import {
  redactLogContext,
  redactLogText,
} from '../../../src/core/logger/redactLog';
import { sanitizeUrl } from '../../../src/core/util/error';

const SECRET_URL =
  'https://esi.evetech.net/latest/characters/1/?token=s3cret&page=2';
const REDACTED_URL = sanitizeUrl(SECRET_URL)!;

describe('redactLogText', () => {
  it('redacts a sensitive query parameter of an absolute URL through sanitizeUrl', () => {
    expect(REDACTED_URL).not.toContain('s3cret');
    expect(redactLogText(`GET ${SECRET_URL} failed`)).toBe(
      `GET ${REDACTED_URL} failed`,
    );
  });

  it('redacts a relative path and keeps it relative', () => {
    expect(
      redactLogText('Fetching /characters/1/?access_token=abc&page=2'),
    ).toBe('Fetching /characters/1/?access_token=%5BREDACTED%5D&page=2');
  });

  it('keeps quotes and brackets around the URL', () => {
    expect(redactLogText(`url='${SECRET_URL}' (${SECRET_URL})`)).toBe(
      `url='${REDACTED_URL}' (${REDACTED_URL})`,
    );
  });

  it('keeps a key= prefix in front of a relative path', () => {
    expect(redactLogText('endpoint=/characters/1/?token=t')).toBe(
      'endpoint=/characters/1/?token=%5BREDACTED%5D',
    );
  });

  it('keeps every URL in the text redacted, not only the first', () => {
    const out = redactLogText(`${SECRET_URL} then ${SECRET_URL}`);
    expect(out).toBe(`${REDACTED_URL} then ${REDACTED_URL}`);
  });

  it.each([
    'Fetching /markets/10000002/orders/?page=2',
    'https://esi.evetech.net/latest/status/?datasource=tranquility',
    'Is the cache warm? yes',
    'no query at all',
    '',
  ])(
    'leaves text with no sensitive parameter exactly as it was: %s',
    (text) => {
      expect(redactLogText(text)).toBe(text);
    },
  );
});

describe('redactLogText edge cases', () => {
  it.each([
    [
      'https://a.example/?page=1,https://b.example/?token=s3cret',
      'https://a.example/?page=1,https://b.example/?token=%5BREDACTED%5D',
    ],
    [
      '/a/?page=1;/b/?refresh_token=s3cret',
      '/a/?page=1;/b/?refresh_token=%5BREDACTED%5D',
    ],
    [
      '//cdn.example/x/?api_key=s3cret&v=2',
      '//cdn.example/x/?api_key=%5BREDACTED%5D&v=2',
    ],
    ['http://[bad/?token=s3cret', 'http://[bad/?token=%5BREDACTED%5D'],
    ['/x/?tok%65n=s3cret', '/x/?tok%65n=%5BREDACTED%5D'],
  ])('redacts %s', (text, expected) => {
    expect(redactLogText(text)).toBe(expected);
    expect(redactLogText(text)).not.toContain('s3cret');
  });

  it('leaves a sensitive name with an empty value alone', () => {
    expect(redactLogText('/x/?token=&page=1')).toBe('/x/?token=&page=1');
  });
});

describe('redactLogContext', () => {
  it('redacts every top-level string value that carries a URL', () => {
    expect(
      redactLogContext({
        url: SECRET_URL,
        endpoint: '/characters/1/?refresh_token=r',
        status: 200,
      }),
    ).toEqual({
      url: REDACTED_URL,
      endpoint: '/characters/1/?refresh_token=%5BREDACTED%5D',
      status: 200,
    });
  });

  it('returns the same object when nothing needed redacting', () => {
    const context = { endpoint: 'status', status: 200 };
    expect(redactLogContext(context)).toBe(context);
  });

  it('never hands a logger an empty context', () => {
    expect(redactLogContext({})).toBeUndefined();
    expect(redactLogContext(undefined)).toBeUndefined();
  });
});
