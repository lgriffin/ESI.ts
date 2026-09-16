Feature: Server Status
  The Status client wraps the single unauthenticated status endpoint, which
  reports whether Tranquility is up and what it is doing. It is the endpoint
  callers poll to decide whether to attempt anything else.

  # ── VIP mode ────────────────────────────────────────────────────────

  Rule: When server status is requested, the Status client shall report the VIP flag of the response as a boolean.
    VIP mode follows downtime, when only privileged accounts can log in. The
    flag is what tells an application to hold off reconnecting, so it is
    carried through as a boolean the caller can branch on.

    Scenario: Restricted login reports the VIP flag set
      Given the server is in VIP mode
      When the client requests the status
      Then the VIP flag shall be the boolean true

  # ── Upstream failure ────────────────────────────────────────────────

  Rule: If ESI answers a status request with a 503 status, then the Status client shall reject the request with an EsiError carrying status 503.
    An outage arrives as a failure rather than as a status payload, so the
    client raises a typed EsiError that a polling caller treats as "cluster
    not reachable".

    Scenario: Service unavailable rejects the status request
      Given the ESI API is unavailable
      When the client requests the status
      Then the client shall reject with an EsiError of status 503
