Feature: Killmails Management
  A killmail is EVE's permanent record of a ship loss: who died, in what, where,
  and every pilot who contributed damage. ESI splits access in two — an
  authenticated feed of recent kills for a character or corporation that returns
  only ID and hash pairs, and an unauthenticated detail endpoint that takes that
  pair and returns the full report.

  That two-step shape is the reason the hash matters: it is the capability token
  that makes an otherwise public killmail addressable.

  # ── Recent killmail feeds ───────────────────────────────────────────

  Rule: When the client requests the recent killmails of a character or of a corporation, the Killmails client shall return one summary per kill carrying a numeric killmail_id and a string killmail_hash.
    The feed is deliberately thin — the pair is a reference, not a report. The
    types matter because both values are substituted into the detail endpoint's
    path, and a hash arriving as anything but a string would break that call.
    The two scenarios cover the character and corporation feeds against the
    same shape.

    Scenario: Three recent kills for a character
      Given an authenticated character with killmails
      When the client requests their recent killmails
      Then the client shall return a list of killmail summaries

    Scenario: Five recent kills for a corporation
      Given an authenticated corporation member
      When the client requests corporation killmails
      Then the client shall return the corporation kill feed

  Rule: While a character has no recent killmails, the Killmails client shall return an empty array.
    A pilot with no recent PvP is an ordinary state, so the feed answers with a
    zero-length list rather than a 404. Callers can iterate the result without
    a null check.

    Scenario: Character with no recent PvP
      Given an authenticated character with no recent PvP activity
      When the client requests their killmails
      Then the client shall return an empty killmail list

  # ── Killmail detail ─────────────────────────────────────────────────

  Rule: When the client requests a killmail by identifier and hash, the Killmails client shall return the kill time, solar system, victim record, and attacker list.
    This is the full report. The victim record carries the hull lost and the
    fitted items destroyed or dropped; the attacker list carries everyone who
    landed damage. Together they are what a killboard renders from one call.

    Scenario: Full kill report with victim and attackers
      Given a valid killmail ID and hash
      When the client requests the killmail details
      Then the client shall return the complete kill report

  Rule: When a killmail summary is used to fetch its detail, the Killmails client shall return a detail record whose killmail_id matches the summary it came from.
    The feed-then-detail chain is the normal way to consume this domain, and it
    only works if the identifier survives the round trip. This is the seam
    where a caller would otherwise have to trust that the hash and the ID
    belong together.

    Scenario: Summary hash feeds the detail lookup
      Given a character with recent killmails for chaining
      When the client fetches summaries and then look up details for the first kill
      Then the client shall return the full kill chain

  Rule: When a killmail names multiple attackers, the Killmails client shall return each attacker with its damage_done and final_blow flag.
    Damage attribution is what killboards rank on, and the final blow is a
    separate distinction from top damage — the scenario below has them held by
    different pilots on purpose. Per-attacker damage summing to the victim's
    damage_taken is what makes the report internally consistent.

    Scenario: Final blow and damage totals across three attackers
      Given a killmail with multiple attackers
      When the client analyzes the attackers
      Then I shall identify the final blow dealer and total damage

  # ── Error responses ─────────────────────────────────────────────────

  Rule: If a killmail request is answered with HTTP 404 or HTTP 403, then the Killmails client shall reject with an EsiError.
    A hash that does not match its killmail ID is refused with 404 rather than
    with an authorisation error, since the pair is the capability. The
    authenticated feeds refuse a missing or wrong-scope token with 403. Both
    surface as the same typed rejection.

    Scenario: Killmail hash that does not match the ID
      Given an invalid killmail hash
      When the client requests the killmail details with invalid hash
      Then the client shall return a 404 not found error

    Scenario: Character killmails without a token
      Given an unauthenticated killmail request
      When the client requests character killmails without auth
      Then the client shall return a 403 forbidden error for killmails
