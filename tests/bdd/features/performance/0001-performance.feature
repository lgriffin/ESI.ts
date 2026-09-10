Feature: Performance Characteristics
  These scenarios pin the throughput and latency budgets the library is
  expected to hold: how much overhead a single call adds over its transport
  delay, that concurrent calls overlap instead of queueing, and how long
  parsing and handing back a large collection takes.

  Transport latency is stubbed at the domain-client seam, so every bound below
  measures scheduling, parsing and aggregation inside the library rather than
  the speed of live ESI. Each bound stated in a requirement is the tightest one
  the scenario under it asserts; where a scenario asserts a loose bound and a
  derived rate, the two are reconciled to the stricter of the pair.

  # ── Single-request latency ──────────────────────────────────────────

  Rule: When five single-endpoint requests are issued one after another, the EsiClient shall keep the mean measured response time below 500 milliseconds.
    The five calls are stubbed at 100, 150, 180, 200 and 300 milliseconds, a
    mean of 186, so the 500 millisecond mean leaves room for scheduling
    overhead without hiding a regression. Each call is also held under its own
    ceiling — 1000 milliseconds for universe, 1500 for characters and
    corporations, 2000 for alliance, 3000 for market — and above a 50
    millisecond floor that catches a stub which stopped awaiting.

    Scenario: Five sequential single-endpoint requests with stubbed latencies of 100 to 300 milliseconds
      Given normal system load
      When the client makes API requests and measure response times
      Then response times shall be within acceptable limits

  Rule: When the transport delays a response, the EsiClient shall return that response within 150 milliseconds of the transport delay.
    Overhead is measured as a fixed margin rather than a ratio, because the
    per-call cost of scheduling and parsing does not grow with the wait. The
    scenario sweeps stubbed delays of 50, 200, 500 and 1000 milliseconds and
    also requires each measurement to sit no more than 5 milliseconds below its
    stubbed delay, which catches a stub that resolved early.

    Scenario: Stubbed latencies of 50, 200, 500, and 1000 milliseconds
      Given different network latencies
      When the client makes requests under different conditions
      Then the client shall handle varying conditions gracefully

  # ── Concurrent requests ─────────────────────────────────────────────

  Rule: When 50 requests are issued concurrently, the EsiClient shall return all 50 responses within 500 milliseconds.
    Each of the 50 calls is stubbed at 100 milliseconds, so running them one
    after another would take 5000. The 500 millisecond bound is the assertion
    that the observed elapsed time is at least ten times shorter than that
    serial figure, and it fails the moment an internal lock, a shared queue or
    a rate-limiter bucket serialises the group.

    Scenario: Fifty concurrent character lookups each stubbed at 100 milliseconds
      Given high concurrent load
      When the client makes simultaneous requests
      Then the client shall handle them efficiently

  Rule: When five requests spanning five domain clients are issued concurrently, the EsiClient shall return all five responses within 350 milliseconds.
    Alliance, character, corporation, universe and market calls are stubbed at
    120, 100, 150, 80 and 200 milliseconds. The bound sits just above the
    slowest leg, so concurrency has to hold across different domain clients and
    not only across repeated calls to one of them.

    Scenario: Alliance, character, corporation, system, and market calls issued together
      Given mixed API types for concurrent requests
      When the client makes concurrent requests across different APIs
      Then all mixed requests shall complete successfully

  # ── Large payload throughput ────────────────────────────────────────

  Rule: When a market response containing 10000 orders is returned, the EsiClient shall make all 10000 parsed orders available to the caller within 2000 milliseconds.
    A Jita region order book is this size, so it is the payload that decides
    whether the library is usable for market tooling. The 2000 millisecond
    window covers the call plus the caller's own pass over the result, and is
    equivalent to the 5000 orders per second rate the scenario also asserts.

    Scenario: Ten thousand market orders filtered and aggregated
      Given large market data
      When the client processes the market dataset
      Then performance shall remain acceptable

  Rule: When a 5000-entry member list and a 100-entry roles list are requested together, the EsiClient shall return both lists within 1500 milliseconds.
    Member identifiers come back as a bare number array, which is the cheapest
    shape ESI returns, so this bound is about the cost of the surrounding
    pipeline rather than of parsing. 1500 milliseconds for 5000 entries is the
    stricter of the two figures asserted, the other being 3000 entries per
    second.

    Scenario: Five thousand member identifiers with one hundred role records
      Given a large corporation
      When the client processes member data
      Then performance shall scale appropriately

  Rule: When a 1000-order response is read 100 times in sequence, the EsiClient shall complete the 100 reads within 5000 milliseconds.
    A long-running process repeats the same call for its whole lifetime, so
    per-call cost has to stay flat: 5000 milliseconds over 100 iterations is
    the 50 millisecond per-iteration mean the scenario asserts. The scenario
    also compares the first and last iteration's order count and average price,
    which would diverge if state accumulated between reads.

    Scenario: One hundred sequential reads of a thousand-order dataset
      Given memory-intensive operations
      When the client processes large amounts of data iteratively
      Then memory usage shall remain efficient

  # ── Failure paths ───────────────────────────────────────────────────

  Rule: If requests within a concurrent group of 20 reject with a 500 error, then the EsiClient shall settle every request in that group within 1000 milliseconds.
    Six of the 20 calls throw and 14 resolve, all stubbed at 100 milliseconds.
    Rejections travel the same path as successes, so a group containing
    failures settles in the same window as one without — 1000 milliseconds,
    against the 2000 a serialised error path would cost. Each rejection reaches
    the caller as an EsiError.

    Scenario: Six of twenty concurrent lookups reject with a 500 error
      Given error conditions exist
      When errors occur during requests
      Then error handling shall not significantly impact performance
