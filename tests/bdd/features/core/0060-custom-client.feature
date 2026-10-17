@ARCH-08
Feature: Custom client built from chosen API clients
  EsiClientBuilder builds a CustomEsiClient that carries only the API clients
  an application names, so a tool that reads the market and the server status
  does not construct the other thirty-odd clients. The built client shares one
  request pipeline between the clients it holds, configured the same way as
  EsiClient.

  Both custom-client surfaces take the middleware instances `createEsi` takes
  (a cache store, rate limiter, circuit breaker, deduplicator and clock),
  report and reset that middleware, and hand out every domain client's
  metadata and safe-mode views from one call (CLIENT-ARCHITECTURE.md,
  decision D).

  These scenarios build a client through the builder, or an EsiClient, and
  read what reached the transport seam.

  Rule: When a custom client is built from a list of API clients, the CustomEsiClient shall expose exactly those clients.
    A getter for a client the builder was not given returns undefined rather
    than a client that was never configured.

    Scenario: A client built with market and status exposes those two alone
      When a custom client is built with the "market" and "status" clients
      Then the custom client shall list "market,status" as its enabled clients
      And the custom client shall expose the "status" client
      And the custom client shall not expose the "route" client

  Rule: When the same API client is added to the builder twice, the EsiClientBuilder shall enable it once.
    Adding a client is idempotent, so code that composes a builder from
    several feature flags cannot enable a client twice.

    Scenario: Adding status twice enables it once
      When a custom client is built with the "status" and "status" clients
      Then the custom client shall list "status" as its enabled clients

  Rule: If a custom client is built with no API clients, then the EsiClientBuilder shall throw an error naming the missing client type.
    A client with nothing to call is a configuration mistake worth catching at
    startup.

    Scenario: Building with no clients is refused
      When a custom client is built with no clients
      Then the builder shall throw "At least one client type must be specified"

  Rule: When a custom client calls an endpoint, the CustomEsiClient shall identify itself with the configured client ID in the X-User-Agent header.
    The built client runs the same pipeline as EsiClient, so CCP can reach
    the application behind a request whichever surface built it.

    Scenario: A custom client asks the server status as its own application
      Given ESI reports the server status
      When a custom client built with the "status" client and the client ID "fleet-tool" requests the server status
      Then the request shall carry the header "X-User-Agent" with the value "fleet-tool"
      And the custom client's result shall report the server status

  # ── Supplied middleware

  Rule: Where a cache store is supplied in the configuration, the CustomEsiClient shall keep the response bodies it caches in that store.
    The custom clients are the product (CLIENT-ARCHITECTURE.md), so the
    middleware `createEsi` takes as instances reaches them through the same
    `configureApiClient` path. A shared store (Redis, a file) implementing the
    `CacheStore` port holds the conditional-request entries instead of the
    client's own memory.

    Scenario: A custom client writes the server status to the supplied store and serves it from there
      Given a custom client built with the "status" client over a supplied cache store
      And ESI reports the server status with an ETag
      When the custom client requests the server status twice
      Then the supplied cache store shall hold the server status with its ETag
      And the client shall have sent 1 request

  Rule: Where a rate limiter is supplied in the configuration, the EsiClient shall ask that rate limiter for clearance before each request it sends.
    The supplied limiter replaces the one `rateLimiterConfig` would build, and
    every domain client of the EsiClient draws on it.

    Scenario: Requests from two domain clients are cleared by the supplied rate limiter
      Given a client with a supplied rate limiter
      And ESI reports the server status
      And ESI reports the alliance list with an ETag
      When the client requests the server status
      And the client requests the alliance list
      Then the supplied rate limiter shall have cleared 2 requests

  Rule: Where a circuit breaker is supplied in the configuration, the CustomEsiClient shall record the failures its clients see in that circuit breaker.
    Supplying a circuit breaker turns it on, as `enableCircuitBreaker` would.

    Scenario: A supplied circuit breaker opens after the custom client's status requests fail
      Given a custom client built with the "status" client and a supplied circuit breaker that opens after 2 failures
      And ESI answers the server status with 500 until the circuit opens
      When the custom client requests the server status until the circuit opens
      Then the supplied circuit breaker shall report 1 open circuit

  Rule: Where a deduplicator is supplied in the configuration, the EsiClient shall coalesce concurrent identical requests through that deduplicator.
    Supplying a deduplicator turns deduplication on, whatever
    `enableRequestDeduplication` says.

    Scenario: Two concurrent status requests are joined by the supplied deduplicator
      Given a client with a supplied deduplicator
      And ESI reports the server status after a delay
      When the client requests the server status twice at once
      Then the client shall have sent 1 request
      And the supplied deduplicator shall have been asked 2 times

  Rule: Where a clock is supplied in the configuration, the EsiClient shall wait out the retry back-off on that clock.
    The clock is the `Clock` port; cache age, retry back-off, rate-limit waits
    and the circuit reset timeout read it, so a test or a host with its own
    scheduler decides how long a back-off takes.

    Scenario: A retried server status waits on the supplied clock
      Given a client with a supplied clock
      And ESI answers the server status with 503 once and then reports it
      When the client requests the server status
      Then the call shall resolve with the server status
      And the supplied clock shall have been asked to wait before the retry

  @TEST-11
  Rule: If a custom client is shut down, then the CustomEsiClient shall not shut down a cache store it was supplied.
    The application owns what it hands in and may share one store between
    clients or processes, so `shutdown()` releases only what the client built.

    Scenario: A supplied cache store stays open after the custom client is shut down
      Given a custom client built with the "status" client over a supplied cache store
      When the custom client is shut down twice
      Then the supplied cache store shall not have been shut down

  # ── Diagnostics

  Rule: When a custom client's cache statistics are requested, the CustomEsiClient shall count the entries and hits of the cache its clients share.
    EsiClient has had `getCacheStats()` and `diagnostics`; the built client
    gets the same methods, backed by the same `EsiDiagnostics` the runtime
    uses.

    Scenario: A status cached and then served from the cache counts one entry and one hit
      Given a custom client built with the "status" client
      And ESI reports the server status with an ETag
      When the custom client requests the server status twice
      Then the custom client's cache statistics shall report 1 entry and 1 hit

  Rule: When a custom client's circuit breaker is reset, the CustomEsiClient shall send the next request for an endpoint whose circuit was open to ESI.
    An operator who knows ESI has recovered need not wait out the reset timeout.

    Scenario: The server status is requested again after its open circuit is reset
      Given a custom client built with the "status" client and a circuit breaker that opens after 2 failures
      And ESI answers the server status with 500 until the circuit opens
      And ESI reports the server status
      When the custom client requests the server status until the circuit opens
      And the custom client's circuit breaker is reset
      And the custom client requests the server status
      Then the call shall resolve with the server status
      And the client shall have sent 3 requests

  # ── Response metadata and safe mode

  Rule: When a domain method of a client in metadata mode answers once, the EsiClient shall resolve with the body and the response metadata read from the ESI headers.
    `withMetadata()` on the client hands out every domain client's metadata
    view from one object, so an application does not call it per domain. The
    metadata is built by the same `buildResponseMeta` the runtime's metadata
    views use.

    Scenario: The client in metadata mode reports the server status with its headers
      Given ESI reports the server status with response headers
      When the client in metadata mode requests the server status
      Then the result shall hold the server status as its data
      And the result's metadata shall report the ETag, expiry, page count and error limit ESI sent

  Rule: When a domain method of a custom client in metadata mode answers once, the CustomEsiClient shall resolve with the body and the response metadata read from the ESI headers.
    The built client's view holds the domains it was built with; a domain it
    was not given is undefined there too.

    Scenario: A custom client in metadata mode reports the server status with its headers
      Given a custom client built with the "status" client
      And ESI reports the server status with response headers
      When the custom client in metadata mode requests the server status
      Then the result shall hold the server status as its data
      And the result's metadata shall report the ETag, expiry, page count and error limit ESI sent

  Rule: If ESI answers a domain method of a client in safe mode with an error status, then the EsiClient shall resolve with ok set to false and the EsiError instead of rejecting.
    `withSafeMode()` on the client gives every domain the result envelope the
    domain clients' own `withSafeMode()` returns.

    Scenario: A missing server status arrives as a failed result
      Given ESI answers the server status with 404
      When the client in safe mode requests the server status
      Then the result shall not be ok and carry an EsiError with status 404
