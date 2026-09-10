Feature: Insurance Management
  Ship insurance in EVE is a fixed tariff table rather than a per-pilot policy:
  for every insurable hull the game publishes six levels, each a premium to pay
  now and a payout on loss. The Insurance client wraps the single
  unauthenticated endpoint that serves that table for every ship type at once.

  Because the response is one large static-ish document, its internal shape —
  tier count, tier ordering, and the payout-over-cost invariant — is as much
  part of the contract as the transport behaviour around it.

  # ── Price retrieval ─────────────────────────────────────────────────

  Rule: When the client requests insurance prices, the Insurance client shall return one entry per insurable ship type carrying a levels list of cost, name, and payout.
    Insurance is quoted per hull type, so type_id is the join key back to the
    rest of the type data. The three fields on a level are the whole of the
    offer: what it costs, what it is called in the client UI, and what it pays.

    Scenario: Frigate and battleship prices with their level lists
      Given the insurance system is operational
      When the client requests insurance prices
      Then the client shall return pricing data for available ship types

  # ── Tier structure ──────────────────────────────────────────────────

  Rule: The Insurance client shall return exactly six insurance levels per ship type, named Basic, Standard, Bronze, Silver, Gold, and Platinum in that order.
    The six-tier ladder is fixed game design, identical for every hull, and the
    names are what players recognise. Callers index the ladder positionally, so
    both the count and the order are load-bearing.

    Scenario: Six named tiers per ship type
      Given insurance prices are available for tier count verification
      When the client inspects each ship type
      Then every entry shall contain six named tiers

  Rule: The Insurance client shall return insurance levels ordered so that each level's cost and payout exceed those of the level before it.
    The ladder is monotonic in both columns: paying more up front always buys a
    larger payout. That is what makes "the next tier up" a meaningful phrase in
    a UI built on positional indexing.

    Scenario: Costs and payouts rise with each tier
      Given insurance prices are available for tier verification
      When the client examines the tiers for a ship type
      Then higher tiers shall have increasing costs and payouts

  Rule: The Insurance client shall return a payout greater than the cost for every insurance level.
    An insurance level that paid out less than its premium would never be worth
    buying, and no such level exists in the game data. Holding the invariant
    here catches a malformed or mis-parsed response before a caller uses it for
    loss calculations.

    Scenario: Payout exceeds cost at every tier
      Given insurance prices are available for payout verification
      When the client checks each tier
      Then the payout shall always be greater than the cost

  # ── Large responses ─────────────────────────────────────────────────

  Rule: When an insurance price response covers 500 ship types, the Insurance client shall resolve the complete set within 1000 milliseconds.
    The live endpoint returns the whole tariff table in one document — hundreds
    of hulls, six levels each. This bound exists so the parsing and validation
    path stays linear and does not quietly acquire per-element overhead.

    Scenario: Five hundred ship types in one response
      Given a large insurance dataset covering many ship types
      When the client processes the large insurance response
      Then the client shall handle it efficiently

  # ── Error responses ─────────────────────────────────────────────────

  Rule: If an insurance price request is answered with HTTP 503 or HTTP 429, then the Insurance client shall reject with an EsiError.
    503 covers the daily downtime window; 429 is ESI's answer once the caller
    has burned through its error budget. Both arrive as the same typed
    rejection, so a retry policy can inspect the status code on one error class
    instead of unwrapping two.

    Scenario: ESI answering 503
      Given the ESI service is temporarily unavailable
      When the client requests insurance prices expecting an error
      Then the client shall return a 503 service unavailable error

    Scenario: ESI answering 429 after the error limit
      Given the API rate limit has been exceeded
      When the client requests insurance prices expecting rate limit error
      Then the client shall return a 429 rate limit error
