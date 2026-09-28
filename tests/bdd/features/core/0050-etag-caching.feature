Feature: ETag Caching
  The EsiClient caches GET responses that carry an ETag header, keyed by
  endpoint. Each entry takes its freshness TTL from the endpoint's cache
  metadata in the ESI spec where there is one, so a repeat request inside that
  window is answered from memory with no HTTP call at all. Otherwise the TTL
  comes from the Cache-Control max-age, and a repeat request is sent with
  If-None-Match. An entry is kept for an hour past its freshness TTL, or for
  the configured default when the response gave none, so a request after the
  TTL still revalidates. Entries are only created for responses that actually
  carry an ETag. The cache is on by default; enableETagCache: false turns it
  off.

  The cache is also what lets a request survive a server error: a 5xx answered
  while an unexpired entry exists is served from that entry and flagged stale.
  Those Rules are the single statement of stale-on-error, and domain features
  point here rather than restating it. Retry, circuit breaking and
  deduplication are specified in 0051-resilience.feature.

  Caching is bounded by a configured maximum entry count and is observable
  through getCacheStats, so callers can reason about memory use and hit rates
  at runtime.

  # ── Storing responses ───────────────────────────────────────────────

  Rule: When a response carrying an ETag header is received, the ETag cache shall store the response body against the requested endpoint.
    The ETag is the server's own identity for a representation, so its
    presence is what marks a response as re-usable. Storage is keyed by
    endpoint rather than by ETag, because lookup happens before the client
    knows what the current ETag is.

    Scenario: First response carrying an ETag is stored in the cache
      Given a fresh client with no cached data
      When the client makes an API request that returns an ETag
      Then the response shall be cached for future use

  Rule: If a response omits the ETag header, then the ETag cache shall store no entry for that request.
    Without an ETag there is nothing to revalidate against later, so caching
    the body would risk serving data the client has no way to check. These
    responses pass straight through to the caller.

    Scenario: Response without an ETag header is not cached
      Given a server response without ETag headers
      When the client makes requests without ETag
      Then the client shall work normally without caching

  # ── Serving from cache ──────────────────────────────────────────────

  Rule: While a cached entry is within its spec-aware TTL, the ETag cache shall serve the stored body without issuing an HTTP request.
    Inside the TTL window the client does not contact the server at all — not
    even a conditional request. This is the behaviour that makes the cache
    worth having, and it is also what the three scenarios below all exercise
    from different angles: a plain repeat, a repeat where the server would
    have returned different data, and a repeat where the server would have
    returned an error. In every case no request leaves the client.

    Scenario: Repeat request inside the TTL window is served from the cache
      Given cached data with an ETag
      When the client repeats the same request inside the TTL window
      Then the client shall return the cached data without a new download

    Scenario: Repeat request inside the TTL window does not observe changed server data
      Given cached data with an ETag for update
      When the server would return new data with a different ETag
      Then the client shall return the originally cached data

    Scenario: Repeat request inside the TTL window does not observe a server error
      Given a cached response exists
      When the server would return an error
      Then the client shall return the originally cached data

  Rule: If a response carries an Expires header, then the ETag cache shall not take the entry's freshness from it.
    Freshness comes from the endpoint's spec cache metadata, or from
    Cache-Control max-age where the spec gives none. Expires is exposed on
    withMetadata as meta.expires, but an Expires already past, or a day
    ahead, changes nothing about when the entry is revalidated.

    Scenario: A server status whose Expires has passed is still served inside its spec TTL
      Given a client whose ETag cache holds the server status from a response whose Expires header had already passed
      When the client requests the server status 10 seconds later
      Then the client resolves with the cached server status
      And the client sent 1 request

    Scenario: A server status whose Expires lies a day ahead is revalidated after its spec TTL
      Given a client whose ETag cache holds the server status from a response whose Expires header lies a day ahead
      And the 30 second spec cache TTL of the server status has elapsed
      And ESI answers the revalidation of the server status with HTTP 304
      When the client requests the server status
      Then the client resolves with the cached server status
      And the client sent 2 requests

  Rule: When an authenticated paginated GET has resolved with every page, the ETag cache shall answer a repeat call inside the spec TTL with every page.
    The combined array is what the caller received, so it is what a cached
    answer must return. Entries for authenticated endpoints are keyed by the
    access token; the combined array has to be stored under that same key, or
    the lookup finds the first page alone.

    Scenario: A repeat character assets call inside the TTL returns both pages
      Given a client with an access token and an empty cache
      And ESI answers the character assets request with 2 pages
      When the client requests the character assets twice
      Then both calls resolve with the assets from both pages
      And the client sent 2 requests

  Rule: If a paginated call requests a page after the first while the ETag cache holds an entry for that page's URL, then the EsiClient shall not send an If-None-Match header for that page.
    Pages 2 to N are fetched unconditionally (PAGINATION.md). A 304 on one
    page would stand for a slice of an older snapshot, and only page 1's
    ETag names the combined array the cache keeps. The entry in the scenario
    is seeded by hand, since no call of the client stores one.

    Scenario: Page 2 of the market types is asked unconditionally despite an entry for its URL
      Given a client whose ETag cache holds an entry for page 2 of the market types
      And ESI answers the market types with 2 pages
      When the client requests the market types for The Forge
      Then the client resolves with the market types of both pages
      And the page 2 request carried no If-None-Match header

  Rule: If a paginated call receives a page after the first, then the ETag cache shall not store that page under its own URL.
    The combined array is stored once, under page 1's URL with page 1's
    ETag, after every page is in. An entry per page would be one nobody
    reads, and each would take a slot from the configured maximum.

    Scenario: A two-page market types call leaves one cache entry
      Given a client with an empty cache
      And ESI answers the market types with 2 pages
      When the client requests the market types for The Forge
      Then the client resolves with the market types of both pages
      And the ETag cache holds 1 entry

  Rule: If a stream or fetch-all helper requests a page, then the EsiClient shall not send an If-None-Match header.
    The stream* and fetchAll* helpers read every page afresh and keep no
    cache of their own, so a 304 would leave them with no body to return.
    An ordinary call to the same URL stores an ETag, and sending it from a
    streamed page turned the next 304 into an EsiError.

    Scenario: Streaming market types after an ordinary market types call
      Given a client with an empty cache
      And the client has fetched the market types for The Forge
      When the client streams the market types for The Forge
      Then the stream yields every market type
      And the streamed request carried no If-None-Match header

  Rule: If a stream or fetch-all helper requests a page while the ETag cache holds an entry inside its spec TTL, then the EsiClient shall not answer the page from that entry.
    The helpers take the lighter single-page path, which has no spec-TTL
    lookup (PAGINATION.md, "What stream* and fetchAll* skip"). A cached
    combined array is not a page, so serving it page by page would repeat
    or drop items.

    Scenario: Streaming market types inside their 600 second spec TTL sends a request
      Given a client with an empty cache
      And the client has fetched the market types for The Forge
      When the client streams the market types for The Forge
      Then the stream yields every market type
      And the client sent a request for the streamed page

  Rule: If a stream or fetch-all helper receives a page, then the EsiClient shall not store that page in the ETag cache.
    A page is part of a resource, not the resource an ordinary call caches
    under the same URL. Storing it would let a later ordinary call be
    answered with one page of a multi-page result.

    Scenario: An ordinary market types call after streaming them fetches afresh
      Given a client with an empty cache
      And the client has streamed the market types for The Forge
      When the client requests the market types for The Forge
      Then the client resolves with every market type
      And the ordinary request carried no If-None-Match header

  Rule: If a page requested by a stream or fetch-all helper is answered with a 5xx status while the ETag cache holds an entry for its URL, then the EsiClient shall not serve that entry in place of the page.
    Stale-on-error belongs to the eager path. The helper's page is not the
    combined array the entry holds, so the failure reaches the caller as an
    EsiError.

    Scenario: Streaming market types answered with HTTP 500 rejects despite the cached entry
      Given a client with an empty cache
      And the client has fetched the market types for The Forge
      And ESI answers the streamed market types page with HTTP 500
      When the client streams the market types for The Forge expecting a failure
      Then the stream rejects with an EsiError carrying status 500

  # ── Serving from cache when ESI fails ───────────────────────────────

  Rule: If a GET request is answered with a 5xx status while the ETag cache holds an unexpired entry for it, then the EsiClient shall resolve with the cached body and flag the response as stale.
    A server error on a resource the client already holds is better answered
    with the last good copy than with a failure. The entry has to be unexpired:
    the cache evicts an expired entry on lookup, so there is nothing to serve.
    An entry expires an hour after its freshness TTL, so for an endpoint with a
    spec cache TTL this path serves the requests made after that TTL. The
    revalidation request goes out with If-None-Match. The stale body is
    returned without retrying, and withMetadata reports stale as true and
    cacheHitType as stale-on-error.

    Scenario Outline: HTTP <status> on a revalidation is answered from the cache
      Given a client whose ETag cache holds the dogma attribute index
      And ESI answers the revalidation of the dogma attribute index with HTTP <status>
      When the client requests the dogma attribute index with metadata
      Then the client resolves with the cached attribute identifiers flagged as stale
      And the revalidation request carried the cached ETag in If-None-Match
      And the client sent 2 requests

      Examples:
        | status |
        | 500    |
        | 503    |

  Rule: If a GET request is answered with a 5xx status while the ETag cache holds an unexpired entry for it, then the EsiClient shall not send the request again.
    The stale entry is the answer, so nothing is thrown and the retry
    strategy has nothing to retry, even for 502, 503 and 504, which it would
    otherwise repeat. A caller who wants the current value despite a stale
    answer checks meta.stale and asks again later.

    Scenario: A 503 on the server status revalidation is not sent again
      Given a client whose ETag cache holds the server status
      And the 30 second spec cache TTL of the server status has elapsed
      And ESI answers the server status request with HTTP 503 on every attempt
      When the client requests the server status
      Then the client resolves with the cached server status
      And the client sent 2 requests

  Rule: If a GET request is answered with a 5xx status and the ETag cache holds no entry for it, then the EsiClient shall reject with an EsiError carrying that status.
    With nothing cached there is no fallback, so the failure reaches the caller
    once the retries its status allows are spent: none for 500, and every
    configured retry for 502, 503 and 504.

    Scenario: HTTP 500 with nothing cached rejects after one request
      Given a client with an empty ETag cache
      And ESI answers the dogma attribute index request with HTTP 500 1 times
      When the client requests the dogma attribute index
      Then the client rejects with an EsiError carrying status 500
      And the client sent 1 requests

    Scenario: HTTP 503 on every attempt with nothing cached rejects once retries are spent
      Given a client with an empty ETag cache
      And ESI answers the dogma attribute index request with HTTP 503 4 times
      When the client requests the dogma attribute index
      Then the client rejects with an EsiError carrying status 503
      And the client sent 4 requests

  Rule: If a GET request is answered with a 4xx status, then the EsiClient shall reject with an EsiError even while the ETag cache holds an entry for it.
    Stale-on-error covers server faults only. A 404 or a 403 says the resource
    is gone or no longer visible to this caller, and serving the old copy would
    hide exactly that.

    Scenario: HTTP 404 on a revalidation rejects despite the cached entry
      Given a client whose ETag cache holds the dogma attribute index
      And ESI answers the revalidation of the dogma attribute index with HTTP 404
      When the client requests the dogma attribute index
      Then the client rejects with an EsiError carrying status 404
      And the client sent 2 requests

  # ── Keeping entries past their freshness TTL ────────────────────────

  Rule: When the freshness TTL of a cached entry elapses, the ETag cache shall keep that entry for one further hour before discarding it.
    The freshness TTL, from the spec cache metadata or Cache-Control max-age,
    decides how long an entry is served without contacting ESI. It does not
    decide how long the entry is useful: past it the entry still carries the
    ETag for a conditional request, and it is the last good copy if ESI fails.
    One hour spans ESI's daily downtime. The configured maximum entry count
    still evicts the oldest entry first, so retention does not raise the memory
    bound. An entry whose response gave no freshness TTL keeps the configured
    defaultTtl.

    Scenario: HTTP 503 after the server status TTL has elapsed is answered from the cache
      Given a client whose ETag cache holds the server status
      And the 30 second spec cache TTL of the server status has elapsed
      And ESI answers the server status request with HTTP 503 on every attempt
      When the client requests the server status with metadata
      Then the client resolves with the cached server status flagged as stale
      And the client sent 2 requests

    Scenario: Revalidation after the server status TTL has elapsed is answered by a 304
      Given a client whose ETag cache holds the server status
      And the 30 second spec cache TTL of the server status has elapsed
      And ESI answers the revalidation of the server status with HTTP 304
      When the client requests the server status with metadata
      Then the client resolves with the cached server status from a 304 revalidation
      And the revalidation request carried the cached server status ETag in If-None-Match

    Scenario: HTTP 503 more than an hour after the server status TTL has elapsed rejects
      Given a client whose ETag cache holds the server status
      And more than one hour past the spec cache TTL of the server status has elapsed
      And ESI answers the server status request with HTTP 503 on every attempt
      When the client requests the server status
      Then the client rejects with an EsiError carrying status 503
      And the client sent 5 requests

  Rule: When a revalidation is answered with HTTP 304, the ETag cache shall restart the freshness TTL of the cached entry.
    A 304 is ESI confirming that the stored body is still current, so the entry
    is as fresh as a new 200 would have made it. Without the restart, every
    request after the first TTL elapsed would go to ESI until the entry was
    discarded.

    Scenario: Server status revalidated by a 304 is served without a request 20 seconds later
      Given a client whose ETag cache holds the server status
      And the 30 second spec cache TTL of the server status has elapsed
      And ESI answers the revalidation of the server status with HTTP 304
      When the client requests the server status twice, 20 seconds apart
      Then both calls resolve with the cached server status
      And the client sent 2 requests

  # ── Observability and control ───────────────────────────────────────

  Rule: The ETag cache shall report the stored entry count, the configured maximum entry count, and the timestamps of the oldest and newest entries.
    Callers embedding this client in a long-running process need to see
    whether the cache is filling up and how stale its contents are. These
    four values are the minimum needed to answer both questions.

    Scenario: Cache statistics report entry counts and age bounds
      Given multiple cached responses exist
      When the client requests cache statistics
      Then the client shall return detailed information about cache usage

  Rule: When the cache is cleared, the ETag cache shall discard every stored entry.
    Long-lived processes need a way to drop cached state — after a token
    switch, for instance, where cached data may belong to a different
    character.

    Scenario: Clearing the cache removes every stored entry
      Given a cache with stored responses
      When the client clears the cache
      Then all cached data shall be removed

  Rule: When the cache configuration is updated with a new maximum entry count, the ETag cache shall report the new limit in its statistics.
    The bound is adjustable at runtime so an embedding application can react
    to memory pressure without rebuilding the client.

    Scenario: Updated maximum entry count is reflected in statistics
      Given a client with initial cache settings
      When the client updates the cache configuration
      Then the new settings shall take effect

  Rule: Where ETag caching is disabled, the EsiClient shall return null from getCacheStats.
    Disabling the feature removes the cache entirely rather than leaving an
    inert empty one, so getCacheStats returns null instead of a zeroed record.
    That distinction lets callers tell "caching is off" from "caching is on
    and cold".

    Scenario: Cache statistics are unavailable when caching is disabled
      Given a client with ETag caching disabled
      When the client makes API requests without cache
      Then responses shall be returned normally without caching

  # ── Identity ─────────────────────────────────────────────────────────

  Rule: When the access token is replaced by another EVE SSO token for the same character, the ETag cache shall serve that character's stored entries under the new token.
    An EVE SSO access token is a JWT whose sub claim names the character, and
    a refresh rotates the token without changing the character. The cache
    keys authenticated entries by that character id rather than by the token,
    so a refresh, whether the caller sets a new token or the 401 path obtains
    one, keeps every ETag the character has earned. The character id is read
    from the token without verifying its signature, so the new token sends
    the character's ETag as If-None-Match and ESI's 304 is what serves the
    entry: a 304 is ESI accepting the token and the entry in one answer.

    Scenario: Structure orders revalidated by a 304 after the access token is replaced
      Given a client holding an SSO access token for character 90000001
      And ESI answers the structure orders request with an ETag
      And the client has requested the structure orders
      When the access token is replaced by a new SSO token for character 90000001
      And the structure orders TTL has elapsed
      And ESI answers the revalidation of the structure orders with HTTP 304
      And the client requests the structure orders again
      Then the client resolves with the cached structure orders from a 304 revalidation
      And the revalidation request carried the cached structure orders ETag in If-None-Match

    Scenario: Token refresh after a 401 keeps the character's cached entry
      Given a client whose refresh provider issues a new SSO token for character 90000001
      And ESI answers the structure orders request with an ETag
      And the client has requested the structure orders
      When the structure orders TTL has elapsed
      And ESI answers the next structure orders request with HTTP 401 and the retry with HTTP 304
      And the client requests the structure orders again
      Then the client resolves with the cached structure orders from a 304 revalidation
      And the client sent 3 requests, the last carrying the cached structure orders ETag in If-None-Match

  Rule: If two EVE SSO access tokens carry different character ids, then the ETag cache shall keep a separate entry for each character.
    A structure's order book, a corporation's wallet or a character's own
    location answer differently for every character that asks, so an entry
    stored for one character is never an answer for another, whatever the
    URL.

    Scenario: A second character's structure orders are fetched rather than served from the first character's entry
      Given a client holding an SSO access token for character 90000001
      And ESI answers the structure orders request with an ETag
      And the client has requested the structure orders
      When the access token is replaced by an SSO token for character 90000002
      And ESI answers the structure orders request with an ETag
      And the client requests the structure orders again
      Then the second structure orders request carried no If-None-Match header
      And the cache holds 2 entries

  Rule: If an access token is not an EVE SSO JWT, then the ETag cache shall scope that token's entries by a hash of the token.
    A token that names no character (a raw string in a test, a token from
    another issuer) has no identity to key by except itself. The hash keeps
    the token out of cache keys, which reach logs and statistics, and two
    such tokens never share an entry even when they belong to one person.

    Scenario: An opaque token replaced by another opaque token fetches the structure orders afresh
      Given a client holding an opaque access token
      And ESI answers the structure orders request with an ETag
      And the client has requested the structure orders
      When the access token is replaced by a different opaque token
      And ESI answers the structure orders request with an ETag
      And the client requests the structure orders again
      Then the second structure orders request carried no If-None-Match header
      And the cache holds 2 entries

  Rule: If the current access token is one ESI has not yet answered, then the ETag cache shall serve no stored entry for it without a request.
    The character a token names is read without verifying the token, so it is
    a claim until ESI has answered a request under that token with 2xx or
    304. A forged token naming a character, set on a client that holds that
    character's entries, would otherwise be served them from the spec TTL or
    on a server error before ESI ever saw it. Until ESI accepts a token the
    client keys it by a hash of the token itself, and the character's entry
    is reached only through a conditional request that ESI answers.

    Scenario: A replaced token that ESI rejects is served nothing from the character's entry
      Given a client holding an SSO access token for character 90000001
      And ESI answers the structure orders request with an ETag
      And the client has requested the structure orders
      When the access token is replaced by a new SSO token for character 90000001
      And ESI answers the next structure orders request with HTTP 401
      And the client requests the structure orders again
      Then the client rejects with an EsiError carrying status 401
      And the client sent 2 requests

    Scenario: A replaced token is served from the spec TTL only after ESI has answered it
      Given a client holding an SSO access token for character 90000001
      And ESI answers the structure orders request with an ETag
      And the client has requested the structure orders
      When the access token is replaced by a new SSO token for character 90000001
      And ESI answers the revalidation of the structure orders with HTTP 304
      And the client requests the structure orders twice more
      Then the client sent 2 requests
