/**
 * ESI.ts Example: Token Refresh
 *
 * Demonstrates automatic token refresh using the onTokenRefresh callback.
 * When ESI returns 401 Unauthorized, the client automatically calls your
 * refresh function, updates the token, and retries the request — no manual
 * token management needed.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN and ESI_REFRESH_TOKEN
 * in your environment.
 *
 * EVE SSO tokens expire after 20 minutes. This example shows how to
 * handle that transparently so long-running applications (market bots,
 * fleet trackers, industry monitors) don't need to manually track expiry.
 *
 * Usage: npm run example:token-refresh
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 1689391488;

// --- Token refresh implementation ---
// In a real app, you'd store these securely (e.g., encrypted DB, keychain).
let refreshToken = process.env.ESI_REFRESH_TOKEN || '';
const clientId = process.env.ESI_SSO_CLIENT_ID || '';

/**
 * Exchange a refresh token for a new access token via EVE SSO.
 *
 * This function is called automatically by the client when a 401 is received.
 * It should return the new access token string. If the refresh token itself
 * is expired or revoked, throw an error — the client will surface it as
 * TOKEN_REFRESH_FAILED.
 */
async function refreshAccessToken(): Promise<string> {
  console.log('  [Token Refresh] Refreshing access token via EVE SSO...');

  const response = await fetch(
    'https://login.eveonline.com/v2/oauth/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SSO token refresh failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  // EVE SSO may rotate the refresh token — always save the latest one
  refreshToken = data.refresh_token;
  console.log(
    `  [Token Refresh] New token obtained (expires in ${data.expires_in}s)`,
  );

  return data.access_token;
}

// --- Example 1: Configure at construction time ---
async function exampleConstructorConfig() {
  console.log('Example 1: Token refresh via constructor config');
  console.log('='.repeat(50));

  const client = new EsiClient({
    clientId: 'esi-ts-token-refresh-demo',
    accessToken: process.env.ESI_ACCESS_TOKEN,
    onTokenRefresh: refreshAccessToken,
  });

  try {
    // This request will automatically refresh the token if it's expired.
    // First call → 401 → refreshAccessToken() → retry → success
    const location = await client.location.getCharacterLocation(CHARACTER_ID);
    console.log(`  Current system: ${location.solar_system_id}`);

    // Subsequent calls reuse the refreshed token — no extra refresh needed
    const ship = await client.location.getCharacterShip(CHARACTER_ID);
    console.log(`  Current ship: type ${ship.ship_type_id}`);
  } catch (err) {
    handleError(err);
  } finally {
    await client.shutdown();
  }
}

// --- Example 2: Configure at runtime ---
async function exampleRuntimeConfig() {
  console.log('\nExample 2: Token refresh set at runtime');
  console.log('='.repeat(50));

  const client = new EsiClient({
    clientId: 'esi-ts-token-refresh-demo',
    accessToken: process.env.ESI_ACCESS_TOKEN,
  });

  // You can add or swap the token provider at any time
  client.setTokenProvider(refreshAccessToken);

  try {
    const skills = await client.skills.getCharacterSkills(CHARACTER_ID);
    console.log(`  Total SP: ${skills.total_sp?.toLocaleString()}`);
  } catch (err) {
    handleError(err);
  } finally {
    // Remove the provider if you want to stop auto-refresh
    client.setTokenProvider(undefined);
    await client.shutdown();
  }
}

// --- Example 3: What happens without a token provider ---
async function exampleWithoutProvider() {
  console.log('\nExample 3: Without token refresh (manual handling)');
  console.log('='.repeat(50));

  const client = new EsiClient({
    clientId: 'esi-ts-token-refresh-demo',
    accessToken: 'deliberately-expired-token',
    // No onTokenRefresh — 401 errors will throw immediately
  });

  try {
    await client.location.getCharacterLocation(CHARACTER_ID);
  } catch (err) {
    if (err instanceof EsiError && err.isUnauthorized()) {
      console.log('  Got 401 as expected — no auto-refresh configured');
      console.log('  You would need to manually call client.setAccessToken()');
    } else {
      handleError(err);
    }
  } finally {
    await client.shutdown();
  }
}

// --- Example 4: Handling refresh token expiry ---
async function exampleRefreshFailure() {
  console.log('\nExample 4: When the refresh token itself is expired');
  console.log('='.repeat(50));

  const client = new EsiClient({
    clientId: 'esi-ts-token-refresh-demo',
    accessToken: 'expired-access-token',
    onTokenRefresh: async () => {
      // Simulate a revoked/expired refresh token
      throw new Error('Refresh token has been revoked');
    },
  });

  try {
    await client.location.getCharacterLocation(CHARACTER_ID);
  } catch (err) {
    if (err instanceof Error && err.message.includes('TOKEN_REFRESH_FAILED')) {
      console.log('  Token refresh failed — user needs to re-authenticate');
      console.log(`  Error: ${err.message}`);
    } else {
      handleError(err);
    }
  } finally {
    await client.shutdown();
  }
}

function handleError(err: unknown) {
  if (err instanceof EsiError) {
    console.error(`  ESI error ${err.statusCode}: ${err.message}`);
    if (err.isUnauthorized()) {
      console.error(
        '  Set ESI_ACCESS_TOKEN and ESI_REFRESH_TOKEN in your environment',
      );
    }
  } else {
    console.error('  Error:', err instanceof Error ? err.message : err);
  }
}

async function main() {
  console.log('Token Refresh Demo\n');

  if (!process.env.ESI_ACCESS_TOKEN) {
    console.log(
      'Note: ESI_ACCESS_TOKEN is not set. Examples 1-2 will fail with 401.\n',
    );
  }

  await exampleConstructorConfig();
  await exampleRuntimeConfig();
  await exampleWithoutProvider();
  await exampleRefreshFailure();

  console.log('\nDone.');
}

main();
