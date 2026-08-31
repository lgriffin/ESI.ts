Feature: Resilience and Error Recovery

  # EARS: Unwanted - Circuit Breaker
  Scenario: IF an endpoint fails repeatedly, THEN the circuit breaker shall open
    Given a client with circuit breaker enabled
    And the endpoint fails with 503 errors
    When the client makes requests until the circuit opens
    Then the circuit breaker shall be in the open state

  # EARS: Unwanted - Circuit Breaker Recovery
  Scenario: IF the circuit is open and the cooldown expires, THEN the circuit shall transition to half-open
    Given a client with circuit breaker in open state
    When the cooldown period expires and a probe request succeeds
    Then the circuit breaker shall transition to closed state

  # EARS: Unwanted - Retry Exhaustion
  Scenario: IF retries are exhausted on a 503, THEN the client shall throw the final error
    Given a client with retry configured for 2 attempts
    And the endpoint always returns 503
    When the client makes a request
    Then the client shall throw a 503 error after all retries

  # EARS: Unwanted - Retry Success
  Scenario: IF a request fails then succeeds on retry, THEN the client shall return the successful response
    Given a client with retry configured for 2 attempts
    And the endpoint fails once then succeeds
    When the client makes a request
    Then the client shall return the successful response

  # EARS: Unwanted - Token Refresh
  Scenario: IF a 401 occurs on an authenticated endpoint, THEN the client shall refresh the token and retry
    Given a client with a token provider
    And the endpoint returns 401 then succeeds after token refresh
    When the client makes an authenticated request
    Then the client shall return the response after token refresh

  # EARS: Unwanted - Token Refresh Failure
  Scenario: IF token refresh fails, THEN the client shall throw a token refresh error
    Given a client with a failing token provider
    And the endpoint returns 401
    When the client makes an authenticated request
    Then the client shall throw a token refresh failed error

  # EARS: Unwanted - Rate Limiting
  Scenario: IF the server returns 429, THEN the client shall throw a rate limit error
    Given a client configured for the status endpoint
    And the server returns 429 Too Many Requests
    When the client requests the server status
    Then the client shall throw a 429 rate limit error

  # EARS: Unwanted - Request Timeout
  Scenario: IF a request exceeds the timeout, THEN the client shall throw a timeout error
    Given a client configured with a short timeout
    And the endpoint does not respond in time
    When the client makes a request
    Then the client shall throw a timeout error

  # EARS: Unwanted - Non-Retryable Error
  Scenario: IF a 404 error occurs with retries enabled, THEN the client shall not retry
    Given a client with retry configured for 3 attempts
    And the endpoint returns 404
    When the client makes a request
    Then the client shall throw a 404 error without retrying
