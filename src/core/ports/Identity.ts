/**
 * Who a request is made as: the source of the bearer token a view of the
 * shared runtime sends, and of the replacement after ESI rejects one.
 *
 * `esi.as(identity)` takes one of these. `EsiTokenManager.identity(id)`
 * builds one over a stored character; `identityFromToken` wraps a raw
 * access token; `identityFromProvider` wraps a `TokenProvider`. Anything
 * with these members works, so a session store or a secrets manager can
 * implement it directly.
 */
export interface Identity {
  /**
   * The EVE character the tokens belong to, when the holder knows it. For
   * diagnostics only: the pipeline keys its cache by the character the token
   * itself names, so a wrong value here misleads nobody but a log reader.
   */
  readonly characterId?: number;
  /**
   * The access token to send now. Asked before every request, so a holder
   * that knows its token is about to expire refreshes first and hands out the
   * new one; a holder that cannot know returns what it has.
   */
  accessToken(): Promise<string>;
  /**
   * A new access token after ESI answered 401 to the current one. Left out
   * when the identity cannot refresh (a raw token): the 401 is then the
   * caller's answer, after a single request.
   */
  refreshAccessToken?(): Promise<string>;
}
