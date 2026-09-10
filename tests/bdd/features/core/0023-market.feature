Feature: Market Management
  The Market client covers the four market surfaces ESI exposes: the global
  price list, the live order book of a region, the daily history of a type in a
  region, and a character's own open and historical orders. Together they are
  the raw material for price analysis, so the client returns records verbatim
  and leaves aggregation, filtering, and trend detection to the caller.

  Market endpoints are the highest-volume ones in the library — a single region
  order book runs to thousands of rows — so payload size and concurrent use are
  part of the contract rather than an afterthought.

  # ── Global price list ───────────────────────────────────────────────

  Rule: When current market prices are requested, the Market client shall return each entry with a type_id, a numeric average_price, and an adjusted_price.
    The price endpoint is the cheapest way to value an arbitrary item. The two
    prices differ in meaning — average_price tracks recent trades, while
    adjusted_price feeds industry cost calculations — so both are carried
    through rather than collapsed into one figure.

    Scenario: Price list returns average and adjusted prices per type
      Given the market system is operational
      When the client requests current market prices
      Then the client shall return price data for all tradeable items

  Rule: If the ESI market price endpoint responds with an error status, then the Market client shall raise an EsiError.
    Market data is served from a cache that can be unavailable while the
    market endpoint itself is up, which surfaces as a 503. The caller sees the
    same EsiError type as for any other market failure.

    Scenario: Price request during a market data outage is rejected with 503
      Given market data is temporarily unavailable
      When the client requests market prices expecting error
      Then the client shall return a market service error

  # ── Regional order book ─────────────────────────────────────────────

  Rule: When the market orders of a region are requested, the Market client shall return each order with an order_id, a type_id, a price, and a boolean is_buy_order.
    Buy and sell orders share one endpoint and one payload shape, separated
    only by the is_buy_order flag. Keeping that flag boolean is what lets a
    caller split the book into bid and ask sides, which is the first step of
    any spread or margin calculation.

    Scenario: Region order book returns buy and sell orders for one type
      Given a valid region ID
      When the client requests market orders for the region
      Then the client shall return current buy and sell orders

    Scenario: Mixed order book splits into bid and ask sides by is_buy_order
      Given market orders with mixed buy and sell types
      When the client analyzes the market orders
      Then the client shall distinguish between buy and sell orders

  # ── Daily history ───────────────────────────────────────────────────

  Rule: When the market history of a region and type is requested, the Market client shall return each daily record with its date, volume, order_count, lowest, highest, and average values in the order ESI supplies them.
    History is a time series, so both the per-day fields and their ordering
    carry meaning. Preserving the sequence is what makes day-over-day
    differencing possible without the caller re-sorting by date first.

    Scenario: Two days of history return traded volume and price bounds
      Given a valid region and item type
      When the client requests market history
      Then the client shall return historical price and volume data

    Scenario: Five consecutive daily averages expose a rising price series
      Given historical market data with trending prices
      When the client analyzes price trends
      Then the client shall identify market patterns

  # ── Character orders ────────────────────────────────────────────────

  Rule: When the open market orders of a character are requested, the Market client shall return each order with an order_id, a type_id, a price, a region_id, and an is_corporation flag.
    A character's own orders carry two fields the public book omits: the
    region they sit in, and whether the order was placed on the corporation's
    behalf. The second decides whose wallet the ISK moves through, so it is
    part of the minimum payload.

    Scenario: Character open orders carry region and corporation attribution
      Given an authenticated character with market orders
      When the client requests their market orders
      Then the client shall return their active orders

  Rule: When the market order history of a character is requested, the Market client shall return each order with a state of closed, cancelled, or expired and a volume_remain no greater than its volume_total.
    Order history is the terminal state of an order, so state is constrained
    to the three values ESI can end on. The volume relationship distinguishes
    a fully filled order from one that expired part-traded.

    Scenario: Closed order reports a terminal state and its filled volume
      Given an authenticated character with order history
      When the client requests their order history
      Then the client shall return completed and cancelled orders

  # ── Concurrency and payload size ────────────────────────────────────

  Rule: When order book requests for three regions are issued concurrently, the Market client shall resolve each request with the orders of its own region.
    Cross-region arbitrage means fanning out the same call over several
    regions at once. Sharing one client instance across those in-flight
    requests has to keep the responses distinct, so each promise settles with
    the book of the region it asked for.

    Scenario: Three region order books requested in parallel each resolve with their own orders
      Given multiple concurrent market data requests
      When the client makes them simultaneously
      Then all market requests shall complete successfully

  Rule: When a region order book of 5000 orders is returned, the Market client shall deliver every order within 1000 milliseconds.
    A busy trade hub returns thousands of rows per type. The client does no
    per-row transformation on the way out, and this bound is what pins that
    down: an implementation that copied or re-validated each order in a loop
    would breach it long before 5000 entries.

    Scenario: Order book of 5000 entries is returned intact inside the time budget
      Given a request for market data with many orders
      When the client processes the large market data
      Then the client shall handle large market datasets efficiently

  Rule: When price, order book, and history requests are issued concurrently, the Market client shall resolve each request with the payload of its own endpoint.
    Valuing a trade needs all three views at once: the reference price, the
    live spread, and the recent trend. Issuing them in parallel is the normal
    access pattern, and each promise has to settle with its own endpoint's
    data for the resulting analysis to mean anything.

    Scenario: Price, order book, and history lookups combine into one analysis pass
      Given a market analysis requirement
      When the client gathers comprehensive market data
      Then the client shall successfully retrieve all market information
