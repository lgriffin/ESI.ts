Feature: Freelance Jobs Management
  Freelance jobs are player-published work contracts: a named objective with a
  progress target, an ISK reward that drains as contributions land, and a
  lifecycle state. The Freelance Jobs client covers the public listing, the
  per-job detail record, the character and corporation views of jobs an owner
  is involved in, a character's own participation record for one job, and the
  participant roll a corporation sees for one of its jobs.

  Unlike most of ESI these endpoints paginate with opaque before/after cursors
  rather than page numbers, so cursor handling is part of the contract.

  # ── Public listing ──────────────────────────────────────────────────

  Rule: When the client requests the freelance job listing, the Freelance Jobs client shall return each job with its id, name, state, and progress, alongside a cursor carrying before and after tokens when present.
    The listing is a summary view — enough to render a board row without a
    detail fetch per job. The cursor travels in the same envelope as the rows
    rather than in headers, so a caller holds one object to page with.

    Scenario: Open and in-progress jobs with a forward cursor
      Given publicly available freelance jobs exist
      When the client requests the job listing
      Then the client shall return jobs with pagination cursors

  Rule: While no freelance jobs are published, the Freelance Jobs client shall return an empty job array, with no before or after token in its cursor when present.
    An empty board is an ordinary state. ESI's Cursor defines both tokens as
    optional strings, never null: an absent token is what tells a caller there
    is nothing to page towards in that direction, which a zero-length array
    alone would not.

    Scenario: No jobs published
      Given no freelance jobs exist
      When the client requests the empty job listing
      Then the client shall return an empty listing

  # ── Job detail ──────────────────────────────────────────────────────

  Rule: When the client requests a freelance job by identifier, the Freelance Jobs client shall return the job together with its details block carrying the description and career.
    The detail record adds everything the board row omits: the prose brief, the
    career the job is aimed at, creator identity, and the contribution and
    visibility configuration. Career in particular is how a caller filters jobs
    a given pilot can usefully take.

    Scenario: Hauling contract exposes its description and career
      Given a valid job ID
      When the client requests the job details
      Then the client shall return the full job information

  Rule: If a freelance job detail record omits its contribution block, expiry, and broadcast locations, then the Freelance Jobs client shall return the job with those three fields undefined.
    FreelanceJobsDetail marks contribution, details.expires and
    access_and_visibility.broadcast_locations optional: a finished job carries
    details.finished instead of an expiry, and a job need not be broadcast
    anywhere. A detail read of such a job is an ordinary answer, not a
    malformed one.

    Scenario: Completed job with no contribution rules, expiry or broadcast
      Given a completed job without optional detail blocks
      When the client requests the completed job details
      Then the client shall return the job without those optional fields

  # ── Owner-scoped listings ───────────────────────────────────────────

  Rule: When the client requests the freelance jobs of a character or of a corporation, the Freelance Jobs client shall return that owner's jobs in the same envelope as the public listing, including its cursor when present.
    Both authenticated views reuse the public listing's shape so a caller can
    render "all jobs" and "my jobs" through one code path. The two scenarios
    exercise the character and corporation endpoints against that one shape.

    Scenario: Character's own jobs
      Given an authenticated character with freelance jobs
      When the client requests their job listing
      Then the client shall return the character jobs

    Scenario: Corporation's own jobs
      Given an authenticated corporation for freelance jobs
      When the client requests their freelance jobs
      Then the client shall return the corporation jobs listing

  Rule: When the client requests a character's participation in a freelance job, the Freelance Jobs client shall return the participation state, the contributed total, and the last_modified timestamp.
    Participation is a separate record from the job because a job has many
    contributors and each sees only their own tally. The state separates a
    committed participant from one who resigned or was kicked, and the
    timestamp is what lets a caller show whether a commitment has gone stale.
    ESI sends all three (CharactersFreelanceJobsParticipation).

    Scenario: Character contribution to a mining job
      Given a character participating in a job
      When the client requests their participation details
      Then the client shall return contribution data

  Rule: When the client requests the participants of a corporation freelance job, the Freelance Jobs client shall return a page whose participants each carry id, name, state, and contributed.
    The corporation view lists everyone working the job, so a director can see
    who contributed what. ESI wraps the roll in an object with an optional
    cursor (CorporationsFreelanceJobsParticipants) rather than a bare array.

    Scenario: Participant roll for a corporation job with two contributors
      Given a corporation job with two participants
      When the client requests the job participants
      Then the client shall return the participant roll

  # ── Cursor pagination ───────────────────────────────────────────────

  Rule: When the client supplies an after token, the Freelance Jobs client shall return the following page, whose cursor carries that token as its before value when present.
    Cursor tokens are opaque and directional. The returned page echoes the
    token it was reached by in its before slot, which is what makes paging back
    the exact inverse of paging forward.

    Scenario: Following the after token to page two
      Given a first page with an after cursor
      When the client requests the next page using the after token
      Then the client shall return the second page of results

  Rule: When the client supplies a before token, the Freelance Jobs client shall return the preceding page, whose cursor, when present, carries no before token at the start of the listing.
    Paging backwards from page two lands on page one, and page one has nothing
    behind it — the absent before token is the end-of-listing marker in that
    direction.

    Scenario: Following the before token back to page one
      Given a second page with a before cursor
      When the client requests the previous page using the before token
      Then the client shall return the first page of results

  # ── Error responses ─────────────────────────────────────────────────

  Rule: If a freelance job request is answered with HTTP 404 or HTTP 403, then the Freelance Jobs client shall reject with an EsiError.
    Jobs expire and are removed, so an ID held from an earlier listing can miss
    with a 404; the authenticated owner views refuse a wrong-scope token with a
    403. Both arrive as the same typed rejection, so callers branch on error
    class rather than on message text.

    Scenario: Unknown job ID
      Given an invalid job ID
      When the client requests details for the invalid job
      Then the client shall return a 404 error for the job

    Scenario: Character jobs with an invalid token
      Given an invalid token for freelance jobs
      When the client requests character freelance jobs with invalid token
      Then the client shall return a 403 forbidden error for freelance jobs
