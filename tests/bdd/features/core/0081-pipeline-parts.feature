@ARCH-08
Feature: Batches, request deduplication, retry, client set-up and pipeline ownership
  Around the request pipeline sit the parts a client is assembled from:
  `EsiClient.batch` and `batchPost` for many keys or IDs at once, the
  deduplicator that joins identical requests in flight, the retry strategy
  with its 401 refresh, `configureApiClient` that installs the middleware,
  what an `ApiClient` serialises to, the ownership that decides what a
  domain client's `shutdown()` stops, and the identity helpers. These Rules
  hold each part to what it hands back and what it logs.

  Batches run through a seam EsiClient logging to a recording logger, with
  fetchers the scenario supplies. The other parts are driven on their own.

  # ── Batches

  Rule: When an EsiClient fetches a batch, the EsiClient shall run no more fetches at once than the concurrency and report progress after each fetch.

    Scenario: Five keys at a concurrency of 2
      Given an EsiClient that logs to a recording logger
      When the client fetches a batch of 5 keys at a concurrency of 2
      Then no more than 2 fetches shall have run at once
      And each of the 5 keys shall have been fetched once
      And the batch shall hold 5 results and 0 errors
      And the batch progress shall have been "1/5, 2/5, 3/5, 4/5, 5/5"

    Scenario: Three keys at a concurrency of 5
      Given an EsiClient that logs to a recording logger
      When the client fetches a batch of 3 keys at a concurrency of 5
      Then no more than 3 fetches shall have run at once
      And each of the 3 keys shall have been fetched once

    Scenario: Twenty-five keys at the default concurrency
      Given an EsiClient that logs to a recording logger
      When the client fetches a batch of 25 keys
      Then no more than 20 fetches shall have run at once
      And the batch shall hold 25 results and 0 errors

  Rule: If a fetch in a batch fails, then the EsiClient shall record the failure as an Error under the fetch's key and return the other results.

    Scenario: One fetch throws an Error and one throws a string
      Given an EsiClient that logs to a recording logger
      And the fetch for "k2" fails with the error "boom"
      And the fetch for "k4" throws the string "bad"
      When the client fetches a batch of 5 keys at a concurrency of 2
      Then the batch shall hold 3 results and 2 errors
      And the batch error for "k2" shall be an Error saying "boom"
      And the batch error for "k4" shall be an Error saying "bad"
      And the batch result for "k5" shall be "value of k5"

  Rule: When an EsiClient fetches a batch of no keys, the EsiClient shall return no results without fetching.

    Scenario: An empty batch
      Given an EsiClient that logs to a recording logger
      When the client fetches a batch of 0 keys at a concurrency of 2
      Then the batch shall hold 0 results and 0 errors
      And no fetch shall have run

  Rule: The EsiClient shall log the number of keys and the concurrency when a batch starts and the successes and failures when the batch completes.

    Scenario: A batch with one failure
      Given an EsiClient that logs to a recording logger
      And the fetch for "k3" fails with the error "boom"
      When the client fetches a batch of 5 keys at a concurrency of 2
      Then the client shall have logged at info "Batch fetch: 5 items, concurrency=2" with the context '{"total":5,"concurrency":2}'
      And the client shall have logged at debug "Batch complete: 4 succeeded, 1 failed" with the context '{"succeeded":4,"failed":1}'

  Rule: When an EsiClient posts IDs in a batch, the EsiClient shall post them in order in chunks of the chunk size and join the chunk results.

    Scenario Outline: <count> IDs in chunks of <size>
      Given an EsiClient that logs to a recording logger
      When the client posts <count> IDs in chunks of <size>
      Then the chunks posted shall have held "<chunks>" IDs
      And the batch post shall return the IDs 1 to <count> in order

      Examples:
        | count | size | chunks           |
        | 2500  | 1000 | 1000, 1000, 500  |
        | 2000  | 1000 | 1000, 1000       |
        | 3     | 2    | 2, 1             |
        | 0     | 2    | none             |

    Scenario: The default chunk size is 1000
      Given an EsiClient that logs to a recording logger
      When the client posts 1500 IDs
      Then the chunks posted shall have held "1000, 500" IDs
      And the client shall have logged at info "Batch POST: 1500 IDs in 2 chunks of 1000" with the context '{"total":1500,"chunks":2,"chunkSize":1000}'

  # ── Request deduplication

  Rule: When a request has the key of one in flight, the request deduplicator shall join the request in flight and log the key at debug.

    Scenario: The same key twice
      Given a request deduplicator that logs to a recording logger
      When a request for "/status/" starts
      And a request for "/status/" starts
      Then the request for "/status/" shall have been sent 1 time
      And the deduplicator shall have logged at debug "[Dedup] Coalescing request: /status/"

  Rule: When in-flight requests are detached by a path, the request deduplicator shall detach exactly the requests whose key contains the path, report the number detached and log the number.

    Scenario: Two of three requests fall under the path
      Given a request deduplicator that logs to a recording logger
      And a request for "/characters/1/contacts/" is in flight
      And a request for "/characters/1/contacts/labels/" is in flight
      And a request for "/status/" is in flight
      When the deduplicator detaches the path "/characters/1/contacts/"
      And a request for "/characters/1/contacts/" starts
      And a request for "/status/" starts
      Then the detach shall report 2 requests
      And the request for "/characters/1/contacts/" shall have been sent 2 times
      And the request for "/status/" shall have been sent 1 time
      And the deduplicator shall have logged at debug "[Dedup] Detached 2 in-flight request(s) matching /characters/1/contacts/ after a write"

  Rule: If no in-flight request falls under a detached path, then the request deduplicator shall detach nothing and log nothing.

    Scenario: A path no request falls under
      Given a request deduplicator that logs to a recording logger
      And a request for "/status/" is in flight
      When the deduplicator detaches the path "/corporations/"
      And a request for "/status/" starts
      Then the detach shall report 0 requests
      And the request for "/status/" shall have been sent 1 time
      And the deduplicator shall have logged no line starting "[Dedup] Detached"

  Rule: When the request deduplicator is cleared, the request deduplicator shall send the next request for every key again.

    Scenario: A cleared deduplicator
      Given a request deduplicator that logs to a recording logger
      And a request for "/status/" is in flight
      When the deduplicator is cleared
      And a request for "/status/" starts
      Then the request for "/status/" shall have been sent 2 times

  # ── Retry

  Rule: If an attempt fails with a CircuitOpenError, then the retry strategy shall fail at once without a retry.

    Scenario: An open circuit with 3 retries allowed
      Given a retry strategy allowing 3 retries
      And the operation fails 1 time with an open circuit and then succeeds
      When the retry strategy runs the operation for an authenticated GET
      Then the operation shall have been attempted 1 time
      And the retry shall have failed with a CircuitOpenError

  Rule: When an authenticated attempt fails with 401, the retry strategy shall refresh the token once and repeat the attempt, logging both steps.

    Scenario: A 401 then success
      Given a retry strategy allowing 0 retries
      And the operation fails 1 time with status 401 and then succeeds
      When the retry strategy runs the operation for an authenticated GET
      Then the operation shall have been attempted 2 times
      And the token shall have been refreshed 1 time
      And the strategy shall have logged at info "Received 401, attempting token refresh..." with the context '{"endpoint":"/characters/1/wallet/"}'
      And the strategy shall have logged at info "Token refreshed, retrying request" with the context '{"endpoint":"/characters/1/wallet/"}'

    Scenario: A 401 after the refresh fails with the 401
      Given a retry strategy allowing 0 retries
      And the operation fails 2 times with status 401 and then succeeds
      When the retry strategy runs the operation for an authenticated GET
      Then the operation shall have been attempted 2 times
      And the token shall have been refreshed 1 time
      And the retry shall have failed with status 401

  Rule: If an authenticated attempt fails with a status other than 401, then the retry strategy shall not refresh the token.

    Scenario: A 503 then success with 1 retry
      Given a retry strategy allowing 1 retries
      And the operation fails 1 time with status 503 and then succeeds
      When the retry strategy runs the operation for an authenticated GET
      Then the operation shall have been attempted 2 times
      And the token shall have been refreshed 0 times

  Rule: If the token refresh fails with an EsiError, then the retry strategy shall fail with that EsiError.

    Scenario: The refresh is refused with status 400
      Given a retry strategy allowing 0 retries
      And the operation fails 1 time with status 401 and then succeeds
      And the token refresh fails with status 400
      When the retry strategy runs the operation for an authenticated GET
      Then the retry shall have failed with status 400

  Rule: If the token refresh fails with any other error, then the retry strategy shall fail with an EsiTokenRefreshError and log the cause.

    Scenario: The refresh throws an Error
      Given a retry strategy allowing 0 retries
      And the operation fails 1 time with status 401 and then succeeds
      And the token refresh fails with the error "revoked"
      When the retry strategy runs the operation for an authenticated GET
      Then the retry shall have failed with an EsiTokenRefreshError
      And the strategy shall have logged at error "Token refresh failed: revoked" with the context '{"endpoint":"/characters/1/wallet/"}'

  Rule: When the retry strategy retries an attempt, the retry strategy shall log the status, the delay and the attempt number.

    Scenario: A 503 retried after 100 ms
      Given a retry strategy allowing 2 retries with a base delay of 200 ms and a cap of 100 ms
      And the operation fails 1 time with status 503 and then succeeds
      When the retry strategy runs the operation for an authenticated GET
      Then the strategy shall have logged at warn "Request to /characters/1/wallet/ failed (503), retrying in 100ms (attempt 1/2)" with the context '{"method":"GET","statusCode":503}'

  # ── Client set-up

  Rule: Where no retry settings are configured, the configured client shall retry 3 times with a base delay of 1000 ms and a cap of 30000 ms.

    Scenario: No retry settings
      Given an ApiClient configured with no retry settings
      Then the client's retry settings shall be '{"maxRetries":3,"baseDelayMs":1000,"maxDelayMs":30000}'

    Scenario: Five retry attempts
      Given an ApiClient configured with 5 retry attempts
      Then the client's retry settings shall be '{"maxRetries":5}'

  Rule: Where a retry strategy is supplied, the configured client shall use the supplied retry strategy.

    Scenario: A supplied strategy
      Given an ApiClient configured with a supplied retry strategy
      Then the client shall use the supplied retry strategy

  Rule: Where a log level is configured without a logger, the configured client shall log through a logger of its own.

    Scenario: A log level of debug
      Given an ApiClient configured with the log level "debug" and no logger
      Then the client shall have a logger of its own

  Rule: Where response interceptors are configured, the configured client shall install each of them.

    Scenario: One response interceptor
      Given an ApiClient configured with 1 response interceptor
      Then the client shall have interceptors installed

  Rule: When the configured client builds a request deduplicator, the deduplicator shall log to the client's logger.

    Scenario: Two identical requests at once
      Given an ApiClient configured with no retry settings
      When the client's deduplicator joins two requests for "/status/"
      Then the client shall have logged at debug "[Dedup] Coalescing request: /status/"

  # ── What a client serialises to

  Rule: The ApiClient shall serialise to its link, datasource, timeout, language, compatibility date, validation switches and which middleware it holds, and not to its access token.

    Scenario: A client with every part
      Given an ApiClient for "https://esi.evetech.net/" with every middleware, a token provider and the access token "secret-token"
      Then the client shall serialise to '{"link":"https://esi.evetech.net","datasource":"singularity","timeout":5000,"hasCache":true,"hasRateLimiter":true,"hasCircuitBreaker":true,"hasDeduplicator":true,"hasTokenProvider":true,"validateResponse":false,"validateRequest":true,"language":"de","compatibilityDate":"2020-01-01"}'
      And the serialised client shall not contain "secret-token"

    Scenario: A bare client
      Given a bare ApiClient for "https://esi.evetech.net"
      Then the client shall serialise to '{"link":"https://esi.evetech.net","timeout":30000,"hasCache":false,"hasRateLimiter":false,"hasCircuitBreaker":false,"hasDeduplicator":false,"hasTokenProvider":false,"validateResponse":true,"validateRequest":false}'

  Rule: When two token refreshes overlap, the ApiClient shall ask the token provider once and give both the same token.

    Scenario: Two refreshes at once
      Given a bare ApiClient for "https://esi.evetech.net"
      And the client's token provider answers "fresh-token"
      When the client refreshes its token twice at once
      Then the token provider shall have been asked 1 time
      And both refreshes shall give "fresh-token"

  Rule: When an ApiClientBuilder builds a client without a rate limiter, the ApiClientBuilder shall give the client a rate limiter of its own.

    Scenario: A builder with no rate limiter
      When an ApiClientBuilder builds a client for "https://esi.evetech.net"
      Then the built client shall have a rate limiter

  # ── Pipeline ownership

  Rule: When a domain client that owns its pipeline shuts down, the pipeline shall stop the cache and circuit breaker it built and drop the in-flight requests of the deduplicator it built.

    Scenario: A pipeline that built every part
      Given an ApiClient configured with every middleware built for it
      And the pipeline is claimed with nothing supplied
      And the pipeline has a circuit and a request in flight
      When the pipeline is shut down
      Then the shutdown shall report that the pipeline was owned
      And the client shall have logged at info "ETag cache manager shut down"
      And the circuit breaker shall hold no circuits
      And the next request for "/status/" shall be sent again

  Rule: When a domain client that owns its pipeline shuts down, the pipeline shall leave every supplied cache, circuit breaker and deduplicator running.

    Scenario: A pipeline whose parts were all supplied
      Given an ApiClient configured with every middleware built for it
      And the pipeline is claimed with every part supplied
      And the pipeline has a circuit and a request in flight
      When the pipeline is shut down
      Then the shutdown shall report that the pipeline was owned
      And the client shall have logged no line starting "ETag cache manager shut down"
      And the circuit breaker shall hold 1 circuit
      And the next request for "/status/" shall join the one in flight

  Rule: If nothing claimed a pipeline, then shutting the pipeline down shall stop nothing and report that the pipeline was not owned.

    Scenario: An unclaimed pipeline
      Given an ApiClient configured with every middleware built for it
      And the pipeline has a circuit and a request in flight
      When the pipeline is shut down
      Then the shutdown shall report that the pipeline was not owned
      And the circuit breaker shall hold 1 circuit

  Rule: The pipeline shall give every surface over one ApiClient the same diagnostics, which report no cache statistics while the ETag cache is disabled.

    Scenario: Diagnostics asked for twice
      Given an ApiClient configured with every middleware built for it
      Then the diagnostics asked for twice shall be the same object
      And the diagnostics shall report cache statistics

    Scenario: Diagnostics with the ETag cache disabled
      Given an ApiClient configured with every middleware built for it
      Then diagnostics made with the ETag cache disabled shall report no cache statistics

  # ── Identities

  Rule: The identity helpers shall carry the character a token names or the provider options give, and no character otherwise.

    Scenario: A token for character 90000001
      When an identity is made from a token for character 90000001
      Then the identity shall name character 90000001

    Scenario: A token that names no character
      When an identity is made from the token "opaque-token"
      Then the identity shall name no character

    Scenario: A provider with character 90000002
      When an identity is made from a token provider for character 90000002
      Then the identity shall name character 90000002

    Scenario: A provider without a character
      When an identity is made from a token provider without a character
      Then the identity shall name no character
