Feature: Server Status
  The Status client wraps the single unauthenticated status endpoint, which
  reports whether Tranquility is up and what it is doing: how many pilots are
  logged in, which build is running, when the node came up, and whether the
  cluster is in VIP mode. It is the endpoint callers poll to decide whether to
  attempt anything else, so both its success payload and its outage behaviour
  are specified here.

  # ── Status payload ──────────────────────────────────────────────────

  Rule: When server status is requested, the Status client shall return the player count as a number, the server version, the start time as a parseable ISO 8601 timestamp, and the VIP flag.
    These four fields are the whole payload. Callers treat players as a
    number they can compare and start_time as a date they can subtract from
    now to get cluster uptime, so both are exercised for type as well as
    presence.

    Scenario: Online server returns all four status fields
      Given the Tranquility server is online
      When the client requests the server status
      Then the client shall return current status information

    Scenario: Player count is a non-negative number
      Given the server is online with a typical player count
      When the client checks the player count
      Then the player count shall be within expected bounds

    Scenario: Start time parses as a calendar date
      Given the server is online
      When the client checks the start time
      Then the start time shall be a valid ISO timestamp

  # ── VIP mode ────────────────────────────────────────────────────────

  Rule: When server status is requested, the Status client shall report the VIP flag as a boolean reflecting whether login is restricted.
    VIP mode follows downtime and after emergency restarts, when only
    privileged accounts can log in. The flag is what tells an application to
    hold off reconnecting, and the low player count that accompanies it is a
    consequence rather than an independent signal.

    Scenario: Restricted login reports the VIP flag set with a low player count
      Given the server is in VIP mode
      When the client requests the status
      Then the VIP flag should be true and player count shall be low

    Scenario: Open login reports the VIP flag clear with a full player count
      Given the server is operating normally
      When the client requests the status for VIP check
      Then the VIP flag shall be false

  # ── Upstream failure ────────────────────────────────────────────────

  Rule: If ESI answers a status request with a 5xx status, then the Status client shall reject the request with an EsiError.
    Both the outage code and the internal error code arrive as failures rather
    than as a status payload with a flag set, so the client raises a typed
    EsiError. A caller polling for availability treats either as "cluster not
    reachable".

    Scenario: Service unavailable rejects the status request with an EsiError
      Given the ESI API is unavailable
      When the client requests the server status
      Then the client shall return a 503 service unavailable error

    Scenario: Internal server error rejects the status request with an EsiError
      Given the ESI API encounters an internal error
      When the client requests the server status for error check
      Then the client shall return a 500 error

  # ── Repeated polling ────────────────────────────────────────────────

  Rule: The Status client shall return the payload of the current response on each successive status request.
    Applications poll this endpoint on a timer. Each call resolves against
    whatever the server returned for that call, so a changing player count is
    observed across polls while a constant server version and start time stay
    constant.

    Scenario: Three successive polls track a changing player count under one server version
      Given the server is online with gradually changing player counts
      When the client checks the status multiple times
      Then each check shall return valid data with consistent server version
