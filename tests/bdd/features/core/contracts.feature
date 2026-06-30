Feature: Contract Management

  Scenario: Get contracts for a valid character
    Given a character with contracts
    When I request character contracts
    Then I should receive a list of contracts

  Scenario: Handle empty contracts list
    Given a character with no contracts
    When I request character contracts for the empty list
    Then I should receive an empty array

  Scenario: Handle non-existent character for contracts
    Given an invalid character ID for contracts
    When I request character contracts for the invalid character
    Then I should receive a 404 not found error

  Scenario: Get public contracts in a region
    Given a valid region ID
    When I request public contracts
    Then I should receive contracts available in that region

  Scenario: Get bids for an auction contract
    Given an auction contract with bids
    When I request contract bids
    Then I should receive a list of bids

  Scenario: Get bids for a public auction
    Given a public auction contract
    When I request public contract bids
    Then I should receive the bid history

  Scenario: Get items in a character contract
    Given an item exchange contract
    When I request contract items
    Then I should receive the list of items

  Scenario: Filter character contracts to find only courier contracts
    Given a character with mixed contract types
    When I retrieve and filter by courier type
    Then I should find only courier contracts

  Scenario: Complete contract inspection workflow
    Given an active auction contract
    When I retrieve the contract then fetch its bids and items
    Then I should have full contract details

  Scenario: Compare character and corporation contracts
    Given a character in a corporation
    When I fetch both sets of contracts concurrently
    Then I should receive independent results
