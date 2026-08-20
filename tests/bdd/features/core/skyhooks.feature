Feature: Skyhooks Management

  # EARS: Event-driven
  Scenario: WHEN getting sovereignty hubs as Upwell structures, the client shall return the data
    Given sovereignty hubs exist
    When the client requests hubs
    Then the client shall return hub data with online status and upgrades

  # EARS: Event-driven
  Scenario: WHEN getting orbital skyhooks with silo data, the client shall return the data
    Given orbital skyhooks are deployed
    When the client requests skyhooks
    Then the client shall return silo capacity and levels

  # EARS: Event-driven
  Scenario: WHEN getting skyhooks that are currently raidable, the client shall return the data
    Given raidable skyhooks exist across New Eden
    When the client requests raidable skyhooks
    Then the client shall return the raidable list

  # EARS: Event-driven
  Scenario: WHEN getting skyhook detail, the client shall return detailed skyhook data
    Given a skyhook exists with detail data
    When the client requests skyhook detail
    Then the client shall return reagents and state information

  # EARS: Event-driven
  Scenario: WHEN getting sovereignty hub detail, the client shall return detailed hub data
    Given a sovereignty hub exists with detail data
    When the client requests sovereignty hub detail
    Then the client shall return upgrades and resource information

  # EARS: Unwanted
  Scenario: IF service unavailable error for skyhooks, THEN the client shall handle the service outage
    Given the ESI service is down for skyhooks
    When the client requests skyhook data
    Then the client shall return a 503 skyhooks error
