Feature: Wars
  The Wars client covers the public war register: the index of declared wars,
  the detail record for one war with its aggressor and defender statistics and
  its declaration, start, and finish timestamps, and the killmail summaries
  attributed to it. None of it needs a token, and the identifiers are handed
  out in declaration order, which is what makes the index usable as a feed.

  # ── War index ───────────────────────────────────────────────────────

  Rule: When the war list is requested, the Wars client shall return an array of positive numeric war identifiers.
    The index carries identifiers only, with no detail attached, so a caller
    walks it and fetches the wars it cares about. Identifiers are plain
    positive numbers rather than strings or objects.

    Scenario: War list returns positive numeric identifiers
      Given wars exist in the system
      When the client requests the list of wars
      Then the client shall return an array of war IDs

  Rule: When the war list is requested, the Wars client shall return the identifiers in descending numeric order.
    War identifiers increase with each declaration, so descending order puts
    the newest war first. A caller polling for new declarations reads from the
    head of the array and stops at the last identifier it already saw.

    Scenario: War list identifiers descend from newest to oldest
      Given multiple wars exist in descending order
      When the client requests the war list
      Then war IDs shall be in descending order

  # ── War detail ──────────────────────────────────────────────────────

  Rule: When a war is requested by identifier, the Wars client shall return aggressor and defender blocks carrying alliance identifier, ISK destroyed, and ships killed, along with the declared and started timestamps.
    The two combatant blocks are symmetric, which is what lets a caller render
    either side with one code path. Declared and started differ because a war
    declaration takes 24 hours to come into effect, and a war still running
    reports no finish timestamp.

    Scenario: Active war returns both combatant blocks and its declaration timestamps
      Given an active war exists
      When the client requests the war details
      Then the client shall return complete war information

  Rule: When a war has concluded, the Wars client shall return a finished timestamp ordered after its declared and started timestamps.
    The finish timestamp is the field that distinguishes a historical war from
    a live one. Its ordering against the other two is what a caller uses to
    compute how long the conflict actually ran.

    Scenario: Concluded war returns a finished timestamp after its start
      Given a finished war exists
      When the client requests the finished war details
      Then the finished timestamp shall be populated

  Rule: When a war is requested by identifier, the Wars client shall return the mutual flag as a boolean.
    A mutual war has been agreed by both parties, which removes the surrender
    mechanic and changes who can join. Callers branch on the flag directly, so
    it arrives as a boolean rather than as a string or a presence marker.

    Scenario: Mutually agreed war reports the mutual flag set
      Given a mutual war exists
      When the client requests the mutual war details
      Then the mutual flag shall be true

  # ── War killmails ───────────────────────────────────────────────────

  Rule: When war killmails are requested, the Wars client shall return one summary per kill carrying a numeric killmail identifier and a string hash.
    The summaries are references, not killmails: the identifier and hash pair
    is what the Killmails client needs to fetch the full record. Both fields
    are required for that follow-up call, so both are always present.

    Scenario: War with three kills returns an identifier and hash per summary
      Given a war with killmails exists
      When the client requests the war killmails
      Then the client shall return killmail summaries

  Rule: If a war has no killmails attributed to it, then the Wars client shall return an empty array.
    A war that was declared but never fought still exists in the register. Its
    killmail list is empty rather than absent, so a caller iterates the result
    without a null check.

    Scenario: War with no kills returns an empty killmail array
      Given a war with no killmails exists
      When the client requests the war killmails for empty war
      Then the client shall return an empty killmail array

  # ── Unknown identifiers ─────────────────────────────────────────────

  Rule: If ESI does not recognise the requested war identifier, then the Wars client shall reject the request with an EsiError.
    War identifiers come from the index or from user input, and both can point
    at a war that never existed. Detail and killmail lookups are covered
    together because the 404 is raised on the shared request path.

    Scenario: Unknown war identifier rejects the detail request with an EsiError
      Given an invalid war ID for details
      When the client requests the invalid war details
      Then the client shall return a 404 not found error for war details

    Scenario: Unknown war identifier rejects the killmail request with an EsiError
      Given an invalid war ID for killmails
      When the client requests killmails for invalid war
      Then the client shall return a 404 not found error for killmails

  # ── Composition ─────────────────────────────────────────────────────

  Rule: When one side of a war is compared against the other, the Wars client shall return per-side ISK destroyed and ships killed values as numbers that can be ordered and summed.
    ESI states no winner. A caller derives dominance by comparing the two
    sides and dividing one side of ISK destroyed by the combined total, which
    only works if both figures are plain numbers on both blocks.

    Scenario: Aggressor outscores the defender on ISK destroyed and ships killed
      Given a war with combat data exists
      When the client analyzes the war stats
      Then the client shall determine the dominant side

  Rule: When war detail and war killmails are gathered concurrently for one identifier, the Wars client shall return a detail record and a killmail array for that same war.
    A conflict report needs the aggregate statistics and the individual kills
    side by side. The two endpoints are independent, so they are fetched
    together and joined on the war identifier the caller already holds.

    Scenario: War detail and killmails gathered for the same war identifier
      Given a war ID to investigate
      When the client gathers full war data including details and killmails
      Then the client shall build a complete picture of the conflict
