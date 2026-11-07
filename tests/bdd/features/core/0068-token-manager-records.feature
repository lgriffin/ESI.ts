Feature: Token manager records, hooks and bulk results
  The token manager keeps one record per character: the tokens, their
  expiry, the scopes and owner hash, and whether SSO has revoked the refresh
  token. Applications read those records back, are told about refreshes
  through hooks and the logger, and refresh many characters at once with
  refreshAll. 0054-token-management.feature covers the refresh flow itself;
  this file covers what the manager records and reports around it.

  The scenarios run a token manager over in-memory storage with a clock they
  hold still, a recording logger and recording hooks. EVE SSO's token and
  revoke endpoints are answered at the transport seam.

  # ── What a stored record holds ─────────────────────────────────────

  Rule: When a token is imported with an expiry in seconds, the token manager shall store its expiry as the current time plus that number of seconds.
    SSO's token response gives expires_in in seconds; the record keeps an
    absolute time in milliseconds so a later read needs no reference point.

    Scenario: A token imported with 600 seconds left expires 600 seconds from now
      Given a token manager
      When a token for character 90000001 is imported with an expiry of 600 seconds
      Then the stored token for character 90000001 shall expire 600000 ms after the manager's current time

  Rule: When a token is imported without an expiry, the token manager shall store the expiry its access token's exp claim names.
    A token migrated from another tool may come without expires_in. The
    access token itself still says when it expires.

    Scenario: A token imported without an expiry takes it from the access token
      Given a token manager
      When a token for character 90000001 is imported without an expiry
      Then the stored token for character 90000001 shall expire when its access token's exp claim says

  Rule: When a token is imported whose access token carries an owner claim, the token manager shall store that owner hash.
    The owner hash changes when a character moves to another account, which
    is how an application notices a character it no longer has rights to.

    Scenario: The owner claim is stored as the owner hash
      Given a token manager
      When a token for character 90000001 owned by "owner-xyz" is imported
      Then the stored token for character 90000001 shall have the owner hash "owner-xyz"

  Rule: If an imported access token carries no scp claim, then the token manager shall store the character with no scopes.
    No scopes is a valid login, limited to public endpoints.

    Scenario: A token without scopes is stored with none
      Given a token manager
      When a token for character 90000001 with no scopes is imported
      Then the stored token for character 90000001 shall have no scopes

  Rule: If the access token SSO returns on a refresh carries no scopes, then the token manager shall keep the scopes the character had.
    A refresh cannot add scopes, and an access token without a scp claim
    says nothing about which were granted, so the record keeps what the login
    granted.

    Scenario: A refresh without scopes keeps the stored scopes
      Given a token manager
      And character 90000001 is stored with the scopes "esi-wallet.read_character_wallet.v1"
      And SSO answers the next refresh with an access token that has no scopes
      When the application refreshes character 90000001
      Then the stored token for character 90000001 shall have the scopes "esi-wallet.read_character_wallet.v1"

  Rule: If the access token SSO returns on a refresh does not decode as a JWT, then the token manager shall keep the character's stored identity.
    The character's identity is already known from the login. A refresh that
    returns an opaque token, through a proxy or a future SSO format, still
    renews the character rather than failing.

    Scenario: An opaque refreshed token keeps the stored name
      Given a token manager
      And character 90000001 is stored with the name "Aurora Vale"
      And SSO answers the next refresh with the opaque access token "opaque-token"
      When the application refreshes character 90000001
      Then the stored token for character 90000001 shall have the access token "opaque-token" and the name "Aurora Vale"

  @ARCH-09
  Rule: If the access token SSO returns on a refresh does not decode as a JWT, then the token manager shall log a debug line saying it kept the stored identity.
    An opaque token is unusual, and an operator chasing an odd record needs
    to see that the identity came from storage, not from the token.

    Scenario: An opaque refreshed token is logged
      Given a token manager
      And character 90000001 is stored with the name "Aurora Vale"
      And SSO answers the next refresh with the opaque access token "opaque-token"
      When the application refreshes character 90000001
      Then the manager's log shall hold a "debug" line containing "did not decode as a JWT; keeping stored identity"

  # ── Reading records back ───────────────────────────────────────────

  Rule: When characters are listed, the token manager shall return each character's id, name, scopes, expiry and revoked flag without its tokens.
    A character list is what an application shows a user, and tokens are
    secrets that list has no reason to carry.

    Scenario: A live and a revoked character are listed
      Given a token manager
      And character 90000001 is stored with the name "Aurora Vale" and the scopes "esi-wallet.read_character_wallet.v1"
      And character 90000002 is stored with a revoked refresh token
      When the application lists the characters
      Then the character list shall hold character 90000001 "Aurora Vale" with the scopes "esi-wallet.read_character_wallet.v1", not revoked
      And the character list shall hold character 90000002, revoked
      And the character list shall carry no access or refresh token

  Rule: When asked whether a character holds a set of scopes, the token manager shall answer true only if the character's stored token grants every one of them.
    An application checks scopes before it calls an endpoint that needs
    them. A character it has no token for holds none.

    Scenario Outline: Asking for <scopes> on <character>
      Given a token manager
      And character 90000001 is stored with the scopes "esi-wallet.read_character_wallet.v1 esi-skills.read_skills.v1"
      When the application asks whether character <character> holds the scopes "<scopes>"
      Then the answer shall be <answer>

      Examples:
        | character | scopes                                                                      | answer |
        | 90000001  | esi-wallet.read_character_wallet.v1                                         | true   |
        | 90000001  | esi-wallet.read_character_wallet.v1 esi-mail.read_mail.v1                   | false  |
        | 90000009  | esi-wallet.read_character_wallet.v1                                         | false  |

  Rule: When the application asks for a character's identity more than once, the token manager shall return the same identity object each time.
    esi.as() keeps one view per identity object, so a new object on every
    call would build a new view on every call.

    Scenario: The identity is the same object on a second call
      Given a token manager
      When the application asks for the identity of character 90000001 twice
      Then both identities shall be the same object

  # ── Revoked refresh tokens ─────────────────────────────────────────

  @ARCH-07
  Rule: If a character's refresh token is revoked, then getToken shall reject with TokenRevokedError even while the stored access token has not expired.
    A revoked login is over. Handing out its last access token would let an
    application act for a user who withdrew consent.

    Scenario: A revoked character's unexpired token is not handed out
      Given a token manager
      And character 90000002 is stored with a revoked refresh token and an access token valid for 20 minutes
      When the application asks for the access token of character 90000002
      Then the call shall reject with TokenRevokedError for character 90000002

  @ARCH-07
  Rule: If a character's refresh token is revoked, then refresh shall reject with TokenRevokedError without calling SSO.
    SSO would refuse the revoked token again; asking costs a request and a
    rate-limit slot for a known answer.

    Scenario: Refreshing a revoked character sends nothing
      Given a token manager
      And character 90000002 is stored with a revoked refresh token
      When the application refreshes character 90000002
      Then the call shall reject with TokenRevokedError for character 90000002
      And no request shall have reached SSO's token endpoint

  @ARCH-07
  Rule: If SSO reports a character's refresh token invalid during a refresh, then the token manager shall reject with TokenRevokedError carrying the character id.
    The error SSO's client raises knows nothing of characters. The manager
    adds the id, so a caller refreshing several characters knows which one
    to send back to the login page.

    Scenario: A revoked refresh names the character
      Given a token manager
      And character 90000001 is stored
      And SSO answers the next refresh with HTTP 400 and the error code "invalid_grant"
      When the application refreshes character 90000001
      Then the call shall reject with TokenRevokedError for character 90000001

  @ARCH-09
  Rule: If SSO reports a character's refresh token invalid during a refresh, then the token manager shall log a warning naming the character.
    A revocation needs a person to log in again, so it is logged above the
    library's default level.

    Scenario: A revoked refresh is logged as a warning
      Given a token manager
      And character 90000001 is stored
      And SSO answers the next refresh with HTTP 400 and the error code "invalid_grant"
      When the application refreshes character 90000001
      Then the manager's log shall hold a "warn" line containing "SSO revoked refresh token for character 90000001"

  # ── Hooks and log lines ────────────────────────────────────────────

  Rule: When a refresh succeeds, the token manager shall call the onRefresh hook with the token it stored.
    An application that mirrors tokens elsewhere, or keeps a session in
    step, learns of the new token from the hook.

    Scenario: The onRefresh hook receives the new token
      Given a token manager
      And character 90000001 is stored
      And SSO answers the next refresh with a new token for character 90000001
      When the application refreshes character 90000001
      Then the onRefresh hook shall have received the stored token for character 90000001

  @ARCH-09
  Rule: When a refresh succeeds, the token manager shall log a debug line naming the character.
    Refreshes happen in the background, so the log is where an operator sees
    them.

    Scenario: A refresh is logged at debug
      Given a token manager
      And character 90000001 is stored
      And SSO answers the next refresh with a new token for character 90000001
      When the application refreshes character 90000001
      Then the manager's log shall hold a "debug" line containing "Refreshed token for character 90000001"

  Rule: If a refresh fails for a reason other than revocation, then the token manager shall call the onRefreshError hook with the character id and the error.
    A failure SSO might recover from leaves the login intact, and the hook
    lets an application count or alert on those failures.

    Scenario: An SSO outage reaches the onRefreshError hook
      Given a token manager
      And character 90000001 is stored
      And SSO answers the next refresh with HTTP 503 and the error code "server_error"
      When the application refreshes character 90000001
      Then the onRefreshError hook shall have received character 90000001 and an SsoError with status 503

  Rule: When a refresh for a character has settled, the token manager shall send that character's next refresh to SSO.
    Concurrent refreshes share one SSO request; once it settles the slot is
    cleared, or every later refresh would get the old result back.

    Scenario: Two refreshes one after the other reach SSO twice
      Given a token manager
      And character 90000001 is stored
      And SSO answers the next refresh with a new token for character 90000001
      And SSO answers the next refresh with a new token for character 90000001
      When the application refreshes character 90000001
      And the application refreshes character 90000001
      Then SSO's token endpoint shall have received 2 requests

  # ── Adding and removing characters ─────────────────────────────────

  Rule: When a character is added with a code verifier and a redirect URI, the token manager shall send both to SSO's token endpoint.
    PKCE and the redirect check both depend on SSO seeing the values the
    login started with.

    Scenario: The code verifier and redirect URI reach SSO
      Given a public-client token manager
      And SSO answers the next code exchange with a token for character 90000001
      When character 90000001 is added from the code "abc123" with the code verifier "verifier-1" and the redirect URI "https://app.example/cb"
      Then SSO's token endpoint shall have received the code verifier "verifier-1" and the redirect URI "https://app.example/cb"

  Rule: Where a character is added again with revokeReplaced, the token manager shall revoke the replaced refresh token at SSO.
    Logging a character in again leaves the old refresh token valid at SSO
    until it is revoked. revokeReplaced closes that gap.

    Scenario: The replaced refresh token is revoked
      Given a token manager
      And character 90000001 is stored with the refresh token "refresh-old"
      And SSO answers the next code exchange with a token for character 90000001
      And SSO accepts the next revocation
      When character 90000001 is added from the code "abc123" with revokeReplaced
      Then SSO's revoke endpoint shall have received the refresh token "refresh-old"

  Rule: Where a character is added again without revokeReplaced, the token manager shall leave the replaced refresh token unrevoked.
    Another process may still hold the old token. Revoking it is the
    application's choice, so the manager does not do it unasked.

    Scenario: The replaced refresh token is left alone
      Given a token manager
      And character 90000001 is stored with the refresh token "refresh-old"
      And SSO answers the next code exchange with a token for character 90000001
      When character 90000001 is added from the code "abc123"
      Then no request shall have reached SSO's revoke endpoint

  Rule: If the replaced refresh token is already revoked, then the token manager shall not revoke it again when a character is added with revokeReplaced.
    SSO has already withdrawn it; a second revocation is a wasted request.

    Scenario: A revoked replaced token is not revoked again
      Given a token manager
      And character 90000001 is stored with a revoked refresh token
      And SSO answers the next code exchange with a token for character 90000001
      When character 90000001 is added from the code "abc123" with revokeReplaced
      Then no request shall have reached SSO's revoke endpoint

  @ARCH-09
  Rule: When a character is added again with a token that grants fewer scopes, the token manager shall log a warning naming each scope the new token drops.
    A login that asked for fewer scopes silently breaks every feature that
    needed the missing ones, so the manager says which ones went.

    Scenario: A dropped scope is named
      Given a token manager
      And character 90000001 is stored with the scopes "esi-wallet.read_character_wallet.v1 esi-skills.read_skills.v1"
      And SSO answers the next code exchange with a token for character 90000001 with the scopes "esi-wallet.read_character_wallet.v1"
      When character 90000001 is added from the code "abc123"
      Then the manager's log shall hold exactly the "warn" line "Replacing token for character 90000001 drops scopes: esi-skills.read_skills.v1"

    Scenario: The same scopes log no warning
      Given a token manager
      And character 90000001 is stored with the scopes "esi-wallet.read_character_wallet.v1"
      And SSO answers the next code exchange with a token for character 90000001 with the scopes "esi-wallet.read_character_wallet.v1"
      When character 90000001 is added from the code "abc123"
      Then the manager's log shall hold no "warn" line

  Rule: Where a character is removed with revoke, the token manager shall revoke the character's refresh token at SSO.
    Removing a character from the application should end the login at SSO
    too, not leave a working refresh token behind.

    Scenario: Removing with revoke revokes at SSO
      Given a token manager
      And character 90000001 is stored with the refresh token "refresh-old"
      And SSO accepts the next revocation
      When character 90000001 is removed with revoke
      Then SSO's revoke endpoint shall have received the refresh token "refresh-old"
      And the storage shall hold no token for character 90000001

  Rule: If a character whose refresh token is already revoked is removed with revoke, then the token manager shall remove it without calling SSO.
    There is nothing left at SSO to revoke.

    Scenario: A revoked character is removed without a request
      Given a token manager
      And character 90000002 is stored with a revoked refresh token
      When character 90000002 is removed with revoke
      Then no request shall have reached SSO's revoke endpoint
      And the storage shall hold no token for character 90000002

  # ── Bulk refresh results ───────────────────────────────────────────

  Rule: Where no expiringWithinMs threshold is given, a bulk refresh shall refresh every live token, however long it has left.
    Without a threshold the caller asked for everything, for instance to
    rotate refresh tokens on a schedule.

    Scenario: A token with 20 minutes left is refreshed
      Given a token manager
      And character 90000001 is stored with an access token valid for 20 minutes
      And SSO answers the next refresh with a new token for character 90000001
      When refreshAll runs
      Then the bulk result for character 90000001 shall have the status "refreshed"

  Rule: Where an expiringWithinMs threshold is given, a bulk refresh shall refresh a token whose expiry minus the refresh skew falls exactly at the end of that window.
    The window is inclusive, so a scheduler running every five minutes with
    a five-minute window leaves no token to expire between runs.

    Scenario: A token at the edge of the window is refreshed
      Given a token manager
      And character 90000001 is stored with an access token expiring 360000 ms after the manager's current time
      And SSO answers the next refresh with a new token for character 90000001
      When refreshAll runs with expiringWithinMs 300000
      Then the bulk result for character 90000001 shall have the status "refreshed"

  Rule: Where a bulk refresh is given an aborted signal, the token manager shall report every character as skipped for reason aborted without calling SSO.
    A scheduler that is shutting down aborts the run; nothing more should
    reach SSO.

    Scenario: An aborted run skips the character
      Given a token manager
      And character 90000001 is stored
      When refreshAll runs with an aborted signal
      Then the bulk result for character 90000001 shall have the status "skipped" for reason "aborted"
      And no request shall have reached SSO's token endpoint

  @ARCH-07
  Rule: If a stored token is revoked when a bulk refresh reaches it, then the token manager shall report it as revoked and not retryable without calling SSO.
    Only a new login can fix a revoked token, so retrying it later would
    only fail again.

    Scenario: A revoked character is reported without a request
      Given a token manager
      And character 90000002 is stored with a revoked refresh token
      When refreshAll runs
      Then the bulk result for character 90000002 shall have the status "revoked" and not be retryable
      And no request shall have reached SSO's token endpoint

  @ARCH-07
  Rule: If SSO reports a refresh token invalid during a bulk refresh, then the token manager shall report that character as revoked and not retryable.
    The same reasoning as a token already marked revoked: a retry cannot
    succeed.

    Scenario: A token SSO revokes mid-run is not retryable
      Given a token manager
      And character 90000001 is stored
      And SSO answers the next refresh with HTTP 400 and the error code "invalid_grant"
      When refreshAll runs
      Then the bulk result for character 90000001 shall have the status "revoked" and not be retryable

  @ARCH-07
  Rule: If SSO refuses a refresh during a bulk refresh with a status other than 429 or 5xx, then the token manager shall report that character as failed and not retryable.
    A 400 for a malformed request will fail the same way next time; only
    rate limits and outages are worth retrying.

    Scenario: An SSO 400 is a failure that is not retryable
      Given a token manager
      And character 90000001 is stored
      And SSO answers the next refresh with HTTP 400 and the error code "invalid_request"
      When refreshAll runs
      Then the bulk result for character 90000001 shall have the status "failed" and not be retryable
