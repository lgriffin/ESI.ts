Feature: Token Management
  EVE SSO access tokens live for twenty minutes and every authenticated ESI
  call needs a current one. Before this feature, each consumer wrote the same
  code: exchange an authorization code, store the refresh token, notice expiry,
  call the SSO token endpoint, persist the rotated refresh token, and repeat
  for every character. This file specifies the library's replacement for that
  boilerplate: an EveSsoClient that speaks to login.eveonline.com, an
  ITokenStorage contract with in-memory and file-backed adapters, and an
  EsiTokenManager that keeps one valid token per character, refreshes in
  bulk with a concurrency cap, and hands a ready-made EsiClient to callers.

  All SSO traffic is mocked at the fetch seam, so the EveSsoClient, the
  EsiTokenManager, and the storage adapters all execute for real.

  # ── SSO client ──────────────────────────────────────────────────────

  Rule: When an authorization code is exchanged, the SSO client shall POST a grant_type=authorization_code request to the token endpoint and return the access token, refresh token and expiry from the response.
    The token endpoint is https://login.eveonline.com/v2/oauth/token and it
    only accepts form-encoded bodies. The expiry is returned by SSO as a
    lifetime in seconds; the client passes it through unchanged so the caller
    decides how to anchor it to wall-clock time.

    Scenario: Confidential client exchanges a code using HTTP Basic credentials
      Given an SSO client configured with a client id and client secret
      And the SSO token endpoint returns a token response
      When the client exchanges the authorization code "abc123"
      Then the request shall be a form-encoded POST to the SSO token endpoint
      And the request shall carry an HTTP Basic Authorization header for the client id and secret
      And the result shall contain the access token, refresh token and expiry from the response

  Rule: Where no client secret is configured, the SSO client shall authenticate token requests with the client_id and code_verifier form fields instead of an Authorization header.
    Desktop and CLI applications cannot keep a secret, so EVE SSO supports
    PKCE for them. The token request then identifies the application by
    client_id in the body and proves possession of the code with the PKCE
    verifier that generated the challenge in the authorization URL.

    Scenario: Public client exchanges a code using PKCE
      Given an SSO client configured with a client id only
      And the SSO token endpoint returns a token response
      When the client exchanges the authorization code "abc123" with a PKCE verifier
      Then the request shall carry no Authorization header
      And the request body shall include the client_id and the code_verifier

  Rule: When an authorization code is exchanged, the SSO client shall send the redirect URI that obtained the code as the redirect_uri form field.
    OAuth2 requires the token request to repeat the redirect_uri from the
    authorization request when one was sent, and every login URL this client
    builds sends one. The configured callbackUrl is the default and a
    per-request override wins, matching getAuthorizationUrl. When neither is
    set the field is omitted, because EVE SSO does not demand it.

    Scenario: Code exchange sends the configured callback as redirect_uri
      Given an SSO client configured with a client id, client secret and a callback URL
      And the SSO token endpoint returns a token response
      When the client exchanges the authorization code "abc123"
      Then the request body shall carry the redirect_uri "https://app.example/callback"

    Scenario: Per-request redirect URI overrides the configured callback
      Given an SSO client configured with a client id, client secret and a callback URL
      And the SSO token endpoint returns a token response
      When the client exchanges the authorization code "abc123" with the redirect URI "https://app.example/other"
      Then the request body shall carry the redirect_uri "https://app.example/other"

  Rule: If the SSO token endpoint responds to a refresh with the error code invalid_grant, then the SSO client shall throw TokenRevokedError.
    invalid_grant is how SSO reports a refresh token that has been revoked by
    the player, expired through disuse, or superseded by a rotation the
    application failed to persist. Retrying cannot help; the character has to
    log in again. A dedicated error type lets callers route to that outcome
    without parsing the response body.

    Scenario: Refreshing a revoked refresh token throws TokenRevokedError
      Given an SSO client configured with a client id and client secret
      And the SSO token endpoint responds 400 with error code "invalid_grant"
      When the client refreshes the refresh token "stale-refresh"
      Then the client shall throw TokenRevokedError

  Rule: If the SSO token endpoint responds to an authorization-code exchange with the error code invalid_grant, then the SSO client shall throw SsoError carrying that error code rather than TokenRevokedError.
    On a code exchange, invalid_grant means the login code expired, was
    already used, or was issued for a different redirect URI. No stored
    refresh token was involved, so reporting it as a revocation would send
    the caller down the re-authentication path for the wrong reason.

    Scenario: Expired login code is reported as SsoError with code invalid_grant
      Given an SSO client configured with a client id and client secret
      And the SSO token endpoint responds 400 with error code "invalid_grant"
      When the client exchanges the authorization code "expired" and the error is captured
      Then the client shall throw SsoError with status 400 and error code "invalid_grant"

  Rule: If the SSO token endpoint responds 2xx with a body that is not a JSON object holding access_token and refresh_token, then the SSO client shall throw SsoError with error code invalid_response.
    A proxy or an outage page can answer the token endpoint with HTML, an
    empty body, or a JSON value that is not an object. Those failures belong
    to the same error family as any other SSO fault so that a caller
    catching SsoError sees them, instead of a raw SyntaxError or TypeError
    escaping from the JSON parser.

    Scenario: HTML success body is reported as SsoError with code invalid_response
      Given an SSO client configured with a client id and client secret
      And the SSO token endpoint responds 200 with the body "<html>ok</html>"
      When the client refreshes the refresh token "any-refresh"
      Then the client shall throw SsoError with status 200 and error code "invalid_response"

    Scenario: JSON null success body is reported as SsoError with code invalid_response
      Given an SSO client configured with a client id and client secret
      And the SSO token endpoint responds 200 with the body "null"
      When the client refreshes the refresh token "any-refresh"
      Then the client shall throw SsoError with status 200 and error code "invalid_response"

  Rule: If the SSO token endpoint responds with a non-2xx status other than invalid_grant, then the SSO client shall throw SsoError carrying that status code and the SSO error code.
    Everything else the token endpoint can say — invalid_client, a 429 from
    SSO's own rate limiter, a 5xx outage — is surfaced with enough detail to
    decide between fixing configuration and trying again later.

    Scenario: SSO rate limit response is surfaced with status 429
      Given an SSO client configured with a client id and client secret
      And the SSO token endpoint responds 429 with error code "rate_limited"
      When the client refreshes the refresh token "any-refresh"
      Then the client shall throw SsoError with status 429 and error code "rate_limited"

  Rule: Where a request timeout is configured, if SSO does not respond within it, then the SSO client shall reject with a retryable SsoError.
    A request that SSO never answers would otherwise keep a refresh pending
    for as long as the connection stays open. Under a locking store the hung
    refresh holds the character's lock, so a waiter breaks it after staleMs
    and spends a refresh token SSO may already have rotated. The timeout
    covers the response body as well as the headers. Status 0 means no HTTP
    response arrived; the error code is timeout.

    Scenario: Refresh that SSO never answers is rejected as a retryable timeout
      Given an SSO client configured with a request timeout of 50 ms
      And the SSO token endpoint never responds
      When the client refreshes the refresh token "any-refresh"
      Then the client shall throw SsoError with status 0 and error code "timeout"
      And the error shall be retryable

    Scenario: Token response whose body stalls is rejected as a retryable timeout
      Given an SSO client configured with a request timeout of 50 ms
      And the SSO token endpoint responds 200 but never finishes the body
      When the client refreshes the refresh token "any-refresh"
      Then the client shall throw SsoError with status 0 and error code "timeout"
      And the error shall be retryable

  Rule: Where no request timeout is configured, the SSO client shall send token requests without an abort signal.
    The timeout is opt-in so that existing callers see no change: a slow SSO
    is waited for exactly as before.

    Scenario: Refresh without a configured timeout carries no abort signal
      Given an SSO client configured with a client id and client secret
      And the SSO token endpoint returns a token
      When the client refreshes the refresh token "any-refresh"
      Then the token request shall carry no abort signal

  Rule: If the configured request timeout is not a positive, finite number, then the SSO client shall throw RangeError when constructed.
    A zero, negative or NaN timeout would abort every request at once or
    never; both are configuration mistakes better reported up front.

    Scenario: Zero request timeout is rejected at construction
      When an SSO client is constructed with a request timeout of 0 ms
      Then construction shall throw RangeError naming timeoutMs

  # ── Token manager: registration ─────────────────────────────────────

  Rule: When a character is added from an authorization code, the token manager shall decode the character id, name and scopes from the access token and persist the token under that character id.
    The access token is a JWT whose sub claim is CHARACTER:EVE:<id>, whose
    name claim is the character name, and whose scp claim lists the granted
    scopes. Reading these from the token avoids a round trip to the
    deprecated verify endpoint and means the caller never has to say which
    character just logged in.

    Scenario: Adding a character stores its decoded identity and scopes
      Given a token manager backed by in-memory storage
      And the SSO token endpoint returns a token for character 2114794365 "Aurora Vale" with scopes "esi-wallet.read_character_wallet.v1 esi-assets.read_assets.v1"
      When the character is added from the authorization code "abc123"
      Then the storage shall hold a token for character 2114794365 named "Aurora Vale"
      And the stored scopes shall be "esi-wallet.read_character_wallet.v1 esi-assets.read_assets.v1"

  Rule: If token verification is not enabled and an access token from SSO carries a signature that EVE SSO's published keys do not verify, then the token manager shall not reject the token.
    By default the token manager decodes the claims without verifying the
    signature: the token arrives straight from SSO's token endpoint over TLS,
    which is what vouches for it (AUTHENTICATION.md, "Guarantees and limits").
    Verification is opt-in through verifyTokens, so the default path never
    fetches keys when a character is added.

    Scenario: A token whose signature SSO never made is stored under its character
      Given a token manager backed by in-memory storage
      And the SSO token endpoint returns a token for character 2114794365 "Aurora Vale" whose signature SSO never made
      When the character is added from the authorization code "abc123"
      Then the storage shall hold a token for character 2114794365 named "Aurora Vale"
      And the token manager sent the token exchange request alone

  # ── Token manager: opt-in JWKS verification ─────────────────────────

  Rule: Where token verification is enabled, the token manager shall store a character whose access token signature verifies against a key in EVE SSO's published key set.
    Applications that accept tokens from a third party (a proxy, a browser
    login handing the token to a backend) cannot rely on TLS to SSO, so they
    turn on verifyTokens. The manager fetches the key set from
    login.eveonline.com/oauth/jwks and checks the RS256 signature before it
    trusts the sub, name, scp and owner claims.

    Scenario: A token signed by SSO's published key is stored
      Given a token manager with token verification enabled
      And EVE SSO publishes its current signing key
      And the SSO token endpoint returns a token for character 2114794365 "Aurora Vale" signed by SSO's current key
      When the character is added from the authorization code "abc123"
      Then the storage shall hold a token for character 2114794365 named "Aurora Vale"
      And the token manager fetched EVE SSO's key set once

  Rule: If token verification is enabled and an imported access token's signature does not match its header and payload, then the token manager shall reject the import with TokenVerificationError and store nothing.
    A tampered payload is the attack verification exists for: someone edits
    the sub claim to claim another character and keeps the original
    signature. The signature no longer covers the bytes, so the import fails
    before anything reaches storage.

    Scenario: An imported token whose payload was edited after signing is rejected
      Given a token manager with token verification enabled
      And EVE SSO publishes its current signing key
      When a token signed by SSO's current key is imported with its character id changed to 90000001
      Then the import shall be rejected with TokenVerificationError for reason "signature"
      And the storage shall hold no tokens

  Rule: When token verification is enabled and an access token names a key id absent from the cached key set, the token manager shall fetch EVE SSO's key set again before verifying the token.
    SSO rotates its signing key. A cached key set that predates the rotation
    does not hold the new key id, so the manager refetches once instead of
    rejecting a token SSO signed legitimately. Refetches are limited to one
    per minute so a stream of made-up key ids cannot hammer the endpoint.

    Scenario: A token signed by a rotated key is accepted after a refetch
      Given a token manager with token verification enabled
      And the token manager cached EVE SSO's key set before SSO rotated its signing key
      And the SSO token endpoint returns a token for character 2114794365 "Aurora Vale" signed by SSO's rotated key
      When the character is added from the authorization code "abc123"
      Then the storage shall hold a token for character 2114794365 named "Aurora Vale"
      And the token manager fetched EVE SSO's key set twice

  Rule: If token verification is enabled and an imported access token's exp claim is in the past, then the token manager shall reject the import with TokenVerificationError and store nothing.
    A validly signed token stops being evidence of a login once it expires,
    so it cannot vouch for the refresh token handed over with it. Callers
    migrating stale tokens from another tool leave verification off for the
    import, or refresh first.

    Scenario: An imported token that expired is rejected
      Given a token manager with token verification enabled
      And EVE SSO publishes its current signing key
      When a token signed by SSO's current key that expired 300 seconds ago is imported
      Then the import shall be rejected with TokenVerificationError for reason "expired"
      And the storage shall hold no tokens

  Rule: If token verification is enabled and an imported access token's aud claim does not name the configured client id, then the token manager shall reject the import with TokenVerificationError.
    SSO signs tokens for every application with the same key, so a valid
    signature alone does not show the token was issued to this application.
    A token issued to another client id is the case a backend accepting
    third-party tokens has to refuse.

    Scenario: A token issued to another application is rejected
      Given a token manager with token verification enabled
      And EVE SSO publishes its current signing key
      When a token signed by SSO's current key for the client id "someone-elses-app" is imported
      Then the import shall be rejected with TokenVerificationError for reason "audience"
      And the storage shall hold no tokens

  Rule: When a character that already has a stored token is added again, the token manager shall replace the stored token rather than storing a second entry.
    Storage is keyed by character id, so a re-authorization never accumulates
    duplicate rows the way an append-only token table can. The newest consent
    wins even when it grants fewer scopes, because it reflects what the player
    most recently agreed to.

    Scenario: Re-authorizing a character replaces the previous token
      Given a token manager backed by in-memory storage
      And character 2114794365 is already stored with refresh token "old-refresh"
      And the SSO token endpoint returns a token for character 2114794365 "Aurora Vale" with refresh token "new-refresh"
      When the character is added from the authorization code "abc123"
      Then the storage shall hold exactly one token
      And the stored refresh token for character 2114794365 shall be "new-refresh"

  # ── Token manager: getToken ─────────────────────────────────────────

  Rule: When a token is requested for a character whose access token expires within the refresh skew, the token manager shall refresh it through SSO before returning.
    A token that expires in the next few seconds will fail by the time the
    request reaches ESI, costing a 401 against the error budget. Refreshing
    ahead of expiry, by a configurable skew that defaults to sixty seconds,
    means the token handed to the caller is usable for the whole request.

    Scenario: Token within the skew window is refreshed before it is returned
      Given a token manager backed by in-memory storage with a refresh skew of 60 seconds
      And character 2114794365 is stored with an access token expiring in 30 seconds
      And the SSO token endpoint returns a token for character 2114794365 with access token "fresh-access"
      When a token is requested for character 2114794365
      Then the returned access token shall be "fresh-access"
      And the SSO token endpoint shall have been called 1 time

    Scenario: Token outside the skew window is returned without contacting SSO
      Given a token manager backed by in-memory storage with a refresh skew of 60 seconds
      And character 2114794365 is stored with an access token expiring in 600 seconds
      When a token is requested for character 2114794365
      Then the returned access token shall be the stored access token
      And the SSO token endpoint shall have been called 0 times

  Rule: While a refresh is in flight for a character, the token manager shall return the same pending refresh to every concurrent caller for that character.
    EVE SSO rotates the refresh token on every use, so two overlapping
    refreshes of the same character would each receive a different rotation
    and whichever is persisted second invalidates the other. Coalescing
    concurrent callers onto a single SSO call removes that race inside one
    process.

    Scenario: Five concurrent token requests produce a single SSO call
      Given a token manager backed by in-memory storage with a refresh skew of 60 seconds
      And character 2114794365 is stored with an access token expiring in 30 seconds
      And the SSO token endpoint returns a token for character 2114794365 with access token "fresh-access"
      When 5 tokens are requested concurrently for character 2114794365
      Then every returned access token shall be "fresh-access"
      And the SSO token endpoint shall have been called 1 time

  Rule: When a refresh succeeds, the token manager shall persist the rotated refresh token before returning the new access token.
    The rotated refresh token is the only credential that can obtain the next
    access token. Persisting it before the caller regains control means a
    crash after the refresh cannot leave storage holding a refresh token SSO
    has already invalidated.

    Scenario: Rotated refresh token is in storage when the refresh resolves
      Given a token manager backed by in-memory storage with a refresh skew of 60 seconds
      And character 2114794365 is stored with an access token expiring in 30 seconds
      And the SSO token endpoint returns a token for character 2114794365 with refresh token "rotated-refresh"
      When a token is requested for character 2114794365
      Then the stored refresh token for character 2114794365 shall be "rotated-refresh"

  Rule: If SSO reports the refresh token as invalid, then the token manager shall mark the character as revoked and reject later token requests for that character without calling SSO.
    Once SSO has rejected a refresh token, every further attempt with it will
    fail the same way and each one counts against SSO's rate limit. Recording
    the revocation turns the failure into a fast local error until the
    character is added again.

    Scenario: Revoked character is rejected locally on the next request
      Given a token manager backed by in-memory storage with a refresh skew of 60 seconds
      And character 2114794365 is stored with an access token expiring in 30 seconds
      And the SSO token endpoint responds 400 with error code "invalid_grant"
      When a token is requested for character 2114794365 and the error is captured
      And a token is requested again for character 2114794365 and the error is captured
      Then both requests shall have thrown TokenRevokedError
      And the SSO token endpoint shall have been called 1 time

  Rule: If a character is removed while its refresh is in flight, then the token manager shall discard the refresh result and reject the refresh with CharacterNotFoundError.
    A refresh holds the SSO round trip open for hundreds of milliseconds.
    Deleting the character in that window is a deliberate act, and the
    late-arriving token must not resurrect the record; it would hold a
    rotated refresh token the operator believes is gone.

    Scenario: Refresh completing after removal leaves storage empty
      Given a token manager backed by in-memory storage with a refresh skew of 60 seconds
      And character 2114794365 is stored with an access token expiring in 30 seconds
      And the SSO token endpoint returns a token for character 2114794365 after the removal completes
      When a refresh is started for character 2114794365 and the character is removed before SSO responds
      Then the refresh shall reject with CharacterNotFoundError
      And the storage shall hold no token for character 2114794365

  Rule: If a character is added again while its refresh is in flight, then the token manager shall keep the newly stored token rather than overwriting it with the refresh result.
    A player re-authorizing during a refresh produces two rotations: the
    refresh's and the new login's. The login is the newer consent and the
    only one whose refresh token SSO still honours, so the stale refresh
    yields to it and hands its caller the current record.

    Scenario: Refresh completing after re-authorization keeps the new refresh token
      Given a token manager backed by in-memory storage with a refresh skew of 60 seconds
      And character 2114794365 is stored with an access token expiring in 30 seconds
      And the SSO token endpoint returns refresh token "rotated-old" to the refresh and "new-login" to the code exchange
      When a refresh is started for character 2114794365 and the character is added again before SSO responds
      Then the stored refresh token for character 2114794365 shall be "new-login"
      And the refresh shall resolve with the refresh token "new-login"

  Rule: Where the storage adapter provides a lock, when a refresh acquires the lock after another holder has rotated the stored refresh token, the token manager shall return the stored token without calling SSO.
    Coalescing only reaches callers inside one manager. Two processes on one
    store each have their own manager, and whichever persisted its rotation
    second would leave the other holding a refresh token SSO has already
    spent. Under the lock the second refresh reads the store again, sees the
    rotation and hands out that token instead of spending it.

    Scenario: Two managers on one locked file store produce a single SSO call
      Given two token managers each opening the same file token storage with locking enabled
      And character 2114794365 is stored with an access token expiring in 30 seconds
      And the SSO token endpoint returns a token for character 2114794365 with access token "fresh-access" after a delay
      When both managers request a token for character 2114794365 at the same time
      Then both managers shall return the access token "fresh-access"
      And the SSO token endpoint shall have been called 1 time

  Rule: Where the storage adapter provides no lock, the token manager shall refresh through SSO without reading the stored token a second time.
    The lock is an optional part of the storage contract. Adapters written
    before it existed keep their behaviour and their number of storage reads.

    Scenario: Refresh on a storage without a lock reads the token once
      Given a token manager backed by storage without a lock that counts reads
      And character 2114794365 is stored with an access token expiring in 30 seconds
      And the SSO token endpoint returns a token for character 2114794365 with access token "fresh-access"
      When the token manager refreshes character 2114794365
      Then the storage shall have been read 1 time
      And the SSO token endpoint shall have been called 1 time

  # ── Token manager: client integration ───────────────────────────────

  Rule: When a client is created for a character, the token manager shall configure that client with the character's current access token and a refresh provider bound to that character.
    The manager is the source of truth for tokens; the EsiClient stays
    unaware of storage or SSO. Binding the refresh provider to the character
    means the existing 401-refresh-retry path in the request pipeline
    replays a request with a token the manager just obtained and persisted.

    Scenario: Client created by the manager refreshes through the manager on a 401
      Given a token manager backed by in-memory storage with a refresh skew of 60 seconds
      And character 2114794365 is stored with an access token expiring in 600 seconds
      And the SSO token endpoint returns a token for character 2114794365 with access token "fresh-access"
      And the ESI endpoint responds 401 to the stored access token and 200 to "fresh-access"
      When a client is created for character 2114794365 and it fetches the character's wallet
      Then the wallet request shall succeed
      And the stored access token for character 2114794365 shall be "fresh-access"

  # ── Bulk refresh ────────────────────────────────────────────────────

  Rule: When a bulk refresh runs with a concurrency limit, the token manager shall keep the number of simultaneous SSO refresh requests at or below that limit.
    SSO applies its own rate limit that is not part of the ESI error budget
    and is not published in the OpenAPI spec. A corporation tool holding
    hundreds of tokens needs to bound how hard it hits the token endpoint;
    the default limit is five.

    Scenario: Twenty tokens refreshed with a limit of three never exceed three in flight
      Given a token manager backed by in-memory storage
      And 20 characters are stored with access tokens expiring in 30 seconds
      And the SSO token endpoint returns a token for each refresh after a short delay
      When refreshAll runs with a concurrency of 3
      Then the peak number of simultaneous SSO requests shall be at most 3
      And every result shall have status "refreshed"

  Rule: If one token fails to refresh during a bulk refresh, then the token manager shall report that failure in its result and continue refreshing the remaining tokens.
    A single revoked or broken token must not abort a scheduled bulk refresh
    for an alliance's worth of characters. The method never rejects; each
    character gets its own result with a status and, on failure, the error.

    Scenario: One revoked token among three is reported while the other two refresh
      Given a token manager backed by in-memory storage
      And 3 characters are stored with access tokens expiring in 30 seconds
      And the SSO token endpoint responds invalid_grant for the second character's refresh token
      When refreshAll runs with a concurrency of 3
      Then the result for the second character shall have status "revoked"
      And the results for the other characters shall have status "refreshed"

  Rule: If a refresh during a bulk refresh fails with an SSO 429 or 5xx status, then the token manager shall flag that result as retryable.
    A rate-limited or outage response says nothing about the token itself.
    Marking those failures retryable lets a scheduler pick them up on its
    next pass while leaving revoked tokens for re-authentication.

    Scenario: SSO 429 during bulk refresh yields a retryable failure
      Given a token manager backed by in-memory storage
      And 1 character is stored with an access token expiring in 30 seconds
      And the SSO token endpoint responds 429 with error code "rate_limited"
      When refreshAll runs with a concurrency of 3
      Then the result for the first character shall have status "failed" and be retryable

  Rule: Where an SSO timeout is configured on the token manager, if SSO does not answer a refresh within it during a bulk refresh, then the token manager shall flag that result as retryable.
    The manager passes ssoTimeoutMs to the SSO client it builds, so a hung
    refresh ends and is reported like an SSO outage: the caller can retry the
    character later.

    Scenario: SSO that never answers during bulk refresh yields a retryable failure
      Given a token manager backed by in-memory storage with an SSO timeout of 50 ms
      And 1 character is stored with an access token expiring in 30 seconds
      And the SSO token endpoint never responds
      When refreshAll runs with a concurrency of 3
      Then the result for the first character shall have status "failed" and be retryable
      And the failure shall be an SsoError with error code "timeout"

  Rule: Where an expiringWithinMs threshold is given, the token manager shall refresh only tokens whose expiry falls within that window and report the others as skipped.
    Refreshing a token that has fifteen minutes left wastes an SSO call and a
    rotation. A staleness window lets a scheduler that runs every five
    minutes refresh only what will expire before its next run.

    Scenario: Only the token inside the five-minute window is refreshed
      Given a token manager backed by in-memory storage
      And character 2114794365 is stored with an access token expiring in 120 seconds
      And character 95465499 is stored with an access token expiring in 1200 seconds
      And the SSO token endpoint returns a token for each refresh after a short delay
      When refreshAll runs with an expiringWithinMs of 300000
      Then the result for character 2114794365 shall have status "refreshed"
      And the result for character 95465499 shall have status "skipped"
      And the SSO token endpoint shall have been called 1 time

  Rule: If a progress callback throws during a bulk refresh, then the token manager shall continue refreshing the remaining tokens and resolve with a result for every character.
    Progress reporting is a courtesy to the caller, not part of the refresh.
    A bug in a progress bar must not strand characters without a result or
    turn a bulk operation that isolates failures into a rejection.

    Scenario: Throwing progress callback does not stop the run
      Given a token manager backed by in-memory storage
      And 3 characters are stored with access tokens expiring in 30 seconds
      And the SSO token endpoint returns a token for each refresh after a short delay
      When refreshAll runs with a progress callback that throws
      Then the run shall resolve with 3 results of status "refreshed"

  Rule: If a bulk refresh is given a concurrency that is not a finite number, then the token manager shall run with the default concurrency of five and report every character.
    concurrency is a public option that can arrive from configuration files
    and environment variables, where NaN and Infinity are one typo away.
    Zero workers would return sparse results and an infinite worker array
    would throw. Falling back to the default keeps the run's contract intact.

    Scenario: NaN concurrency refreshes every character
      Given a token manager backed by in-memory storage
      And 3 characters are stored with access tokens expiring in 30 seconds
      And the SSO token endpoint returns a token for each refresh after a short delay
      When refreshAll runs with a concurrency of NaN
      Then the run shall resolve with 3 results of status "refreshed"

  Rule: If the storage adapter fails to list tokens, then a bulk refresh shall reject with that storage error.
    Per-character failures are isolated because every character still gets
    a result. A storage that cannot be enumerated yields no characters to
    report on, and swallowing a disk or database fault would make a
    scheduler believe an empty run succeeded. This is the one rejection the
    bulk refresh makes, and its documentation says so.

    Scenario: Failing storage list rejects the bulk refresh with the storage error
      Given a token manager whose storage fails to list tokens with "disk unavailable"
      When refreshAll runs and the error is captured
      Then the bulk refresh shall have rejected with the message "disk unavailable"

  # ── File storage ────────────────────────────────────────────────────

  Rule: The file token storage shall return from a new instance on the same path every token written by a previous instance.
    Persistence across process restarts is the whole point of a file adapter.
    Writes go to a temporary file that is renamed into place, so a crash
    mid-write leaves the previous file intact rather than a truncated one.

    Scenario: Tokens written by one instance are read back by another
      Given a file token storage on a temporary path
      And a token for character 2114794365 is written to it
      When a second file token storage is opened on the same path
      Then the second storage shall return the token for character 2114794365
      And the second storage shall list exactly 1 token

  Rule: If the token file holds an entry that lacks a required field, then the file token storage shall ignore that entry and return the remaining tokens.
    Only entries with the full StoredToken shape can be handed to the
    manager; a record with a numeric id but no scopes array would crash the
    first get() or list() that copies it. Skipping the malformed entry keeps
    the healthy tokens usable and leaves the file untouched until the next
    write.

    Scenario: Entry without scopes is skipped while the valid token is returned
      Given a token file holding a valid token for character 2114794365 and an entry for character 95465499 without scopes
      When a file token storage is opened on that file
      Then the storage shall list exactly 1 token
      And the storage shall return the token for character 2114794365

  Rule: If the file token storage is invalidated while a read is in progress, then the storage shall serve the next request from a fresh read of the file.
    invalidate() exists so an operator can pick up an external edit. A read
    that started before the call must not reinstate its stale map after the
    call, or the next caller sees the very data invalidate() was asked to
    drop.

    Scenario: Read started before invalidate does not repopulate the cache
      Given a file token storage on a temporary path holding a token for character 2114794365
      And the file read is delayed
      When a list is started, the storage is invalidated and the file gains a token for character 95465499 before the read finishes
      Then the next list shall return 2 tokens

  Rule: Where locking is enabled, the file token storage shall keep every token that another instance on the same path wrote when it writes a different character.
    A process that wrote from its own copy of the file would put back the
    refresh token another process had just rotated. With locking on, each
    write reads the file under the lock and changes only its own entry.

    Scenario: Locked instances writing different characters keep both tokens
      Given two file token storages on the same temporary path with locking enabled
      When the first storage writes character 2114794365 and the second writes character 95465499 at the same time
      Then a new file token storage on that path shall list 2 tokens

  Rule: If the lock file is older than the stale timeout, then the file token storage shall break the lock and complete the write.
    A process that crashes while holding the lock leaves the lock file
    behind. Without a timeout every other process would wait on it forever;
    the timeout must exceed the longest time a live holder keeps the lock.

    Scenario: Lock left by a crashed holder is broken
      Given a file token storage on a temporary path with locking enabled and a stale timeout of 1000 ms
      And a lock file acquired 5000 ms ago is present
      When a token for character 2114794365 is written to the locked storage
      Then the locked storage shall return the token for character 2114794365
      And no lock file shall remain

  Rule: If the lock is held by a live holder for longer than the lock timeout, then the file token storage shall reject the write with an error naming the lock file.
    A caller blocked indefinitely on a lock cannot report anything. Failing
    after the timeout surfaces the stuck holder, and the token file is left
    as it was.

    Scenario: Write gives up on a lock that stays held
      Given a file token storage on a temporary path with locking enabled and a lock timeout of 100 ms
      And a lock file acquired just now is present
      When a token for character 2114794365 is written to the locked storage and the error is captured
      Then the write shall have rejected with a message naming the lock file
      And the token file shall not exist
