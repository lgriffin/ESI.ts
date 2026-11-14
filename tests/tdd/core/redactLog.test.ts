import type { LoggerLevel } from '../../../src/core/logger/ILogger';
import {
  redactingLogger,
  redactLogContext,
  redactLogText,
} from '../../../src/core/logger/redactLog';
import { spyLogger } from '../helpers/spyLogger';
import { sanitizeUrl } from '../../../src/core/util/error';

const SECRET_URL =
  'https://esi.evetech.net/latest/characters/1/?token=s3cret&page=2';
const REDACTED_URL = sanitizeUrl(SECRET_URL)!;

describe('SEC-02: redactLogText', () => {
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

describe('SEC-02: redactLogText edge cases', () => {
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

describe('SEC-02: redactLogText outside a URL', () => {
  it.each([
    [
      'grant_type=refresh_token&refresh_token=s3cret',
      'grant_type=refresh_token&refresh_token=%5BREDACTED%5D',
    ],
    ['body: refresh_token=s3cret', 'body: refresh_token=%5BREDACTED%5D'],
    [
      'client_id=app&client_secret=s3cret&code=s3cret',
      'client_id=app&client_secret=%5BREDACTED%5D&code=%5BREDACTED%5D',
    ],
    ['a "token=s3cret" b', 'a "token=%5BREDACTED%5D" b'],
    ["a 'token=s3cret' b", "a 'token=%5BREDACTED%5D' b"],
    ['a `token=s3cret` b', 'a `token=%5BREDACTED%5D` b'],
    ['(token=s3cret)', '(token=%5BREDACTED%5D)'],
    ['[token=s3cret]', '[token=%5BREDACTED%5D]'],
    ['{token=s3cret}', '{token=%5BREDACTED%5D}'],
    ['x,token=s3cret', 'x,token=%5BREDACTED%5D'],
    ['x;token=s3cret', 'x;token=%5BREDACTED%5D'],
    ['line	token=s3cret', 'line	token=%5BREDACTED%5D'],
    ['tok%65n=s3cret', 'tok%65n=%5BREDACTED%5D'],
  ])('redacts the form field in %s', (text, expected) => {
    expect(redactLogText(text)).toBe(expected);
  });

  it('does not let a field that is not sensitive swallow the next one', () => {
    expect(redactLogText('next=/a/?token=s3cret')).toBe(
      'next=/a/?token=%5BREDACTED%5D',
    );
    expect(redactLogText('state=x"token=s3cret')).toBe(
      'state=x"token=%5BREDACTED%5D',
    );
  });

  it('redacts each sensitive string member of a JSON body', () => {
    const body =
      '{"access_token":"eyJ.a.b","expires_in":1199,"token_type":"Bearer","refresh_token":"r-9f2c"}';
    expect(redactLogText(`token response ${body}`)).toBe(
      'token response {"access_token":"[REDACTED]","expires_in":1199,"token_type":"Bearer","refresh_token":"[REDACTED]"}',
    );
  });

  it('keeps the spacing of a JSON member and an escaped quote inside its value', () => {
    expect(redactLogText('{ "token" : "a\\"b", "page": "2" }')).toBe(
      '{ "token" : "[REDACTED]", "page": "2" }',
    );
  });

  it('leaves an empty JSON member and a member that is not sensitive alone', () => {
    const text = '{"token":"","token_type":"Bearer","note":"token=s3cret"}';
    expect(redactLogText(text)).toBe(
      '{"token":"","token_type":"Bearer","note":"token=%5BREDACTED%5D"}',
    );
  });

  // A boundary the name scan does not stop at makes the prefilter rescan to
  // the end of the line from every comma or quote: quadratic, so a 1 MB
  // compact JSON body took minutes. Linear, each takes milliseconds; the
  // bound leaves room for a slow machine and still fails a quadratic scan.
  it.each([
    [
      'compact JSON',
      JSON.stringify(
        Array.from({ length: 50_000 }, (_, i) => ({ a: i, b: 'x' })),
      ),
    ],
    ['brackets', '('.repeat(1_000_000)],
    ['commas before a percent sign', `${','.repeat(1_000_000)}%`],
    ['quotes', '"'.repeat(1_000_000)],
  ])('redacts a megabyte of %s in linear time', (_kind, body) => {
    const text = `${body} refresh_token=s3cret`;
    const started = performance.now();
    const out = redactLogText(text);
    expect(performance.now() - started).toBeLessThan(1_000);
    expect(out.endsWith('refresh_token=%5BREDACTED%5D')).toBe(true);
  });

  it.each([
    'token: abc',
    'auth failed for character 1',
    'status code 500',
    'tokens=3',
    'mytoken=abc',
    '99% done',
    'code=',
  ])('leaves prose with no credential exactly as it was: %s', (text) => {
    expect(redactLogText(text)).toBe(text);
  });
});

describe('SEC-02: redactLogContext', () => {
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

  it('redacts a form body or JSON body held in a context field', () => {
    expect(
      redactLogContext({
        body: 'grant_type=refresh_token&refresh_token=r',
        reply: '{"access_token":"a"}',
      }),
    ).toEqual({
      body: 'grant_type=refresh_token&refresh_token=%5BREDACTED%5D',
      reply: '{"access_token":"[REDACTED]"}',
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

describe('SEC-02: redactingLogger', () => {
  const gated = (enabled: readonly LoggerLevel[]) => {
    const inner = spyLogger();
    inner.isLevelEnabled = (level) => enabled.includes(level);
    return inner;
  };

  it('redacts the message and the context it forwards', () => {
    const inner = spyLogger();
    redactingLogger(inner).warn(`GET ${SECRET_URL} failed`, {
      url: SECRET_URL,
      status: 401,
    });
    expect(inner.warn.mock.calls).toEqual([
      [`GET ${REDACTED_URL} failed`, { url: REDACTED_URL, status: 401 }],
    ]);
  });

  it('forwards a context that needed no redaction', () => {
    const inner = spyLogger();
    redactingLogger(inner).error('Refresh failed', { characterId: 1 });
    expect(inner.error.mock.calls).toEqual([
      ['Refresh failed', { characterId: 1 }],
    ]);
  });

  it('passes the message alone for a missing or empty context', () => {
    const inner = spyLogger();
    const logger = redactingLogger(inner);
    logger.info('a');
    logger.info('b', {});
    expect(inner.info.mock.calls).toEqual([['a'], ['b']]);
  });

  it('drops a line at a level the logger reports disabled', () => {
    const inner = gated(['warn']);
    const logger = redactingLogger(inner);
    logger.debug('dropped');
    logger.warn('kept');
    expect(inner.debug).not.toHaveBeenCalled();
    expect(inner.warn.mock.calls).toEqual([['kept']]);
  });

  it('routes each level to the same level of the logger it wraps', () => {
    const inner = spyLogger();
    const logger = redactingLogger(inner);
    const levels: LoggerLevel[] = [
      'fatal',
      'error',
      'warn',
      'info',
      'debug',
      'trace',
    ];
    for (const level of levels) logger[level](level);
    for (const level of levels)
      expect(inner[level].mock.calls).toEqual([[level]]);
  });
});
