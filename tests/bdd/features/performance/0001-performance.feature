Feature: Performance Characteristics
  These scenarios are smoke checks of the behaviour that performance depends
  on: a response is waited for rather than answered early, concurrent calls
  overlap instead of queueing, and large or repeated payloads come back
  complete and in order. They state no latency or throughput budget. How fast
  each path is, and whether a change made it slower, is measured by the
  benchmark tier (tests/benchmark, npm run bench:ab), which compares a change
  with its base statistically on one machine instead of against a wall-clock
  limit a slow runner can miss.

  Responses are queued at the HTTP transport, several with a simulated
  network delay, so every scenario runs the real request pipeline: rate
  limiter, fetch, JSON parsing, the ETag cache, pagination and Zod validation.
  The only time bounds below are the ones that separate overlapping requests
  from requests sent one after another, and each sits at or above half of the
  serial figure, far from the pipeline's own cost.

  The concurrency Rules hold only with the rate limiter's minimum request
  spacing set to zero. Its default of 50 milliseconds staggers dispatch on
  purpose.

  # ── Single requests ─────────────────────────────────────────────────

  Rule: When five single-endpoint requests are issued one after another, the EsiClient shall return each body as ESI sent it, no sooner than its transport delay.
    The alliance, character, corporation, market price and solar system calls
    wait 200, 150, 180, 300 and 100 milliseconds at the transport. Each result
    is compared with the body ESI sent, one request goes out per call, and each
    call takes at least its delay less a 5 millisecond timer tolerance, which
    catches a response that never waited on the transport. There is no upper
    bound: a slow runner is not a fault.

    Scenario: Five sequential single-endpoint requests with stubbed latencies of 100 to 300 milliseconds
      Given normal system load
      When the client makes API requests and measure response times
      Then each response shall match the body ESI sent

  Rule: When the transport delays a response by up to 1000 milliseconds, the EsiClient shall wait for that response and return its body.
    The scenario sweeps transport delays of 50, 200, 500 and 1000 milliseconds,
    one character lookup each, and requires each call to take at least its
    delay less the timer tolerance, so a long wait is neither cut short nor
    answered from somewhere other than the transport.

    Scenario: Stubbed latencies of 50, 200, 500, and 1000 milliseconds
      Given different network latencies
      When the client makes requests under different conditions
      Then the client shall wait for each delayed response

  # ── Concurrent requests ─────────────────────────────────────────────

  Rule: Where minimum request spacing is disabled, when 50 requests are issued concurrently, the EsiClient shall return all 50 responses within 2500 milliseconds.
    Each of the 50 character lookups waits 100 milliseconds at the transport,
    so sending them one after another would take 5000. The bound is half that:
    it fails when requests queue behind one another, or when no more than two
    are allowed in flight, and leaves the overlapping case, about 110
    milliseconds, more than twenty times its own duration in headroom.

    Scenario: Fifty concurrent character lookups each stubbed at 100 milliseconds
      Given high concurrent load
      When the client makes simultaneous requests
      Then the requests shall overlap rather than run one after another

  Rule: Where minimum request spacing is disabled, when five requests spanning five domain clients are issued concurrently, the EsiClient shall return all five responses within 650 milliseconds.
    Alliance, character, corporation, universe and market calls wait 120, 100,
    150, 80 and 200 milliseconds at the transport, 650 in total, so sent one
    after another they cannot finish sooner than 650. Overlapping, they settle
    near the slowest leg, about 210, so concurrency has to hold across
    different domain clients and not only across repeated calls to one.

    Scenario: Alliance, character, corporation, system, and market calls issued together
      Given mixed API types for concurrent requests
      When the client makes concurrent requests across different APIs
      Then all mixed requests shall complete successfully

  # ── Large and repeated payloads ─────────────────────────────────────

  Rule: When a region order book of 10000 orders is returned across 10 pages, the EsiClient shall request each page once, in order, and return all 10000 orders in the order ESI sent them.
    A Jita region order book is this size, served 1000 orders a page. The
    scenario checks the page sequence, the order identifiers and the caller's
    aggregates over the whole book. The cost of fetching, parsing and
    validating a page is a benchmark (pipeline/GET 1000 region market orders).

    Scenario: Ten thousand market orders filtered and aggregated
      Given large market data
      When the client processes the market dataset
      Then every page shall be fetched once and every order returned

  Rule: When a 5000-entry member list and a 100-entry roles list are requested together, the EsiClient shall return both lists as ESI sent them, each over an authenticated request.
    Member identifiers come back as a bare number array, the cheapest shape
    ESI returns, alongside role records; the scenario counts members by role
    over the result.

    Scenario: Five thousand member identifiers with one hundred role records
      Given a large corporation
      When the client processes member data
      Then both lists shall be returned complete

  Rule: When a 1000-order response without an ETag is read 100 times in sequence, the EsiClient shall send 100 requests and return the same 1000 orders on the last read as on the first.
    Without an ETag nothing is cached, so every read is a full fetch, parse and
    validation. The scenario compares the first and last iteration's order
    count and average price, which would diverge if state accumulated between
    reads. Whether memory stays flat over a long run is the heap soak's
    question (npm run soak), not this scenario's.

    Scenario: One hundred sequential reads of a thousand-order dataset
      Given memory-intensive operations
      When the client processes large amounts of data iteratively
      Then every read shall return the same complete dataset

  # ── Failure paths ───────────────────────────────────────────────────

  Rule: Where minimum request spacing is disabled, if requests within a concurrent group of 20 reject with a 500 error, then the EsiClient shall settle every request in that group within 1000 milliseconds.
    ESI answers six of the 20 character lookups with a 500 and the other 14
    with a character record, each after 100 milliseconds. A 500 is not
    retried, so each lookup is exactly one request. Sent one after another the
    group would take 2000 milliseconds; the bound is half that, so rejections
    have to overlap like successes do. Each rejection reaches the caller as an
    EsiError carrying status 500.

    Scenario: Six of twenty concurrent lookups reject with a 500 error
      Given error conditions exist
      When errors occur during requests
      Then failed requests shall settle alongside successful ones
