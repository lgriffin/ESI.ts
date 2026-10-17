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

  # ── What the legacy endpoint definitions carried

  Rule: When a view invokes an operation the spec marks deprecated, the runtime shall log one warning through the runtime's logger naming the operation, its replacement and its sunset date.
    The first step of the deprecation process in guides/SEMVER.md is a
    warning on every call, which the legacy endpoint definitions give through
    DeprecationInfo. The generator carries the spec's deprecated flag and the
    message, replacement and sunset date from scripts/spec/operation-overlay.json
    into the operation's metadata. No operation in the vendored spec is
    deprecated today, so the scenario marks the server status metadata
    deprecated for its duration.

    Scenario: A deprecated operation called through the public view warns once
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" that logs to a recording logger
      And the server status operation is marked deprecated in favour of the route status
      And ESI reports the server status
      When the public view requests the server status
      Then the runtime's logger shall receive one warning naming the server status operation, the route status and the sunset date

    Scenario: An operation the spec does not deprecate logs no warning
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" that logs to a recording logger
      And ESI reports the server status
      When the public view requests the server status
      Then the runtime's logger shall receive no warning

  Rule: When the public view requests the OpenAPI document in JSON form, the runtime shall resolve with the parsed document.
    ESI serves its specification under meta/ without listing those paths in
    the specification itself, so nothing is generated from the spec for them.
    The generator adds both from scripts/spec/operation-overlay.json, as the
    legacy Meta client's endpoint map lists them.

    Scenario: The JSON specification reaches the public view parsed
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI serves its specification in JSON form
      When the public view requests the OpenAPI document in JSON form
      Then the view shall receive the parsed JSON specification

  Rule: When the public view requests the OpenAPI document in YAML form, the runtime shall ask for YAML in the Accept header and resolve with the document as unparsed text.
    The YAML document is not JSON, so the overlay marks the operation as a
    text response with the Accept header the legacy Meta client sends, and
    the transport hands the body back verbatim.

    Scenario: The YAML specification reaches the public view as text
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI serves its specification in YAML form
      When the public view requests the OpenAPI document in YAML form
      Then the view shall receive the YAML specification as text
      And the request shall carry the header "Accept" with the value "application/yaml, text/yaml, text/plain"

  Rule: If ESI answers a request for a public contract's bids or items with no content, then the runtime shall yield no entries.
    A public contract can expire or be accepted between the region listing
    and the detail read. The spec documents a 204 beside the 200 on both
    routes, and ESI in practice sends a 200 with Content-Length 0. The
    generator marks every operation whose spec pairs a JSON 200 with a 204,
    and the runtime reads either answer as an empty list, as the legacy
    Contracts client does. Every other operation keeps rejecting an empty
    200 body.

    Scenario: Bids on an auction accepted after the listing
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI answers the public contract's bids with an empty 200 response
      When the public view follows every page of the public contract's bids
      Then the view shall receive no entries after one request

    Scenario: Items on a contract answered with 204 No Content
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI answers the public contract's items with 204 No Content
      When the public view follows every page of the public contract's items
      Then the view shall receive no entries after one request

  # ── Response validation

  Rule: While the validateResponse option is unset, the runtime shall return a generated operation's body as ESI sent it.
    Generated operations have returned ESI's body unchecked since the runtime
    shipped, so validating them by default would turn bodies applications
    already accept into errors within a minor release. Validation is opt-in
    until a future major makes it the default. The hand-written EsiClient
    keeps validating by default; this concerns the generated operations only.

    Scenario: A server status without its player count is returned when validation is left unset
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)"
      And ESI reports the server status without its player count
      When the public view requests the server status
      Then the call shall resolve with the server status as ESI sent it

  Rule: Where response validation is turned on, if ESI answers a generated operation with a JSON body that does not match the operation's generated response schema, then the runtime shall reject the call with an EsiValidationError naming the request URL.
    `validateResponse: true` checks a generated operation's body against a Zod
    schema generated from the OpenAPI document beside its type, as the
    hand-written clients check theirs. A body that breaks the type the caller
    compiled against fails at the call, not three functions later. Fields ESI
    adds are kept, and so is a new enum member.

    Scenario: A server status without its player count is rejected when validation is on
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with response validation on
      And ESI reports the server status without its player count
      When the public view requests the server status
      Then the call shall be rejected with an EsiValidationError naming "/status"

    Scenario: A server status with a field the document does not name is accepted with that field when validation is on
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with response validation on
      And ESI reports the server status with an extra field "shard"
      When the public view requests the server status
      Then the call shall resolve with the server status as ESI sent it

  Rule: Where response validation is turned off, the runtime shall return a generated operation's body as ESI sent it.
    `validateResponse: false` states the unvalidated behaviour explicitly, and
    keeps it once a future major turns validation on by default.

    Scenario: A server status without its player count is returned when validation is off
      Given a runtime for the application "fleet-tool/2.1 (ops@example.com)" with response validation off
      And ESI reports the server status without its player count
      When the public view requests the server status
      Then the call shall resolve with the server status as ESI sent it
