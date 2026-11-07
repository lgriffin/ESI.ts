@ARCH-08
Feature: Circuit breaker state, statistics and clean-up
  `CircuitBreaker` keeps one circuit per endpoint: closed while the endpoint
  answers, open after enough consecutive failures, half-open once the reset
  timeout has passed so a probe can test the endpoint again.
  0051-resilience.feature specifies how the EsiClient behaves around an open
  circuit. These Rules hold the breaker itself to its configuration: which
  statuses count, when the timeout ends, how many probes it admits, what its
  statistics report, and which idle circuits it drops.

  The scenarios drive a real CircuitBreaker that reads a clock the scenario
  moves, so each timeout and threshold is crossed exactly.

  # ── What counts as a failure

  Rule: When an endpoint fails with status 0, 420, 429 or a status of 500 or above, the circuit breaker shall count the failure towards opening the circuit.
    Status 0 is a network failure or a timeout, 420 and 429 are ESI's rate
    limits, and 5xx is the server. Each says the endpoint is unwell.

    Scenario Outline: A failure with status <status> opens a circuit that opens after 1 failure
      Given a circuit breaker that opens after 1 failures and resets after 1000 ms
      And the endpoint "status/" fails with status <status>
      Then the circuit for "status/" shall be open

      Examples:
        | status |
        | 0      |
        | 420    |
        | 429    |
        | 503    |

  Rule: If an endpoint fails with a status from 400 to 499 other than 420 and 429, then the circuit breaker shall not count the failure.
    A client error describes the request, not the endpoint's health.

    Scenario Outline: A failure with status <status> leaves the circuit closed
      Given a circuit breaker that opens after 1 failures and resets after 1000 ms
      And the endpoint "status/" fails with status <status>
      Then the circuit for "status/" shall be closed

      Examples:
        | status |
        | 400    |
        | 404    |

  # ── The reset timeout

  Rule: While the reset timeout has not elapsed, the circuit breaker shall refuse a check of an open circuit with a CircuitOpenError that reports the time left.
    The time left tells the caller when a retry can succeed.

    Scenario: A check 400 ms into a 1000 ms timeout is told to wait 600 ms
      Given a circuit breaker that opens after 2 failures and resets after 1000 ms
      And the endpoint "status/" fails 2 times with status 503
      And 400 ms pass
      When the circuit breaker checks the endpoint "status/"
      Then the check shall be refused with a CircuitOpenError retrying after 600 ms
      And the circuit for "status/" shall be open

  Rule: When the reset timeout has elapsed, the circuit breaker shall report the circuit as half-open and admit a probe.
    The timeout ends at the millisecond it was set for, not one after.

    Scenario: A check exactly 1000 ms into a 1000 ms timeout is admitted as the probe
      Given a circuit breaker that opens after 2 failures and resets after 1000 ms
      And the endpoint "status/" fails 2 times with status 503
      And 1000 ms pass
      Then the circuit for "status/" shall be half-open
      When the circuit breaker checks the endpoint "status/"
      Then the check shall be admitted

  Rule: While a circuit is half-open, the circuit breaker shall admit up to halfOpenMaxAttempts probes and refuse the next one.
    More than one probe lets a caller test an endpoint with several calls in
    flight; the limit keeps a sick endpoint from a full load.

    Scenario: A circuit that allows 2 probes admits 2 checks and refuses the third
      Given a circuit breaker that opens after 2 failures and allows 2 probes
      And the endpoint "status/" fails 2 times with status 503
      And 1000 ms pass
      When the circuit breaker checks the endpoint "status/" 3 times
      Then the circuit breaker shall have admitted 2 checks before refusing one

  # ── Statistics and reset

  Rule: When statistics are requested, the circuit breaker shall count only the open circuits as open.
    The open count is what a health check alerts on.

    Scenario: One open and one closed circuit count one open circuit of two
      Given a circuit breaker that opens after 1 failures and resets after 1000 ms
      And the endpoint "status/" fails with status 503
      And the endpoint "markets/prices/" is checked
      Then the circuit breaker shall report 1 open circuits of 2

  Rule: When the circuit breaker is reset for one endpoint, the circuit breaker shall close that endpoint's circuit and keep the others.
    Resetting one endpoint after a fix must not hide another that is still
    failing.

    Scenario: Resetting the status circuit leaves the prices circuit open
      Given a circuit breaker that opens after 1 failures and resets after 1000 ms
      And the endpoint "status/" fails with status 503
      And the endpoint "markets/prices/" fails with status 503
      When the circuit breaker is reset for the endpoint "status/"
      Then the circuit for "status/" shall be closed
      And the circuit for "markets/prices/" shall be open

  Rule: When the circuit breaker is shut down, the circuit breaker shall forget every circuit.
    A breaker that is shut down holds no state for a later run to inherit.

    Scenario: A shut down breaker reports no circuits
      Given a circuit breaker that opens after 1 failures and resets after 1000 ms
      And the endpoint "status/" fails with status 503
      When the circuit breaker is shut down
      Then the circuit breaker shall report 0 open circuits of 0

  # ── Idle circuits

  Rule: When the circuit breaker cleans up, the circuit breaker shall remove each closed circuit with no failures whose last failure is older than the stale threshold, and keep every other circuit.
    A long-running process meets a great number of endpoints; a circuit that
    recovered long ago is only memory. A circuit that is open, still counting
    failures, recovered recently or never failed is still information.

    Scenario: Only the circuit that recovered long ago is removed
      Given a circuit breaker that opens after 2 failures and drops circuits idle for 1000 ms
      And the endpoint "status/" fails with status 503
      And the endpoint "status/" succeeds
      And the endpoint "wallet/" fails with status 503
      And the endpoint "markets/" fails 2 times with status 503
      And the endpoint "route/" is checked
      And 500 ms pass
      And the endpoint "fresh/" fails with status 503
      And the endpoint "fresh/" succeeds
      And 501 ms pass
      When the circuit breaker cleans up
      Then the clean-up shall have removed 1 circuits
      And the circuit breaker shall hold the circuits "wallet/, markets/, route/, fresh/"

    Scenario: A circuit idle for exactly the stale threshold is kept
      Given a circuit breaker that opens after 2 failures and drops circuits idle for 1000 ms
      And the endpoint "status/" fails with status 503
      And the endpoint "status/" succeeds
      And 1000 ms pass
      When the circuit breaker cleans up
      Then the clean-up shall have removed 0 circuits
      And the circuit breaker shall hold the circuits "status/"

  Rule: Where cleanupIntervalMs is above 0, the circuit breaker shall clean up on that interval until it is shut down.
    The interval is how an application that never calls cleanup itself keeps
    the circuit map bounded.

    Scenario: A breaker that cleans up every 5 ms drops a stale circuit by itself
      Given a circuit breaker that drops circuits idle for 1000 ms and cleans up every 5 ms
      And the endpoint "status/" fails with status 503
      And the endpoint "status/" succeeds
      And 1001 ms pass
      When 40 ms of real time pass
      Then the circuit breaker shall hold no circuits

    Scenario: A breaker that was shut down no longer cleans up
      Given a circuit breaker that drops circuits idle for 1000 ms and cleans up every 5 ms
      And the circuit breaker is shut down
      And the endpoint "status/" fails with status 503
      And the endpoint "status/" succeeds
      And 1001 ms pass
      When 40 ms of real time pass
      Then the circuit breaker shall hold the circuits "status/"

  Rule: Where cleanupIntervalMs is 0, the circuit breaker shall not clean up by itself.
    0 is how the configuration turns the timer off.

    Scenario: A breaker with a clean-up interval of 0 keeps a stale circuit
      Given a circuit breaker that drops circuits idle for 1000 ms and cleans up every 0 ms
      And the endpoint "status/" fails with status 503
      And the endpoint "status/" succeeds
      And 1001 ms pass
      When 40 ms of real time pass
      Then the circuit breaker shall hold the circuits "status/"
