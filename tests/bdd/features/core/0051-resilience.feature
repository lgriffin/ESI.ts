Feature: Resilience and Error Recovery
  Every request leaving this library passes through a retry strategy and,
  where enabled, a per-endpoint circuit breaker before it reaches the
  transport, and every
  failure comes back to the caller as a typed error. This file pins down that
  behaviour: when an attempt is repeated, when it is not, when the circuit
  stops attempting altogether, and which error type surfaces for a 401, a 429,
  a timeout and a non-retryable status.

  The first Rules exercise the circuit breaker and retry strategy directly,
  because both are swappable strategies with their own contracts
  (ICircuitBreaker, RetryStrategy) that any replacement has to meet. The Rules
  from "Retry classes" on drive a real EsiClient against HTTP responses. They
  are the single statement of which failures are retried, how the circuit
  moves between states, and when identical requests share one HTTP call.
  Domain features point here rather than restating them. Serving a cached
  body when ESI fails is an ETag cache behaviour, specified in
  0050-etag-caching.feature.

  # ── Circuit breaking ────────────────────────────────────────────────

  Rule: When recorded consecutive failures for an endpoint reach the configured failure threshold, the circuit breaker shall move that endpoint to the open state and reject further calls to it with CircuitOpenError.
    The breaker exists to stop a failing endpoint from consuming the shared ESI
    error budget. State is tracked per endpoint, so one dead route does not
    stop traffic to healthy ones. Once open, checkCircuit refuses the call
    before any HTTP request is built.

    Scenario: Third consecutive 503 opens a circuit with a threshold of three
      Given a client with circuit breaker enabled
      And the endpoint fails with 503 errors
      When the client makes requests until the circuit opens
      Then the circuit breaker shall be in the open state

  Rule: When the reset timeout has elapsed and the probe call that follows succeeds, the circuit breaker shall return the endpoint to the closed state.
    An open circuit is a temporary state, not a permanent one. After the reset
    timeout the next checkCircuit lets a single probe through; a success on
    that probe clears the failure count and traffic resumes at full rate.

    Scenario: Probe succeeding after the reset timeout closes the circuit
      Given a client with circuit breaker in open state
      When the cooldown period expires and a probe request succeeds
      Then the circuit breaker shall transition to closed state

  # ── Retrying ────────────────────────────────────────────────────────

  Rule: When an attempt fails with a retryable error and a later attempt succeeds, the retry strategy shall return the successful result to the caller.
    Transient 5xx responses are common on ESI and are the reason retry exists.
    The caller sees only the eventual success — the intermediate failure is not
    surfaced as an error or as a partial result.

    Scenario: Second attempt succeeds after a 503 on the first
      Given a client with retry configured for 2 attempts
      And the endpoint fails once then succeeds
      When the client makes a request
      Then the client shall return the successful response

  Rule: If every attempt fails with a retryable error, then the retry strategy shall invoke the operation once more than the configured maxRetries and rethrow the last error unchanged.
    Retry has to terminate. With maxRetries set to 2 the operation runs three
    times in total — the initial attempt plus two retries — and the error from
    the final attempt is the one the caller receives, with its status code
    intact.

    Scenario: Persistent 503 runs three attempts and rethrows the 503
      Given a client with retry configured for 2 attempts
      And the endpoint always returns 503
      When the client makes a request
      Then the client shall throw a 503 error after all retries

  Rule: If an error is classified as non-retryable, then the retry strategy shall invoke the operation exactly once and rethrow that error.
    A 404 means the resource is absent, not that the server is struggling, so
    repeating the call cannot change the outcome. Bypassing retry for these
    statuses keeps latency low and protects the ESI error budget, and it holds
    regardless of how high maxRetries is configured.

    Scenario: 404 is rethrown after a single attempt despite maxRetries of three
      Given a client with retry configured for 3 attempts
      And the endpoint returns 404
      When the client makes a request
      Then the client shall throw a 404 error without retrying

  # ── Token refresh on 401 ────────────────────────────────────────────

  Rule: When an authenticated request fails with 401, the retry strategy shall invoke the refreshToken callback and return the result of the retried attempt.
    Access tokens expire mid-session, and the 401 is the first the client hears
    of it. Refreshing and replaying the request keeps that invisible to the
    caller. This path applies only where the request context is marked
    requiresAuth.

    Scenario: 401 on an authenticated endpoint is replayed after refreshing
      Given a client with a token provider
      And the endpoint returns 401 then succeeds after token refresh
      When the client makes an authenticated request
      Then the client shall return the response after token refresh

  Rule: If the refreshToken callback rejects, then the retry strategy shall throw an error whose message reports the token refresh failure.
    A refresh failure is a credential problem, not a transport problem, and the
    caller needs to be able to tell the two apart to decide whether to
    re-authenticate the user. The original 401 is replaced by a message naming
    the refresh as the cause.

    Scenario: Rejecting refresh callback surfaces a token refresh failure
      Given a client with a failing token provider
      And the endpoint returns 401
      When the client makes an authenticated request
      Then the client shall throw a token refresh failed error

  # ── Typed errors reaching the caller ────────────────────────────────

  Rule: If every attempt at a request is answered with 429, then the EsiClient shall reject the call with an EsiError carrying status code 429.
    ESI signals error-limit exhaustion with 429. Surfacing it as an EsiError
    with the status code preserved lets a caller distinguish backpressure from
    a genuine failure. A 429 is retryable, so the rejection comes only once the
    retry budget is spent; this scenario's client has no retries, so its one
    attempt is every attempt.

    Scenario: 429 response reaches the caller as an EsiError with status 429
      Given a client configured for the status endpoint
      And the server returns 429 Too Many Requests
      When the client requests the server status
      Then the client shall throw a 429 rate limit error

  Rule: If every attempt at a request exceeds the configured timeout, then the EsiClient shall reject the call with a TimeoutError.
    A distinct error type matters here because a timeout carries no HTTP status
    and no response body. TimeoutError extends EsiError with status code 0, and
    status 0 is retryable, so a timed-out attempt is repeated while retries
    remain; this scenario's client has none.

    Scenario: Unresponsive endpoint reaches the caller as a TimeoutError
      Given a client configured with a short timeout
      And the endpoint does not respond in time
      When the client makes a request
      Then the client shall throw a timeout error

  # ── Retry classes ───────────────────────────────────────────────────

  Rule: If a GET request is answered with HTTP 502, 503, or 504 while retries remain, then the EsiClient shall issue the same request again and resolve with the response to the retry.
    These are the gateway and availability failures ESI returns around
    downtime and under load, and an attempt moments later often succeeds. The
    delay between attempts is exponential with jitter; the scenarios shrink it
    to milliseconds. HTTP 500 is not in this class, as the non-retryable Rule
    below states.

    Scenario Outline: HTTP <status> on the first attempt is retried
      Given a client with retries enabled
      And ESI answers the first server status request with HTTP <status> and the retry with a payload
      When the client requests the server status
      Then the client resolves with the payload from the retry
      And the client sent 2 requests

      Examples:
        | status |
        | 502    |
        | 503    |
        | 504    |

  Rule: If a GET request is answered with HTTP 420 or 429 while retries remain, then the request pipeline shall issue the same request again.
    Both statuses mean the caller is being throttled, not that the request is
    wrong. In production the rate limiter first blocks the whole rate-limit
    group, for the Retry-After period or 60 seconds when none is given, so the
    retry leaves only after that wait. These scenarios run the rate limiter in
    test mode, as the unit suite does, so they pin the decision to retry and
    not the wait.

    Scenario Outline: HTTP <status> on the first attempt is retried once the rate limiter allows it
      Given a request pipeline with retries enabled and its rate limiter in test mode
      And ESI answers the first server status request with HTTP <status> and the retry with a payload
      When the client requests the server status
      Then the client resolves with the payload from the retry
      And the client sent 2 requests

      Examples:
        | status |
        | 420    |
        | 429    |

  Rule: If a GET request exceeds the configured timeout while retries remain, then the EsiClient shall issue the same request again.
    A timeout reaches the retry strategy as a TimeoutError with status code 0,
    which it treats as transient: the server may only have been slow. A caller
    that needs a hard deadline sets retries to 0.

    Scenario: A timed-out first attempt is retried
      Given a client with retries enabled and a 50 millisecond timeout
      And ESI holds the first server status request past the timeout and answers the retry at once
      When the client requests the server status
      Then the client resolves with the payload from the retry
      And the client sent 2 requests

  Rule: If a GET request is answered with HTTP 400, 401, 403, 404, or 500, then the EsiClient shall reject with an EsiError carrying that status after a single request.
    These statuses describe the request or a fault the retry strategy does not
    classify as transient, and repeating the call spends the ESI error budget
    for the same answer. The retryable classes are exactly 0 (timeout), 420,
    429, 502, 503 and 504. A 401 is replayed once after a token refresh, and
    only where a refresh callback is configured; this client has none.

    Scenario Outline: HTTP <status> is rejected without a retry
      Given a client with retries enabled
      And ESI answers the server status request with HTTP <status>
      When the client requests the server status
      Then the client rejects with an EsiError carrying status <status>
      And the client sent 1 request

      Examples:
        | status |
        | 400    |
        | 401    |
        | 403    |
        | 404    |
        | 500    |

  Rule: If a non-GET request is answered with HTTP 503, then the EsiClient shall reject after a single request.
    A POST, PUT or DELETE may already have taken effect when the error comes
    back, and repeating it could apply it twice. Mutations are therefore not
    retried unless retryMutations is set.

    Scenario: A name resolution POST answered with 503 is not retried
      Given a client with retries enabled
      And ESI answers the name resolution request with HTTP 503
      When the client posts identifiers for name resolution
      Then the client rejects with an EsiError carrying status 503
      And the client sent 1 request

  Rule: Where retryMutations is enabled, the EsiClient shall issue a non-GET request answered with HTTP 503 again.
    For endpoints the caller knows to be idempotent, such as name resolution,
    opting in restores the same retry behaviour GET requests have.

    Scenario: A name resolution POST answered with 503 is retried when mutations may be retried
      Given a client with retries enabled for mutations
      And ESI answers the first name resolution request with HTTP 503 and the retry with names
      When the client posts identifiers for name resolution
      Then the client resolves with the names from the retry
      And the client sent 2 requests

  # ── Circuit states ──────────────────────────────────────────────────

  Rule: While the circuit for an endpoint is open, the EsiClient shall reject calls to that endpoint with CircuitOpenError without issuing an HTTP request.
    The breaker exists to stop spending the error budget on an endpoint that is
    failing, so the refusal comes before the rate limiter and before fetch. The
    circuit breaker is opt-in through enableCircuitBreaker.

    Scenario: A call after the failure threshold is refused without a request
      Given a client whose circuit breaker opens after 2 failures, with no retries
      And ESI answers the server status request with HTTP 503 2 times
      When the client requests the server status 3 times
      Then the first 2 calls reject with an EsiError carrying status 503
      And the last call rejects with CircuitOpenError
      And the client sent 2 requests

  Rule: While the circuit for one endpoint is open, the EsiClient shall continue to issue requests to other endpoints.
    Circuits are keyed by the resolved request path, so an outage on one
    endpoint does not cut the client off from the rest of ESI.

    Scenario: An open server status circuit leaves the dogma attribute index reachable
      Given a client whose circuit breaker opens after 1 failure, with no retries
      And the circuit for the server status endpoint has opened
      And ESI answers the dogma attribute index request with a payload
      When the client requests the dogma attribute index
      Then the client resolves with the dogma attribute identifiers
      And the circuit for the server status endpoint is open
      And the client sent 2 requests

  Rule: If an endpoint answers with a 4xx status other than 420 or 429, then the circuit breaker shall not count the response towards opening the circuit.
    A 404 or a 403 describes the request, not the health of the endpoint.
    Counting them would let one caller's unknown identifiers shut an endpoint
    for every other call sharing the client. Status 420 and 429, 5xx, and
    transport failures all count.

    Scenario: Repeated 404s leave the circuit closed
      Given a client whose circuit breaker opens after 2 failures, with no retries
      And ESI answers the server status request with HTTP 404 3 times
      When the client requests the server status 3 times
      Then the first 3 calls reject with an EsiError carrying status 404
      And the circuit for the server status endpoint is closed
      And the client sent 3 requests

  Rule: If the probe request issued after the reset timeout fails, then the circuit breaker shall return the endpoint to the open state.
    A failed probe is evidence the endpoint is still down, so the circuit
    reopens and the reset timeout starts again from the probe's failure.

    Scenario: A failed probe reopens the circuit
      Given a client whose circuit breaker opens after 1 failure and resets after 50 milliseconds, with no retries or deduplication
      And the circuit for the server status endpoint has opened
      And the reset timeout has elapsed
      And ESI answers the server status probe with HTTP 503
      When the client requests the server status 2 times
      Then the first call rejects with an EsiError carrying status 503
      And the last call rejects with CircuitOpenError
      And the client sent 2 requests

  Rule: While the probe for a half-open circuit is in flight, the EsiClient shall reject further calls to that endpoint with CircuitOpenError without issuing an HTTP request.
    halfOpenMaxAttempts, default 1, is the number of probes a half-open circuit
    admits. The call that moves the circuit from open to half-open is the
    first of them; counting from the call after it would let one probe more
    than configured reach an endpoint that has just been failing.

    Scenario: A second call while the probe is in flight is refused without a request
      Given a client whose circuit breaker opens after 1 failure and resets after 50 milliseconds, with no retries or deduplication
      And the circuit for the server status endpoint has opened
      And the reset timeout has elapsed
      And ESI answers the server status probe with a payload after 100 milliseconds
      When the client requests the server status twice at once
      Then the first call resolves with the server status
      And the last call rejects with CircuitOpenError
      And the client sent 2 requests

  Rule: If a call admitted before the circuit opened succeeds while the circuit is open, then the circuit breaker shall keep the circuit open.
    Calls already in flight when the threshold is reached still complete. Only
    the probe issued after the reset timeout may close an open circuit; a late
    success from an earlier call would otherwise close it at once, and under
    concurrent traffic the breaker would never stay open.

    Scenario: A slow success that lands after the circuit opened leaves it open
      Given a client whose circuit breaker opens after 1 failure, with no retries or deduplication
      And ESI answers the first server status request with a payload after 100 milliseconds
      And ESI answers the second server status request with HTTP 503
      When the client requests the server status twice at once
      Then the first call resolves with the server status
      And the last call rejects with an EsiError carrying status 503
      And the circuit for the server status endpoint is open

  Rule: If the circuit opens while a call is still retrying, then the EsiClient shall reject that call with CircuitOpenError and issue no further attempt.
    Retry and circuit breaking compose: each failed attempt counts towards the
    threshold, and the retry strategy passes CircuitOpenError straight through
    rather than retrying it. A caller with both enabled can therefore receive
    CircuitOpenError, not the last 5xx, from a call whose own attempts opened
    the circuit.

    Scenario: The second of four attempts opens the circuit and ends the call
      Given a client whose circuit breaker opens after 2 failures, with retries enabled
      And ESI answers the server status request with HTTP 503 2 times
      When the client requests the server status
      Then the client rejects with CircuitOpenError
      And the client sent 2 requests

  # ── Deduplication of in-flight requests ─────────────────────────────

  Rule: When identical GET requests are issued while the first is still in flight, the EsiClient shall issue one HTTP request and resolve every caller with its response.
    Dashboards and fan-out code often ask for one resource from several places
    at once. Coalescing the calls keeps duplicates off the ESI rate limit. The
    key is the resolved request path, query string included, so requests that
    differ by a path parameter or a page stay separate. Deduplication is on by
    default.

    Scenario: Two concurrent server status requests share one HTTP request
      Given a client with request deduplication and no ETag cache
      And ESI answers the server status request after 20 milliseconds with a payload
      When the client requests the server status twice at once
      Then both calls resolve with the payload
      And the client sent 1 request

  Rule: If a shared in-flight GET request fails, then the EsiClient shall reject every caller that joined it.
    Callers that joined an in-flight request share its outcome, failure
    included. None of them receives a result the others did not.

    Scenario: Two concurrent callers of a failing request both reject
      Given a client with request deduplication and no ETag cache
      And ESI answers the server status request after 20 milliseconds with HTTP 404
      When the client requests the server status twice at once
      Then both calls reject with an EsiError carrying status 404
      And the client sent 1 request

  Rule: When an identical GET request is issued after the first has settled, the EsiClient shall issue a new HTTP request.
    Deduplication covers only requests in flight together. It is not a cache:
    once a request settles, the next identical one goes to the network unless
    the ETag cache answers it.

    Scenario: A second server status request after the first resolves issues its own request
      Given a client with request deduplication and no ETag cache
      And ESI answers the server status request after 0 milliseconds with a payload 2 times
      When the client requests the server status 2 times
      Then the client sent 2 requests

  Rule: Where request deduplication is disabled, the EsiClient shall issue one HTTP request per concurrent call.
    Setting enableRequestDeduplication to false restores one request per call
    for a caller that needs every response fetched independently.

    Scenario: Two concurrent server status requests without deduplication issue two requests
      Given a client without request deduplication or an ETag cache
      And ESI answers the server status request after 20 milliseconds with a payload 2 times
      When the client requests the server status twice at once
      Then both calls resolve with the payload
      And the client sent 2 requests

  Rule: When identical non-GET requests are issued concurrently, the EsiClient shall issue one HTTP request per call.
    Only bodiless GET requests are coalesced. Two identical writes are two
    intended writes, and merging them would drop one.

    Scenario: Two concurrent name resolution POSTs issue two requests
      Given a client with request deduplication and no ETag cache
      And ESI answers the name resolution request after 20 milliseconds with names 2 times
      When the client posts identifiers for name resolution twice at once
      Then the client sent 2 requests
