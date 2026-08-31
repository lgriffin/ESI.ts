Feature: Fittings Management

  # EARS: Event-driven
  Scenario: WHEN listing all saved fittings for a character, the client shall return the data
    Given a character with saved fittings
    When the client requests their fittings
    Then the client shall return an array of fitting details

  # EARS: State-driven
  Scenario: WHILE the character has no saved fittings, the client shall return an empty result
    Given a character with no saved fittings
    When the client requests their fittings list
    Then the client shall return an empty array

  # EARS: Event-driven
  Scenario: WHEN creating a new fitting, the client shall create the resource
    Given valid fitting data
    When the client creates a new fitting
    Then the client shall return the new fitting ID

  # EARS: Event-driven
  Scenario: WHEN creating fitting with maximum items, the client shall create the resource
    Given a fully fitted ship
    When the client saves the fitting
    Then the fitting shall be created with all module slots populated

  # EARS: Event-driven
  Scenario: WHEN deleting an existing fitting, the client shall complete the operation
    Given a valid fitting ID
    When the client deletes the fitting
    Then the operation shall complete without error

  # EARS: Unwanted
  Scenario: IF unauthorized access to fittings, THEN the client shall return a forbidden error
    Given an invalid or expired token for fittings
    When the client requests fittings with invalid token
    Then the client shall return a 403 forbidden error for fittings

  # EARS: Unwanted
  Scenario: IF unauthorized access when creating a fitting, THEN the client shall return a forbidden error
    Given insufficient permissions for fitting creation
    When the client attempts to create a fitting
    Then the client shall return a 403 forbidden error for creation

  # EARS: Event-driven
  Scenario: WHEN performing full fitting lifecycle - create, list, and delete, the client shall complete all steps
    Given a character for fitting lifecycle
    When the client creates a fitting then list fittings then delete it
    Then each operation shall succeed in sequence
