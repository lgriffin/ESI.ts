Feature: Clone Management

  Scenario: Get clone information for a valid character
    Given a valid character ID for clones
    When I request clone information
    Then I should receive clone details

  Scenario: Handle unauthorized clone request
    Given an invalid access token for clones
    When I request clone information without authorization
    Then I should receive an authentication error for clones

  Scenario: Get active implants for a character
    Given a valid character ID for implants
    When I request implant information
    Then I should receive a list of implant type IDs

  Scenario: Character with no implants
    Given a character with no active implants
    When I request implant information for the character
    Then I should receive an empty array for implants

  Scenario: Retrieve clones and their implants
    Given a character with clones
    When I retrieve clone info and implants
    Then I should have complete clone data
