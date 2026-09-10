Feature: Corporation Management
  The Corporations client covers the corporation endpoints of ESI: the public
  corporation record, the member list and the roles held by those members, and
  the director-only views over blueprints, structures, and standings. Most of
  this domain is role-gated, so the failure surface matters as much as the
  success payloads and is stated here alongside them.

  # ── Corporation records ─────────────────────────────────────────────

  Rule: When public information is requested for a corporation ID, the Corporations client shall return a record carrying corporation_id, name, ticker, alliance_id, ceo_id, and member_count.
    The corporation record is the anchor object for the domain and needs no
    token. Ticker and member count are what most display surfaces show next to
    the name, and alliance_id is the join key up to the alliance domain.

    Scenario: Public profile for a known corporation ID
      Given a valid corporation ID
      When the client requests public information
      Then the client shall return complete corporation profile

  Rule: When public information for distinct corporation IDs is requested concurrently, the Corporations client shall resolve each call with the record belonging to its own corporation ID.
    Request deduplication coalesces identical GETs in flight. This pins down
    that calls differing by path parameter stay distinct and never answer one
    another.

    Scenario: Three corporation profiles fetched at once
      Given multiple concurrent corporation data requests
      When the client makes them simultaneously
      Then all requests shall complete successfully

  # ── Membership ──────────────────────────────────────────────────────

  Rule: When the member list is requested for a corporation ID, the Corporations client shall return an array of numeric character IDs.
    The member endpoint returns bare IDs rather than objects, so a caller
    wanting names has to fan out to the character domain. Stating the element
    type here is what makes that fan-out safe to write.

    Scenario: Member character IDs for an authenticated director
      Given an authenticated corporation director
      When the client requests member list
      Then the client shall return member character IDs

  Rule: When member roles are requested for a corporation ID, the Corporations client shall return an array whose entries each carry character_id and a roles array.
    Role assignments are per member, so the character_id is what ties an entry
    back to the member list. The roles array is the field that decides which
    director-only endpoints that member can reach.

    Scenario: Role assignments for a corporation member
      Given an authenticated corporation director for roles
      When the client requests member roles
      Then the client shall return role assignments

  Rule: When a member list of 10000 entries is returned, the Corporations client shall deliver every entry to the caller in under 1000 milliseconds.
    Large alliances run corporations with member counts in the thousands. The
    response passes through schema validation on the way out, so this bound
    guards against validation cost scaling badly with array length.

    Scenario: Member list of ten thousand IDs
      Given a large corporation with many members
      When the client requests member data
      Then the client shall handle large data sets efficiently

  # ── Director-only holdings ──────────────────────────────────────────

  Rule: When blueprints are requested for a corporation ID, the Corporations client shall return an array whose entries each carry item_id, type_id, quantity, and location_flag.
    The location_flag distinguishes corporate hangar divisions, which is what
    lets a caller tell one division's holdings from another's without a
    separate lookup.

    Scenario: Blueprint inventory entries for an authenticated member
      Given an authenticated corporation member
      When the client requests corporation blueprints
      Then the client shall return corporation inventory

  Rule: When structures are requested for a corporation ID, the Corporations client shall return an array whose entries each carry structure_id, type_id, system_id, and state.
    The state field drives structure timers, which is the reason most callers
    poll this endpoint at all. System and type place the structure on the map
    and identify what it is.

    Scenario: Structure entries carrying a vulnerability state
      Given an authenticated corporation director for structures
      When the client requests structures
      Then the client shall return structure information

  Rule: When a corporation endpoint returns an array of records, the Corporations client shall deliver each entry to the caller with its fields unmodified.
    Zod schemas in this library are loose objects, so fields ESI adds beyond
    the declared shape survive the round trip rather than being stripped. Both
    scenarios below drive the standings call and read back record shapes the
    caller supplied, which is what makes them a check on passthrough rather
    than on any one endpoint's payload.

    Scenario: Wallet division records returned by the standings call
      Given an authenticated corporation accountant
      When the client requests corporation standings returning wallet divisions
      Then the client shall return wallet divisions

    Scenario: Wallet journal records returned by the standings call
      Given an authenticated corporation accountant for journal
      When the client requests corporation standings returning journal entries
      Then the client shall return transaction history

  Rule: When public information, members, standings, and structures are requested together, the Corporations client shall resolve all four calls.
    Building a corporation dashboard means fanning out across four endpoints
    at once, three of which are role-gated. A caller issues these as one batch,
    so they need to be safe to await together.

    Scenario: Concurrent fetch of profile, members, standings, and structures
      Given a corporation ID for profile assembly
      When the client gathers complete corporation data
      Then the client shall successfully retrieve all corporation information

  # ── Failure surface ─────────────────────────────────────────────────

  Rule: If a corporation request fails, then the Corporations client shall reject with an EsiError.
    One error type across the domain keeps the call site to a single catch.
    The three scenarios cover the distinct origins that reach this surface: an
    HTTP 404 for an unknown corporation, an HTTP 403 where the caller holds no
    director role, and an HTTP 401 where the token is rejected outright.

    Scenario: Unknown corporation ID rejects the request
      Given an invalid corporation ID
      When the client requests public information for the invalid corporation
      Then the client shall return a not found error

    Scenario: Missing director role on the member list rejects the request
      Given a member without director roles
      When the client accesses restricted data
      Then the client shall return a forbidden error

    Scenario: Invalid token on the blueprints endpoint rejects the request
      Given invalid authentication credentials
      When the client accesses corporation data
      Then the client shall return an authentication error
