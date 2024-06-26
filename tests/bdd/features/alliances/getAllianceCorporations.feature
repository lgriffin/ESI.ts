Feature: Get Alliance Corporations

  Scenario: Retrieve corporations for a specific alliance
    Given an alliance with ID "99000006" exists
    When I request the corporations for alliance ID "99000006"
    Then the response should contain a list of corporation IDs
