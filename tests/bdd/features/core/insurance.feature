Feature: Insurance Management

  # EARS: Event-driven
  Scenario: WHEN retrieving insurance prices for all ship types, the client shall return the data
    Given the insurance system is operational
    When the client requests insurance prices
    Then the client shall return pricing data for available ship types

  # EARS: Event-driven
  Scenario: WHEN verifying insurance price tiers are ordered correctly, the client shall validate the data
    Given insurance prices are available for tier verification
    When the client examines the tiers for a ship type
    Then higher tiers shall have increasing costs and payouts

  # EARS: Event-driven
  Scenario: WHEN verifying payout always exceeds cost for each tier, the client shall validate the data
    Given insurance prices are available for payout verification
    When the client checks each tier
    Then the payout shall always be greater than the cost

  # EARS: Ubiquitous
  Scenario: The client shall handle large insurance dataset
    Given a large insurance dataset covering many ship types
    When the client processes the large insurance response
    Then the client shall handle it efficiently

  # EARS: Event-driven
  Scenario: WHEN listing insurance tiers, the client shall return exactly six per ship type
    Given insurance prices are available for tier count verification
    When the client inspects each ship type
    Then every entry shall contain six named tiers

  # EARS: Unwanted
  Scenario: IF eSI service unavailable error, THEN the client shall handle the service outage
    Given the ESI service is temporarily unavailable
    When the client requests insurance prices expecting an error
    Then the client shall return a 503 service unavailable error

  # EARS: Unwanted
  Scenario: IF rate limiting on insurance endpoint, THEN the client shall respect the rate limit
    Given the API rate limit has been exceeded
    When the client requests insurance prices expecting rate limit error
    Then the client shall return a 429 rate limit error
