Feature: ETag Caching
  The EsiClient can cache GET responses that carry an ETag header, keyed by
  endpoint. Each entry has a TTL derived from the endpoint's cache metadata in
  the ESI spec, so a repeat request inside that window is answered from memory
  with no HTTP call at all. Entries are only created for responses that
  actually carry an ETag, and the whole subsystem is opt-in via the
  enableETagCache client option.

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
