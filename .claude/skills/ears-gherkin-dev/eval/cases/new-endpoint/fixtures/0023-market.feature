Feature: Market Management
  The Market client covers the four market surfaces ESI exposes: the global
  price list, the live order book of a region, the daily history of a type in a
  region, and a character's own open and historical orders. Together they are
  the raw material for price analysis, so the client returns records verbatim
  and leaves aggregation, filtering, and trend detection to the caller.

  # ── Global price list ───────────────────────────────────────────────

  Rule: When current market prices are requested, the Market client shall return each entry with a type_id, a numeric average_price, and an adjusted_price.
    The price endpoint is the cheapest way to value an arbitrary item. The two
    prices differ in meaning, so both are carried through rather than
    collapsed into one figure.

    Scenario: Price list returns average and adjusted prices per type
      Given the market system is operational
      When the client requests current market prices
      Then the client shall return price data for all tradeable items

  # ── Regional order book ─────────────────────────────────────────────

  Rule: When the market orders of a region are requested, the Market client shall return each order with an order_id, a type_id, a price, and a boolean is_buy_order.
    Buy and sell orders share one endpoint and one payload shape, separated
    only by the is_buy_order flag.

    Scenario: Region order book returns buy and sell orders for one type
      Given a valid region ID
      When the client requests market orders for the region
      Then the client shall return current buy and sell orders
