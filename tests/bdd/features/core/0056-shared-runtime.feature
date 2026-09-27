Feature: One runtime, many identities
  An application that acts for more than one character used to build one
  EsiClient per character, each with its own rate limiter, error budget and
  cache, although ESI meters all of them as one caller. The `./client` entry
  builds one runtime and hands out views over it: `esi.public` reaches only
  the operations that need no scope, and `esi.as(identity)` reaches every
  operation as one character, with the token supplied by an EsiTokenManager,
  a raw access token or a custom TokenProvider. The views share the rate
  limiter, the circuit breaker, the deduplicator and the ETag cache, and the
  cache keeps each identity's authenticated entries apart.

  These scenarios drive the generated operations through the real request
  pipeline to the transport seam and read what went over the wire.

  # ── Construction

  Rule: If the runtime is created without a legal user agent, then the runtime constructor shall throw a VALIDATION_ERROR naming the userAgent option.
    CCP asks every caller to identify itself. The legacy client left the user
    agent optional for compatibility; the new surface has no such debt, so it
    refuses to exist without one, at construction rather than on every request.

    Scenario: A runtime built without a user agent is refused
      When a runtime is created without a user agent
      Then the client constructor shall throw a VALIDATION_ERROR naming the option

    Scenario: A runtime built with an empty user agent is refused
      When a runtime is created with an empty user agent
      Then the client constructor shall throw a VALIDATION_ERROR naming the option

    Scenario: A runtime built with a user agent holding a line break is refused
      When a runtime is created with a user agent holding a line break
      Then the client constructor shall throw a VALIDATION_ERROR naming the option

  Rule: The runtime shall send the configured user agent as the X-User-Agent header on every request.
    The same value goes out whichever view sent the request: the identity
    changes the token, not who the application is.

    Scenario: The public view identifies the application
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI reports the server status
      When the public view requests the server status
      Then the request shall carry the header "X-User-Agent" with the value "fleet-tool/2.1 (ops@example.com)"

    Scenario: A character's view identifies the application
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character holding an access token
      And ESI reports the character's wallet balance
      When the character's view requests the wallet balance
      Then the request shall carry the header "X-User-Agent" with the value "fleet-tool/2.1 (ops@example.com)"

  # ── The public view

  Rule: When the public view requests an operation, the runtime shall send no Authorization header.
    The public view holds no token, so nothing it sends can be attributed to a
    character, whatever tokens the runtime's other views hold.

    Scenario: A public request from a runtime that also serves a character carries no token
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character holding an access token
      And ESI reports the server status
      When the public view requests the server status
      Then the request shall not carry the header "Authorization"

  Rule: If an authenticated operation is invoked on the public view, then the runtime shall reject the call with NO_AUTH_TOKEN without sending a request.
    The type of the public view leaves the authenticated operations out, so the
    call does not compile; this is the guard for a caller who casts past it.

    Scenario: A wallet request forced through the public view is refused before the wire
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      When an authenticated wallet request is forced through the public view
      Then the call shall be rejected with NO_AUTH_TOKEN and no request shall be sent

  # ── A character's view

  Rule: When a view requests an authenticated operation, the runtime shall send the identity's current access token as the bearer.
    The identity decides what "current" means: a raw token is itself, a token
    manager returns the stored token and refreshes it first when stale, and a
    custom provider is asked each time.

    Scenario: A raw access token is sent as given
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character holding an access token
      And ESI reports the character's wallet balance
      When the character's view requests the wallet balance
      Then the request shall carry the header "Authorization" with the value "Bearer raw-access-token"

    Scenario: A token manager's stored token is sent
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character managed by a token manager
      And ESI reports the character's wallet balance
      When the character's view requests the wallet balance
      Then the request shall carry the character's stored access token as the bearer

    Scenario: A stale managed token is refreshed before the request
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character whose managed token is stale
      And SSO issues the character a fresh token
      And ESI reports the character's wallet balance
      When the character's view requests the wallet balance
      Then the request shall carry the character's fresh access token as the bearer

    Scenario: A custom token provider is asked for the token on each request
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character whose provider hands out a new token on each call
      And ESI reports the character's wallet balance twice
      When the character's view requests the wallet balance twice
      Then the two requests shall carry the provider's first and second tokens

  Rule: When ESI answers 401 to a view whose identity can refresh, the runtime shall retry the request once with the refreshed token.
    A managed character refreshes through SSO; a provider identity asks its
    provider again. Either way the caller sees the retried answer, not the 401.

    Scenario: A managed token rejected by ESI is refreshed through SSO and the request retried
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character managed by a token manager
      And ESI rejects the character's token once and then reports the wallet balance
      And SSO issues the character a fresh token
      When the character's view requests the wallet balance
      Then the call shall resolve with the wallet balance after two requests
      And the request shall carry the character's fresh access token as the bearer

  Rule: If ESI answers 401 to a view whose identity cannot refresh, then the runtime shall reject the call with the 401 after a single request.
    A raw access token has nowhere to turn. Retrying it would be a second
    rejection and a spent error-budget point, so the view reports the 401.

    Scenario: A raw token rejected by ESI is not retried
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character holding an access token
      And ESI rejects the character's token
      When the character's view requests the wallet balance
      Then the call shall be rejected with status 401 after a single request

  # ── What the views share

  Rule: While two views share one runtime, the runtime shall serve a public entry cached through one view to the other without a request.
    Public data is the same whoever asked for it, and the spec TTL says how
    long it holds, so the second view reads the first view's entry.

    Scenario: The server status fetched by a character's view is served to the public view from the cache
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character holding an access token
      And ESI reports the server status with an ETag
      When the character's view requests the server status
      And the public view requests the server status
      Then the runtime shall have sent 1 request

  Rule: While two views share one runtime, the runtime shall keep each identity's authenticated entries apart.
    Two characters in one corporation ask the same URL and get answers scoped
    to their own roles. Sharing the cached body would show one character the
    other's answer, so each identity has its own entry, keyed by the character
    the token names.

    Scenario: A corporation wallet fetched by one character is not served to another
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And views for two characters of one corporation
      And ESI reports the corporation wallets twice
      When each character's view requests the corporation wallets
      Then the runtime shall have sent 2 requests

  Rule: While the circuit for an endpoint is open, the runtime shall reject that endpoint from every view without sending a request.
    The circuit breaker guards ESI, not a character. Failures seen through one
    view open the circuit for the public view and every other view alike.

    Scenario: An endpoint that failed through a character's view is rejected for the public view
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with a circuit breaker that opens after 2 failures
      And a view for a character holding an access token
      And ESI answers the server status with 500 until the circuit opens
      When the character's view requests the server status and the circuit opens
      And the public view requests the server status
      Then the public request shall be rejected with CircuitOpenError
      And the runtime shall have sent 2 requests
