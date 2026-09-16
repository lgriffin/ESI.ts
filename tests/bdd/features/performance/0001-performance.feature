Feature: Performance Characteristics
  These scenarios pin the throughput and latency budgets the library is
  expected to hold: how much overhead a single call adds over its transport
  delay, that concurrent calls overlap instead of queueing, and how long
  parsing and handing back a large collection takes.

  Responses are queued at the HTTP transport, each with a simulated network
  delay, so every bound below measures the real request pipeline (rate
  limiter, fetch, JSON parsing, the ETag cache, pagination and Zod validation)
  plus any aggregation the caller does, rather than the speed of live ESI.
  Each bound stated in a requirement is the one the scenario under it asserts.
  The bounds are coarse regression guards sized for slow CI runners, with at
  least ten times the pipeline cost observed locally as headroom; they catch
  serialised dispatch, stalls and per-call delays, not a constant-factor
  slowdown in parsing.

  The concurrency bounds hold only with the rate limiter's minimum request
  spacing set to zero. Its default of 50 milliseconds staggers dispatch on
  purpose, which alone would push a group of 20 concurrent requests close to
  one second.

  # ── Single-request latency ──────────────────────────────────────────

  Rule: When five single-endpoint requests are issued one after another, the EsiClient shall keep the mean measured response time below 500 milliseconds.
    The alliance, character, corporation, market price and solar system calls
    wait 200, 150, 180, 300 and 100 milliseconds at the transport, a mean of
    186, so the 500 millisecond mean leaves 314 milliseconds of pipeline
    overhead per call. Each call is also held under its own transport delay
    plus 250 milliseconds, and no more than 5 milliseconds below that delay,
    which catches a response that never waited on the transport. Every result
    is compared with the body ESI sent.

    Scenario: Five sequential single-endpoint requests with stubbed latencies of 100 to 300 milliseconds
      Given normal system load
      When the client makes API requests and measure response times
      Then response times shall be within acceptable limits

  Rule: When the transport delays a response, the EsiClient shall return that response within 150 milliseconds of the transport delay.
    Overhead is measured as a fixed margin rather than a ratio, because the
    per-call cost of scheduling and parsing does not grow with the wait. The
    scenario sweeps transport delays of 50, 200, 500 and 1000 milliseconds,
    one character lookup each, and also requires each measurement to sit no
    more than 5 milliseconds below its delay, which catches a response that
    never waited on the transport.

    Scenario: Stubbed latencies of 50, 200, 500, and 1000 milliseconds
      Given different network latencies
      When the client makes requests under different conditions
      Then the client shall handle varying conditions gracefully

  # ── Concurrent requests ─────────────────────────────────────────────

  Rule: Where minimum request spacing is disabled, when 50 requests are issued concurrently, the EsiClient shall return all 50 responses within 500 milliseconds.
    Each of the 50 character lookups waits 100 milliseconds at the transport,
    so running them one after another would take 5000. The 500 millisecond
    bound is ten times shorter than that serial figure, and fails once an
    internal lock or a shared queue limits the group to ten requests in flight
    or fewer. With the default 50 millisecond spacing the dispatches alone
    would span 2450 milliseconds, which is why the requirement is conditional
    on spacing being off.

    Scenario: Fifty concurrent character lookups each stubbed at 100 milliseconds
      Given high concurrent load
      When the client makes simultaneous requests
      Then the client shall handle them efficiently

  Rule: Where minimum request spacing is disabled, when five requests spanning five domain clients are issued concurrently, the EsiClient shall return all five responses within 400 milliseconds.
    Alliance, character, corporation, universe and market calls wait 120, 100,
    150, 80 and 200 milliseconds at the transport, 650 in total. The bound sits
    200 milliseconds above the slowest leg, room for five parses on a slow
    runner while still far below the serial total, so concurrency has to hold
    across different domain clients and not only across repeated calls to one
    of them.

    Scenario: Alliance, character, corporation, system, and market calls issued together
      Given mixed API types for concurrent requests
      When the client makes concurrent requests across different APIs
      Then all mixed requests shall complete successfully

  # ── Large payload throughput ────────────────────────────────────────

  Rule: When a region order book of 10000 orders is returned across 10 pages, the EsiClient shall make all 10000 parsed orders available to the caller within 2000 milliseconds.
    A Jita region order book is this size, so it is the payload that decides
    whether the library is usable for market tooling. ESI serves it 1000
    orders per page, so the 2000 millisecond window covers ten sequential
    fetches and parses, the page concatenation, Zod validation of the whole
    book and the caller's own pass over the result: a rate of 5000 orders per
    second. The scenario also checks that every page was requested once, in
    order, and that the orders and aggregates match what ESI sent.

    Scenario: Ten thousand market orders filtered and aggregated
      Given large market data
      When the client processes the market dataset
      Then performance shall remain acceptable

  Rule: When a 5000-entry member list and a 100-entry roles list are requested together, the EsiClient shall return both lists within 1500 milliseconds.
    Member identifiers come back as a bare number array, which is the cheapest
    shape ESI returns, so this bound is about the cost of the surrounding
    pipeline rather than of parsing. 1500 milliseconds for 5000 entries is a
    rate above 3000 entries per second, and the window covers both
    authenticated fetches, their validation and counting members by role.

    Scenario: Five thousand member identifiers with one hundred role records
      Given a large corporation
      When the client processes member data
      Then performance shall scale appropriately

  Rule: When a 1000-order response without an ETag is read 100 times in sequence, the EsiClient shall complete the 100 reads within 5000 milliseconds.
    A long-running process repeats the same call for its whole lifetime, so
    per-call cost has to stay flat: 5000 milliseconds over 100 iterations is a
    50 millisecond mean per read. Without an ETag nothing is cached, so every
    read is a full fetch, parse and validation, and the scenario checks that
    100 requests went out. It also compares the first and last iteration's
    order count and average price, which would diverge if state accumulated
    between reads.

    Scenario: One hundred sequential reads of a thousand-order dataset
      Given memory-intensive operations
      When the client processes large amounts of data iteratively
      Then memory usage shall remain efficient

  # ── Failure paths ───────────────────────────────────────────────────

  Rule: Where minimum request spacing is disabled, if requests within a concurrent group of 20 reject with a 500 error, then the EsiClient shall settle every request in that group within 1000 milliseconds.
    ESI answers six of the 20 character lookups with a 500 and the other 14
    with a character record, each after 100 milliseconds. A 500 is not
    retried, so each lookup is exactly one request. Rejections travel the same
    path as successes, so a group containing failures settles in the same
    window as one without: 1000 milliseconds, against the 2000 a serialised
    error path would cost. Each rejection reaches the caller as an EsiError
    carrying status 500.

    Scenario: Six of twenty concurrent lookups reject with a 500 error
      Given error conditions exist
      When errors occur during requests
      Then error handling shall not significantly impact performance
