Feature: Corporation Projects Management
  The Corporation Projects client covers the project endpoints a corporation
  uses to set collective goals and track who worked towards them. It reads the
  project list, one project in detail, the contributor roll for a project, and
  a single character's contribution to it. Progress and contribution figures
  are what consuming applications rank and reward on, so their presence and
  type are pinned down here.

  # ── Project records ─────────────────────────────────────────────────

  Rule: When the project list is requested for a corporation ID, the Corporation Projects client shall return an array whose entries each carry project_id, state, progress, and start_time.
    The list view is what a corporation dashboard renders. State separates
    active work from finished work, progress drives the completion bar, and
    start_time orders the list, so all four are needed before an entry can be
    displayed at all.

    Scenario: Project list holding an active project and a completed project
      Given a valid corporation ID with projects
      When the client requests corporation projects
      Then the client shall return an array of projects

  Rule: When one project is requested by corporation ID and project ID, the Corporation Projects client shall return a record carrying project_id, state, progress, start_time, and finish_time.
    The detail view adds finish_time over the list view, which is what lets a
    caller show a deadline or a completion date rather than a bare progress
    figure.

    Scenario: Detail record for an active project
      Given a valid corporation ID and project ID
      When the client requests project details
      Then the client shall return complete project information

  # ── Contributions ───────────────────────────────────────────────────

  Rule: When contributors are requested for a project, the Corporation Projects client shall return an array whose entries each carry a numeric character_id and a numeric contribution.
    The contributor roll is what corporations pay out against, so both fields
    have to be numbers a caller can sum and sort without parsing. The entry
    order carries no ranking of its own.

    Scenario: Contributor roll for a project with two participants
      Given a corporation project with contributors
      When the client requests project contributors
      Then the client shall return an array of contributors

  Rule: When the contribution of one character to one project is requested, the Corporation Projects client shall return a record carrying that character_id and its contribution figure.
    Fetching a single contributor avoids pulling the whole roll to answer
    "what did this member do", which matters for corporations with large
    membership.

    Scenario: Single contributor looked up by character ID
      Given a character who contributed to a project
      When the client requests the character contribution
      Then the client shall return the contribution details

  # ── Failure surface ─────────────────────────────────────────────────

  Rule: If a project request fails, then the Corporation Projects client shall reject with an EsiError.
    Projects are created and retired continuously, so a stale project ID is an
    ordinary occurrence for a caller holding a cached list. Rejecting with the
    domain error type keeps that case on the same handling path as any other
    failure.

    Scenario: Unknown project ID rejects the request
      Given an invalid project ID
      When the client requests details for the invalid project
      Then the client shall return a not found error
