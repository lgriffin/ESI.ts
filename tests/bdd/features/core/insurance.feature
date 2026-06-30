Feature: Insurance Management

  Scenario: Retrieve insurance prices for all ship types
    Given the insurance system is operational
    When I request insurance prices
    Then I should receive pricing data for available ship types

  Scenario: Verify insurance price tiers are ordered correctly
    Given insurance prices are available for tier verification
    When I examine the tiers for a ship type
    Then higher tiers should have increasing costs and payouts

  Scenario: Verify payout always exceeds cost for each tier
    Given insurance prices are available for payout verification
    When I check each tier
    Then the payout should always be greater than the cost

  Scenario: Handle large insurance dataset
    Given a large insurance dataset covering many ship types
    When I process the large insurance response
    Then the system should handle it efficiently

  Scenario: Each ship type has exactly six insurance tiers
    Given insurance prices are available for tier count verification
    When I inspect each ship type
    Then every entry should contain six named tiers

  Scenario: Handle ESI service unavailable error
    Given the ESI service is temporarily unavailable
    When I request insurance prices expecting an error
    Then I should receive a 503 service unavailable error

  Scenario: Handle rate limiting on insurance endpoint
    Given the API rate limit has been exceeded
    When I request insurance prices expecting rate limit error
    Then I should receive a 429 rate limit error
