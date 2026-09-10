Feature: Industry Management
  Industry in EVE spans manufacturing, research, invention and mining, and ESI
  splits that across several endpoints. The Industry client covers all of them:
  the job queues of a character and of a corporation, the public facility list
  and per-system cost indices that determine what a job costs to install, and
  the mining ledgers — a character's own extraction history and a corporation's
  structure-mounted mining observers.

  The job and ledger endpoints are authenticated, and the corporation ones
  additionally require an in-game role, so refusal is a specified outcome.

  # ── Industry jobs ───────────────────────────────────────────────────

  Rule: When the client requests the industry jobs of a character, the Industry client shall return one entry per job carrying job_id, activity_id, status, blueprint_type_id, runs, start_date, and end_date.
    A job queue entry has to answer "what is being built, from what, how many,
    and when does it finish" without a second lookup. activity_id distinguishes
    manufacturing from research and invention, and status separates a running
    job from one already delivered.

    Scenario: Manufacturing and invention jobs with blueprint and run counts
      Given a character with active industry jobs
      When the client requests their industry jobs
      Then the client shall return job details including status and blueprint info

  Rule: While a character has no industry jobs, the Industry client shall return an empty array.
    An idle industrialist is an ordinary state rather than an error, so the
    endpoint answers with a zero-length list and the caller can iterate
    unconditionally.

    Scenario: Character with no jobs installed
      Given a character with no industry jobs
      When the client requests their industry jobs
      Then the client shall return an empty array

  Rule: When the client requests the industry jobs of a corporation, the Industry client shall return every member's job carrying the installer identity and the facility the job runs in.
    The corporation view is the union of its members' queues, so an entry is
    only actionable if it says who installed it and where. Those two fields are
    what the character view can leave implicit and this one cannot.

    Scenario: Corporation jobs across three installers
      Given a corporation with running industry jobs
      When the client requests the corporation industry jobs
      Then the client shall return the full list of corporation jobs

  # ── Public industry reference data ──────────────────────────────────

  Rule: When the client requests industry facilities, the Industry client shall return each facility with its owner, region, solar system, type, and tax rate.
    Choosing where to install a job is a cost decision, and tax is half of it.
    The location fields let a caller filter to reachable space before comparing
    rates.

    Scenario: Facilities report their owner, location, and tax
      Given industry facilities exist in the universe
      When the client requests the facility list
      Then the client shall return facilities with location and tax info

  Rule: When the client requests industry systems, the Industry client shall return each solar system with a cost index per industrial activity.
    The system cost index is the other half of installation cost, and it is
    per-activity — manufacturing, the two research lines, copying and invention
    each carry their own index, and a system may publish indices for only some
    of them.

    Scenario: Cost indices per activity for two systems
      Given solar systems with industry activity
      When the client requests system indices
      Then the client shall return cost index data per activity

  # ── Mining ledgers ──────────────────────────────────────────────────

  Rule: When the client requests the mining ledger of a character, the Industry client shall return one entry per date, solar system, and ore type carrying the quantity extracted.
    The ledger is pre-aggregated by day rather than per mining cycle, so the
    date, system and ore type together form the key of each row. That is what
    lets a caller total a week's yield without deduplication.

    Scenario: Two days of ore mined across two systems
      Given a character who has been mining
      When the client requests their mining ledger
      Then the client shall return daily ore quantities

  Rule: When the client requests the mining observers of a corporation, the Industry client shall return each observer with its identifier, type, and last updated timestamp.
    An observer is a mining structure that records what is extracted at it. The
    list is an index — identifier plus freshness — and the observer ID is the
    handle for the per-observer detail call below.

    Scenario: Structure observers with last update times
      Given a corporation with mining observers
      When the client requests the observer list
      Then the client shall return observer details

  Rule: When the client requests one mining observer, the Industry client shall return per-character entries carrying the recorded corporation, ore type, quantity, and last updated timestamp.
    This is the payout ledger for a corporation-owned refinery: who mined what
    at that structure. recorded_corporation_id is held per entry because a
    pilot's corporation at the time of extraction is what determines the split.

    Scenario: Observer breaks mining down per character
      Given a valid mining observer
      When the client requests the observer activity
      Then the client shall return character mining entries

  # ── Concurrent retrieval ────────────────────────────────────────────

  Rule: When character jobs, facilities, and system indices are requested together in one Promise.all, the Industry client shall resolve each request with its own response.
    An industry planner needs the queue and both cost inputs at once, and the
    three reads are independent. The client keeps no per-instance request state
    that concurrent calls could corrupt.

    Scenario: Jobs, facilities, and systems fetched in parallel
      Given an authenticated character for concurrent industry fetch
      When the client fetches industry jobs, facilities, and systems in parallel
      Then all three industry requests shall resolve successfully

  # ── Unauthorised access ─────────────────────────────────────────────

  Rule: If an authenticated industry request is answered with HTTP 403, then the Industry client shall reject with an EsiError.
    Character job access needs a scope; corporation mining data needs a scope
    and an in-game director role. ESI refuses both with 403, and the client
    turns both into the same typed rejection so callers branch on error class
    rather than on message text.

    Scenario: Character industry jobs with an expired token
      Given an invalid or expired token
      When the client requests character industry jobs
      Then the client shall return a 403 forbidden error for industry jobs

    Scenario: Mining observers without the required corporation role
      Given insufficient corporation roles
      When the client requests mining observers
      Then the client shall return a 403 forbidden error for mining observers
