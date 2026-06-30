Feature: Market Management

  Scenario: Retrieve current market prices
    Given the market system is operational
    When I request current market prices
    Then I should receive price data for all tradeable items

  Scenario: Handle market data unavailability
    Given market data is temporarily unavailable
    When I request market prices expecting error
    Then I should receive a market service error

  Scenario: Retrieve market orders for a region
    Given a valid region ID
    When I request market orders for the region
    Then I should receive current buy and sell orders

  Scenario: Filter buy and sell orders
    Given market orders with mixed buy and sell types
    When I analyze the market orders
    Then I should be able to distinguish between buy and sell orders

  Scenario: Retrieve historical market data
    Given a valid region and item type
    When I request market history
    Then I should receive historical price and volume data

  Scenario: Analyze price trends
    Given historical market data with trending prices
    When I analyze price trends
    Then I should be able to identify market patterns

  Scenario: Retrieve character market orders
    Given an authenticated character with market orders
    When I request their market orders
    Then I should receive their active orders

  Scenario: Retrieve character order history
    Given an authenticated character with order history
    When I request their order history
    Then I should receive completed and cancelled orders

  Scenario: Handle high-frequency market data requests
    Given multiple concurrent market data requests
    When I make them simultaneously
    Then all market requests should complete successfully

  Scenario: Handle market data with large volumes
    Given a request for market data with many orders
    When I process the large market data
    Then the system should handle large market datasets efficiently

  Scenario: Complete market analysis workflow
    Given a market analysis requirement
    When I gather comprehensive market data
    Then I should successfully retrieve all market information
