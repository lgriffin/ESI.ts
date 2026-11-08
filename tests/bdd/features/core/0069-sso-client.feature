@ARCH-07
Feature: EVE SSO client requests and errors
  `EveSsoClient` talks to EVE SSO's OAuth2 endpoints: it builds the login
  URL, exchanges an authorization code, refreshes and revokes tokens, and
  turns every way SSO can refuse or fail into an SsoError. The token manager
  builds one, and an application can use it directly. 0054-token-management.feature
  covers the code exchange and refresh; this file covers the login URL, the
  refresh scope, revocation, client configuration and how failures read.

  The scenarios call the client directly. SSO's endpoints are answered at the
  transport seam, except where a scenario passes its own fetch.

  # ── The login URL ─────────────────────────────────────────────────

  Rule: When the SSO client builds an authorization URL, the SSO client shall carry response_type code, the redirect URI, the client id, the scopes joined by spaces and the state as query parameters.
    SSO's login page reads these to know which application asks, for what,
    and where to send the user back. The state comes back unchanged, so the
    application can match the callback to the login it started.

    Scenario: The login URL names the application, scopes and state
      Given an SSO client for the client id "app-1" with the callback URL "https://app.example/callback"
      When an authorization URL is built for the scopes "esi-wallet.read_character_wallet.v1 esi-skills.read_skills.v1" and the state "s-1"
      Then the URL shall carry the query parameters:
        """
        { "response_type": "code", "redirect_uri": "https://app.example/callback", "client_id": "app-1", "scope": "esi-wallet.read_character_wallet.v1 esi-skills.read_skills.v1", "state": "s-1" }
        """
      And the URL shall carry no "code_challenge" parameter

  Rule: Where an authorization URL is built with a code challenge, the SSO client shall carry that challenge with code_challenge_method S256.
    A public client cannot keep a secret, so PKCE stands in for one: SSO
    checks the verifier against this challenge when the code comes back.

    Scenario: The code challenge travels with its method
      Given an SSO client for the client id "app-1" with the callback URL "https://app.example/callback"
      When an authorization URL is built for the scopes "esi-wallet.read_character_wallet.v1" and the state "s-1" with the code challenge "challenge-1"
      Then the URL shall carry the query parameters:
        """
        { "code_challenge": "challenge-1", "code_challenge_method": "S256" }
        """

  Rule: Where an authorization URL is built with its own redirect URI, the SSO client shall carry that redirect URI in place of the configured callback URL.
    One application can serve several callback paths, for example one per
    deployment.

    Scenario: A redirect URI given for the login wins
      Given an SSO client for the client id "app-1" with the callback URL "https://app.example/callback"
      When an authorization URL is built for the scopes "esi-wallet.read_character_wallet.v1" and the state "s-1" with the redirect URI "https://app.example/other"
      Then the URL shall carry the query parameters:
        """
        { "redirect_uri": "https://app.example/other" }
        """

  # ── Client configuration ──────────────────────────────────────────

  Rule: If the SSO client is constructed without a client id, then the SSO client shall throw an error saying it requires one.
    Every SSO request names the application by its client id, so a client
    without one could not make any request.

    Scenario: A missing client id is refused at construction
      When an SSO client is constructed with an empty client id
      Then the construction shall throw an error saying "requires a clientId"

  Rule: Where the configured client secret is empty, the SSO client shall authenticate as a public client, sending client_id in the form and no Authorization header.
    An empty string from an unset environment variable means no secret, not
    a secret that is empty; sending Basic credentials with an empty secret
    would fail every request.

    Scenario: An empty secret makes a public client
      Given an SSO client with an empty client secret
      And SSO answers the next refresh with a new token for character 90000001
      When the SSO client refreshes "refresh-a"
      Then SSO's token endpoint shall have received the client id "test-client-id" and no Authorization header

  # ── Refresh scope ─────────────────────────────────────────────────

  Rule: Where a refresh names scopes, the SSO client shall send them joined by spaces in the scope field.
    A refresh can narrow the scopes of the new access token to the ones a
    task needs.

    Scenario: Two scopes are sent space-separated
      Given an SSO client
      And SSO answers the next refresh with a new token for character 90000001
      When the SSO client refreshes "refresh-a" asking for the scopes "esi-wallet.read_character_wallet.v1 esi-skills.read_skills.v1"
      Then SSO's token endpoint shall have received the scope "esi-wallet.read_character_wallet.v1 esi-skills.read_skills.v1"

  Rule: Where a refresh names an empty scope list, the SSO client shall send no scope field.
    An empty scope field would ask SSO for a token with no scopes; an empty
    list means the caller has nothing to narrow.

    Scenario: An empty scope list sends no scope field
      Given an SSO client
      And SSO answers the next refresh with a new token for character 90000001
      When the SSO client refreshes "refresh-a" asking for no scopes
      Then SSO's token endpoint shall have received no scope field

  # ── Revocation ────────────────────────────────────────────────────

  Rule: When the SSO client revokes a refresh token, the SSO client shall POST that token with the hint refresh_token to SSO's revoke endpoint.
    Revocation ends a login at SSO; the hint saves SSO a lookup.

    Scenario: The revoke request carries the token and its hint
      Given an SSO client
      And SSO accepts the next revocation
      When the SSO client revokes the refresh token "refresh-a"
      Then the call shall resolve
      And SSO's revoke endpoint shall have received the token "refresh-a" with the hint "refresh_token"

  Rule: When SSO accepts a revocation, the SSO client shall resolve without waiting for the response body.
    A successful revocation carries nothing the caller needs, so a body
    that is slow to arrive must not hold the caller up.

    Scenario: A revocation whose body never arrives still resolves
      Given an SSO client with a request timeout of 200 ms
      And SSO accepts the next revocation with a body that never arrives
      When the SSO client revokes the refresh token "refresh-a"
      Then the call shall resolve

  Rule: If SSO refuses a revocation, then the SSO client shall reject with an SsoError carrying SSO's status and error code.
    A revocation that did not happen leaves a working refresh token, and the
    caller has to know.

    Scenario: A refused revocation is an SsoError
      Given an SSO client
      And SSO refuses the next revocation with HTTP 400 and the error code "unsupported_token_type"
      When the SSO client revokes the refresh token "refresh-a"
      Then the call shall reject with an SsoError with status 400 and the error code "unsupported_token_type"

  # ── How failures read ─────────────────────────────────────────────

  Rule: If SSO refuses a token request with an error description, then the SsoError shall carry that description.
    SSO's description says what was wrong with the request in words; the
    error code alone is often too terse to act on.

    Scenario: The error description is kept
      Given an SSO client
      And SSO answers the next token request with HTTP 400, the error code "invalid_request" and the description "Missing redirect_uri"
      When the SSO client refreshes "refresh-a"
      Then the call shall reject with an SsoError with status 400 and the error code "invalid_request"
      And the SsoError shall carry the description "Missing redirect_uri"

  Rule: If SSO answers a token request with a 2xx status and a body that is not a JSON object, then the SSO client shall reject with an SsoError for invalid_response saying what the body was.
    A proxy or an outage page can answer 2xx. The message separates a body
    that is not JSON at all from JSON of the wrong shape.

    Scenario Outline: A 2xx body that is <kind> is an invalid response
      Given an SSO client
      And SSO answers the next token request with HTTP 200 and the body '<body>'
      When the SSO client refreshes "refresh-a"
      Then the call shall reject with an SsoError with status 200 and the error code "invalid_response"
      And the SsoError shall say "<message>"

      Examples:
        | kind          | body          | message                  |
        | HTML          | <html></html> | was not valid JSON       |
        | a JSON string | "token"       | was not a JSON object    |

  Rule: If the body of a 2xx token response breaks off before a timeout passes, then the SSO client shall reject with an SsoError for invalid_response.
    A body cut short cannot be read as tokens, and it is not a timeout:
    the connection failed, not the clock.

    Scenario: A 2xx body that breaks off is an invalid response
      Given an SSO client with a request timeout of 5000 ms
      And SSO answers the next token request with HTTP 200 and a body that breaks off
      When the SSO client refreshes "refresh-a"
      Then the call shall reject with an SsoError with status 200 and the error code "invalid_response"

  Rule: If the transport fails a token request before any timeout passes, then the SSO client shall reject with the transport's error.
    A refused connection is a network fault the caller may already handle;
    it is not dressed up as a timeout.

    Scenario: A refused connection rejects with the transport error
      Given an SSO client
      And the next token request fails to connect
      When the SSO client refreshes "refresh-a"
      Then the call shall reject with the transport's error rather than an SsoError

  Rule: Where a request timeout is configured, if a custom fetch ignores the abort signal, then the SSO client shall reject with an SsoError for timeout once the timeout passes.
    The client cannot rely on every fetch honouring the signal, so it races
    the request against the deadline itself.

    Scenario: A fetch that never answers and ignores the signal still times out
      Given an SSO client with a request timeout of 50 ms over a fetch that never answers and ignores its abort signal
      When the SSO client refreshes "refresh-a"
      Then the call shall reject with an SsoError with status 0 and the error code "timeout"

  Rule: The SsoError shall report itself retryable for status 429, for a 5xx status, and for a timeout with no status, and not otherwise.
    A rate limit, an outage and a request that got no answer can succeed
    later; anything else will fail the same way again.

    Scenario Outline: An SsoError with status <status> and code <code>
      When an SsoError is made with the status <status> and the error code "<code>"
      Then the SsoError shall <verdict>

      Examples:
        | status | code         | verdict             |
        | 429    | rate_limited | be retryable        |
        | 500    | server_error | be retryable        |
        | 499    | client_gone  | not be retryable    |
        | 0      | timeout      | be retryable        |
        | 0      | network      | not be retryable    |
