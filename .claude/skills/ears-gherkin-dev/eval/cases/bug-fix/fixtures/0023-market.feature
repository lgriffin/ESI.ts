Feature: Market Management
  The Market client covers the four market surfaces ESI exposes: the global
  price list, the live order book of a region, the daily history of a type in a
  region, and a character's own open and historical orders.

  # ── Regional order book ─────────────────────────────────────────────

  Rule: When the market orders of a region are requested, the Market client shall return each order with an order_id, a type_id, a price, and a boolean is_buy_order.
    Buy and sell orders share one endpoint and one payload shape, separated
    only by the is_buy_order flag.

    Scenario: Region order book returns buy and sell orders for one type
      Given a valid region ID
      When the client requests market orders for the region
      Then the client shall return current buy and sell orders
