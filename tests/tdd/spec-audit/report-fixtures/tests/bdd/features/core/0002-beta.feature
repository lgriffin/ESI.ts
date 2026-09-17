Feature: Beta
  A fixture feature bound by a legacy step file.

  Rule: When a status is requested, the Beta client shall return the status.
    Rationale.

    Scenario: Status is returned
      Given a status
      When the status is requested
      Then the status is returned

    Scenario: Status is returned twice
      Given a status
      When the status is requested twice
      Then the status is returned
