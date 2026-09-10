Feature: Paragon Hub SKINR Marketplace
  The ParagonHub client covers the player-to-player marketplace for SKINR
  designs. Listings are readable three ways: the public board, the listings a
  single character has posted, and the listings targeted at an alliance. Each
  view returns the same listing shape wrapped in a cursor-paginated envelope.

  Prices are denominated in either ISK or PLEX, and a listing carries a target
  that decides who can see it, so both the payment and the visibility model
  differ from the regular market endpoints.

  # ── Browsing listings ───────────────────────────────────────────────

  Rule: When public SKINR listings are requested, the ParagonHub client shall return each listing with its skinr_id and a price denominated in either ISK or PLEX, alongside the page cursor.
    The public board is the default view of the marketplace. Price is a tagged
    value rather than a number plus a currency field, so a caller reads the
    key to learn the denomination — collapsing the two into one figure would
    lose that distinction between real-money and in-game payment.

    Scenario: Public board returns ISK-priced and PLEX-priced listings with a cursor
      Given public SKINR listings exist
      When the client requests public listings
      Then the client shall return listings with cursor data

  Rule: When the Paragon Hub listings of a character are requested, the ParagonHub client shall return each listing with that character as its seller_id and with its target visibility.
    This is the seller's own view of what they have posted. The target field
    says whether a listing is on the public board or restricted, and it
    appears here because it is the seller who sets it.

    Scenario: Character listing reports the seller ID and public target
      Given the character has listed SKINR designs
      When the client requests character listings
      Then the client shall return listings with target visibility

  Rule: When the listings targeted at an alliance are requested, the ParagonHub client shall return the listings collection for that alliance.
    Alliance-targeted listings are invisible on the public board, so the
    alliance endpoint is the only way its members reach them. The payload
    shape matches the public view so a caller can render either through the
    same path.

    Scenario: Alliance endpoint returns the designs targeted at that alliance
      Given alliance-targeted SKINR listings exist
      When the client requests alliance listings
      Then the client shall return listings targeted at the alliance

  # ── Cursor pagination ───────────────────────────────────────────────

  Rule: When a cursor is supplied with a public listings request, the ParagonHub client shall return the page it identifies together with the after and before cursors of the adjacent pages.
    Paragon Hub uses cursor paging rather than page numbers, because listings
    are created and expire while a caller is walking the board. Returning
    both adjacent cursors is what allows movement in either direction from
    any page.

    Scenario: Cursor request returns the page with its forward and backward cursors
      Given multiple pages of listings exist
      When the client requests the next page using a cursor
      Then the client shall return the next page of results

  # ── Error propagation ───────────────────────────────────────────────

  Rule: If the ESI API responds to a Paragon Hub request with an error status, then the ParagonHub client shall raise an EsiError.
    The marketplace endpoints sit behind the same infrastructure as the rest
    of ESI, so an upstream outage surfaces as the standard error type instead
    of an empty listings page that a caller could mistake for a quiet board.

    Scenario: Listing request during an ESI outage is rejected with 503
      Given the ESI service is down
      When the client requests Paragon Hub data
      Then the client shall return a 503 error
