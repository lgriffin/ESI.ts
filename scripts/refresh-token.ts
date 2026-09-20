/**
 * ESI.ts Token Refresher
 *
 * Uses the refresh token stored in .env to obtain a fresh access token
 * from the EVE SSO. Updates .env in place with the new access and
 * refresh tokens.
 *
 * Prerequisites:
 *   - ESI_SSO_CLIENT_ID and ESI_REFRESH_TOKEN must be set in .env
 *   - Run `npm run token:create` first if you don't have these
 *
 * Usage: npm run token:refresh
 */
import * as fs from 'fs';
import * as path from 'path';

const EVE_SSO_TOKEN_URL = 'https://login.eveonline.com/v2/oauth/token';
const ENV_FILE = path.resolve(__dirname, '..', '.env');

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface TokenError {
  error: string;
  error_description?: string;
}

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
  fs.writeFileSync(ENV_FILE, content.replace(/\n+$/, '\n'));
}

async function main() {
  const envVars = readEnvFile();
  const clientId = envVars.get('ESI_SSO_CLIENT_ID');
  const refreshToken = envVars.get('ESI_REFRESH_TOKEN');

  if (!clientId) {
    console.error(
      'ESI_SSO_CLIENT_ID not found in .env — run `npm run token:create` first.',
    );
    process.exit(1);
  }
  if (!refreshToken) {
    console.error(
      'ESI_REFRESH_TOKEN not found in .env — run `npm run token:create` first.',
    );
    process.exit(1);
  }

  console.log('Refreshing ESI access token...');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const response = await fetch(EVE_SSO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const body = (await response.json()) as TokenResponse | TokenError;

  if ('error' in body) {
    console.error(`Token refresh failed: ${body.error}`);
    if (body.error_description) {
      console.error(`  ${body.error_description}`);
    }
    console.error(
      '\nYour refresh token may have expired. Run `npm run token:create` to get a new one.',
    );
    process.exit(1);
  }

  envVars.set('ESI_ACCESS_TOKEN', body.access_token);
  envVars.set('ESI_REFRESH_TOKEN', body.refresh_token);
  writeEnvFile(envVars);

  const payload = JSON.parse(
    Buffer.from(body.access_token.split('.')[1]!, 'base64').toString(),
  );
  const expiry = new Date(payload.exp * 1000);

  console.log(`Token refreshed for ${payload.name} (${payload.sub})`);
  console.log(`Expires: ${expiry.toLocaleString()} (${body.expires_in}s)`);
  console.log('.env updated.');
}

main();
