Feature: Get Alliance Information by ID

  Scenario: Retrieve alliance information with a valid ID
    Given an alliance with ID "99000006" exists
    When I request the alliance information for ID "99000006"
    Then the response should contain the alliance name "Goonswarm Federation"
