Feature: Resilience and Error Recovery
  Every request leaving this library passes through a retry strategy and a
  per-endpoint circuit breaker before it reaches the transport, and every
  failure comes back to the caller as a typed error. This file pins down that
  behaviour: when an attempt is repeated, when it is not, when the circuit
  stops attempting altogether, and which error type surfaces for a 401, a 429,
  a timeout and a non-retryable status.

  The circuit breaker and retry strategy are exercised directly rather than
  through a client, because both are swappable strategies with their own
  contracts (ICircuitBreaker, RetryStrategy) that any replacement has to meet.

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

  Rule: If the server responds with 429, then the EsiClient shall reject the call with an EsiError carrying status code 429.
    ESI signals error-limit exhaustion with 429. Surfacing it as an EsiError
    with the status code preserved lets a caller distinguish backpressure from
    a genuine failure and back off rather than retry at once.

    Scenario: 429 response reaches the caller as an EsiError with status 429
      Given a client configured for the status endpoint
      And the server returns 429 Too Many Requests
      When the client requests the server status
      Then the client shall throw a 429 rate limit error

  Rule: If a request exceeds the configured timeout, then the EsiClient shall reject the call with a TimeoutError.
    A distinct error type matters here because a timeout carries no status code
    and no response body — the caller cannot inspect it the way it would an
    EsiError, and retrying it has a different cost profile.

    Scenario: Unresponsive endpoint reaches the caller as a TimeoutError
      Given a client configured with a short timeout
      And the endpoint does not respond in time
      When the client makes a request
      Then the client shall throw a timeout error
