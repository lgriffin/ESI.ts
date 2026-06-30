Feature: Asset Management

  Scenario: Get assets for a valid character
    Given a valid character ID with assets
    When I request character assets
    Then I should receive a list of assets

  Scenario: Handle empty inventory
    Given a character with no assets
    When I request character assets for the empty inventory
    Then I should receive an empty array

  Scenario: Handle unauthorized access
    Given an invalid or expired token for assets
    When I request character assets without authorization
    Then I should receive a 403 forbidden error

  Scenario: Look up names for specific assets
    Given a character with named assets
    When I request asset names by item IDs
    Then I should receive the names for those assets

  Scenario: Look up locations for specific assets
    Given a character with located assets
    When I request asset locations by item IDs
    Then I should receive position data

  Scenario: Retrieve corporation assets
    Given a valid corporation ID with assets
    When I request corporation assets
    Then I should receive the corporation asset list

  Scenario: Concurrent character and corporation asset fetch
    Given a character and their corporation
    When I fetch both asset sets concurrently
    Then I should receive both results independently

  Scenario: Full asset audit workflow
    Given a character with assets for audit
    When I retrieve assets then look up their names and locations
    Then I should have a complete asset inventory
