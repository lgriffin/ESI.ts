Feature: Beta
  A fixture feature bound by a legacy step file.

  Rule: When a status is requested, the Beta client shall return it.
    Rationale.

    Scenario: Status is returned
      Given a status
      When it is requested
      Then it is returned
