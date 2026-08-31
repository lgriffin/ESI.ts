Feature: Asset Management

  # EARS: Event-driven
  Scenario: WHEN getting assets for a valid character, the client shall return the data
    Given a valid character ID with assets
    When the client requests character assets
    Then the client shall return a list of assets

  # EARS: State-driven
  Scenario: WHILE empty inventory, the client shall return an empty result
    Given a character with no assets
    When the client requests character assets for the empty inventory
    Then the client shall return an empty array

  # EARS: Unwanted
  Scenario: IF unauthorized access, THEN the client shall return a forbidden error
    Given an invalid or expired token for assets
    When the client requests character assets without authorization
    Then the client shall return a 403 forbidden error

  # EARS: Event-driven
  Scenario: WHEN looking up names for specific assets, the client shall return the data
    Given a character with named assets
    When the client requests asset names by item IDs
    Then the client shall return the names for those assets

  # EARS: Event-driven
  Scenario: WHEN looking up locations for specific assets, the client shall return the data
    Given a character with located assets
    When the client requests asset locations by item IDs
    Then the client shall return position data

  # EARS: Event-driven
  Scenario: WHEN retrieving corporation assets, the client shall return the data
    Given a valid corporation ID with assets
    When the client requests corporation assets
    Then the client shall return the corporation asset list

  # EARS: Ubiquitous
  Scenario: The client shall handle concurrent character and corporation asset fetch
    Given a character and their corporation
    When the client fetches both asset sets concurrently
    Then the client shall return both results independently

  # EARS: Event-driven
  Scenario: WHEN performing full asset audit workflow, the client shall complete all steps
    Given a character with assets for audit
    When the client retrieves assets then look up their names and locations
    Then the client shall have a complete asset inventory
