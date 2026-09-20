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

  # ── Traded type IDs ─────────────────────────────────────────────────

  Rule: When the traded type IDs of a region are requested, the Market client shall return the type IDs with active orders in that region as an array of integers.
    ESI offers this list so that indexers can walk a region's order book one
    type at a time instead of downloading the whole book. The IDs are passed
    through as ESI supplies them; ordering and de-duplication are left to the
    caller because the spec promises neither.

    Scenario: Single-page region returns its traded type IDs
      Given a region whose traded type IDs fit on one page
      When the client requests the traded type IDs of the region
      Then the client shall return those type IDs as integers

  Rule: When the first page of traded type IDs announces further pages in its X-Pages header, the Market client shall return the type IDs of every page concatenated in page order.
    The endpoint caps a page at 1000 IDs, and a busy trade hub exceeds that.
    Returning only the first page would silently drop most of the market, so
    the client follows X-Pages to the last page before resolving.

    Scenario: Three-page region returns the type IDs of every page
      Given a region whose traded type IDs span three pages
      When the client requests the traded type IDs of the region
      Then the client shall return the type IDs of all three pages in page order

  Rule: If ESI answers a traded type ID request with a 404 status, then the Market client shall reject the request with an EsiError carrying status 404.
    A 404 means the region does not exist. Resolving with an empty list would
    be indistinguishable from a region with no orders, so the caller gets a
    typed rejection instead.

    Scenario: Unknown region is rejected with a 404 EsiError
      Given ESI reports the region as not found
      When the client requests the traded type IDs of the region expecting an error
      Then the client shall reject with an EsiError of status 404
