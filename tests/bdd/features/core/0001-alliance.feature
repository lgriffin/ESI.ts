Feature: Alliance Management
  The Alliance client covers the public alliance endpoints of ESI: the alliance
  record itself, the alliance contact list, and the corporations that belong to
  the alliance. These are the endpoints most integrations reach for first, so
  the shape of a successful payload, the shape of an empty collection, and the
  shape of a failure are all pinned down here rather than rediscovered per
  domain.

  # ── Alliance records ────────────────────────────────────────────────

  Rule: When alliance details are requested for an alliance ID, the Alliance client shall return a record carrying alliance_id, name, ticker, and creator_id.
    The alliance record is the anchor object for the domain — every other
    alliance lookup is keyed off the same ID. Those four fields are the ones
    ESI marks required on the payload, so a caller can depend on them being
    present without a null check.

    Scenario: Alliance record for a known alliance ID
      Given a valid alliance ID
      When the client requests alliance details
      Then the client shall return complete alliance information

  Rule: When alliance details, contacts, and member corporations are requested together, the Alliance client shall resolve all three calls and return the member corporations as an array of numeric corporation IDs.
    Profile assembly fans out across three endpoints at once. The member
    corporation endpoint is the odd one out because it returns bare IDs rather
    than objects, so this is where that contract is stated.

    Scenario: Concurrent fetch of record, contacts, and member corporations
      Given a valid alliance ID for information gathering
      When the client gathers complete alliance information
      Then the client shall successfully retrieve all related data

  # ── Contacts ────────────────────────────────────────────────────────

  Rule: When an alliance contact list is requested, the Alliance client shall return an array whose entries each carry contact_id, contact_type, and standing.
    Contacts drive standings-based logic in consuming applications, so the
    entry triple of who, what kind, and what standing is the minimum a caller
    needs. Entries arrive as a flat array with no envelope.

    Scenario: Contact list holding a character entry and a corporation entry
      Given a valid alliance with contacts
      When the client requests contact list
      Then the client shall return an array of contacts

  Rule: If an alliance holds no contacts, then the Alliance client shall return an empty array.
    An alliance with no contacts is an ordinary state, not an error. Returning
    an empty array rather than null or a rejection keeps the call site free of
    a special case.

    Scenario: Alliance holding no contacts
      Given an alliance with no contacts
      When the client requests contact list for the alliance
      Then the client shall return an empty array

  # ── Failure surface ─────────────────────────────────────────────────

  Rule: If an alliance request fails, then the Alliance client shall reject with an EsiError.
    Every failure mode is funnelled into one error type so callers write a
    single catch rather than branching on transport versus HTTP status. The
    three scenarios below cover the distinct origins of failure that reach
    this surface: an HTTP 404 from ESI, a transport-level failure with no HTTP
    status at all, and an HTTP 429 from the error limiter.

    Scenario: Unknown alliance ID rejects the request
      Given an invalid alliance ID
      When the client requests alliance details for the invalid ID
      Then the client shall return a not found error

    Scenario: Transport failure rejects the request
      Given network connectivity problems
      When the client requests alliance details during network issues
      Then the client shall return a network error

    Scenario: Rate limited response rejects the request
      Given API rate limiting is active
      When the client makes a rate limited request
      Then the client shall return appropriate rate limit errors

  # ── Latency ─────────────────────────────────────────────────────────

  Rule: When alliance details are requested, the Alliance client shall resolve the call in under 5000 milliseconds.
    The client wraps each call in retry, rate limiting, and cache lookup
    middleware. This bound guards against a change to that pipeline adding a
    stall — a blocking sleep or an unbounded backoff — on the happy path.

    Scenario: Alliance details resolve inside the latency budget
      Given normal API conditions
      When the client requests alliance data
      Then the response shall be within acceptable time limits
