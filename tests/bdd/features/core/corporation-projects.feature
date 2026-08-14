Feature: Corporation Projects Management

  # EARS: Event-driven
  Scenario: WHEN listing corporation projects, the client shall return the data
    Given a valid corporation ID with projects
    When the client requests corporation projects
    Then the client shall return an array of projects

  # EARS: Event-driven
  Scenario: WHEN getting specific project details, the client shall return the data
    Given a valid corporation ID and project ID
    When the client requests project details
    Then the client shall return complete project information

  # EARS: Event-driven
  Scenario: WHEN getting project contributors, the client shall return the data
    Given a corporation project with contributors
    When the client requests project contributors
    Then the client shall return an array of contributors

  # EARS: Event-driven
  Scenario: WHEN getting character contribution, the client shall return the data
    Given a character who contributed to a project
    When the client requests the character contribution
    Then the client shall return the contribution details

  # EARS: Unwanted
  Scenario: IF non-existent project ID, THEN the client shall return a not-found error
    Given an invalid project ID
    When the client requests details for the invalid project
    Then the client shall return a not found error
