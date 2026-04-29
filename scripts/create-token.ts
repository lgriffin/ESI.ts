/**
 * ESI.ts Token Creator
 *
 * Automates the EVE SSO OAuth2 PKCE flow to create an all-access token
 * for local testing. Tokens are written to .env (gitignored).
 *
 * Prerequisites:
 *   1. Register an application at https://developers.eveonline.com/
 *   2. Set callback URL to http://localhost:3000/sso_callback
 *   3. Select ALL ESI scopes (or the ones you need)
 *   4. Copy the Client ID into your .env as ESI_SSO_CLIENT_ID
 *
 * Usage: npm run token:create
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { exec } from 'child_process';

const ESI_SWAGGER_URL = 'https://esi.evetech.net/latest/swagger.json';
const EVE_SSO_AUTH_URL = 'https://login.eveonline.com/v2/oauth/authorize';
const EVE_SSO_TOKEN_URL = 'https://login.eveonline.com/v2/oauth/token';
const ENV_FILE = path.resolve(__dirname, '..', '.env');
const DEFAULT_PORT = 3000;
const DEFAULT_CALLBACK_PATH = '/sso_callback';

interface SwaggerSpec {
  paths: Record<
    string,
    Record<string, { security?: Array<Record<string, string[]>> }>
  >;
  securityDefinitions?: Record<
    string,
    { scopes?: Record<string, string> }
  >;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

// ---------------------------------------------------------------------------
// .env helpers
// ---------------------------------------------------------------------------

function readEnvFile(): Map<string, string> {
  const env = new Map<string, string>();
  if (!fs.existsSync(ENV_FILE)) return env;
  const lines = fs.readFileSync(ENV_FILE, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    env.set(trimmed.slice(0, eqIdx), trimmed.slice(eqIdx + 1));
  }
  return env;
}

function writeEnvFile(env: Map<string, string>): void {
  let content = '';
  if (fs.existsSync(ENV_FILE)) {
    const existing = fs.readFileSync(ENV_FILE, 'utf-8');
    const written = new Set<string>();
    const lines = existing.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx);
          if (env.has(key)) {
            content += `${key}=${env.get(key)}\n`;
            written.add(key);
            continue;
          }
        }
      }
      content += line + '\n';
    }
    for (const [key, value] of env) {
      if (!written.has(key)) {
        content += `${key}=${value}\n`;
      }
    }
  } else {
    for (const [key, value] of env) {
      content += `${key}=${value}\n`;
    }
  }
  fs.writeFileSync(ENV_FILE, content.trimEnd() + '\n', 'utf-8');
}

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

function generateCodeVerifier(): string {
  return crypto.randomBytes(48).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

// ---------------------------------------------------------------------------
// Scope fetching
// ---------------------------------------------------------------------------

async function fetchAllScopes(): Promise<string[]> {
  console.log('Fetching all ESI scopes from swagger spec...');
  const response = await fetch(ESI_SWAGGER_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch swagger spec: HTTP ${response.status}`);
  }

  const spec = (await response.json()) as SwaggerSpec;
  const scopes = new Set<string>();

  if (spec.securityDefinitions) {
    for (const def of Object.values(spec.securityDefinitions)) {
      if (def.scopes) {
        for (const scope of Object.keys(def.scopes)) {
          scopes.add(scope);
        }
      }
    }
  }

  if (scopes.size === 0) {
    for (const methods of Object.values(spec.paths)) {
      for (const operation of Object.values(methods)) {
        if (operation.security) {
          for (const requirement of operation.security) {
            for (const scopeList of Object.values(requirement)) {
              for (const scope of scopeList) {
                scopes.add(scope);
              }
            }
          }
        }
      }
    }
  }

  const sorted = Array.from(scopes).sort();
  console.log(`Found ${sorted.length} ESI scopes`);
  return sorted;
}

// ---------------------------------------------------------------------------
// Browser launcher
// ---------------------------------------------------------------------------

function openBrowser(url: string): void {
  const platform = process.platform;
  let cmd: string;
  if (platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }
  exec(cmd, (err) => {
    if (err) {
      console.error('Could not open browser automatically.');
      console.log(`Open this URL manually:\n  ${url}`);
    }
  });
}

// ---------------------------------------------------------------------------
// OAuth callback server
// ---------------------------------------------------------------------------

type CallbackResult =
  | { kind: 'code'; code: string }
  | { kind: 'invalid_scope'; scope: string }
  | { kind: 'error'; error: string; description: string };

function parseInvalidScope(description: string): string | null {
  const match = description.match(/'([^']+)'/);
  return match ? match[1] : null;
}

function waitForCallback(
  port: number,
  expectedState: string,
): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${port}`);
      if (url.pathname !== DEFAULT_CALLBACK_PATH) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const error = url.searchParams.get('error');
      const errorDesc = url.searchParams.get('error_description') || '';
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (error) {
        if (error === 'invalid_scope') {
          const scope = parseInvalidScope(errorDesc);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(
            '<html><body style="font-family:sans-serif;text-align:center;padding:3em">' +
              '<h2>Retrying with corrected scopes...</h2>' +
              '<p>A new browser tab will open shortly. You can close this one.</p>' +
              '</body></html>',
          );
          server.close();
          if (scope) {
            resolve({ kind: 'invalid_scope', scope });
          } else {
            resolve({ kind: 'error', error, description: errorDesc });
          }
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(
            '<html><body style="font-family:sans-serif;text-align:center;padding:3em">' +
              `<h2>OAuth error: ${error}</h2><p>${errorDesc}</p>` +
              '</body></html>',
          );
          server.close();
          resolve({ kind: 'error', error, description: errorDesc });
        }
        return;
      }

      if (state !== expectedState) {
        res.writeHead(400);
        res.end('State mismatch — possible CSRF. Please try again.');
        server.close();
        reject(new Error('OAuth state mismatch'));
        return;
      }

      if (!code) {
        res.writeHead(400);
        res.end('No authorization code received.');
        server.close();
        reject(new Error('No authorization code in callback'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        '<html><body style="font-family:sans-serif;text-align:center;padding:3em">' +
          '<h2>Authentication successful</h2>' +
          '<p>You can close this tab and return to your terminal.</p>' +
          '</body></html>',
      );

      server.close();
      resolve({ kind: 'code', code });
    });

    server.listen(port, () => {
      console.log(`Callback server listening on http://localhost:${port}${DEFAULT_CALLBACK_PATH}`);
    });

    server.on('error', (err) => {
      reject(new Error(`Could not start callback server on port ${port}: ${err.message}`));
    });

    setTimeout(() => {
      server.close();
      reject(new Error('Timed out waiting for OAuth callback (5 minutes)'));
    }, 5 * 60 * 1000);
  });
}

// ---------------------------------------------------------------------------
// Token exchange
// ---------------------------------------------------------------------------

async function exchangeCode(
  code: string,
  clientId: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<TokenResponse> {
  const response = await fetch(EVE_SSO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${body}`);
  }

  return (await response.json()) as TokenResponse;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('ESI.ts Token Creator');
  console.log('='.repeat(50));

  const envVars = readEnvFile();
  const clientId =
    process.env.ESI_SSO_CLIENT_ID || envVars.get('ESI_SSO_CLIENT_ID') || '';
  const port = parseInt(
    process.env.ESI_SSO_CALLBACK_PORT ||
      envVars.get('ESI_SSO_CALLBACK_PORT') ||
      String(DEFAULT_PORT),
    10,
  );

  if (!clientId) {
    console.error('\nESI_SSO_CLIENT_ID is not set.\n');
    console.log('To create a token you need an EVE developer application:\n');
    console.log('  1. Go to https://developers.eveonline.com/');
    console.log('  2. Create a new application');
    console.log(`  3. Set callback URL to: http://localhost:${port}${DEFAULT_CALLBACK_PATH}`);
    console.log('  4. Under "Permissions", select ALL ESI scopes');
    console.log('  5. Copy the Client ID');
    console.log(`  6. Add to your .env file:  ESI_SSO_CLIENT_ID=<your-client-id>\n`);
    console.log('Then re-run:  npm run token:create');
    process.exit(1);
  }

  let scopes = await fetchAllScopes();
  const redirectUri = `http://localhost:${port}${DEFAULT_CALLBACK_PATH}`;
  const rejectedScopes: string[] = [];
  const MAX_RETRIES = 20;

  let code: string | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    const authUrl = new URL(EVE_SSO_AUTH_URL);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    if (attempt === 0) {
      console.log(`\nRequesting ${scopes.length} scopes (all access)`);
      console.log('Opening browser for EVE SSO login...\n');
    } else {
      console.log(`\nRetrying with ${scopes.length} scopes (attempt ${attempt + 1})...`);
    }
    openBrowser(authUrl.toString());

    let result: CallbackResult;
    try {
      result = await waitForCallback(port, state);
    } catch (err) {
      console.error(`\nCallback failed: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }

    if (result.kind === 'code') {
      console.log('\nAuthorization code received. Exchanging for tokens...');

      let tokens: TokenResponse;
      try {
        tokens = await exchangeCode(result.code, clientId, codeVerifier, redirectUri);
      } catch (err) {
        console.error(`\nToken exchange failed: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      }

      envVars.set('ESI_ACCESS_TOKEN', tokens.access_token);
      envVars.set('ESI_REFRESH_TOKEN', tokens.refresh_token);
      envVars.set('ESI_SSO_CLIENT_ID', clientId);
      writeEnvFile(envVars);

      const grantedCount = scopes.length;
      console.log('\n' + '='.repeat(50));
      console.log('Token created successfully!');
      console.log(`  Access token:  written to .env (expires in ${tokens.expires_in}s)`);
      console.log('  Refresh token: written to .env');
      console.log(`  Scopes:        ${grantedCount} granted`);
      if (rejectedScopes.length > 0) {
        console.log(`  Rejected:      ${rejectedScopes.length} scopes removed (not valid for this character/app)`);
        for (const s of rejectedScopes) {
          console.log(`                   - ${s}`);
        }
      }
      console.log('\nUsage:');
      console.log('  # Load env vars and run live tests');
      console.log('  export $(grep -v "^#" .env | xargs)');
      console.log('  npm run test:integration:live');
      console.log('\n  # Or use Node --env-file flag (Node 20.6+)');
      console.log('  node --env-file=.env -e "console.log(process.env.ESI_ACCESS_TOKEN)"');
      console.log('\nNote: Access tokens expire after ~20 minutes.');
      console.log('Use the refresh token or re-run this script to get a new one.');
      code = result.code;
      break;
    }

    if (result.kind === 'invalid_scope') {
      console.log(`  Scope rejected by SSO: ${result.scope} — removing and retrying`);
      rejectedScopes.push(result.scope);
      scopes = scopes.filter((s) => s !== result.scope);
      continue;
    }

    console.error(`\nOAuth error: ${result.error}`);
    console.error(`  ${result.description}`);
    process.exit(1);
  }

  if (!code) {
    console.error(`\nToo many invalid scopes (${rejectedScopes.length}). Giving up.`);
    process.exit(1);
  }
}

main();
