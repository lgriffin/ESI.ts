/**
 * ESI.ts Token Creator
 *
 * Automates the EVE SSO OAuth2 PKCE flow to create an all-access token
 * for local testing. Tokens are written to .env (gitignored).
 *
 * Prerequisites:
 *   1. Register an application at https://developers.eveonline.com/
 *   2. Set callback URL to http://localhost:3000/sso_callback
 *      (an application registered with another localhost path or port sets
 *      ESI_SSO_CALLBACK_PATH and ESI_SSO_CALLBACK_PORT to match)
 *   3. Select ALL ESI scopes (or the ones you need)
 *   4. Copy the Client ID into your .env as ESI_SSO_CLIENT_ID
 *
 * Usage: npm run token:create
 *
 * SSO rejects a scope the application does not grant. When it redirects the
 * rejection back here the script drops that scope and retries; when it shows
 * the error on its own page instead, list the scope in ESI_SSO_EXCLUDE_SCOPES
 * (comma- or space-separated) and re-run.
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { exec } from 'child_process';

import { COMPATIBILITY_DATE } from '../../src/core/constants';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ESI_OPENAPI_URL = `https://esi.evetech.net/meta/openapi.json?compatibility_date=${COMPATIBILITY_DATE}`;
const EVE_SSO_AUTH_URL = 'https://login.eveonline.com/v2/oauth/authorize';
const EVE_SSO_TOKEN_URL = 'https://login.eveonline.com/v2/oauth/token';
const ENV_FILE = path.resolve(__dirname, '../..', '.env');
const DEFAULT_PORT = 3000;
const DEFAULT_CALLBACK_PATH = '/sso_callback';

interface OpenApiSpec {
  paths: Record<
    string,
    Record<string, { security?: Array<Record<string, string[]>> }>
  >;
  components?: {
    securitySchemes?: Record<
      string,
      {
        flows?: Record<string, { scopes?: Record<string, string> }>;
      }
    >;
  };
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
    env.set(trimmed.slice(0, eqIdx), unquote(trimmed.slice(eqIdx + 1)));
  }
  return env;
}

/** Strips one pair of matching surrounding quotes, as dotenv does. */
function unquote(raw: string): string {
  const value = raw.trim();
  const quoted =
    value.length >= 2 &&
    (value[0] === '"' || value[0] === "'") &&
    value.endsWith(value[0]);
  return quoted ? value.slice(1, -1) : value;
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
  console.log('Fetching all ESI scopes from OpenAPI spec...');
  const response = await fetch(ESI_OPENAPI_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: HTTP ${response.status}`);
  }

  const spec = (await response.json()) as OpenApiSpec;
  const scopes = new Set<string>();

  if (spec.components?.securitySchemes) {
    for (const scheme of Object.values(spec.components.securitySchemes)) {
      if (scheme.flows) {
        for (const flow of Object.values(scheme.flows)) {
          if (flow.scopes) {
            for (const scope of Object.keys(flow.scopes)) {
              scopes.add(scope);
            }
          }
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

/** Parses a comma- or whitespace-separated scope list. */
function parseScopeList(raw: string | undefined): string[] {
  return (raw ?? '').split(/[\s,]+/).filter((s) => s.length > 0);
}

/** Drops the scopes named in ESI_SSO_EXCLUDE_SCOPES and reports them. */
function applyExclusions(scopes: string[], excluded: string[]): string[] {
  if (excluded.length === 0) return scopes;
  const skip = new Set(excluded);
  console.log(`Excluding ${skip.size} scope(s) via ESI_SSO_EXCLUDE_SCOPES:`);
  for (const s of skip) {
    const note = scopes.includes(s) ? '' : ' (not in the spec; ignored)';
    console.log(`  - ${s}${note}`);
  }
  return scopes.filter((s) => !skip.has(s));
}

/**
 * Reads the scopes SSO actually granted from the access token's `scp` claim.
 * Returns null when the token is not a JWT carrying one.
 */
function grantedScopes(accessToken: string): string[] | null {
  const payload = accessToken.split('.')[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf-8'),
    ) as { scp?: string | string[] };
    if (claims.scp === undefined) return null;
    return Array.isArray(claims.scp) ? claims.scp : [claims.scp];
  } catch {
    return null;
  }
}

function reportScopes(
  requested: string[],
  rejected: string[],
  accessToken: string,
): void {
  const granted = grantedScopes(accessToken);
  if (granted === null) {
    console.log(
      `  Scopes:        ${requested.length} requested (could not read the token's scp claim)`,
    );
  } else {
    console.log(
      `  Scopes:        ${granted.length} granted of ${requested.length} requested`,
    );
    const grantedSet = new Set(granted);
    const missing = requested.filter((s) => !grantedSet.has(s));
    for (const s of missing) {
      console.log(`                   not granted: ${s}`);
    }
  }
  if (rejected.length > 0) {
    console.log(
      `  Rejected:      ${rejected.length} scopes removed (not valid for this character/app)`,
    );
    for (const s of rejected) {
      console.log(`                   - ${s}`);
    }
  }
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

const CALLBACK_TIMEOUT_MS = 5 * 60 * 1000;

function parseInvalidScope(description: string): string | null {
  return /'([^']+)'/.exec(description)?.[1] ?? null;
}

function htmlPage(heading: string, body: string): string {
  return (
    '<html><body style="font-family:sans-serif;text-align:center;padding:3em">' +
    `<h2>${heading}</h2><p>${body}</p>` +
    '</body></html>'
  );
}

/** Turns a callback request into a response and an outcome for the caller. */
function handleCallback(
  url: URL,
  expectedState: string,
): { status: number; html: string; outcome: CallbackResult | Error } {
  // Checked first, error callbacks included, so a request that did not come
  // from this login cannot make the script drop scopes or give up.
  if (url.searchParams.get('state') !== expectedState) {
    return {
      status: 400,
      html: htmlPage('State mismatch', 'Possible CSRF. Please try again.'),
      outcome: new Error('OAuth state mismatch'),
    };
  }

  const error = url.searchParams.get('error');
  if (error) {
    const description = url.searchParams.get('error_description') || '';
    const scope =
      error === 'invalid_scope' ? parseInvalidScope(description) : null;
    if (scope) {
      return {
        status: 200,
        html: htmlPage(
          'Retrying with corrected scopes...',
          'A new browser tab will open shortly. You can close this one.',
        ),
        outcome: { kind: 'invalid_scope', scope },
      };
    }
    return {
      status: 400,
      html: htmlPage(
        `OAuth error: ${escapeHtml(error)}`,
        escapeHtml(description),
      ),
      outcome: { kind: 'error', error, description },
    };
  }

  const code = url.searchParams.get('code');
  if (!code) {
    return {
      status: 400,
      html: htmlPage('No authorization code received', ''),
      outcome: new Error('No authorization code in callback'),
    };
  }

  return {
    status: 200,
    html: htmlPage(
      'Authentication successful',
      'You can close this tab and return to your terminal.',
    ),
    outcome: { kind: 'code', code },
  };
}

function waitForCallback(
  port: number,
  callbackPath: string,
  expectedState: string,
): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    // Settles once: clears the timeout so the process can exit, and closes the
    // server so the next attempt can listen on the same port.
    const settle = (outcome: CallbackResult | Error): void => {
      clearTimeout(timer);
      server.close();
      if (outcome instanceof Error) reject(outcome);
      else resolve(outcome);
    };

    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${port}`);
      // No keep-alive, so closing the server is not held open by the browser.
      res.setHeader('Connection', 'close');
      if (url.pathname !== callbackPath) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const { status, html, outcome } = handleCallback(url, expectedState);
      res.writeHead(status, { 'Content-Type': 'text/html' });
      res.end(html);
      settle(outcome);
    });

    server.listen(port, () => {
      console.log(
        `Callback server listening on http://localhost:${port}${callbackPath}`,
      );
    });

    server.on('error', (err) => {
      settle(
        new Error(
          `Could not start callback server on port ${port}: ${err.message}`,
        ),
      );
    });

    const timer = setTimeout(() => {
      settle(
        new Error(
          'Timed out waiting for OAuth callback (5 minutes).\n' +
            '  If the browser showed an SSO error such as invalid_scope instead of\n' +
            '  returning here, SSO rejected the request on its own page. Add the\n' +
            '  scope it named to ESI_SSO_EXCLUDE_SCOPES in .env and re-run.',
        ),
      );
    }, CALLBACK_TIMEOUT_MS);
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
  // Normalised the way the callback server parses requests, so a value such
  // as `callback` or `/a/../callback` matches the pathname the browser sends.
  const callbackPath = new URL(
    process.env.ESI_SSO_CALLBACK_PATH ||
      envVars.get('ESI_SSO_CALLBACK_PATH') ||
      DEFAULT_CALLBACK_PATH,
    `http://localhost:${port}`,
  ).pathname;

  if (!clientId) {
    console.error('\nESI_SSO_CLIENT_ID is not set.\n');
    console.log('To create a token you need an EVE developer application:\n');
    console.log('  1. Go to https://developers.eveonline.com/');
    console.log('  2. Create a new application');
    console.log(
      `  3. Set callback URL to: http://localhost:${port}${callbackPath}`,
    );
    console.log('  4. Under "Permissions", select ALL ESI scopes');
    console.log('  5. Copy the Client ID');
    console.log(
      `  6. Add to your .env file:  ESI_SSO_CLIENT_ID=<your-client-id>\n`,
    );
    console.log('Then re-run:  npm run token:create');
    process.exit(1);
  }

  let scopes = applyExclusions(
    await fetchAllScopes(),
    parseScopeList(
      process.env.ESI_SSO_EXCLUDE_SCOPES ||
        envVars.get('ESI_SSO_EXCLUDE_SCOPES'),
    ),
  );
  const redirectUri = `http://localhost:${port}${callbackPath}`;
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
      console.log(
        `\nRetrying with ${scopes.length} scopes (attempt ${attempt + 1})...`,
      );
    }
    openBrowser(authUrl.toString());

    let result: CallbackResult;
    try {
      result = await waitForCallback(port, callbackPath, state);
    } catch (err) {
      console.error(
        `\nCallback failed: ${err instanceof Error ? err.message : err}`,
      );
      process.exit(1);
    }

    if (result.kind === 'code') {
      console.log('\nAuthorization code received. Exchanging for tokens...');

      let tokens: TokenResponse;
      try {
        tokens = await exchangeCode(
          result.code,
          clientId,
          codeVerifier,
          redirectUri,
        );
      } catch (err) {
        console.error(
          `\nToken exchange failed: ${err instanceof Error ? err.message : err}`,
        );
        process.exit(1);
      }

      envVars.set('ESI_ACCESS_TOKEN', tokens.access_token);
      envVars.set('ESI_REFRESH_TOKEN', tokens.refresh_token);
      envVars.set('ESI_SSO_CLIENT_ID', clientId);
      writeEnvFile(envVars);

      console.log('\n' + '='.repeat(50));
      console.log('Token created successfully!');
      console.log(
        `  Access token:  written to .env (expires in ${tokens.expires_in}s)`,
      );
      console.log('  Refresh token: written to .env');
      reportScopes(scopes, rejectedScopes, tokens.access_token);
      console.log('\nUsage:');
      console.log('  # Load env vars and run live tests');
      console.log('  export $(grep -v "^#" .env | xargs)');
      console.log('  ESI_LIVE_TESTS=true npm run test:integration:live');
      console.log('\n  # Or use Node --env-file flag (Node 20.6+)');
      console.log(
        '  node --env-file=.env -e "console.log(process.env.ESI_ACCESS_TOKEN)"',
      );
      console.log('\nNote: Access tokens expire after ~20 minutes.');
      console.log(
        'Use the refresh token or re-run this script to get a new one.',
      );
      code = result.code;
      break;
    }

    if (result.kind === 'invalid_scope') {
      console.log(
        `  Scope rejected by SSO: ${result.scope} — removing and retrying`,
      );
      rejectedScopes.push(result.scope);
      scopes = scopes.filter((s) => s !== result.scope);
      continue;
    }

    console.error(`\nOAuth error: ${result.error}`);
    console.error(`  ${result.description}`);
    process.exit(1);
  }

  if (!code) {
    console.error(
      `\nToo many invalid scopes (${rejectedScopes.length}). Giving up.`,
    );
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
