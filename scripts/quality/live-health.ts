/**
 * npm run health:live
 *
 * The nightly smoke against Tranquility (guides/AUDIT.md, "Live health"):
 * refresh a maintained EVE SSO token, call one public route and one
 * authenticated route through the real client, and say which of the three
 * steps failed. `nightly-live-health.yml` runs it every night and keeps one
 * issue open while it fails.
 *
 * Environment (repository secrets in CI):
 *   ESI_HEALTH_CLIENT_ID      the SSO application's client id
 *   ESI_HEALTH_CLIENT_SECRET  its secret; leave unset for a PKCE (public) app
 *   ESI_HEALTH_REFRESH_TOKEN  a refresh token for a character that granted
 *                             esi-location.read_online.v1
 *
 * Exit codes:
 *   0  healthy: SSO refreshed the token, ESI answered both routes and the
 *      responses validated
 *   1  a failure this repository or the token owns: SSO rejected the refresh
 *      token, the token lacks the scope, ESI rejected the request, or the
 *      response failed validation
 *   2  Tranquility or SSO unavailable (HTTP 5xx or no answer): downtime, not
 *      a defect; the workflow warns without filing an issue
 *   3  not configured: a required variable is missing
 *
 * No token is ever printed. The summary goes to stdout and, when set, to
 * $GITHUB_STEP_SUMMARY.
 */
import { appendFileSync } from 'fs';

import { EsiClient } from '../../src/EsiClient';
import { EveSsoClient } from '../../src/auth/EveSsoClient';
import { AuthError, SsoError, TokenRevokedError } from '../../src/auth/errors';
import { decodeAccessToken } from '../../src/auth/jwt';
import {
  EsiError,
  EsiFaultError,
  EsiValidationError,
} from '../../src/core/util/error';

export const REQUIRED_SCOPE = 'esi-location.read_online.v1';

export const EXIT = {
  healthy: 0,
  failed: 1,
  unavailable: 2,
  unconfigured: 3,
} as const;

type Outcome = {
  code: (typeof EXIT)[keyof typeof EXIT];
  lines: string[];
};

/**
 * Classify an error from SSO or ESI: an outage is not a failure of ours.
 *
 * Validation, parse and configuration errors carry status 0 like a network
 * error does, so they are recognised by class first: a body that fails the
 * schema is a failure the repository owns, never an outage. A raw error out
 * of the SSO step (a rejected fetch, which EveSsoClient does not wrap) is
 * transport, so SSO counts as unavailable; the same out of the ESI step is
 * the client's own defect, because the pipeline wraps its transport errors.
 */
export function classify(
  error: unknown,
  phase: 'sso' | 'esi',
): {
  code: typeof EXIT.failed | typeof EXIT.unavailable;
  reason: string;
} {
  if (error instanceof TokenRevokedError) {
    return {
      code: EXIT.failed,
      reason:
        'SSO reports the refresh token as revoked; issue a new one and update the ESI_HEALTH_REFRESH_TOKEN secret',
    };
  }
  if (error instanceof SsoError) {
    return error.statusCode >= 500
      ? { code: EXIT.unavailable, reason: `SSO answered ${error.statusCode}` }
      : { code: EXIT.failed, reason: error.message };
  }
  if (error instanceof AuthError) {
    return { code: EXIT.failed, reason: error.message };
  }
  if (error instanceof EsiValidationError || error instanceof EsiFaultError) {
    return { code: EXIT.failed, reason: error.message };
  }
  if (error instanceof EsiError) {
    return error.statusCode === 0 || error.statusCode >= 500
      ? {
          code: EXIT.unavailable,
          reason:
            error.statusCode === 0
              ? `ESI did not answer: ${error.message}`
              : `ESI answered ${error.statusCode}`,
        }
      : { code: EXIT.failed, reason: error.message };
  }
  const reason = error instanceof Error ? error.message : String(error);
  return phase === 'sso'
    ? { code: EXIT.unavailable, reason: `SSO did not answer: ${reason}` }
    : { code: EXIT.failed, reason };
}

export async function run(env: NodeJS.ProcessEnv): Promise<Outcome> {
  const clientId = env.ESI_HEALTH_CLIENT_ID ?? '';
  const clientSecret = env.ESI_HEALTH_CLIENT_SECRET;
  const refreshToken = env.ESI_HEALTH_REFRESH_TOKEN ?? '';
  const lines: string[] = [];

  if (!clientId || !refreshToken) {
    const missing = [
      !clientId && 'ESI_HEALTH_CLIENT_ID',
      !refreshToken && 'ESI_HEALTH_REFRESH_TOKEN',
    ].filter((n): n is string => typeof n === 'string');
    lines.push(
      `Not configured: ${missing.join(' and ')} not set. Add the repository secrets and re-run.`,
    );
    return { code: EXIT.unconfigured, lines };
  }

  // 1. SSO: refresh the maintained token.
  const sso = new EveSsoClient({
    clientId,
    ...(clientSecret ? { clientSecret } : {}),
  });
  let accessToken: string;
  let characterId: number;
  try {
    const token = await sso.refresh(refreshToken);
    accessToken = token.accessToken;
    const decoded = decodeAccessToken(accessToken);
    characterId = decoded.characterId;
    lines.push(
      `SSO: refreshed a token for character ${characterId} (${decoded.scopes.length} scopes, expires in ${token.expiresIn}s)`,
    );
    if (token.refreshToken !== refreshToken) {
      // EVE SSO returns the same refresh token for a refresh grant today, so
      // this is a tripwire. Writing the replacement back needs a token with
      // secrets: write, which GITHUB_TOKEN never has; the message names the
      // manual step and the value stays out of every log.
      lines.push(
        'SSO rotated the refresh token: the run used the old one; re-issue a token for this character and update the ESI_HEALTH_REFRESH_TOKEN secret',
      );
    }
    if (!decoded.scopes.includes(REQUIRED_SCOPE)) {
      lines.push(
        `Failed: the token does not carry ${REQUIRED_SCOPE}; issue one with that scope`,
      );
      return { code: EXIT.failed, lines };
    }
  } catch (error) {
    const { code, reason } = classify(error, 'sso');
    lines.push(
      `SSO refresh ${code === EXIT.failed ? 'failed' : 'unavailable'}: ${reason}`,
    );
    return { code, lines };
  }

  // 2 and 3. ESI: one public route, one authenticated route, through the real pipeline.
  const client = new EsiClient({
    accessToken,
    userAgent: 'esi.ts live-health (https://github.com/lgriffin/ESI.ts)',
  });
  try {
    const status = await client.status.getStatus();
    lines.push(
      `ESI public: /status answered, ${status.players} players online, server ${status.server_version}`,
    );
    const online = await client.location.getCharacterOnline(characterId);
    lines.push(
      `ESI authenticated: /characters/${characterId}/online answered, online=${String(online.online)}`,
    );
    return { code: EXIT.healthy, lines };
  } catch (error) {
    const { code, reason } = classify(error, 'esi');
    lines.push(
      `ESI ${code === EXIT.failed ? 'failed' : 'unavailable'}: ${reason}`,
    );
    return { code, lines };
  } finally {
    client.shutdown();
  }
}

async function main(): Promise<void> {
  const { code, lines } = await run(process.env);
  const verdict =
    code === EXIT.healthy
      ? 'healthy'
      : code === EXIT.unavailable
        ? 'unavailable'
        : code === EXIT.unconfigured
          ? 'not configured'
          : 'failed';
  const text = `Live health: ${verdict}\n${lines.map((l) => `- ${l}`).join('\n')}\n`;
  process.stdout.write(text);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Live health: ${verdict}\n\n${lines.map((l) => `- ${l}`).join('\n')}\n`,
    );
  }
  process.exitCode = code;
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = EXIT.failed;
  });
}
