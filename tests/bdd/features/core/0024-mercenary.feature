Feature: Mercenary Operations
  The Mercenary client covers mercenary dens and the tactical operations that
  spawn from them. A den is a persistent structure with development and anarchy
  levels that evolve over time; a mercenary tactical operation (MTO) is a
  short-lived site, identified by a UUID, tied back to its parent den by
  mercenary_den_id.

  Each concept has a list endpoint that locates what a character owns and a
  detail endpoint for the state, evolution and expiry data the list view omits.

  Retry, stale-on-error, circuit breaking and request deduplication apply to
  these calls as to every other; 0050-etag-caching.feature and
  0051-resilience.feature specify them once. A failure Rule below states
  the outcome after they have run, which is why it names every attempt and
  the absence of a usable cached entry.

  # ── Den listing ─────────────────────────────────────────────────────

  Rule: When the mercenary dens of a character are requested, the Mercenary client shall return the response's mercenary_dens list, each entry with its den id and planet.
    ESI wraps the list in an object ({ mercenary_dens: [...] }), and the
    client returns that object as sent. The listing only locates each den: its
    id and the planet_id it sits on. State, infomorphs and the development and
    anarchy evolution come from the per-den detail endpoint.

    Scenario: Two dens return their ids and planets
      Given mercenary dens exist
      When the client requests dens
      Then the client shall return the mercenary_dens list with ids and planets

  Rule: If a character owns no mercenary dens, then the Mercenary client shall return an empty mercenary_dens list.
    Owning no dens is the default state for a character who has never deployed
    one, so ESI reports it as { mercenary_dens: [] } rather than an error, and
    callers branch on the list's length.

    Scenario: Character with no dens receives an empty mercenary_dens list
      Given no dens exist in the area
      When the client requests dens
      Then the client shall return an empty mercenary_dens list

  # ── Tactical operations ─────────────────────────────────────────────

  Rule: When the mercenary tactical operations of a character are requested, the Mercenary client shall return the response's operations list, each entry with its UUID operation id and its mercenary_den_id.
    ESI wraps the list in an object ({ operations: [...] }), and the client
    returns that object as sent. An operation is identified by a UUID string
    rather than a numeric ID. State, dungeon type and expiry come from the
    per-operation detail endpoint.

    Scenario: Two operations return their UUIDs and parent den ids
      Given MTOs are active
      When the client requests operations
      Then the client shall return the operations list with UUIDs and den ids

  Rule: When dens and tactical operations are fetched together, the Mercenary client shall return on each operation the mercenary_den_id that equals the id of the den it spawned from.
    The mercenary_den_id is the only link between the two endpoints. Without it
    a caller could list both sides but could not attribute an operation to the
    structure that produced it, which is the whole point of surveying them
    together.

    Scenario: Operation mercenary_den_id matches the parent den fetched alongside it
      Given dens and MTOs exist
      When the client fetches both
      Then the client shall correlate operations to their parent dens

  # ── Detail lookups ──────────────────────────────────────────────────

  Rule: When a mercenary den detail is requested by den ID, the Mercenary client shall return the den state, its infomorph amount, its skyhook, and its development and anarchy evolution, each as an amount and a named level.
    The detail view is where evolution progress and the attached skyhook
    appear — none of it is in the list payload. Each evolution axis reports a
    numeric amount and a level from Level0 to Level4. Infomorph stock is what
    the den consumes to keep running, so it belongs with the state rather than
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

  Rule: If the ESI API answers every attempt at a mercenary request with an error status and no usable cached entry exists, then the Mercenary client shall raise an EsiError.
    Mercenary endpoints are recent additions and are taken offline during
    deployments more often than the older surfaces, so callers see an
    upstream 503 as the same EsiError type used everywhere else.

    Scenario: Den request during an ESI outage is rejected with 503
      Given the ESI service is down
      When the client requests mercenary data
      Then the client shall return a 503 error
