Feature: Server Status
  The Status client wraps the single unauthenticated status endpoint, which
  reports whether Tranquility is up and what it is doing. It is the endpoint
  callers poll to decide whether to attempt anything else.

  # ── VIP mode ────────────────────────────────────────────────────────

  Rule: When server status is requested, the Status client shall report the VIP flag as a boolean and shall reject a 503 response with an EsiError.
    VIP mode follows downtime, when only privileged accounts can log in. An
    outage during the same window arrives as a 503.

    Scenario: Restricted login reports the VIP flag set
      Given the server is in VIP mode
      When the client requests the status
      Then the VIP flag shall be true

    Scenario: Outage during VIP window rejects the status request
      Given the ESI API is unavailable
      When the client requests the status
      Then the client shall reject with an EsiError
