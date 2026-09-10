Feature: Planetary Interaction Management
  The PI client covers planetary industry: the colonies a character owns, the
  pin-link-route layout inside each colony, the schematics those pins run, and
  the customs offices a corporation operates to tax what comes off the planet.

  Colony listings are deliberately shallow — a caller discovers planet IDs
  there and then fetches each layout separately — so the two endpoints are
  designed to be used one after the other.

  # ── Colony listing ──────────────────────────────────────────────────

  Rule: When the planetary colonies of a character are requested, the PI client shall return each colony with its planet_id, planet_type, and upgrade_level.
    The listing is a survey view. Planet type decides which resources the
    colony can extract and upgrade level caps what can be built on it, so
    those two fields are enough to triage a set of colonies without opening
    each layout.

    Scenario: Two colonies return their planet type and upgrade level
      Given a valid character ID for PI
      When the client requests planetary colonies
      Then the client shall return a list of colonies

  Rule: If a character owns no planetary colonies, then the PI client shall return an empty array.
    Planetary industry is optional, so no colonies is a normal state. It is
    reported as an empty array rather than an error and the caller branches
    on length.

    Scenario: Character with no colonies receives an empty array
      Given a character with no PI colonies
      When the client requests colonies
      Then the client shall return an empty colony array

  # ── Colony layout ───────────────────────────────────────────────────

  Rule: When the layout of a colony is requested, the PI client shall return its pins, its links with their source and destination pin IDs, and its routes.
    A colony is a graph: pins are the nodes, links are the physical
    connections, and routes are the commodity flows layered on top. The link
    endpoints are what let a caller reconstruct that graph, so both pin IDs
    are carried on every link.

    Scenario: Two-pin colony returns the link joining its pins
      Given a character ID and planet ID
      When the client requests the colony layout
      Then the client shall return pins, links, and routes

  Rule: If a colony contains no structures, then the PI client shall return empty pins, links, and routes arrays.
    A planet can be occupied with nothing built on it yet. All three
    collections come back empty rather than absent, so a caller can iterate
    them without an existence check per field.

    Scenario: Colony with nothing built returns three empty arrays
      Given a colony with no structures
      When the client requests the layout
      Then the client shall return empty arrays

  Rule: When a colony layout is fetched using a planet_id taken from the colony listing, the PI client shall request that layout for the same character and planet.
    Listing then drilling down is the intended access pattern for planetary
    industry, and it only works if the planet_id read out of the listing is
    the one the layout call goes on to use.

    Scenario: Planet ID from the colony listing drives the follow-up layout request
      Given a character with colonies for workflow
      When the client retrieves colonies and then their layouts
      Then the client shall have complete PI data

  # ── Schematics ──────────────────────────────────────────────────────

  Rule: When a planetary schematic is requested by ID, the PI client shall return its schematic_name and cycle_time.
    Pins reference schematics by ID alone, so this endpoint is how a caller
    turns a layout into something readable. Cycle time is what converts a
    factory pin into an output rate.

    Scenario: Bacteria schematic returns its name and cycle time
      Given a valid schematic ID
      When the client requests the schematic
      Then the client shall return schematic details

  # ── Customs offices ─────────────────────────────────────────────────

  Rule: When the customs offices of a corporation are requested, the PI client shall return each office with its office_id and system_id.
    Customs offices are corporation assets rather than character ones, and
    the system they sit in is what ties an office to the planets it taxes.

    Scenario: Two customs offices return their office and system IDs
      Given a valid corporation ID for customs offices
      When the client requests customs offices
      Then the client shall return a list of customs offices

  # ── Error propagation ───────────────────────────────────────────────

  Rule: If the ESI API rejects a planetary interaction request with an error status, then the PI client shall raise an EsiError.
    The public schematic lookup and the authenticated corporation endpoint
    fail in different ways — an unknown ID versus a missing role — but both
    surface as one error type so a caller wraps the whole domain in a single
    try/catch.

    Scenario: Unknown schematic ID is rejected with 404
      Given an invalid schematic ID
      When the client requests the invalid schematic
      Then the client shall return a 404 error

    Scenario: Customs office request without the corporation role is rejected with 403
      Given insufficient permissions for customs offices
      When the client requests customs offices without permissions
      Then the client shall return a 403 error
