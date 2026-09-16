Feature: Skyhooks and Sovereignty Hubs
  The Skyhooks client covers the Equinox structures a corporation plants on
  planets and in sovereign systems: orbital skyhooks with their reagent silos,
  sovereignty hubs with their installed upgrades and resource pools, and the
  New Eden wide list of skyhooks currently open to raiding. Summary listings
  and per-structure detail are separate endpoints with different payload
  shapes, so both are specified here.

  Retry, stale-on-error, circuit breaking and request deduplication apply to
  these calls as to every other; 0050-etag-caching.feature and
  0051-resilience.feature specify them once. A failure Rule below states
  the outcome after they have run, which is why it names every attempt and
  the absence of a usable cached entry.

  # ── Corporation structure listings ──────────────────────────────────

  Rule: When the sovereignty hubs of a corporation are requested, the Skyhooks client shall return one entry per hub carrying its online flag, and its installed upgrade list when present.
    A hub listing drives the sovereignty map overlay, where the two facts that
    matter per structure are whether it is powered and which upgrades are
    fitted. An offline hub is reported with an empty upgrade list rather than
    being omitted from the response.

    Scenario: Hub listing reports an online hub with upgrades and an offline hub without
      Given sovereignty hubs exist
      When the client requests hubs
      Then the client shall return hub data with online status and upgrades

  Rule: When the orbital skyhooks of a corporation are requested, the Skyhooks client shall return one entry per skyhook carrying its reagent silo capacity and current silo level when present.
    Silo level against capacity is what tells an industrialist when a skyhook
    needs emptying, so both numbers travel together in the listing rather than
    requiring a detail call per structure.

    Scenario: Skyhook listing reports silo capacity and current fill level
      Given orbital skyhooks are deployed
      When the client requests skyhooks
      Then the client shall return silo capacity and levels

  Rule: When raidable skyhooks are requested, the Skyhooks client shall return the public skyhook entries carrying the is_raidable flag, and the raidable_at timestamp when present.
    This endpoint is cluster-wide and unauthenticated, so it lists skyhooks
    belonging to any corporation. Entries whose raid window has not opened yet
    are still present with is_raidable false, which lets a caller plan ahead
    from the raidable_at timestamp.

    Scenario: Raidable listing includes entries both inside and outside their raid window
      Given raidable skyhooks exist across New Eden
      When the client requests raidable skyhooks
      Then the client shall return the raidable list

  # ── Per-structure detail ────────────────────────────────────────────

  Rule: When the detail of a single skyhook is requested, the Skyhooks client shall return its structure state, and its per-reagent stock entries and theft vulnerability window when present.
    The detail endpoint is the only place the reagent breakdown and the theft
    window appear. Both are needed to decide whether a skyhook is worth raiding
    and when, which the listing endpoint deliberately does not expose.

    Scenario: Skyhook detail returns shield state, reagent stock, and theft window
      Given a skyhook exists with detail data
      When the client requests skyhook detail
      Then the client shall return reagents and state information

  Rule: When the detail of a single sovereignty hub is requested, the Skyhooks client shall return its installed upgrades, reagent bay contents, and power and workforce pools, and its vulnerability window when present.
    A hub is a resource machine: upgrades consume power and workforce, and the
    reagent bay burns down at a stated hourly rate. The detail payload carries
    every one of those inputs so a caller can project when the hub runs dry.

    Scenario: Hub detail returns upgrade power state, reagent bay, and resource pools
      Given a sovereignty hub exists with detail data
      When the client requests sovereignty hub detail
      Then the client shall return upgrades and resource information

  # ── Upstream failure ────────────────────────────────────────────────

  Rule: If ESI answers every attempt at a skyhooks request with a 503 status and no usable cached entry exists, then the Skyhooks client shall reject the request with an EsiError.
    Equinox endpoints go offline during downtime and deployments. The client
    turns the upstream 503 into a typed EsiError so a caller can distinguish an
    outage from an empty structure list.

    Scenario: ESI outage rejects the hub request with an EsiError
      Given the ESI service is down for skyhooks
      When the client requests skyhook data
      Then the client shall return a 503 skyhooks error
