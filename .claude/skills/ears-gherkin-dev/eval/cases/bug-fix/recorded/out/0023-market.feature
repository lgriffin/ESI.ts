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

  Rule: When a region order book filtered by order type spans more than one page, the Market client shall send the order_type filter on the request for every page.
    Pages after the first were requested without the filter, so a sell-only
    request returned buy orders from page two onward (esi-4kq). The filter is
    part of the query, not of the first request, and every page request has to
    carry it for the returned book to match what was asked for.

    Scenario: Sell filter is sent on each page of a three-page order book
      Given a sell-filtered order book for The Forge that spans three pages
      When the client requests the sell orders of The Forge
      Then every page request shall carry the sell filter

    Scenario: Sell filter on a single-page order book issues one filtered request
      Given a sell-filtered order book for The Forge that fits on one page
      When the client requests the sell orders of The Forge
      Then exactly one filtered request shall be sent
