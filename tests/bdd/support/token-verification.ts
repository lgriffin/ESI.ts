/**
 * What 0067-token-verification.feature configures and reads: EVE SSO's key
 * set served by a recording fetch, a clock the scenario moves, and access
 * tokens signed by SSO's current key with one part changed.
 */
import { sign } from 'crypto';
import { SsoJwks, verifyAccessToken } from '../../../src/auth/jwks';
import { decodeAccessToken } from '../../../src/auth/jwt';
import type { FetchLike } from '../../../src/core/ApiClient';
import {
  makeSignedJwt,
  signingKey,
} from '../step-definitions/shared/sso-helpers';
import type { World } from './world';

export const VERIFY_CLIENT_ID = 'test-client-id';

/** The key id SSO's current signing key carries. */
export const CURRENT_KID = 'JWT-Signature-Key';

/** One request the key set fetch received. */
export interface KeySetRequest {
  url: string;
  init: RequestInit | undefined;
}

/** How the key set endpoint answers: a status and a body, or a network failure. */
export type KeySetAnswer =
  { status: number; body: string } | { networkError: string };

/** SSO's current public key as a JWK, the way SSO publishes it. */
export function currentJwk(): Record<string, unknown> {
  return {
    ...signingKey().publicKey.export({ format: 'jwk' }),
    alg: 'RS256',
    kid: CURRENT_KID,
    use: 'sig',
  };
}

/** A key set document holding `keys`. */
export function keySetBody(keys: unknown[]): string {
  return JSON.stringify({ keys, SkipUnresolvedJsonWebKeys: true });
}

export interface VerificationState {
  /** Epoch milliseconds the scenario's clock reads. */
  clock: number;
  answer: KeySetAnswer;
  requests: KeySetRequest[];
  fetch: FetchLike;
  now: () => number;
}

/**
 * Sets up the scenario's key set endpoint (answering with SSO's current key
 * until a step changes `answer`) and its clock, started at the real time so
 * tokens signed now are valid.
 */
export function verificationState(world: World): VerificationState {
  const existing = world.values.verification as VerificationState | undefined;
  if (existing) return existing;
  const state: VerificationState = {
    clock: Date.now(),
    answer: { status: 200, body: keySetBody([currentJwk()]) },
    requests: [],
    fetch: (async (input: unknown, init?: RequestInit) => {
      state.requests.push({ url: String(input), init });
      const answer = state.answer;
      if ('networkError' in answer) throw new Error(answer.networkError);
      return new Response(answer.body, {
        status: answer.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as FetchLike,
    now: () => state.clock,
  };
  world.values.verification = state;
  return state;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

/** Decodes one JWT segment as JSON. */
function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}

/**
 * A token signed by SSO's current key for the default character, issued at
 * `nowMs`, with `edit` applied to its header and claims before signing.
 */
export function signedToken(
  nowMs: number,
  edit: {
    header?: (header: Record<string, unknown>) => Record<string, unknown>;
    claims?: (claims: Record<string, unknown>) => Record<string, unknown>;
  } = {},
): string {
  const [headerSegment, payloadSegment] = makeSignedJwt().split('.');
  const nowSeconds = Math.floor(nowMs / 1000);
  const claims = {
    ...decodeSegment(payloadSegment!),
    iat: nowSeconds,
    exp: nowSeconds + 1199,
  };
  const header = (edit.header ?? ((h) => h))(decodeSegment(headerSegment!));
  const input = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify((edit.claims ?? ((c) => c))(claims)),
  )}`;
  const signature = sign(
    'RSA-SHA256',
    Buffer.from(input),
    signingKey().privateKey,
  );
  return `${input}.${base64url(signature)}`;
}

/** Parses a value written as JSON in a feature file. */
export function jsonValue(text: string): unknown {
  return JSON.parse(text);
}

/** Runs verifyAccessToken with the scenario's fetch and clock, recording the outcome. */
export async function verifyWith(
  world: World,
  token: string,
  options: { clockToleranceSeconds?: number } = {},
): Promise<void> {
  const state = verificationState(world);
  try {
    world.result = await verifyAccessToken(token, {
      clientId: VERIFY_CLIENT_ID,
      fetch: state.fetch,
      now: state.now,
      ...options,
    });
  } catch (err: unknown) {
    world.error = err;
  }
}

/** Asks the scenario's key set cache for `kid`, recording the outcome of this call alone. */
export async function askForKey(world: World, kid: string): Promise<void> {
  world.result = undefined;
  world.error = undefined;
  try {
    world.result = await (world.values.jwks as SsoJwks).getKey(kid);
  } catch (err: unknown) {
    world.error = err;
  }
}

/** An unsigned token carrying `claims`, for decodeAccessToken, which reads without verifying. */
export function unsignedToken(claims: Record<string, unknown>): string {
  const header = Buffer.from('{"alg":"RS256","typ":"JWT"}').toString(
    'base64url',
  );
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${header}.${payload}.signature`;
}

/** Runs decodeAccessToken on `token`, recording the outcome. */
export function decodeWith(world: World, token: string): void {
  try {
    world.result = decodeAccessToken(token);
  } catch (err: unknown) {
    world.error = err;
  }
}
