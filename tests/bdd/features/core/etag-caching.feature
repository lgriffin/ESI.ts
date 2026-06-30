Feature: ETag Caching System

  Scenario: First-time API request caches response
    Given a fresh client with no cached data
    When I make an API request that returns an ETag
    Then the response should be cached for future use

  Scenario: Subsequent request with unchanged data returns cached response
    Given cached data with an ETag
    When I make the same request and server returns 304 Not Modified
    Then I should receive the cached data without a new download

  Scenario: Data changes trigger cache update
    Given cached data with an ETag for update
    When the server returns new data with a different ETag
    Then the cache should be updated with the new data

  Scenario: Cache statistics provide insight into performance
    Given multiple cached responses exist
    When I request cache statistics
    Then I should receive detailed information about cache usage

  Scenario: Cache can be manually cleared
    Given a cache with stored responses
    When I clear the cache
    Then all cached data should be removed

  Scenario: Cache configuration can be updated at runtime
    Given a client with initial cache settings
    When I update the cache configuration
    Then the new settings should take effect

  Scenario: Handle server errors gracefully with caching
    Given a cached response exists
    When the server returns an error
    Then the stale cached data should be served

  Scenario: Handle missing ETag headers gracefully
    Given a server response without ETag headers
    When I make requests without ETag
    Then the system should work normally without caching

  Scenario: Client works normally with caching disabled
    Given a client with ETag caching disabled
    When I make API requests without cache
    Then responses should be returned normally without caching
