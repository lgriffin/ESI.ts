# Authentication

**Implements:** `SEC-02` · `SEC-08` · `ARCH-07`. See [CHARTER.md](CHARTER.md) Part 6 and Part 2.

How a client gets an EVE SSO access token, keeps it fresh, and holds tokens for many characters. Construction and configuration are in [USAGE.md](USAGE.md). The error classes named here are described in [ERRORS.md](ERRORS.md).

Three rules hold for every path on this page:

- The library attaches a token only to calls whose endpoint declares SSO scopes. A public call never carries your token, even when the client holds one.
- A token never appears in clear text in a log line, an error message or a cache key (SEC-02). URLs are redacted in every error and every log line, and cache and deduplication keys hash the `Authorization` header.
- Local development credentials come from the PKCE script into a git-ignored `.env`. They never appear in a committed file, fixture or example (SEC-08).

---

## 1. One token

Three ways to give a client a token, in order of precedence:

| Source               | How                                                     | Use for                            |
| -------------------- | ------------------------------------------------------- | ---------------------------------- |
| Constructor option   | `new EsiClient({ accessToken })`                        | Apps that manage tokens themselves |
| Runtime update       | `client.setAccessToken(newToken)`                       | Replacing a token you refreshed    |
| Environment variable | `ESI_ACCESS_TOKEN`, read when the client is constructed | Scripts, examples, CI              |

```typescript
import 'dotenv/config';
import { EsiClient } from '@lgriffin/esi.ts';

const fromEnv = new EsiClient(); // reads process.env.ESI_ACCESS_TOKEN
const explicit = new EsiClient({ accessToken: token });
explicit.setAccessToken(newToken);
```

To get a token, register an application at [EVE Developers](https://developers.eveonline.com/), choose the scopes it needs, and run the [OAuth2 flow](https://docs.esi.evetech.net/docs/sso/). For local work, `npx ts-node scripts/create-token.ts` runs the PKCE flow and writes the result to `.env`. Copy `.env.example` first.

`esiEndpointScopes` (see [USAGE.md](USAGE.md#7-generated-types-and-scopes)) tells you which scopes a route needs before you ask the player for them.

## 2. Refresh on 401

EVE SSO access tokens live for 20 minutes. Give the client a refresh callback and it handles expiry itself:

```typescript
const refreshing = new EsiClient({
  accessToken: initialToken,
  onTokenRefresh: async () => {
    const response = await fetch('https://login.eveonline.com/v2/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: myRefreshToken,
        client_id: myClientId,
      }),
    });
    const { access_token } = await response.json();
    return access_token;
  },
});

const location = await refreshing.location.getCharacterLocation(characterId);
```

`client.setTokenProvider(myRefreshFunction)` sets or replaces the callback later, and `setTokenProvider(undefined)` removes it.

Behaviour, each pinned by a scenario in `tests/bdd/features/core/`:

- **One refresh per call.** If the refreshed token also gets a 401, that error is thrown.
- **Coalesced.** Concurrent 401s share one call to your callback.
- **Typed failure.** A callback that throws anything other than an `EsiError` surfaces as an `EsiTokenRefreshError` (code `TOKEN_REFRESH_FAILED`) with what it threw, such as a `TokenRevokedError`, on `cause`. A callback that throws an `EsiError`, including `CircuitOpenError`, has that error propagate unchanged (`src/core/RetryStrategy.ts`).
- **No provider, no refresh.** A 401 throws immediately.

## 3. Many characters: `EsiTokenManager`

The callback above is a hook. `EsiTokenManager` is the whole lifecycle for applications that hold tokens for one or many characters:

- the SSO code exchange, with or without PKCE;
- persistence through a storage adapter;
- proactive refresh before expiry;
- coalescing of concurrent refreshes;
- persisting the rotated refresh token before it is used;
- revocation tracking and bulk refresh.

```typescript
import {
  EsiTokenManager,
  FileTokenStorage,
  generateState,
} from '@lgriffin/esi.ts';
import { createEsi } from '@lgriffin/esi.ts/client';

const esi = createEsi({ userAgent: 'my-app/1.0 (ops@my-app.example)' });
const tokens = new EsiTokenManager({
  clientId: process.env.ESI_SSO_CLIENT_ID!,
  clientSecret: process.env.ESI_SSO_CLIENT_SECRET, // omit for a public (PKCE) client
  callbackUrl: 'https://my-app.example/callback',
  storage: new FileTokenStorage('./tokens.json'), // or MemoryTokenStorage, or your own
});

// 1. Send the player to SSO, and keep loginState with this user's session
const loginState = generateState();
const loginUrl = tokens.getAuthorizationUrl({
  scopes: ['esi-wallet.read_character_wallet.v1'],
  state: loginState,
});

// 2. In your callback handler, reject a callback whose state is not the one
//    saved for this login (it may come from someone else's login), then
//    exchange the code. The character id, name and scopes are decoded from
//    the token.
async function onSsoCallback(requestUrl: string, savedState: string) {
  const params = new URL(requestUrl, 'https://my-app.example').searchParams;
  const code = params.get('code');
  if (!code || params.get('state') !== savedState) {
    throw new Error('SSO callback missing code or state mismatch');
  }
  const stored = await tokens.addCharacter(code);
  console.log(`Added ${stored.characterName} (${stored.characterId})`);

  // 3. A view of the shared runtime as that character, refreshed through the manager
  await esi
    .as(tokens.identity(stored.characterId))
    .character(stored.characterId)
    .wallet.get();

  // Or a fresh access token, or a TokenProvider for a client you build yourself
  const accessToken = await tokens.getToken(stored.characterId);
  const provider = tokens.tokenProviderFor(stored.characterId);
  return { stored, accessToken, provider };
}
```

Public clients, such as desktop and CLI tools that cannot keep a secret, use PKCE:

```typescript
import { generatePkcePair } from '@lgriffin/esi.ts';

const pkce = generatePkcePair();
const url = tokens.getAuthorizationUrl({
  scopes,
  state,
  codeChallenge: pkce.codeChallenge,
});
// ...later, on a callback whose state matched (as above):
await tokens.addCharacter(code, { codeVerifier: pkce.codeVerifier });
```

`listCharacters()`, `importToken()` and `removeCharacter(id, { revoke: true })` complete the lifecycle. `examples/token-manager.ts` (`npm run example:token-manager`) walks through it against real SSO.

### Bulk refresh

Services that hold many characters refresh in bulk. A failure for one character never rejects the call: each character gets its own result. The one exception is a storage adapter that cannot list tokens, which rejects with the storage error.

```typescript
const results = await tokens.refreshAll({
  concurrency: 5, // simultaneous SSO requests (default 5)
  expiringWithinMs: 5 * 60_000, // only tokens expiring within 5 minutes; omit for all
});

for (const r of results) {
  switch (r.status) {
    case 'refreshed':
      break;
    case 'skipped':
      break; // not stale, or the run was aborted
    case 'revoked':
      console.log(`${r.characterId} must log in again`);
      break;
    case 'failed':
      if (r.retryable) scheduleRetry(r.characterId);
      break;
  }
}
```

### Storage adapters

`ITokenStorage` is four async methods keyed by character id: `get`, `set`, `delete` and `list`.

| Adapter              | Use for                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| `MemoryTokenStorage` | Tests, CLIs that log in on every run, a cache in front of a durable store |
| `FileTokenStorage`   | Single-process apps. Writes go to a temp file then a rename, mode `0600`  |

Implement the interface over Redis, Postgres or a keychain for anything else. `set` must be durable before it resolves. The manager persists the rotated refresh token before it returns the new access token, and SSO has already invalidated the previous one.

### Guarantees and limits

- **One token per character.** Re-authorising replaces the stored token. A warning is logged if the new consent drops scopes.
- **Proactive refresh.** `getToken` refreshes a token that is within `refreshSkewMs` of expiry (default 60 s).
- **Coalescing.** Concurrent refreshes for one character share one SSO call. This matters because SSO rotates the refresh token on every use.
- **Revocation.** An `invalid_grant` from SSO marks the character revoked. Later calls throw `TokenRevokedError` locally without calling SSO.
- **Hooks.** `onRefresh`, `onRefreshError` and `onRevoked` are there for logging, metrics or prompting a re-login.
- **No JWT signature verification.** Tokens are trusted because they arrive straight from SSO over TLS. Do not use `decodeAccessToken` to authenticate a token a third party hands you. Opt-in JWKS verification is tracked in [#256](https://github.com/lgriffin/ESI.ts/issues/256).
- **One process per store.** Two processes sharing one `FileTokenStorage` would each rotate refresh tokens the other cannot see. A locking adapter for shared stores is tracked in [#258](https://github.com/lgriffin/ESI.ts/issues/258), after 11.0.

## 4. What 11.0.0 changes

`tokens.createClient(id)` builds a complete `EsiClient` for each character. Each of those clients has its own rate limiter and cache, so ESI's per-IP error budget is tracked once per character. 11.0.0 fixes that without removing this API:

- **Phase 2 PR 10b (done)** keys the cache and the deduplicator by the character the token names instead of the token, so ETags survive a refresh.
- **Phase 2 PR 11 (done)** adds `@lgriffin/esi.ts/client`: `esi.as(identity)` is an immutable per-character view over one shared runtime, built from `tokens.identity(characterId)`, a raw token (`identityFromToken`) or a `TokenProvider` (`identityFromProvider`). [MULTI-CHARACTER.md](MULTI-CHARACTER.md) is the guide. **Deprecated in 11.0.0:** `tokens.createClient(id)` still works, and is `@deprecated` in favour of `esi.as(tokens.identity(id))`. Removal is 12.0.0 at the earliest.

The design is in [ROADMAP.md](ROADMAP.md), Phase 2.
