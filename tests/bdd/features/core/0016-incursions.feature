Feature: Incursion Management
  An incursion is a Sansha invasion occupying one constellation at a time. ESI
  publishes a single unauthenticated endpoint listing every active incursion,
  and the Incursions client wraps it. Each entry names the constellation and
  staging system under attack, the systems infested within it, the invading
  faction, whether the Sansha commander is present, and a progress state that
  moves from established through mobilizing to withdrawing.

  Because the list is a live snapshot of a game event, both the empty case and
  server-side failures are ordinary outcomes worth specifying.

  # ── The active incursion list ───────────────────────────────────────

  Rule: When the client requests the incursion list, the Incursions client shall return each active incursion with its state, influence, boss flag, faction, constellation, staging system, and infested system list.
    Every field in that set drives a decision for a player: state and influence
    say how far the invasion has progressed, has_boss says whether the final
    site is up, and the constellation, staging and infested systems say where
    to go. The three scenarios below exercise the same shape across the
    lifecycle states and across multiple simultaneous incursions.

    Scenario: Established and mobilizing incursions side by side
      Given active incursions exist in the universe
      When the client requests the incursion list
      Then the client shall return complete incursion details

    Scenario: Withdrawing incursion has zero influence and no boss
      Given an incursion in the withdrawing state
      When the client requests the incursion list for withdrawing state
      Then the incursion shall show zero influence and no boss

    Scenario: Three concurrent incursions in distinct constellations
      Given multiple incursions in different regions
      When the client requests the list of multiple incursions
      Then each shall have unique constellation and staging system IDs

  Rule: While no incursion is active, the Incursions client shall return an empty array.
    Quiet periods between spawns are normal. The endpoint answers 200 with an
    empty list rather than a 404, and the client passes that through, so
    callers can iterate the result without a null check.

    Scenario: No incursion active anywhere
      Given no incursions are active in the universe
      When the client requests the incursion list for empty state
      Then the client shall return an empty array

  Rule: The Incursions client shall report incursion influence as a value within the inclusive range 0 to 1.
    Influence is a normalised fraction, not a percentage — a caller multiplying
    by 100 for display depends on that. The endpoint's own bounds are 0 for a
    fully suppressed invasion and 1 for an unopposed one.

    Scenario: Influence at both range endpoints
      Given active incursions with varying influence
      When the client examines the incursion results
      Then all influence values shall be between 0 and 1

  # ── Server-side failures ────────────────────────────────────────────

  Rule: If the incursion list request is answered with HTTP 503, then the Incursions client shall reject with an EsiError.
    ESI returns 503 through the daily downtime window and during Sansha event
    reloads. Surfacing it as a typed rejection lets a polling caller back off
    rather than treat the outage as "no incursions".

    Scenario: ESI answering 503 during downtime
      Given the ESI service is experiencing downtime
      When the client requests incursions during downtime
      Then the client shall return a 503 service unavailable error

  Rule: If the incursion list request is answered with HTTP 500, then the Incursions client shall reject with an EsiError whose statusCode is 500 and whose isServerError predicate returns true.
    The isServerError predicate is the client's classification hook: it is what
    a retry policy consults to decide a failure is the server's fault and worth
    retrying, without the caller hard-coding status code ranges.

    Scenario: ESI answering 500
      Given an internal server error occurs
      When the client requests incursions and a server error happens
      Then the error shall indicate a server-side issue
