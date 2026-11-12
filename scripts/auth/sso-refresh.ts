/**
 * Access tokens from a refresh token, for runs that cannot open a browser:
 * the authenticated nightly (`nightly-examples.yml`) and anything else that
 * holds ESI_SSO_CLIENT_ID and ESI_REFRESH_TOKEN as secrets.
 *
 * As a script (`npm run token:ci`) it mints one access token and, under
 * GitHub Actions, masks it and appends ESI_ACCESS_TOKEN to $GITHUB_ENV so
 * later steps of the job see it. The token is never printed.
 *
 * `TokenSource` is what the examples runner uses: it refreshes again when the
 * token has less than `REFRESH_MARGIN_MS` left, because an access token lives
 * 20 minutes and a run can last longer.
 */
import * as fs from 'node:fs';

const EVE_SSO_TOKEN_URL = 'https://login.eveonline.com/v2/oauth/token';

/** Refresh when a token has less than this long left. */
export const REFRESH_MARGIN_MS = 5 * 60_000;

export interface MintedToken {
  accessToken: string;
  /** Epoch milliseconds, from the token's `exp` claim. */
  expiresAt: number;
  /** Whether SSO returned a different refresh token than the one sent. */
  rotated: boolean;
}

/** The `exp` claim of a JWT access token, in epoch milliseconds. */
export function expiryOf(accessToken: string): number {
  const payload = accessToken.split('.')[1];
  if (!payload) throw new Error('The access token is not a JWT');
  const claims = JSON.parse(
    Buffer.from(payload, 'base64url').toString('utf-8'),
  ) as { exp?: unknown };
  if (typeof claims.exp !== 'number') {
    throw new Error('The access token carries no exp claim');
  }
  return claims.exp * 1000;
}

/** Whether `token` still has more than `REFRESH_MARGIN_MS` before it expires. */
export function stillFresh(expiresAt: number, now: number): boolean {
  return expiresAt - now > REFRESH_MARGIN_MS;
}

/** Exchanges a refresh token for an access token at EVE SSO (a public PKCE client: no secret). */
export async function refreshAccessToken(
  clientId: string,
  refreshToken: string,
): Promise<MintedToken> {
  const response = await fetch(EVE_SSO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !body.access_token) {
    // The description is SSO's; it never contains the refresh token.
    throw new Error(
      `Token refresh failed (HTTP ${response.status}): ${body.error ?? 'no access_token'}` +
        (body.error_description ? ` — ${body.error_description}` : ''),
    );
  }
  return {
    accessToken: body.access_token,
    expiresAt: expiryOf(body.access_token),
    rotated:
      body.refresh_token !== undefined && body.refresh_token !== refreshToken,
  };
}

/** Under GitHub Actions, hides `value` in every later log line of the job. */
export function maskInActions(value: string): void {
  if (process.env.GITHUB_ACTIONS === 'true')
    console.log(`::add-mask::${value}`);
}

/**
 * Hands out a usable access token: minted from ESI_SSO_CLIENT_ID and
 * ESI_REFRESH_TOKEN and refreshed near expiry, or a fixed ESI_ACCESS_TOKEN
 * when no refresh token is set (a local run with a token from `.env`).
 */
export class TokenSource {
  private current: { accessToken: string; expiresAt: number } | null = null;

  private constructor(
    private readonly refresh: { clientId: string; refreshToken: string } | null,
    fixed: string | null,
  ) {
    if (fixed)
      this.current = { accessToken: fixed, expiresAt: expiryOf(fixed) };
  }

  /** From the environment; throws when it holds neither a refresh token nor an access token. */
  static fromEnv(env: NodeJS.ProcessEnv = process.env): TokenSource {
    const clientId = env.ESI_SSO_CLIENT_ID;
    const refreshToken = env.ESI_REFRESH_TOKEN;
    if (clientId && refreshToken) {
      return new TokenSource({ clientId, refreshToken }, null);
    }
    if (env.ESI_ACCESS_TOKEN)
      return new TokenSource(null, env.ESI_ACCESS_TOKEN);
    throw new Error(
      'An authenticated run needs ESI_SSO_CLIENT_ID and ESI_REFRESH_TOKEN (or ESI_ACCESS_TOKEN)',
    );
  }

  async get(now: number = Date.now()): Promise<string> {
    if (this.current && stillFresh(this.current.expiresAt, now)) {
      return this.current.accessToken;
    }
    if (!this.refresh) {
      if (this.current && this.current.expiresAt > now) {
        return this.current.accessToken;
      }
      throw new Error(
        'ESI_ACCESS_TOKEN has expired; set ESI_REFRESH_TOKEN and ESI_SSO_CLIENT_ID, or run npm run token:refresh',
      );
    }
    const minted = await refreshAccessToken(
      this.refresh.clientId,
      this.refresh.refreshToken,
    );
    maskInActions(minted.accessToken);
    if (minted.rotated) {
      console.log(
        '::warning title=EVE SSO::SSO returned a new refresh token; the stored ESI_REFRESH_TOKEN may stop working. Re-run npm run token:create and update the secret.',
      );
    }
    this.current = minted;
    return minted.accessToken;
  }
}

async function main(): Promise<void> {
  const source = TokenSource.fromEnv();
  const token = await source.get();
  const githubEnv = process.env.GITHUB_ENV;
  if (githubEnv) {
    fs.appendFileSync(githubEnv, `ESI_ACCESS_TOKEN=${token}\n`);
  }
  console.log(
    `Access token minted; expires ${new Date(expiryOf(token)).toISOString()}` +
      (githubEnv ? ' (exported to later steps as ESI_ACCESS_TOKEN)' : ''),
  );
}

if (require.main === module) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
