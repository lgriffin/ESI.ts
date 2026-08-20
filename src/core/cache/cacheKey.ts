import { createHash } from 'crypto';
import { ApiClient } from '../ApiClient';

export function buildCacheKey(
  url: string,
  client: ApiClient,
  requiresAuth: boolean = false,
): string {
  if (!requiresAuth) return url;
  const authHeader = client.getAuthorizationHeader();
  if (!authHeader) return url;
  const hash = createHash('sha256')
    .update(authHeader)
    .digest('hex')
    .slice(0, 16);
  return `${hash}:${url}`;
}
