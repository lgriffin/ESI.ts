Feature: Market Management

  # EARS: Event-driven
  Scenario: WHEN retrieving current market prices, the client shall return the data
    Given the market system is operational
    When the client requests current market prices
    Then the client shall return price data for all tradeable items

  # EARS: Unwanted
  Scenario: IF market data is unavailable, THEN the client shall handle the outage
    Given market data is temporarily unavailable
    When the client requests market prices expecting error
    Then the client shall return a market service error

  # EARS: Event-driven
  Scenario: WHEN retrieving market orders for a region, the client shall return the data
    Given a valid region ID
    When the client requests market orders for the region
    Then the client shall return current buy and sell orders

  # EARS: Event-driven
  Scenario: WHEN filtering buy and sell orders, the client shall return filtered results
    Given market orders with mixed buy and sell types
    When the client analyzes the market orders
    Then the client shall distinguish between buy and sell orders

  # EARS: Event-driven
  Scenario: WHEN retrieving historical market data, the client shall return the data
    Given a valid region and item type
    When the client requests market history
    Then the client shall return historical price and volume data

  # EARS: Event-driven
  Scenario: WHEN analyzing price trends, the client shall return the analysis
    Given historical market data with trending prices
    When the client analyzes price trends
    Then the client shall identify market patterns

  # EARS: Event-driven
  Scenario: WHEN retrieving character market orders, the client shall return the data
    Given an authenticated character with market orders
    When the client requests their market orders
    Then the client shall return their active orders

  # EARS: Event-driven
  Scenario: WHEN retrieving character order history, the client shall return the data
    Given an authenticated character with order history
    When the client requests their order history
    Then the client shall return completed and cancelled orders

  # EARS: Ubiquitous
  Scenario: The client shall handle high-frequency market data requests
    Given multiple concurrent market data requests
    When the client makes them simultaneously
    Then all market requests shall complete successfully

  # EARS: Ubiquitous
  Scenario: The client shall handle market data with large volumes
    Given a request for market data with many orders
    When the client processes the large market data
    Then the client shall handle large market datasets efficiently

  # EARS: Event-driven
  Scenario: WHEN completing market analysis workflow, the client shall complete all steps
    Given a market analysis requirement
    When the client gathers comprehensive market data
    Then the client shall successfully retrieve all market information
