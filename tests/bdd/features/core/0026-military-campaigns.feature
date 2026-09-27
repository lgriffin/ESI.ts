Feature: Military Campaigns
  The MilitaryCampaigns client covers the campaign endpoints: the list of
  campaigns, the detail of one campaign, the objectives inside it, and a
  character's own participation in those objectives. Campaigns and objectives
  are identified by UUID rather than a numeric ID, and both carry a state and a
  progress value that advance over the campaign's lifetime. ESI serves these
  routes from compatibility date 2026-08-18 and wraps each list in an object:
  `{ campaigns: [...] }` and `{ objectives: [...], cursor }`.

  The character-scoped objective view is the only authenticated surface here;
  campaign and objective data is public.

  # ── Campaign listing ────────────────────────────────────────────────

  Rule: When the military campaign listing is requested, the MilitaryCampaigns client shall return a campaigns array holding each campaign's id, state, and progress, and the finished time of an ended campaign when present.
    The listing mixes running and finished campaigns. State and progress are
    what separate them, and finished appears only once a campaign has ended,
    so a caller reads its presence as the end of the campaign's lifetime
    rather than inferring it from progress. The array sits under a campaigns
    key, which is the body ESI sends.

    Scenario: Active and completed campaigns return state and progress
      Given active and completed military campaigns exist
      When the client requests the campaigns listing
      Then the client shall return campaigns with state and progress

  Rule: If no military campaigns exist, then the MilitaryCampaigns client shall return an empty campaigns array.
    Between campaign cycles the listing is legitimately empty. That is
    reported as an empty array rather than an error, so a caller polling for
    the next campaign branches on its length.

    Scenario: No campaigns in progress returns an empty array
      Given no military campaigns exist
      When the client requests the empty campaigns listing
      Then the client shall return an empty campaigns array

  # ── Campaign and objective detail ───────────────────────────────────

  Rule: When a campaign is requested by UUID, the MilitaryCampaigns client shall return that campaign's id, state, and progress, and its started time when present.
    The detail endpoint is how a caller refreshes one campaign it is already
    tracking without re-pulling the whole listing. The start time anchors the
    progress value to a real elapsed duration.

    Scenario: Campaign fetched by UUID returns its start time and progress
      Given a valid campaign UUID
      When the client requests the campaign details
      Then the client shall return the full campaign information

  Rule: When the objectives of a campaign are requested, the MilitaryCampaigns client shall return an objectives array holding each objective's id, state, progress, and its total, committed, and contributor participant counts.
    Objectives are where a campaign's progress actually comes from. The three
    participant counts are distinct measures — signed up, committed, and
    actually contributing — so collapsing them into one number would hide
    which objectives are under-crewed.

    Scenario: Two objectives return their participant totals and commitments
      Given a campaign with objectives
      When the client requests the campaign objectives
      Then the client shall return objectives with participant counts

  Rule: When a page cursor or limit is supplied for an objectives listing, the MilitaryCampaigns client shall send each supplied value as a query parameter of the same name.
    Both objective listings are cursor-paginated: ESI returns before and after
    tokens in the body and serves the next page only when a token comes back
    as a query parameter. Without forwarding them a caller could read only the
    first page.

    Scenario: Next page of a campaign's objectives is requested with the after cursor
      Given a campaign whose objectives continue on a later page
      When the client requests the objectives after that cursor with a limit of 50
      Then the request shall carry the after cursor and the limit

    Scenario: Earlier page of a character's objectives is requested with the before cursor
      Given a character whose objectives continue on an earlier page
      When the client requests the character objectives before that cursor
      Then the request shall carry the before cursor

  # ── Character participation ─────────────────────────────────────────

  Rule: When the campaign objectives of a character are requested, the MilitaryCampaigns client shall return an objectives array holding each objective's id with that character's is_committed flag and contributed value.
    This is the personal view of the same objectives: whether the character
    has committed to one, and how much they have contributed to it. Both are
    per-character values that the public objective payload cannot carry.

    Scenario: Character objective returns the commitment flag and contribution
      Given an authenticated character with campaign participation
      When the client requests their campaign objectives
      Then the client shall return the character participation data

  # ── Error propagation ───────────────────────────────────────────────

  Rule: If a requested campaign UUID does not resolve to a campaign, then the MilitaryCampaigns client shall raise an EsiError.
    Campaign UUIDs are opaque and are often carried over from a previous
    cycle, so an unknown ID is a routine caller mistake. ESI answers 404 and
    the client surfaces it as the same error type used across the library.

    Scenario: Unknown campaign UUID is rejected with 404
      Given an invalid campaign UUID
      When the client requests details for the invalid campaign
      Then the client shall return a 404 error for the campaign
