Feature: Get Alliance Icons

  Scenario: Retrieve icons for a specific alliance
    Given an alliance with ID "99000006" exists
    When I request the icons for alliance ID "99000006"
    Then the response should contain icon URLs
