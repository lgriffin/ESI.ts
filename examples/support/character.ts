/**
 * The character an example reads data for.
 *
 * Authenticated endpoints only return a character's data to a token for that
 * character, so a hard-coded ID fails with 403 for anyone else's token. This
 * resolves the ID the same way in every example:
 *
 * 1. `ESI_CHARACTER_ID`, when set;
 * 2. otherwise the character the token in `ESI_ACCESS_TOKEN` belongs to
 *    (`decodeAccessToken` reads the claims; it does not verify the token);
 * 3. otherwise `fallback`, for an example whose public calls still run
 *    without a token;
 * 4. otherwise it stops with a message saying what to set.
 */
import { decodeAccessToken } from '../../src';

export function exampleCharacterId(fallback?: number): number {
  const fromEnv = process.env.ESI_CHARACTER_ID;
  if (fromEnv) {
    const id = Number(fromEnv);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(
        `ESI_CHARACTER_ID must be a character ID, got "${fromEnv}"`,
      );
    }
    return id;
  }
  const token = process.env.ESI_ACCESS_TOKEN;
  if (token) return decodeAccessToken(token).characterId;
  if (fallback !== undefined) return fallback;
  throw new Error(
    'This example needs a character: set ESI_ACCESS_TOKEN (npm run token:create) or ESI_CHARACTER_ID.',
  );
}
