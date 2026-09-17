Feature: Alpha
  A fixture feature bound by a spec entry.

  Rule: When orders are requested, the Alpha client shall return every order.
    Rationale.

    Scenario: Five orders are returned
      Given a region with 5 orders
      When the orders are requested
      Then every order is returned

  Rule: If ESI answers with a server error, then the Alpha client shall retry the request.
    Rationale.

    Scenario Outline: HTTP <status> is retried
      Given ESI answers with HTTP <status>
      When the orders are requested
      Then the request is retried

      Examples:
        | status |
        | 502    |
        | 503    |
