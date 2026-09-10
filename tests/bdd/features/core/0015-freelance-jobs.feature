Feature: Freelance Jobs Management
  Freelance jobs are player-published work contracts: a named objective with a
  progress target, an ISK reward that drains as contributions land, and a
  lifecycle state. The Freelance Jobs client covers the public listing, the
  per-job detail record, the character and corporation views of jobs an owner
  is involved in, and a character's own participation record for one job.

  Unlike most of ESI these endpoints paginate with opaque before/after cursors
  rather than page numbers, so cursor handling is part of the contract.

  # ── Public listing ──────────────────────────────────────────────────

  Rule: When the client requests the freelance job listing, the Freelance Jobs client shall return each job with its id, name, state, and progress alongside a cursor carrying before and after tokens.
    The listing is a summary view — enough to render a board row without a
    detail fetch per job. The cursor travels in the same envelope as the rows
    rather than in headers, so a caller holds one object to page with.

    Scenario: Open and in-progress jobs with a forward cursor
      Given publicly available freelance jobs exist
      When the client requests the job listing
      Then the client shall return jobs with pagination cursors

  Rule: While no freelance jobs are published, the Freelance Jobs client shall return an empty job array with null before and after cursor tokens.
    An empty board is an ordinary state. Nulling both cursor ends is what tells
    a caller there is nothing to page towards in either direction, which a
    zero-length array alone would not.

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

  # ── Owner-scoped listings ───────────────────────────────────────────

  Rule: When the client requests the freelance jobs of a character or of a corporation, the Freelance Jobs client shall return that owner's jobs in the same cursor envelope as the public listing.
    Both authenticated views reuse the public listing's shape so a caller can
    render "all jobs" and "my jobs" through one code path. The two scenarios
    exercise the character and corporation endpoints against that one shape.

    Scenario: Character's own jobs
      Given an authenticated character with freelance jobs
      When the client requests their job listing
      Then the client shall return the character jobs with cursors

    Scenario: Corporation's own jobs
      Given an authenticated corporation for freelance jobs
      When the client requests their freelance jobs
      Then the client shall return the corporation jobs listing

  Rule: When the client requests a character's participation in a freelance job, the Freelance Jobs client shall return the participation status, the contribution total, and the last contribution timestamp.
    Participation is a separate record from the job because a job has many
    contributors and each sees only their own tally. The timestamp is what lets
    a caller show whether a commitment has gone stale.

    Scenario: Character contribution to a mining job
      Given a character participating in a job
      When the client requests their participation details
      Then the client shall return contribution data

  # ── Cursor pagination ───────────────────────────────────────────────

  Rule: When the client supplies an after token, the Freelance Jobs client shall return the following page carrying that token as its before cursor.
    Cursor tokens are opaque and directional. The returned page echoes the
    token it was reached by in its before slot, which is what makes paging back
    the exact inverse of paging forward.

    Scenario: Following the after token to page two
      Given a first page with an after cursor
      When the client requests the next page using the after token
      Then the client shall return the second page of results

  Rule: When the client supplies a before token, the Freelance Jobs client shall return the preceding page with a null before cursor at the start of the listing.
    Paging backwards from page two lands on page one, and page one has nothing
    behind it — the null before token is the end-of-listing marker in that
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
