/**
 * ESI.ts Example: Token Manager
 *
 * Demonstrates EsiTokenManager: the SSO login flow, persistent multi-character
 * token storage, proactive refresh, a client bound to a character, and bulk
 * refresh with a concurrency cap.
 *
 * REQUIRES an SSO application — set ESI_SSO_CLIENT_ID (and, for a
 * confidential client, ESI_SSO_CLIENT_SECRET) in your environment. Register
 * one at https://developers.eveonline.com/ with callback
 * http://localhost:8765/callback.
 *
 * On first run this opens a login URL, waits for the SSO callback on
 * localhost:8765, and stores the resulting token in ./tokens.example.json.
 * Later runs reuse the stored token and refresh it as needed.
 *
 * Usage: npm run example:token-manager
 */
import * as http from 'http';
import {
  EsiTokenManager,
  FileTokenStorage,
  generatePkcePair,
  generateState,
  isTokenRevoked,
} from '../src';

const CALLBACK_PORT = 8765;
const CALLBACK_URL = `http://localhost:${CALLBACK_PORT}/callback`;
const SCOPES = ['esi-location.read_location.v1', 'esi-skills.read_skills.v1'];

const tokens = new EsiTokenManager({
  clientId: process.env.ESI_SSO_CLIENT_ID ?? '',
  clientSecret: process.env.ESI_SSO_CLIENT_SECRET, // undefined => PKCE public client
  callbackUrl: CALLBACK_URL,
  storage: new FileTokenStorage('./tokens.example.json'),
  onRefresh: (t) =>
    console.log(
      `  [refresh] ${t.characterName} now expires ${new Date(t.expiresAt).toISOString()}`,
    ),
  onRevoked: (id) =>
    console.log(`  [revoked] character ${id} must log in again`),
});

/** Run the browser login flow once and store the character. */
async function loginNewCharacter(): Promise<number> {
  const state = generateState();
  const pkce = tokens.getSsoClient().isConfidential()
    ? undefined
    : generatePkcePair();

  const loginUrl = tokens.getAuthorizationUrl({
    scopes: SCOPES,
    state,
    codeChallenge: pkce?.codeChallenge,
  });

  console.log('\nOpen this URL in a browser to log in:\n');
  console.log(`  ${loginUrl}\n`);

  const code = await waitForCallback(state);
  const stored = await tokens.addCharacter(code, {
    codeVerifier: pkce?.codeVerifier,
  });
  console.log(
    `  Stored token for ${stored.characterName} (${stored.characterId})`,
  );
  console.log(`  Scopes: ${stored.scopes.join(', ')}`);
  return stored.characterId;
}

/** Tiny one-shot HTTP server that captures the SSO callback. */
function waitForCallback(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${CALLBACK_PORT}`);
      if (url.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      if (!code || state !== expectedState) {
        res.writeHead(400).end('Missing code or state mismatch');
        server.close();
        reject(new Error('SSO callback missing code or state mismatch'));
        return;
      }
      res
        .writeHead(200, { 'Content-Type': 'text/plain' })
        .end('Logged in. You can close this tab.');
      server.close();
      resolve(code);
    });
    server.listen(CALLBACK_PORT, () =>
      console.log(`  Waiting for callback on ${CALLBACK_URL} ...`),
    );
  });
}

async function main() {
  console.log('Token Manager Demo');
  console.log('='.repeat(50));

  if (!process.env.ESI_SSO_CLIENT_ID) {
    console.log(
      'Set ESI_SSO_CLIENT_ID (and optionally ESI_SSO_CLIENT_SECRET) to run this example.',
    );
    return;
  }

  // --- 1. Find or add a character ---
  const characters = await tokens.listCharacters();
  const active = characters.filter((c) => !c.revoked);
  console.log(`\nStored characters: ${active.length}`);
  for (const c of active) {
    console.log(
      `  ${c.characterName} (${c.characterId}) expires ${new Date(c.expiresAt).toISOString()}`,
    );
  }
  const characterId = active[0]?.characterId ?? (await loginNewCharacter());

  // --- 2. A client bound to the character ---
  // The manager refreshes the token if it is within 60 s of expiry before
  // building the client, and again through onTokenRefresh on any 401.
  const client = await tokens.createClient(characterId, {
    clientId: 'esi-ts-token-manager-demo',
  });
  try {
    const location = await client.location.getCharacterLocation(characterId);
    console.log(`\nCurrent system: ${location.solar_system_id}`);
  } catch (err) {
    if (isTokenRevoked(err)) {
      console.log('\nToken revoked — remove the character and log in again:');
      console.log(`  await tokens.removeCharacter(${characterId})`);
    } else {
      console.error('  Error:', err instanceof Error ? err.message : err);
    }
  } finally {
    client.shutdown();
  }

  // --- 3. Bulk refresh ---
  // Only tokens expiring in the next five minutes are refreshed; the rest
  // are reported as skipped. Each character settles independently.
  console.log('\nBulk refresh (tokens expiring within 5 minutes):');
  const results = await tokens.refreshAll({
    concurrency: 5,
    expiringWithinMs: 5 * 60_000,
  });
  for (const r of results) {
    const detail =
      r.status === 'failed'
        ? ` (${r.error?.message}${r.retryable ? ', retryable' : ''})`
        : '';
    console.log(`  ${r.characterId}: ${r.status}${detail}`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
