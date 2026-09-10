Feature: Character Management
  The Characters client covers the per-character endpoints of ESI, split
  between data anyone can read — the public profile, the portrait set, and the
  employment history — and data that needs a scoped token, such as corporation
  roles, medals, and notifications. Each endpoint returns a differently shaped
  payload, so the required fields of each are stated separately below, along
  with the single error type every failure is funnelled into.

  # ── Public character data ───────────────────────────────────────────

  Rule: When the public profile is requested for a character ID, the Characters client shall return a record carrying character_id, name, corporation_id, alliance_id, and birthday.
    The public profile is the anchor record for the domain and needs no token.
    Corporation and alliance membership are the fields callers most often join
    against, and birthday is what dates a character for age-based filtering.

    Scenario: Public profile for a known character ID
      Given a valid character ID
      When the client requests public information
      Then the client shall return complete character profile

  Rule: When the portrait set is requested for a character ID, the Characters client shall return image URLs at the 64, 128, 256, and 512 pixel sizes.
    ESI serves portraits as four fixed renditions rather than a single
    resizable image. A caller picking a size for a given surface needs all
    four keys present, so the absence of any one of them is a defect.

    Scenario: Portrait URLs at four pixel sizes
      Given a valid character ID for portrait
      When the client requests portraits
      Then the client shall return image URLs in different sizes

  Rule: When corporation history is requested for a character ID, the Characters client shall return an array whose entries each carry corporation_id, start_date, and record_id.
    Employment history is public and is the usual way to establish how long a
    character has been where. The record_id orders the entries, and start_date
    dates each membership span.

    Scenario: Employment history entries for a character
      Given a character ID for history
      When the client requests corporation history
      Then the client shall return employment history

  # ── Authenticated character data ────────────────────────────────────

  Rule: When corporation roles are requested for a character ID, the Characters client shall return a record whose roles field is an array of role names.
    Roles gate access to the corporation endpoints, so a consuming application
    reads them to decide which calls are worth attempting. The payload also
    carries base, HQ, and other-location variants, but the plain roles array
    is the one every caller reads.

    Scenario: Role assignments for an authenticated character
      Given an authenticated character
      When the client requests roles
      Then the client shall return role information

  Rule: When medals are requested for a character ID, the Characters client shall return an array whose entries each carry medal_id, title, description, and date.
    Medals are awarded by a corporation and carry free text supplied by the
    issuer. The four fields named here are the ones a display surface needs to
    render an award without a second lookup.

    Scenario: Medal entries awarded to a character
      Given a character ID for medals
      When the client requests medals
      Then the client shall return medal information

  Rule: When notifications are requested for a character ID, the Characters client shall return an array whose entries each carry notification_id, sender_id, type, and timestamp.
    Notifications are the in-game message feed. The type field discriminates
    dozens of message kinds, and the timestamp orders them, so both are needed
    before an entry can be interpreted at all.

    Scenario: Notification entries for an authenticated character
      Given an authenticated character for notifications
      When the client requests notifications
      Then the client shall return notification list

  # ── Failure surface ─────────────────────────────────────────────────

  Rule: If a character request fails, then the Characters client shall reject with an EsiError.
    One error type across the domain keeps the call site to a single catch.
    The three scenarios below cover the distinct origins that reach this
    surface: an HTTP 404 for an unknown character, an HTTP 403 where the token
    lacks the scope, and an HTTP 401 where the token has expired.

    Scenario: Unknown character ID rejects the request
      Given an invalid character ID
      When the client requests public information for the invalid character
      Then the client shall return a not found error

    Scenario: Missing authorization on the roles endpoint rejects the request
      Given an unauthenticated request
      When the client accesses private data without authorization
      Then the client shall return an authorization error

    Scenario: Expired token on the notifications endpoint rejects the request
      Given an expired token
      When the client accesses private data with expired token
      Then the client shall return an authentication error

  # ── Concurrency and latency ─────────────────────────────────────────

  Rule: When public profiles for distinct character IDs are requested concurrently, the Characters client shall resolve each call with the record belonging to its own character ID.
    Nothing in the request pipeline may let one in-flight call answer another.
    Request deduplication coalesces identical GETs, so this pins down that
    calls differing only by path parameter stay distinct.

    Scenario: Three character profiles fetched at once
      Given multiple concurrent character requests
      When the client makes them simultaneously
      Then all requests shall complete successfully

  Rule: When the public profile, portrait, roles, and notifications are requested together, the Characters client shall resolve all four calls.
    Profile assembly fans out across four endpoints, two of which need a
    token. A caller building a character sheet issues these as one batch, so
    they need to be safe to await together.

    Scenario: Concurrent fetch of profile, portrait, roles, and notifications
      Given a character ID for profile assembly
      When the client gathers complete profile data
      Then the client shall successfully retrieve all available character information

  Rule: When a character public profile is requested, the Characters client shall resolve the call in under 5000 milliseconds.
    Each call passes through retry, rate limiting, and cache lookup middleware.
    This bound guards against a change to that pipeline introducing a stall on
    the happy path.

    Scenario: Character profile resolves inside the latency budget
      Given normal API conditions for character
      When the client requests character data
      Then the response shall be within acceptable limits
