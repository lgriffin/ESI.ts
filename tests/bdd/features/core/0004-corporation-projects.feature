Feature: Corporation Projects Management
  The Corporation Projects client covers the project endpoints a corporation
  uses to set collective goals and track who worked towards them. It reads the
  project list, one project in detail, the contributor roll for a project, and
  a single character's contribution to it. Progress and contribution figures
  are what consuming applications rank and reward on, so their presence and
  type are pinned down here.

  ESI identifies a project by a UUID string, and both lists are cursor
  paginated: each page is an object holding its entries next to an optional
  cursor, not a bare array.

  # ── Project records ─────────────────────────────────────────────────

  Rule: When the project list is requested for a corporation ID, the Corporation Projects client shall return a page whose projects entries each carry id, name, state, last_modified, and progress, and the page cursor when present.
    The list view is what a corporation dashboard renders. The id is the UUID
    every other project call takes, state separates active work from finished
    work, and progress holds the current and desired figures a completion bar
    is drawn from. The cursor is what a caller passes back to read the next
    page.

    Scenario: Project list page holding an active project and a completed project
      Given a corporation with an active project and a completed project
      When the client requests the corporation project list
      Then the client shall return both projects with their progress and the page cursor

  Rule: When one project is requested by corporation ID and project UUID, the Corporation Projects client shall return a record carrying id, name, state, progress, creator, details, and configuration.
    The detail view adds who created the project, its description, career and
    creation time, and the configuration that says what counts as a
    contribution, which is what lets a caller explain a project rather than
    show a bare progress figure.

    Scenario: Detail record for an active project identified by its UUID
      Given an active corporation project with a manual configuration
      When the client requests the corporation project details
      Then the client shall return the project creator, details and configuration

  # ── Contributions ───────────────────────────────────────────────────

  Rule: When contributors are requested for a project, the Corporation Projects client shall return a page whose contributors entries each carry a numeric id, a name, and a numeric contributed figure, and the page cursor when present.
    The contributor roll is what corporations pay out against, so the
    contributed figure has to be a number a caller can sum and sort without
    parsing. The entry order carries no ranking of its own.

    Scenario: Contributor roll for a project with two participants
      Given a corporation project with two contributors
      When the client requests the project contributor roll
      Then the client shall return each contributor with a numeric contributed figure

  Rule: When the project list or a contributor roll is requested with a cursor token, the Corporation Projects client shall send that token to ESI unchanged in the request query string.
    Cursor tokens are opaque. The client neither parses nor rewrites them; a
    caller walks forward through a list by passing the after token of one page
    into the request for the next.

    Scenario: Project list page requested after a cursor token
      Given a corporation whose project list continues after a cursor token
      When the client requests the corporation project list after that token
      Then the request shall carry the cursor token as the after query parameter

    Scenario: Contributor roll page requested after a cursor token
      Given a corporation project whose contributor roll continues after a cursor token
      When the client requests the project contributor roll after that token
      Then the request shall carry the cursor token as the after query parameter

  Rule: When the contribution of one character to one project is requested, the Corporation Projects client shall return a record carrying the contributed figure, and last_modified when present.
    Fetching a single contributor avoids pulling the whole roll to answer
    "what did this member do", which matters for corporations with large
    membership. The ESI spec marks the modification time optional, so a
    record without one is still a valid answer.

    Scenario: Contribution looked up by character ID
      Given a character who contributed to a corporation project
      When the client requests the project contribution of that character
      Then the client shall return the contributed figure and its modification time

    Scenario: Contribution with no modification time
      Given a project contribution recorded without a modification time
      When the client requests the project contribution of that character
      Then the client shall return the contributed figure without a modification time

  # ── Failure surface ─────────────────────────────────────────────────

  Rule: If a project request fails, then the Corporation Projects client shall reject with an EsiError.
    Projects are created and retired continuously, so a stale project ID is an
    ordinary occurrence for a caller holding a cached list. Rejecting with the
    domain error type keeps that case on the same handling path as any other
    failure.

    Scenario: Unknown project ID rejects the request
      Given an unknown corporation project ID
      When the client requests details for the unknown corporation project
      Then the client shall reject the project request with a not found EsiError
