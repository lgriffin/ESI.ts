Feature: Loyalty Management
  The Loyalty client covers the two ESI loyalty endpoints: a character's
  loyalty point balances per NPC corporation, and the store offers an NPC
  corporation publishes. Between them they let a caller answer "how much LP do
  I have and what can I spend it on", which is why both sides expose the raw
  numeric costs rather than any pre-computed affordability verdict.

  Store offers carry trade-in requirements as well as LP and ISK costs, so the
  shape of an offer is part of the contract this feature pins down.

  # ── Character loyalty balances ──────────────────────────────────────

  Rule: When a character's loyalty points are requested, the Loyalty client shall return one entry per corporation carrying a numeric corporation_id and a non-negative numeric loyalty_points balance.
    LP is held separately against each NPC corporation, so the response is a
    list rather than a single total. Callers derive totals and rankings
    themselves, which only works if every entry comes back with both fields
    intact and typed as numbers.

    Scenario: Balances from three corporations are returned with typed fields
      Given an authenticated character with LP from multiple corporations
      When the client requests their loyalty points
      Then the client shall return LP balances per corporation

    Scenario: Four returned balances support maximum and total calculations
      Given a character with LP across multiple corps
      When the client analyzes their LP balances
      Then the client shall find the highest LP balance

  Rule: If a character holds no loyalty points with any corporation, then the Loyalty client shall return an empty list.
    A character who has never run missions has no LP rows at all. ESI answers
    with an empty array rather than an error, and the client passes that
    through so callers can branch on length instead of catching.

    Scenario: Character who has never run missions returns no balances
      Given an authenticated character who has never run missions
      When the client requests their loyalty points expecting none
      Then the client shall return an empty loyalty points list

  # ── Loyalty store offers ────────────────────────────────────────────

  Rule: When the loyalty store offers of an NPC corporation are requested, the Loyalty client shall return each offer with its offer_id, type_id, quantity, lp_cost, isk_cost, and required_items fields.
    An offer is only actionable if the caller can see what is being sold, how
    many units, and the full price in both LP and ISK. Returning lp_cost as a
    raw number is what lets a caller filter the catalogue against a known
    balance without a second round trip.

    Scenario: Store catalogue returns offers with LP and ISK costs
      Given a valid NPC corporation
      When the client requests their LP store offers
      Then the client shall return available items with costs

    Scenario: Offers priced above the character balance are excluded by an lp_cost filter
      Given a set of store offers and a character LP balance
      When the client filters by what the character can afford
      Then the client shall report only the affordable offers

  Rule: The Loyalty client shall return each required_items entry of a store offer with a type_id and a quantity.
    Certain offers demand trade-in hulls or materials alongside the LP and ISK
    cost. Without the type and count of each required item a caller cannot
    tell whether the offer is redeemable, so these entries are preserved
    verbatim.

    Scenario: Offer requiring a hull and a mineral lists both trade-in items
      Given store offers that require trade-in items
      When the client inspects the offers with requirements
      Then the client shall report the required items and quantities

  # ── Error propagation ───────────────────────────────────────────────

  Rule: If the ESI API rejects a loyalty request with an error status, then the Loyalty client shall raise an EsiError.
    Both loyalty endpoints surface failures the same way, so callers wrap one
    try/catch around either call. The two scenarios cover the authorisation
    boundary and the upstream failure boundary.

    Scenario: Unauthenticated loyalty point request is rejected with 403
      Given an unauthenticated loyalty request
      When the client requests character loyalty points without auth
      Then the client shall return a 403 forbidden error for loyalty

    Scenario: Store offer request fails with an upstream 500
      Given the ESI service encounters an internal error
      When the client requests store offers expecting error
      Then the client shall return a 500 server error
