Feature: Universe Information
  The Universe client covers the static map and item database: solar systems
  and the celestials inside them, stations and player structures, item types
  and the groups they belong to, plus the bulk identifier-to-name resolution
  endpoint. Most of these are public, cached for a long time, and reached by
  identifier, so the client is largely a typed read layer over identifiers a
  caller already holds.

  # ── Solar systems ───────────────────────────────────────────────────

  Rule: When a solar system is requested by identifier, the Universe client shall return its name, security status, and the stargate, station, and planet identifier arrays.
    A system record is the hub of the map graph: the stargate list gives the
    edges, and the station and planet lists give the celestials a caller can
    then look up individually. Security status is returned as the raw float
    rather than the rounded value shown in the game client.

    Scenario: Jita returns its name, security status, and celestial identifier arrays
      Given a valid solar system ID
      When the client requests system information
      Then the client shall return complete system details

  Rule: If ESI does not recognise the requested solar system identifier, then the Universe client shall reject the request with an EsiError.
    Map identifiers are frequently derived from user input or stale exports, so
    a lookup miss is expected traffic. It arrives as a 404 and is surfaced as a
    typed EsiError rather than as an empty system record.

    Scenario: Unknown system identifier rejects with an EsiError
      Given an invalid solar system ID
      When the client requests invalid system information
      Then the client shall return a not found error

  # ── Identifier indexes ──────────────────────────────────────────────

  Rule: When an identifier index is requested, the Universe client shall return an array of numeric identifiers.
    The index endpoints return bare identifier arrays with no accompanying
    detail, and callers page through them to build a local mirror of the
    static data. Systems and item groups are both exercised because they share
    one response shape.

    Scenario: System index returns numeric system identifiers
      Given the universe data is available
      When the client requests all systems
      Then the client shall return a list of all system IDs

    Scenario: Item group index returns numeric group identifiers
      Given the universe data is available for groups
      When the client requests all item groups
      Then the client shall return a list of all group IDs

  Rule: When an index response carries 8000 identifiers, the Universe client shall resolve the array within 1000 milliseconds.
    The real system index is several thousand entries and the type index is
    larger still, so the client does no per-element work that would turn a
    large index into a stall for the calling application.

    Scenario: Index of 8000 systems resolves within the time bound
      Given a request for all systems with large dataset
      When the client processes the large dataset
      Then the client shall handle it efficiently

  # ── Stations and structures ─────────────────────────────────────────

  Rule: When a station is requested by identifier, the Universe client shall return its name, host solar system identifier, service list, and maximum dockable ship volume.
    NPC stations differ from each other mainly in what they let a pilot do, so
    the service list is the field callers branch on when deciding where to
    reprocess, trade, or fit. Dockable volume decides whether a capital can
    enter at all.

    Scenario: Station returns its host system and service list
      Given a valid station ID
      When the client requests station information
      Then the client shall return complete station details

  Rule: When a structure is requested by identifier, the Universe client shall return its name, host solar system identifier, and position vector.
    Player structures are placed at arbitrary coordinates rather than at a
    fixed celestial, so the position vector is what locates them on the system
    map. This endpoint needs a docking-access token, unlike the station one.

    Scenario: Structure returns its host system and position vector
      Given a valid structure ID
      When the client requests structure information
      Then the client shall return structure details

  # ── Celestial bodies ────────────────────────────────────────────────

  Rule: When a star is requested by identifier, the Universe client shall return its name, host solar system identifier, spectral class, temperature, and radius.
    Star attributes drive both the visual rendering of a system and the
    industrial output of anything anchored around it, so the physical values
    come back alongside the identity fields.

    Scenario: Star returns its spectral class, temperature, and radius
      Given a valid star ID
      When the client requests star information
      Then the client shall return star details

  Rule: When a planet is requested by identifier, the Universe client shall return its name, host solar system identifier, and position vector.
    Planets are addressed by the identifiers listed on the parent system
    record, and the position vector is what places them relative to the star
    for distance and travel-time calculations.

    Scenario: Planet returns its host system and position
      Given a valid planet ID
      When the client requests planet information
      Then the client shall return planet details

  # ── Item types and groups ───────────────────────────────────────────

  Rule: When an item type is requested by identifier, the Universe client shall return its name, description, group identifier, volume, and published flag.
    Volume is what every hauling and fitting calculation starts from, and the
    published flag marks types that exist in the database but are not
    obtainable in game, which a caller filters out before showing them.

    Scenario: Tritanium returns its group, volume, and published flag
      Given a valid type ID
      When the client requests type information
      Then the client shall return complete item details

  Rule: When an item group is requested by identifier, the Universe client shall return its name, category identifier, and the identifiers of the types it contains.
    Groups are the middle tier between category and type. Returning the
    contained type identifiers inline means a caller can walk category to
    group to type without a separate index call at each level.

    Scenario: Mineral group returns its category and contained type identifiers
      Given a valid group ID
      When the client requests group information
      Then the client shall return group details and contained types

  # ── Name resolution and search ──────────────────────────────────────

  Rule: When a list of entity identifiers is posted for resolution, the Universe client shall return one entry per identifier carrying its name and category.
    This endpoint is the general escape hatch for turning identifiers found in
    killmails, contracts, or wallet journals into something displayable. The
    category field is what tells the caller which typed endpoint to follow up
    with, since the identifiers themselves are not self-describing.

    Scenario: Mixed identifier list resolves to names with categories
      Given a list of entity IDs
      When the client requests name resolution
      Then the client shall return entity names and categories

  Rule: When a universe search is performed for a term, the Search client shall return the matching identifiers grouped by entity category.
    Searching is the inverse of name resolution and lives on the authenticated
    character search endpoint. Results arrive keyed by category, so a term
    matching both a system and its stations produces populated arrays under
    each and empty arrays elsewhere.

    Scenario: Search for Jita returns matching system and station identifiers
      Given a search term for the universe
      When the client searches the universe
      Then the client shall return matching entities

  # ── Concurrency and composition ─────────────────────────────────────

  Rule: The Universe client shall return the record matching each requested identifier when system lookups are issued concurrently.
    Map tooling fans out over a set of systems at once. The client keeps no
    per-instance request state, so responses stay bound to the identifier that
    asked for them rather than to arrival order.

    Scenario: Three concurrent system lookups each return their own system
      Given multiple concurrent universe data requests are prepared
      When the client makes them simultaneously
      Then all requests shall complete successfully

  Rule: When identifiers taken from a system record are used to look up its star, station, and planet, the Universe client shall return bodies reporting that same solar system as their host.
    This is the composition the map graph is built on: one system read yields
    the identifiers for its celestials, and each celestial read points back at
    the system. The round trip is what makes the identifier arrays on the
    system record usable without a separate lookup table.

    Scenario: System lookup chained into star, station, and planet lookups
      Given a system ID for exploration
      When the client gathers complete system information
      Then the client shall successfully retrieve all system data
