/**
 * Supplies an access token for authenticated requests. Called when a request
 * needs a token and after a 401, so it returns the current token, refreshing
 * it first when it has expired. The same shape as the `onTokenRefresh` option.
 */
export type TokenProvider = () => Promise<string>;
