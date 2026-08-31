Feature: Contract Management

  # EARS: Event-driven
  Scenario: WHEN getting contracts for a valid character, the client shall return the data
    Given a character with contracts
    When the client requests character contracts
    Then the client shall return a list of contracts

  # EARS: State-driven
  Scenario: WHILE empty contracts list, the client shall return an empty result
    Given a character with no contracts
    When the client requests character contracts for the empty list
    Then the client shall return an empty array

  # EARS: Unwanted
  Scenario: IF non-existent character for contracts, THEN the client shall return a not-found error
    Given an invalid character ID for contracts
    When the client requests character contracts for the invalid character
    Then the client shall return a 404 not found error

  # EARS: Event-driven
  Scenario: WHEN getting public contracts in a region, the client shall return the data
    Given a valid region ID
    When the client requests public contracts
    Then the client shall return contracts available in that region

  # EARS: Event-driven
  Scenario: WHEN getting bids for an auction contract, the client shall return the data
    Given an auction contract with bids
    When the client requests contract bids
    Then the client shall return a list of bids

  # EARS: Event-driven
  Scenario: WHEN getting bids for a public auction, the client shall return the data
    Given a public auction contract
    When the client requests public contract bids
    Then the client shall return the bid history

  # EARS: Event-driven
  Scenario: WHEN getting items in a character contract, the client shall return the data
    Given an item exchange contract
    When the client requests contract items
    Then the client shall return the list of items

  # EARS: Event-driven
  Scenario: WHEN filtering character contracts to find only courier contracts, the client shall return filtered results
    Given a character with mixed contract types
    When the client retrieves and filter by courier type
    Then the client shall return only courier contracts

  # EARS: Event-driven
  Scenario: WHEN completing contract inspection workflow, the client shall complete all steps
    Given an active auction contract
    When the client retrieves the contract then fetch its bids and items
    Then the client shall have full contract details

  # EARS: Event-driven
  Scenario: WHEN comparing character and corporation contracts, the client shall return the analysis
    Given a character in a corporation
    When the client fetches both sets of contracts concurrently
    Then the client shall return independent results
