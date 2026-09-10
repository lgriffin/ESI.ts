Feature: Mercenary Operations
  The Mercenary client covers mercenary dens and the tactical operations that
  spawn from them. A den is a persistent structure with development and anarchy
  levels that evolve over time; a mercenary tactical operation (MTO) is a
  short-lived site tied back to its parent den by den_id.

  Each concept has a list endpoint for surveying what a character owns and a
  detail endpoint for the evolution and expiry data the list view omits.

  # ── Den listing ─────────────────────────────────────────────────────

  Rule: When the mercenary dens of a character are requested, the Mercenary client shall return each den with its den_id, development_level, anarchy_level, and active_operations count.
    Development and anarchy are the two axes a den evolves along, and the
    active operation count says how much is currently running out of it.
    Those three numbers are what a caller needs to rank dens without opening
    each one's detail view.

    Scenario: Two dens return their development, anarchy, and active operation counts
      Given mercenary dens exist
      When the client requests dens
      Then the client shall return development and anarchy parameters

  Rule: If a character owns no mercenary dens, then the Mercenary client shall return an empty array.
    Owning no dens is the default state for a character who has never deployed
    one, so it is reported
    as an empty array rather than an error and callers branch on length.

    Scenario: Character with no dens receives an empty array
      Given no dens exist in the area
      When the client requests dens
      Then the client shall return an empty array

  # ── Tactical operations ─────────────────────────────────────────────

  Rule: When the mercenary tactical operations of a character are requested, the Mercenary client shall return each operation with its operation_id, site_type, and status.
    An MTO's status moves from spawning to active over its lifetime and the
    site type decides what fit is needed to run it. Both are in the list view
    so a caller can triage which operations are worth opening.

    Scenario: Active and spawning operations return their site type and status
      Given MTOs are active
      When the client requests operations
      Then the client shall return operation details with status

  Rule: When dens and tactical operations are fetched together, the Mercenary client shall return on each operation the den_id of the den it spawned from.
    The den_id is the only link between the two endpoints. Without it a caller
    could list both sides but could not attribute an operation to the
    structure that produced it, which is the whole point of surveying them
    together.

    Scenario: Operation den_id matches the parent den fetched alongside it
      Given dens and MTOs exist
      When the client fetches both
      Then the client shall correlate operations to their parent dens

  # ── Detail lookups ──────────────────────────────────────────────────

  Rule: When a mercenary den detail is requested by den ID, the Mercenary client shall return the den state, its infomorph amount, its skyhook, and its development and anarchy evolution levels.
    The detail view is where evolution progress and the attached skyhook
    appear — none of it is in the list payload. Infomorph stock is what the
    den consumes to keep running, so it belongs with the state rather than
    behind a further call.

    Scenario: Running den reports its evolution levels, infomorphs, and skyhook
      Given a mercenary den exists with detail data
      When the client requests den detail
      Then the client shall return the den evolution and infomorph data

  Rule: When a tactical operation detail is requested by operation ID, the Mercenary client shall return the operation state, its dungeon_type_id, and its expiry timestamp.
    Operations are identified by a UUID rather than a numeric ID, and they
    expire. The expiry timestamp and the dungeon type are what decide whether
    the site is still worth travelling to.

    Scenario: Available operation reports its dungeon type and expiry time
      Given an MTO exists with detail data
      When the client requests operation detail
      Then the client shall return the operation state and expiry

  # ── Error propagation ───────────────────────────────────────────────

  Rule: If the ESI API responds to a mercenary request with an error status, then the Mercenary client shall raise an EsiError.
    Mercenary endpoints are recent additions and are taken offline during
    deployments more often than the older surfaces, so callers see an
    upstream 503 as the same EsiError type used everywhere else.

    Scenario: Den request during an ESI outage is rejected with 503
      Given the ESI service is down
      When the client requests mercenary data
      Then the client shall return a 503 error
