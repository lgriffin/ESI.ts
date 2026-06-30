Feature: Fittings Management

  Scenario: List all saved fittings for a character
    Given a character with saved fittings
    When I request their fittings
    Then I should receive an array of fitting details

  Scenario: Character has no saved fittings
    Given a character with no saved fittings
    When I request their fittings list
    Then I should receive an empty array

  Scenario: Successfully create a new fitting
    Given valid fitting data
    When I create a new fitting
    Then I should receive the new fitting ID

  Scenario: Create fitting with maximum items
    Given a fully fitted ship
    When I save the fitting
    Then the fitting should be created with all module slots populated

  Scenario: Successfully delete an existing fitting
    Given a valid fitting ID
    When I delete the fitting
    Then the operation should complete without error

  Scenario: Unauthorized access to fittings
    Given an invalid or expired token for fittings
    When I request fittings with invalid token
    Then I should receive a 403 forbidden error for fittings

  Scenario: Unauthorized access when creating a fitting
    Given insufficient permissions for fitting creation
    When I attempt to create a fitting
    Then I should receive a 403 forbidden error for creation

  Scenario: Full fitting lifecycle - create, list, and delete
    Given a character for fitting lifecycle
    When I create a fitting then list fittings then delete it
    Then each operation should succeed in sequence
