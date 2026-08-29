# Authentication

Many ESI endpoints require an EVE SSO access token. ESI.ts supports three ways to provide one, plus automatic token refresh.

## 1. Environment Variable <Badge type="tip" text="Recommended" />

Set `ESI_ACCESS_TOKEN` in your environment or a `.env` file. The client reads it automatically — no token in source code.

```bash
# Copy the example and fill in your token
cp .env.example .env
```

```env
ESI_ACCESS_TOKEN=your-eve-sso-access-token
ESI_CLIENT_ID=my-app-name
```

```typescript
import 'dotenv/config';
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();
// Token picked up from process.env.ESI_ACCESS_TOKEN
```

## 2. Constructor Parameter

Pass the token directly (useful for apps that manage tokens themselves):

```typescript
const client = new EsiClient({ accessToken: token });
```

## 3. Runtime Update

Set or refresh the token after construction:

```typescript
client.setAccessToken(newToken);
```

## Automatic Token Refresh

EVE SSO access tokens expire after 20 minutes. Provide a refresh callback and the client will automatically handle 401s:

```typescript
const client = new EsiClient({
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

// Requests auto-refresh on 401
const location = await client.location.getCharacterLocation(characterId);
```

The token provider can also be set at runtime:

```typescript
client.setTokenProvider(myRefreshFunction);
client.setTokenProvider(undefined); // disable auto-refresh
```

### Token Refresh Behaviors

- Only retries **once** per request — if the refreshed token also gets a 401, the error is thrown
- **Concurrent coalescing** — if multiple requests hit 401 simultaneously, only one refresh call is made
- If the refresh callback throws (e.g., refresh token revoked), a `TOKEN_REFRESH_FAILED` error is raised
- Without a token provider, 401 errors throw immediately

## Getting an EVE SSO Token

1. Register an application at [EVE Developers](https://developers.eveonline.com/)
2. Set a callback URL and select the ESI scopes your app needs
3. Implement the [OAuth2 flow](https://docs.esi.evetech.net/docs/sso/) to obtain an access token
4. Access tokens expire — use the refresh token to get new ones

## Checking Scopes

The library includes a generated scope-to-endpoint mapping:

```typescript
import { esiEndpointScopes, EsiScope } from '@lgriffin/esi.ts';

// Check what scopes an endpoint needs
const walletScopes = esiEndpointScopes['GET:characters/{character_id}/wallet'];
// → ['esi-wallet.read_character_wallet.v1']

// Check if an endpoint is public
const isPublic = !esiEndpointScopes['GET:universe/types/{type_id}'];
// → true
```
