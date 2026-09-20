Feature: Alpha
  A fixture feature bound by a spec entry.

  Rule: When orders are requested, the Alpha client shall return every order.
    Rationale.

    Scenario: Five orders are returned
      Given a region with 5 orders
      When the orders are requested
      Then every order is returned
