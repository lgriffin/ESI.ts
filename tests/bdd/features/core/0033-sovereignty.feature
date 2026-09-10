Feature: Sovereignty
  The Sovereignty client covers null-security space ownership: the campaigns
  currently being contested over TCUs and IHubs, and the combined systems
  endpoint that reports who holds each solar system along with its development
  indices and sovereignty hub vulnerability window. The combined endpoint
  folds together what used to be the separate map and structures payloads, so
  one call answers both occupancy and structure questions.

  # ── Contested campaigns ─────────────────────────────────────────────

  Rule: When sovereignty campaigns are requested, the Sovereignty client shall return one entry per contest carrying its event type, structure, attacker score, and defender score.
    The two scores are the live state of a contest and are what a caller
    renders as the capture bar. Event type distinguishes a TCU defense from an
    IHub defense, which have different timers. Between contests ESI returns an
    empty array rather than a 404, so an idle cluster is a normal response and
    not an error.

    Scenario: Active contests return event type and both contest scores
      Given active sovereignty contests exist
      When the client requests campaigns
      Then the client shall return campaign details with scores

    Scenario: Cluster with no contests returns an empty campaign array
      Given no active campaigns exist
      When the client requests campaigns
      Then the client shall return an empty array

  Rule: If ESI answers a sovereignty request with a 503 status, then the Sovereignty client shall reject the request with an EsiError.
    Sovereignty data goes unavailable during downtime. Surfacing the outage as
    a typed EsiError keeps it distinguishable from the empty-array response
    that means there are genuinely no campaigns running.

    Scenario: ESI outage rejects the campaign request with an EsiError
      Given the ESI service is down
      When the client requests sovereignty data
      Then the client shall return a 503 error

  # ── System occupancy ────────────────────────────────────────────────

  Rule: When sovereignty systems are requested, the Sovereignty client shall return one entry per solar system carrying the holding alliance claim and its military, industrial, and strategic development levels.
    The three development levels are tracked independently under Equinox, each
    driving different upgrades, so they are reported as distinct fields rather
    than folded into a single index. The claim block also carries the holding
    alliance and corporation and the date the claim was taken.

    Scenario: Two claimed systems return separate military, industrial, and strategic levels
      Given the combined systems endpoint is available
      When the client requests sovereignty systems
      Then the client shall return occupancy, structures, and separate ADM indices

    Scenario: Combined payload carries claim, development, and hub vulnerability window together
      Given the combined systems endpoint exists
      When the client fetches systems
      Then it shall contain data from both map and structures

  # ── Concurrency ─────────────────────────────────────────────────────

  Rule: The Sovereignty client shall return the campaign and system payloads independently when both are requested concurrently.
    A sovereignty dashboard fetches contests and occupancy together and then
    joins them on solar_system_id. The client keeps no per-instance request
    state, so the two in-flight calls resolve to their own payloads and the
    join holds.

    Scenario: Concurrent campaign and system calls resolve to joinable payloads
      Given all sovereignty endpoints are available
      When the client fetches all data concurrently
      Then both shall return valid data
