Feature: In-Game UI Control
  The UI client drives the EVE client of the authenticated character: it sets
  autopilot waypoints and opens contract, information, market details, and new
  mail windows. Every one of these endpoints is a write with no response body,
  so the observable contract is which arguments reach the endpoint and that
  the call resolves without a payload. All of them need a character token, and
  a request made without one comes back as a forbidden error.

  # ── Autopilot ───────────────────────────────────────────────────────

  Rule: When an autopilot waypoint is set, the UI client shall submit the destination identifier together with the add-to-beginning and clear-other-waypoints flags.
    The two boolean flags decide whether the destination is appended, put
    first, or replaces the route entirely, so they travel with every waypoint
    call rather than defaulting server-side. Route clearing is the flag with
    destructive effect, so it is exercised on its own.

    Scenario: Waypoint appended to the existing route
      Given an authenticated character for waypoint
      When the client sets an autopilot waypoint to a solar system
      Then the waypoint shall be set successfully

    Scenario: Waypoint set with the clear-other-waypoints flag
      Given an authenticated character with existing waypoints
      When the client sets a waypoint with clear flag
      Then existing waypoints shall be cleared

  # ── Window opening ──────────────────────────────────────────────────

  Rule: When an identifier-addressed window is opened, the UI client shall submit that identifier and resolve with no response body.
    The contract, information, and market details windows each take a single
    identifier and return 204 with an empty body. Resolving to undefined
    rather than to a parsed object is what tells a caller the request was
    accepted, since there is nothing else to inspect.

    Scenario: Contract window opened for a contract identifier
      Given an authenticated character for contracts
      When the client opens a contract window for a specific contract
      Then the contract window shall open successfully

    Scenario: Information window opened for a character identifier
      Given an authenticated character for info window
      When the client opens an info window for another character
      Then the information window shall display successfully

    Scenario: Market details window opened for a type identifier
      Given an authenticated character for market
      When the client opens the market details for an item type
      Then the market window shall display successfully

  Rule: When a new mail window is opened, the UI client shall submit the recipient list, subject, and body as the request payload.
    Unlike the other window endpoints this one carries a composed draft rather
    than an identifier, so the whole body is forwarded and the in-game
    composer opens pre-filled. Nothing comes back to confirm the contents.

    Scenario: Mail window opened with recipients, subject, and body
      Given an authenticated character for mail
      When the client opens a new mail window with recipients and content
      Then the mail window shall display with pre-filled data

  # ── Authorisation ───────────────────────────────────────────────────

  Rule: If a UI request is made without a token granting the openwindow scope, then the UI client shall reject the request with an EsiError.
    These endpoints act on a running game client, so ESI refuses them outright
    without the character scope. Both a waypoint write and a window open are
    covered, because the rejection comes from the shared request path rather
    than from either method.

    Scenario: Unauthenticated waypoint request rejects with an EsiError
      Given an unauthenticated user for waypoint
      When the client attempts to set a waypoint
      Then the client shall return a 403 forbidden error for waypoint

    Scenario: Unauthenticated contract window request rejects with an EsiError
      Given an unauthenticated user for contracts
      When the client attempts to open a contract window
      Then the client shall return a 403 forbidden error for contract

  # ── Concurrency ─────────────────────────────────────────────────────

  Rule: The UI client shall issue one request per call when five UI operations are invoked concurrently.
    A tooling integration can fire several UI commands off one user action.
    The client holds no shared per-request state, so each concurrent call
    reaches its own endpoint exactly once and resolves independently.

    Scenario: Five concurrent UI operations each issue exactly one request
      Given an authenticated character for concurrent operations
      When the client performs multiple UI operations concurrently
      Then all operations shall complete successfully
