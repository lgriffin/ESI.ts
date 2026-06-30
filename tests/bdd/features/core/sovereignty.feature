Feature: Sovereignty Management

  Scenario: Get active sovereignty campaigns
    Given active sovereignty contests exist
    When I request campaigns
    Then I should receive campaign details with scores

  Scenario: No active sovereignty campaigns
    Given no active campaigns exist
    When I request campaigns
    Then I should receive an empty array

  Scenario: Service unavailable error for sovereignty
    Given the ESI service is down
    When I request sovereignty data
    Then I should receive a 503 error

  Scenario: Get combined sovereignty systems with ADM indices
    Given the combined systems endpoint is available
    When I request sovereignty systems
    Then I should receive occupancy, structures, and separate ADM indices

  Scenario: Combined route replaces separate map and structures endpoints
    Given the combined systems endpoint exists
    When I fetch systems
    Then it should contain data from both map and structures

  Scenario: Concurrent fetch of campaigns and systems
    Given all sovereignty endpoints are available
    When I fetch all data concurrently
    Then both should return valid data
