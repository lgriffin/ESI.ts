/**
 * The Tranquility smoke (scripts/quality/live-health.ts) decides between four
 * exit codes, and nightly-live-health.yml files or withholds an issue on that
 * decision. These cases pin the boundary that matters: a body that fails the
 * schema is a failure the repository owns (an issue), an outage is not, and
 * a raw transport error is an outage only on the SSO side, where the client
 * does not wrap it.
 */
import fetchMock from 'jest-fetch-mock';

import {
  AuthError,
  SsoError,
  TokenDecodeError,
  TokenRevokedError,
} from '../../../src/auth/errors';
import {
  EsiError,
  EsiNetworkError,
  EsiParseError,
  EsiValidationError,
} from '../../../src/core/util/error';
import {
  classify,
  EXIT,
  REQUIRED_SCOPE,
  run,
} from '../../../scripts/quality/live-health';

const CHARACTER_ID = 2114794365;
const b64 = (v: unknown): string =>
  Buffer.from(JSON.stringify(v)).toString('base64url');
const jwt = (scopes: string[]): string =>
  `${b64({ alg: 'none' })}.${b64({
    sub: `CHARACTER:EVE:${CHARACTER_ID}`,
    name: 'Smoke Pilot',
    scp: scopes,
    exp: Math.floor(Date.now() / 1000) + 1200,
  })}.sig`;

const env = {
  ESI_HEALTH_CLIENT_ID: 'client-id',
  ESI_HEALTH_REFRESH_TOKEN: 'refresh-1',
};

const ssoJson = (accessToken: string, refreshToken = 'refresh-1'): string =>
  JSON.stringify({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 1199,
    token_type: 'Bearer',
  });

const status = JSON.stringify({
  players: 25_000,
  server_version: '2.0.0',
  start_time: '2026-09-28T11:05:00Z',
  vip: false,
});

describe('classify', () => {
  it('treats a response that failed validation as a failure, not an outage', () => {
    const error = new EsiValidationError('https://esi.evetech.net/status', {});
    expect(error.statusCode).toBe(0);
    expect(classify(error, 'esi').code).toBe(EXIT.failed);
  });

  it('treats a parse fault the same way', () => {
    const error = new EsiParseError('not json', 'https://esi.evetech.net/x');
    expect(classify(error, 'esi').code).toBe(EXIT.failed);
  });

  it('treats a network error and a 5xx from ESI as unavailable', () => {
    expect(classify(new EsiNetworkError('reset'), 'esi').code).toBe(
      EXIT.unavailable,
    );
    expect(classify(new EsiError(503, 'down'), 'esi').code).toBe(
      EXIT.unavailable,
    );
  });

  it('treats a 4xx from ESI as a failure', () => {
    expect(classify(new EsiError(403, 'forbidden'), 'esi').code).toBe(
      EXIT.failed,
    );
  });

  it('separates an SSO outage from an SSO rejection', () => {
    expect(classify(new SsoError(502, 'bad_gateway'), 'sso').code).toBe(
      EXIT.unavailable,
    );
    expect(classify(new SsoError(400, 'invalid_grant'), 'sso').code).toBe(
      EXIT.failed,
    );
    expect(classify(new TokenRevokedError('revoked', 1), 'sso').code).toBe(
      EXIT.failed,
    );
    expect(classify(new TokenDecodeError('no sub'), 'sso').code).toBe(
      EXIT.failed,
    );
    expect(classify(new AuthError('other'), 'sso').code).toBe(EXIT.failed);
  });

  it('reads a raw error as transport on the SSO side and as a defect on the ESI side', () => {
    const raw = new TypeError('fetch failed');
    expect(classify(raw, 'sso')).toEqual({
      code: EXIT.unavailable,
      reason: 'SSO did not answer: fetch failed',
    });
    expect(classify(raw, 'esi')).toEqual({
      code: EXIT.failed,
      reason: 'fetch failed',
    });
  });
});

describe('run', () => {
  it('reports not configured, naming the missing variables, without calling anything', async () => {
    const outcome = await run({});
    expect(outcome.code).toBe(EXIT.unconfigured);
    expect(outcome.lines[0]).toContain('ESI_HEALTH_CLIENT_ID');
    expect(outcome.lines[0]).toContain('ESI_HEALTH_REFRESH_TOKEN');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('is healthy when SSO refreshes and both routes validate', async () => {
    fetchMock.mockResponse(async (req) => {
      if (req.url.startsWith('https://login.eveonline.com/')) {
        return { body: ssoJson(jwt([REQUIRED_SCOPE])) };
      }
      if (req.url.includes('/status')) return { body: status };
      if (req.url.includes(`/characters/${CHARACTER_ID}/online`)) {
        return { body: JSON.stringify({ online: true }) };
      }
      return { status: 404, body: '{}' };
    });
    const outcome = await run(env);
    expect(outcome.code).toBe(EXIT.healthy);
    expect(outcome.lines).toHaveLength(3);
    expect(outcome.lines[2]).toContain('online=true');
  });

  it('fails, and says why, when the authenticated route answers a body the schema rejects', async () => {
    fetchMock.mockResponse(async (req) => {
      if (req.url.startsWith('https://login.eveonline.com/')) {
        return { body: ssoJson(jwt([REQUIRED_SCOPE])) };
      }
      if (req.url.includes('/status')) return { body: status };
      return { body: JSON.stringify({ online: 'yes' }) };
    });
    const outcome = await run(env);
    expect(outcome.code).toBe(EXIT.failed);
    expect(outcome.lines.at(-1)).toMatch(
      /^ESI failed: Response validation failed/,
    );
  });

  it('fails when the token lacks the scope the route needs', async () => {
    fetchMock.mockResponseOnce(
      ssoJson(jwt(['esi-wallet.read_character_wallet.v1'])),
    );
    const outcome = await run(env);
    expect(outcome.code).toBe(EXIT.failed);
    expect(outcome.lines.at(-1)).toContain(REQUIRED_SCOPE);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('is unavailable, not failed, when SSO answers 5xx or does not answer', async () => {
    fetchMock.mockResponseOnce('<html>maintenance</html>', { status: 503 });
    expect((await run(env)).code).toBe(EXIT.unavailable);

    fetchMock.mockRejectOnce(new TypeError('fetch failed'));
    const outcome = await run(env);
    expect(outcome.code).toBe(EXIT.unavailable);
    expect(outcome.lines[0]).toBe(
      'SSO refresh unavailable: SSO did not answer: fetch failed',
    );
  });

  it('fails when SSO rejects the refresh token, pointing at the secret', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'invalid_grant', error_description: 'revoked' }),
      { status: 400 },
    );
    const outcome = await run(env);
    expect(outcome.code).toBe(EXIT.failed);
    expect(outcome.lines[0]).toContain('ESI_HEALTH_REFRESH_TOKEN');
  });

  it('warns when SSO rotates the refresh token, without printing either token', async () => {
    fetchMock.mockResponse(async (req) => {
      if (req.url.startsWith('https://login.eveonline.com/')) {
        return { body: ssoJson(jwt([REQUIRED_SCOPE]), 'refresh-2') };
      }
      if (req.url.includes('/status')) return { body: status };
      return { body: JSON.stringify({ online: false }) };
    });
    const outcome = await run(env);
    expect(outcome.code).toBe(EXIT.healthy);
    expect(outcome.lines[1]).toContain('rotated the refresh token');
    const text = outcome.lines.join('\n');
    expect(text).not.toContain('refresh-1');
    expect(text).not.toContain('refresh-2');
    expect(text).not.toContain(jwt([REQUIRED_SCOPE]).slice(0, 20));
  });
});
