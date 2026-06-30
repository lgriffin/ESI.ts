Feature: Performance Testing

  Scenario: API response time benchmarking
    Given normal system load
    When I make API requests and measure response times
    Then response times should be within acceptable limits

  Scenario: Performance under varying network conditions
    Given different network latencies
    When I make requests under different conditions
    Then the system should handle varying conditions gracefully

  Scenario: High concurrency load testing
    Given high concurrent load
    When I make simultaneous requests
    Then the system should handle them efficiently

  Scenario: Mixed API concurrent requests
    Given mixed API types for concurrent requests
    When I make concurrent requests across different APIs
    Then all mixed requests should complete successfully

  Scenario: Processing large market datasets
    Given large market data
    When I process the market dataset
    Then performance should remain acceptable

  Scenario: Handling large corporation member lists
    Given a large corporation
    When I process member data
    Then performance should scale appropriately

  Scenario: Memory efficiency with large datasets
    Given memory-intensive operations
    When I process large amounts of data iteratively
    Then memory usage should remain efficient

  Scenario: Performance impact of error conditions
    Given error conditions exist
    When errors occur during requests
    Then error handling should not significantly impact performance
