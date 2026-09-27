/**
 * Cache-key derivation: properties of `buildEndpointPath` + `buildCacheKey`,
 * the two functions that turn a client call into the key the ETag cache and
 * the spec-aware TTL lookup use.
 *
 *   Deterministic   the same call gives the same key, and equivalent argument
 *                   encodings (the number 34 and the string "34") give the
 *                   same key.
 *   Injective       calls whose query values differ give different keys, for
 *                   any values, including ones containing `&`, `=`, `+`, `%`
 *                   and spaces. `+`, `%20` and a space are different values
 *                   to ESI, so they must not share a key.
 *   Canonical order query parameters appear in the endpoint definition's
 *                   order whichever optional parameters are present, so a
 *                   call cannot produce two spellings of one request.
 *   Identity        for an authenticated endpoint, tokens for different
 *                   identities never share a key, and no authenticated key
 *                   equals the unauthenticated key of the same URL. For a
 *                   public endpoint the token does not change the key. An
 *                   identity is the character an EVE SSO token names, so two
 *                   tokens for one character share a key and tokens for two
 *                   characters never do; a token naming no character is its
 *                   own identity. This holds for the deduplication key as well
 *                   as the cache key: both outlive a single request, so both
 *                   have to say whose data they stand for (esi-23g.36).
 *
 * Method and body are not part of the key by design: only GET responses are
 * cached (cacheResponse, trySpecAwareCacheHit), so a POST or a request with a
 * body is never answered from the cache. etag-cache-model.property.test.ts
 * checks that through the pipeline.
 */
import { createHash } from 'crypto';
import * as fc from 'fast-check';

import { ApiClient } from '../../src/core/ApiClient';
import { buildCacheKey, buildDedupeKey } from '../../src/core/cache/cacheKey';
import { buildEndpointPath } from '../../src/core/endpoints/buildEndpointPath';
import type { EndpointDefinition } from '../../src/core/endpoints/EndpointDefinition';
import { describeProperty, invariant } from './support/property';

interface KeyDerivation {
  buildEndpointPath: typeof buildEndpointPath;
  buildCacheKey: typeof buildCacheKey;
  buildDedupeKey: typeof buildDedupeKey;
}

/** Either key function: both take (subject, client, requiresAuth). */
type KeyFn = (
  subject: string,
  client: ApiClient,
  requiresAuth?: boolean,
) => string;

const BASE = 'https://esi.evetech.net';

const DEFINITION: EndpointDefinition = {
  path: 'markets/{regionId}/history/',
  method: 'GET',
  requiresAuth: false,
  pathParams: ['regionId'],
  queryParams: { typeId: 'type_id', orderType: 'order_type', page: 'page' },
};
const QUERY_KEYS = ['type_id', 'order_type', 'page'];

type Value = number | string | undefined;

/** Values built from URL-significant fragments, so collisions are reachable. */
const fragmentValue = fc
  .array(
    fc.constantFrom(
      '1',
      '34',
      'a',
      '&',
      '=',
      '+',
      ' ',
      '%',
      '%20',
      '20',
      'type_id',
      'order_type',
      '?',
      '#',
      '/',
    ),
    {
      minLength: 1,
      maxLength: 5,
    },
  )
  .map((parts) => parts.join(''));

const valueArb: fc.Arbitrary<Value> = fc.oneof(
  fc.constant(undefined),
  fc.integer({ min: 0, max: 100 }),
  fragmentValue,
  fc.string({ maxLength: 12 }),
);

const argsArb = fc.tuple(
  fc.integer({ min: 10000001, max: 10000003 }),
  valueArb,
  valueArb,
  valueArb,
);

/** Spellings a value is easily confused with. */
function lookalikes(v: Value): Value[] {
  if (v === undefined) return ['', 0, ' '];
  if (typeof v === 'number') return [String(v), v + 1, ` ${v}`];
  return [
    ` ${v}`,
    `${v} `,
    v.split(' ').join('+'),
    v.split('+').join(' '),
    v.split(' ').join('%20'),
    v.split('%20').join(' '),
    encodeURIComponent(v),
    '',
  ];
}

/** A second call: unrelated, or the first with one value respelled. */
const pairArb = argsArb.chain((a) =>
  fc.tuple(
    fc.constant(a),
    fc.oneof(
      argsArb,
      fc.tuple(fc.integer({ min: 1, max: 3 }), fc.nat()).map(([i, pick]) => {
        const options = lookalikes(a[i] as Value);
        const b = [...a] as typeof a;
        (b as Value[])[i] = options[pick % options.length];
        return b;
      }),
    ),
  ),
);

function keyFor(
  d: KeyDerivation,
  client: ApiClient,
  args: unknown[],
  requiresAuth = false,
): string {
  const { path } = d.buildEndpointPath(DEFINITION, args);
  return d.buildCacheKey(`${BASE}/${path}`, client, requiresAuth);
}

/** What ESI receives: undefined means absent, anything else its string form. */
function canonical(args: readonly unknown[]): string {
  return JSON.stringify(args.map((v) => (v === undefined ? null : String(v))));
}

function keyProperty(d: KeyDerivation) {
  const publicClient = new ApiClient('fuzz', BASE);
  return fc.property(pairArb, ([a, b]) => {
    const keyA = keyFor(d, publicClient, a);
    const keyB = keyFor(d, publicClient, b);

    invariant(
      keyFor(d, publicClient, a) === keyA,
      `key for ${canonical(a)} changed between two derivations`,
    );
    const stringified = a.map((v) => (typeof v === 'number' ? String(v) : v));
    invariant(
      keyFor(d, publicClient, stringified) === keyA,
      `numbers and their string form give different keys: ${keyA} vs ${keyFor(d, publicClient, stringified)}`,
    );

    const sameRequest = canonical(a) === canonical(b);
    invariant(
      sameRequest === (keyA === keyB),
      sameRequest
        ? `the same request ${canonical(a)} gave two keys: ${keyA} / ${keyB}`
        : `different requests ${canonical(a)} and ${canonical(b)} share the key ${keyA}`,
    );

    const query = new URL(keyA).search.slice(1);
    const names =
      query === '' ? [] : query.split('&').map((pair) => pair.split('=')[0]!);
    const expectedNames = QUERY_KEYS.filter((_, i) => a[i + 1] !== undefined);
    invariant(
      names.join(',') === expectedNames.join(','),
      `query parameters appear as [${names.join(', ')}], expected definition order [${expectedNames.join(', ')}] in ${keyA}`,
    );
  });
}

/** An unsigned JWT with the claim EVE SSO uses to name a character. */
function ssoToken(characterId: number, jti: string): string {
  const b64 = (v: string) => Buffer.from(v).toString('base64url');
  return [
    b64('{"alg":"RS256","typ":"JWT"}'),
    b64(JSON.stringify({ sub: `CHARACTER:EVE:${characterId}`, jti })),
    b64('signature'),
  ].join('.');
}

/**
 * Tokens that name no character. A random string with two dots is a
 * three-segment token whose middle segment could, in principle, decode to a
 * character claim; excluding the shape keeps the property exact rather than
 * probable.
 */
const opaqueTokenArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((token) => token.split('.').length !== 3);

/**
 * Tokens for different identities never share a key, and an authenticated
 * key is never the public one. Shared by the cache key and the deduplication
 * key, because the reason is the same for both: a path does not say whose
 * data it returns.
 */
function identityPropertyOver(pick: (d: KeyDerivation) => KeyFn) {
  return (d: KeyDerivation) =>
    fc.property(
      fc.uniqueArray(opaqueTokenArb, {
        minLength: 2,
        maxLength: 8,
      }),
      argsArb,
      (tokens, args) => {
        const keyOf = pick(d);
        const subject = `${BASE}/${d.buildEndpointPath(DEFINITION, args).path}`;
        const anonymous = new ApiClient('fuzz', BASE);
        const publicKey = keyOf(subject, anonymous, true);
        const seen = new Map<string, string>();
        for (const token of tokens) {
          const client = new ApiClient('fuzz', BASE, token);
          const authKey = keyOf(subject, client, true);
          invariant(
            authKey !== publicKey,
            `token ${JSON.stringify(token)} shares the unauthenticated key ${publicKey}`,
          );
          const clash = seen.get(authKey);
          invariant(
            clash === undefined,
            `tokens ${JSON.stringify(clash)} and ${JSON.stringify(token)} share the key ${authKey}`,
          );
          seen.set(authKey, token);
          invariant(
            keyOf(subject, client, false) === subject,
            `a public endpoint's key depends on the token: ${keyOf(subject, client, false)}`,
          );
        }
      },
    );
}

const identityProperty = identityPropertyOver((d) => d.buildCacheKey);
const dedupeIdentityProperty = identityPropertyOver((d) => d.buildDedupeKey);

/**
 * Two SSO tokens for one character share a key whatever else the tokens
 * carry, tokens for two characters never do, and neither shares a key with
 * an opaque token or the public key.
 */
function characterPropertyOver(pick: (d: KeyDerivation) => KeyFn) {
  return (d: KeyDerivation) =>
    fc.property(
      fc.integer({ min: 1, max: 2_147_483_647 }),
      fc.integer({ min: 1, max: 2_147_483_647 }),
      fc.uniqueArray(fc.string({ minLength: 1, maxLength: 12 }), {
        minLength: 2,
        maxLength: 2,
      }),
      opaqueTokenArb,
      argsArb,
      (characterA, characterB, [jtiA, jtiB], opaque, args) => {
        fc.pre(characterA !== characterB);
        const keyOf = pick(d);
        const subject = `${BASE}/${d.buildEndpointPath(DEFINITION, args).path}`;
        const key = (token: string) =>
          keyOf(subject, new ApiClient('fuzz', BASE, token), true);
        const first = key(ssoToken(characterA, jtiA));
        const rotated = key(ssoToken(characterA, jtiB));
        const other = key(ssoToken(characterB, jtiA));
        invariant(
          first === rotated,
          `two tokens for character ${characterA} have different keys: ${first} and ${rotated}`,
        );
        invariant(
          first !== other,
          `characters ${characterA} and ${characterB} share the key ${first}`,
        );
        const opaqueKey = key(opaque);
        invariant(
          opaqueKey !== first && opaqueKey !== other,
          `opaque token ${JSON.stringify(opaque)} shares the key of a character`,
        );
        const publicKey = keyOf(subject, new ApiClient('fuzz', BASE), true);
        invariant(
          first !== publicKey,
          `character ${characterA} shares the unauthenticated key ${publicKey}`,
        );
      },
    );
}

const characterProperty = characterPropertyOver((d) => d.buildCacheKey);
const dedupeCharacterProperty = characterPropertyOver((d) => d.buildDedupeKey);

const real = (): KeyDerivation => ({
  buildEndpointPath,
  buildCacheKey,
  buildDedupeKey,
});

describeProperty<KeyDerivation>({
  name: 'cache keys are deterministic, injective and in canonical query order',
  file: __filename,
  subject: real,
  mutants: {
    'query values are not percent-encoded': () => ({
      ...real(),
      buildEndpointPath: (def, args, datasource) => {
        const result = buildEndpointPath(def, args, datasource);
        const [path, query] = result.path.split('?');
        return query === undefined
          ? result
          : { ...result, path: `${path}?${decodeURIComponent(query)}` };
      },
    }),
    'query parameters in reverse definition order': () => ({
      ...real(),
      buildEndpointPath: (def, args, datasource) => {
        const result = buildEndpointPath(def, args, datasource);
        const [path, query] = result.path.split('?');
        return query === undefined
          ? result
          : {
              ...result,
              path: `${path}?${query.split('&').reverse().join('&')}`,
            };
      },
    }),
    'string values are trimmed into the key': () => ({
      ...real(),
      buildEndpointPath: (def, args, datasource) =>
        buildEndpointPath(
          def,
          args.map((v) => (typeof v === 'string' ? v.trim() || v : v)),
          datasource,
        ),
    }),
  },
  property: keyProperty,
});

describeProperty<KeyDerivation>({
  name: 'authenticated cache keys never collide across access tokens',
  file: __filename,
  subject: real,
  mutants: {
    'key ignores the access token': () => ({
      ...real(),
      buildCacheKey: (url) => url,
    }),
    'token hash truncated to one hex digit': () => ({
      ...real(),
      buildCacheKey: (url, client, requiresAuth = false) => {
        const header = requiresAuth
          ? client.getAuthorizationHeader()
          : undefined;
        if (!header) return url;
        return `${createHash('sha256').update(header).digest('hex').slice(0, 1)}:${url}`;
      },
    }),
  },
  property: identityProperty,
});

/**
 * The deduplication key. `key ignores the access token` is esi-23g.36 itself:
 * the key was the bare endpoint, so two concurrent authenticated GETs under
 * different tokens coalesced and one caller was handed the other identity's
 * response.
 */
describeProperty<KeyDerivation>({
  name: 'authenticated deduplication keys never collide across access tokens',
  file: __filename,
  subject: real,
  mutants: {
    'key ignores the access token': () => ({
      ...real(),
      buildDedupeKey: (endpoint) => endpoint,
    }),
    'token hash truncated to one hex digit': () => ({
      ...real(),
      buildDedupeKey: (endpoint, client, requiresAuth = false) => {
        const header = requiresAuth
          ? client.getAuthorizationHeader()
          : undefined;
        if (!header) return endpoint;
        return `${createHash('sha256').update(header).digest('hex').slice(0, 1)}:${endpoint}`;
      },
    }),
  },
  property: dedupeIdentityProperty,
});

/**
 * The header hash alone was the key before PR 10b of the 11.0 plan: a token
 * refresh emptied the character's cache. `every SSO token is one identity`
 * is the opposite failure, where the character id is read but not used.
 */
describeProperty<KeyDerivation>({
  name: 'authenticated cache keys follow the character, not the token',
  file: __filename,
  subject: real,
  mutants: {
    'key hashes the header rather than reading the character': () => ({
      ...real(),
      buildCacheKey: (url, client, requiresAuth = false) => {
        const header = requiresAuth
          ? client.getAuthorizationHeader()
          : undefined;
        if (!header) return url;
        return `${createHash('sha256').update(header).digest('hex').slice(0, 16)}:${url}`;
      },
    }),
    'every SSO token is one identity': () => ({
      ...real(),
      buildCacheKey: (url, client, requiresAuth = false) => {
        const header = requiresAuth
          ? client.getAuthorizationHeader()
          : undefined;
        if (!header) return url;
        return header.split('.').length === 3
          ? `character:0:${url}`
          : `${createHash('sha256').update(header).digest('hex').slice(0, 16)}:${url}`;
      },
    }),
  },
  property: characterProperty,
});

describeProperty<KeyDerivation>({
  name: 'authenticated deduplication keys follow the character, not the token',
  file: __filename,
  subject: real,
  mutants: {
    'key hashes the header rather than reading the character': () => ({
      ...real(),
      buildDedupeKey: (endpoint, client, requiresAuth = false) => {
        const header = requiresAuth
          ? client.getAuthorizationHeader()
          : undefined;
        if (!header) return endpoint;
        return `${createHash('sha256').update(header).digest('hex').slice(0, 16)}:${endpoint}`;
      },
    }),
  },
  property: dedupeCharacterProperty,
});
