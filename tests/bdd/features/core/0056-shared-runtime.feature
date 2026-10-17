@ARCH-08
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

  @TEST-11
  Rule: If the public view requests an operation while another view holds a token, then the runtime shall not send an Authorization header.
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

  Rule: When a view follows the pages of an authenticated operation, the runtime shall ask the identity for its token before each page.
    Each page is its own request, and a consumer may hold the iterator across
    a token rotation, so the token is not taken once for the whole collection.

    Scenario: A provider's newer token is sent for the second page
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character whose provider hands out a new token on each call
      And ESI reports the character's assets on two pages
      When the character's view follows every page of the character's assets
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

  @sec-P4 @SEC-10
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

  Rule: When the runtime is shut down, the runtime shall stop its cleanup timers and keep every view usable.
    The shared cache and circuit breaker each run a cleanup timer. Shutdown
    releases them, once or many times over, so an application that replaces
    a runtime holds nothing of the old one; a view still answers afterwards,
    as the legacy client does, because a request needs no timer.

    Scenario: A character's view still answers after the runtime is shut down
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character holding an access token
      And ESI reports the character's wallet balance
      When the runtime is shut down twice
      And the character's view requests the wallet balance
      Then the call shall resolve with the wallet balance after one request

  # ── Response metadata and safe mode

  Rule: When a view in metadata mode requests an operation that answers once, the runtime shall resolve with the body and the response metadata read from the ESI headers.
    The legacy `withMetadata()` answered `{ data, meta }`. `esi.withMetadata()`
    hands out the same two views over the same runtime, and each operation
    resolves with the body ESI sent and the metadata the legacy clients built
    from its headers: the ETag, `Expires`, `X-Pages` and the error-limit
    counters, and whether the shared cache answered.

    Scenario: The public view in metadata mode reports the server status with its headers
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI reports the server status with response headers
      When the public view in metadata mode requests the server status
      Then the result shall hold the server status as its data
      And the result's metadata shall report the ETag, expiry, page count and error limit ESI sent

    Scenario: A character's view in metadata mode reports the wallet balance with its headers
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character holding an access token
      And ESI reports the character's wallet balance with response headers
      When the character's view in metadata mode requests the wallet balance
      Then the result shall hold the wallet balance as its data
      And the result's metadata shall report the ETag, expiry, page count and error limit ESI sent

    Scenario: An answer served from the shared cache is reported as cached
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI reports the server status with an ETag
      When the public view requests the server status
      And the public view in metadata mode requests the server status
      Then the result's metadata shall report an answer from the cache
      And the runtime shall have sent 1 request

  Rule: When a view in safe mode requests an operation that ESI answers, the runtime shall resolve with ok set to true, the body and the response metadata.
    The legacy `withSafeMode()` resolved every call with a result object
    instead of throwing. `esi.withSafeMode()` does the same for both views; a
    success carries the metadata a metadata-mode view would report.

    Scenario: The public view in safe mode reports the server status
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI reports the server status with response headers
      When the public view in safe mode requests the server status
      Then the result shall be ok and hold the server status as its data
      And the result's metadata shall report the ETag, expiry, page count and error limit ESI sent

  Rule: If an operation fails on a view in safe mode, then the runtime shall resolve with ok set to false and the EsiError instead of rejecting.
    Every failure the plain view would throw becomes the result's error, the
    refusal of an authenticated operation on the public view included, so a
    caller in safe mode handles one shape and never a rejection.

    Scenario: A wallet request ESI answers with 404 resolves as a failure
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character holding an access token
      And ESI answers the character's wallet balance with 404
      When the character's view in safe mode requests the wallet balance
      Then the result shall not be ok and carry an EsiError with status 404

    Scenario: A wallet request forced through the public view in safe mode fails before the wire
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      When an authenticated wallet request is forced through the public view in safe mode
      Then the result shall not be ok and carry an EsiError coded NO_AUTH_TOKEN
      And the runtime shall have sent 0 requests

  @TEST-11
  Rule: If a view in metadata or safe mode follows the pages of an operation, then the runtime shall not wrap the items the pages yield.
    A paginated operation yields items across several responses, each with its
    own headers, so there is no one answer to attach metadata to. The items
    arrive as the plain view yields them, and a failing page rejects the
    iteration in either mode.

    Scenario: A character's assets followed in safe mode arrive as plain items
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character holding an access token
      And ESI reports the character's assets on two pages
      When the character's safe-mode view follows every page of its assets
      Then the items shall be the character's two assets as ESI sent them

  # ── Diagnostics

  Rule: When the runtime's cache statistics are requested, the runtime shall count the entries and hits of the cache every view shares.
    One cache serves every view, so one set of statistics describes it,
    whichever view wrote an entry or read it back.

    Scenario: A status cached by a character's view and served to the public view counts one entry and one hit
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And a view for a character holding an access token
      And ESI reports the server status with an ETag
      When the character's view requests the server status
      And the public view requests the server status
      Then the runtime's cache statistics shall report 1 entry and 1 hit

  Rule: If the ETag cache is disabled, then the runtime shall report its cache statistics as null.
    Nothing is cached, so there is nothing to count; null tells that apart
    from an empty cache.

    Scenario: A runtime without the ETag cache has no statistics
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" without the ETag cache
      When the runtime's cache statistics are read
      Then the cache statistics shall be null

  Rule: When the runtime's cache is cleared, the runtime shall send the next request for a cached entry to ESI.
    Clearing drops every view's entries at once, since they share one cache.

    Scenario: The server status is fetched again after the cache is cleared
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI reports the server status twice
      When the public view requests the server status
      And the runtime's cache is cleared
      And the public view requests the server status
      Then the runtime shall have sent 2 requests

  Rule: When the runtime's cache configuration is updated, the runtime shall limit its entries to the updated maxEntries.
    The configuration changes in place, so the views keep the cache they share.

    Scenario: A cache limited to one entry keeps only the newest response
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI reports the server status with an ETag
      And ESI reports the alliance list with an ETag
      When the runtime's cache is limited to 1 entry
      And the public view requests the server status
      And the public view requests the alliance list
      Then the runtime's cache statistics shall report 1 entry

  Rule: While the circuit breaker is enabled, the runtime shall report the state and failure count of each endpoint's circuit.
    The circuits are shared by every view, so the statistics show failures
    whichever view saw them.

    Scenario: An endpoint whose circuit opened through a character's view is reported open
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with a circuit breaker that opens after 2 failures
      And a view for a character holding an access token
      And ESI answers the server status with 500 until the circuit opens
      When the character's view requests the server status and the circuit opens
      Then the runtime's circuit breaker statistics shall report 1 open circuit with 2 failures

  Rule: When the runtime's circuit breaker is reset, the runtime shall send the next request for an endpoint whose circuit was open to ESI.
    An operator who knows ESI has recovered need not wait out the reset timeout.

    Scenario: The server status is requested again after its open circuit is reset
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with a circuit breaker that opens after 2 failures
      And a view for a character holding an access token
      And ESI answers the server status with 500 until the circuit opens
      And ESI reports the server status
      When the character's view requests the server status and the circuit opens
      And the runtime's circuit breaker is reset
      And the public view requests the server status
      Then the call shall resolve with the server status
      And the runtime shall have sent 3 requests

  # ── Supplied middleware

  Rule: Where a cache store is supplied, the runtime shall keep the response bodies it caches in that store.
    The `CacheStore` port is the five calls a shared store, a Redis client or a
    file, implements. The runtime keeps its conditional-request entries there
    instead of in its own memory, and reads them back for every view.

    Scenario: The server status is written to the supplied store and served from it
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" over a supplied cache store
      And ESI reports the server status with an ETag
      When the public view requests the server status
      And the public view requests the server status
      Then the supplied cache store shall hold the server status with its ETag
      And the runtime shall have sent 1 request

  Rule: Where a rate limiter is supplied, the runtime shall ask that rate limiter for clearance before each request it sends.
    The supplied limiter replaces the one `rateLimiterConfig` would build, and
    every view draws on it.

    Scenario: Each view's request is cleared by the supplied rate limiter
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with a supplied rate limiter
      And a view for a character holding an access token
      And ESI reports the server status
      And ESI reports the character's wallet balance
      When the public view requests the server status
      And the character's view requests the wallet balance
      Then the supplied rate limiter shall have cleared 2 requests

  Rule: Where a circuit breaker is supplied, the runtime shall record the failures every view sees in that circuit breaker.
    Supplying a circuit breaker turns it on, as `enableCircuitBreaker` would.

    Scenario: A supplied circuit breaker opened through a character's view rejects the public view
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with a supplied circuit breaker that opens after 2 failures
      And a view for a character holding an access token
      And ESI answers the server status with 500 until the circuit opens
      When the character's view requests the server status and the circuit opens
      And the public view requests the server status
      Then the public request shall be rejected with CircuitOpenError
      And the supplied circuit breaker shall report 1 open circuit

  Rule: Where a deduplicator is supplied, the runtime shall coalesce concurrent identical requests through that deduplicator.
    Supplying a deduplicator turns deduplication on, whatever
    `enableRequestDeduplication` says.

    Scenario: Two concurrent status requests are joined by the supplied deduplicator
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with a supplied deduplicator
      And ESI reports the server status after a delay
      When the public view requests the server status twice at once
      Then the runtime shall have sent 1 request
      And the supplied deduplicator shall have been asked 2 times

  Rule: Where a clock is supplied, the runtime shall age cached entries by that clock.
    The spec TTL of the server status is 30 seconds. Read by the supplied
    clock, an entry older than that is revalidated with its ETag, and a
    younger one answers without a request, whatever the wall clock says.

    Scenario: A status older than its spec TTL by the supplied clock is revalidated
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with a supplied clock
      And ESI reports the server status with an ETag
      And ESI confirms the server status is unchanged
      When the public view requests the server status
      And the supplied clock advances 31 seconds
      And the public view requests the server status
      Then the runtime shall have sent 2 requests
      And the second request shall revalidate the cached ETag

    Scenario: A status younger than its spec TTL by the supplied clock is served from the cache
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with a supplied clock
      And ESI reports the server status with an ETag
      When the public view requests the server status
      And the supplied clock advances 10 seconds
      And the public view requests the server status
      Then the runtime shall have sent 1 request

  Rule: Where a clock is supplied, the runtime shall wait out the retry back-off on that clock.
    A test, or a host with its own scheduler, then decides how long a back-off
    takes.

    Scenario: A retried server status waits on the supplied clock
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with a supplied clock
      And ESI answers the server status with 503 once and then reports it
      When the public view requests the server status
      Then the call shall resolve with the server status
      And the supplied clock shall have been asked to wait before the retry

  @TEST-11
  Rule: If the runtime is shut down, then the runtime shall not shut down a cache store or circuit breaker it was supplied.
    The application owns what it hands in, and may share one store between
    runtimes or processes, so `shutdown()` releases only what the runtime
    built itself.

    Scenario: A supplied cache store stays open after the runtime is shut down
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" over a supplied cache store
      When the runtime is shut down twice
      Then the supplied cache store shall not have been shut down
