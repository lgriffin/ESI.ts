Feature: Military Campaigns
  The MilitaryCampaigns client covers the campaign endpoints: the list of
  campaigns, the detail of one campaign, the objectives inside it, and a
  character's own participation in those objectives. Campaigns and objectives
  are identified by UUID rather than a numeric ID, and both carry a state and a
  fractional progress value that advance over the campaign's lifetime.

  The character-scoped objective view is the only authenticated surface here;
  campaign and objective data is public.

  # ── Campaign listing ────────────────────────────────────────────────

  Rule: When the military campaign listing is requested, the MilitaryCampaigns client shall return each campaign with its campaign_id, state, progress, and, for a completed campaign, its finish_time.
    The listing mixes running and finished campaigns. State and progress are
    what separate them, and finish_time appears only once a campaign has
    ended, so a caller reads its presence as the end of the campaign's
    lifetime rather than inferring it from progress reaching 1.0.

    Scenario: Active and completed campaigns return state and progress
      Given active and completed military campaigns exist
      When the client requests the campaigns listing
      Then the client shall return campaigns with state and progress

  Rule: If no military campaigns exist, then the MilitaryCampaigns client shall return an empty array.
    Between campaign cycles the listing is legitimately empty. That is
    reported as an empty array rather than an error, so a caller polling for
    the next campaign branches on length.

    Scenario: No campaigns in progress returns an empty array
      Given no military campaigns exist
      When the client requests the empty campaigns listing
      Then the client shall return an empty campaigns array

  # ── Campaign and objective detail ───────────────────────────────────

  Rule: When a campaign is requested by UUID, the MilitaryCampaigns client shall return that campaign's state, progress, and start_time.
    The detail endpoint is how a caller refreshes one campaign it is already
    tracking without re-pulling the whole listing. The start time anchors the
    progress value to a real elapsed duration.

    Scenario: Campaign fetched by UUID returns its start time and progress
      Given a valid campaign UUID
      When the client requests the campaign details
      Then the client shall return the full campaign information

  Rule: When the objectives of a campaign are requested, the MilitaryCampaigns client shall return each objective with its objective_id, state, progress, and its total, committed, and contributor participant counts.
    Objectives are where a campaign's progress actually comes from. The three
    participant counts are distinct measures — signed up, committed, and
    actually contributing — so collapsing them into one number would hide
    which objectives are under-crewed.

    Scenario: Two objectives return their participant totals and commitments
      Given a campaign with objectives
      When the client requests the campaign objectives
      Then the client shall return objectives with participant counts

  # ── Character participation ─────────────────────────────────────────

  Rule: When the campaign objectives of a character are requested, the MilitaryCampaigns client shall return each objective with that character's committed flag and contribution value.
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
