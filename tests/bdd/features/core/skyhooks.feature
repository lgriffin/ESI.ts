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

  # EARS: Unwanted
  Scenario: IF service unavailable error for skyhooks, THEN the client shall handle the service outage
    Given the ESI service is down for skyhooks
    When the client requests skyhook data
    Then the client shall return a 503 skyhooks error
