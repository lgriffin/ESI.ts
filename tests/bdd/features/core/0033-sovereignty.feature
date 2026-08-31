Feature: Sovereignty Management

  # EARS: Event-driven
  Scenario: WHEN getting active sovereignty campaigns, the client shall return the data
    Given active sovereignty contests exist
    When the client requests campaigns
    Then the client shall return campaign details with scores

  # EARS: State-driven
  Scenario: WHILE no active sovereignty campaigns, the client shall return an empty result
    Given no active campaigns exist
    When the client requests campaigns
    Then the client shall return an empty array

  # EARS: Unwanted
  Scenario: IF service unavailable error for sovereignty, THEN the client shall handle the service outage
    Given the ESI service is down
    When the client requests sovereignty data
    Then the client shall return a 503 error

  # EARS: Event-driven
  Scenario: WHEN getting combined sovereignty systems with ADM indices, the client shall return the data
    Given the combined systems endpoint is available
    When the client requests sovereignty systems
    Then the client shall return occupancy, structures, and separate ADM indices

  # EARS: Event-driven
  Scenario: WHEN fetching combined sovereignty data, the client shall replace separate map and structures calls
    Given the combined systems endpoint exists
    When the client fetches systems
    Then it shall contain data from both map and structures

  # EARS: Ubiquitous
  Scenario: The client shall handle concurrent fetch of campaigns and systems
    Given all sovereignty endpoints are available
    When the client fetches all data concurrently
    Then both shall return valid data
