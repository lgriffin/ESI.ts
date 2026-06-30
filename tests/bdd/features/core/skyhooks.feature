Feature: Skyhooks Management

  Scenario: Get sovereignty hubs as Upwell structures
    Given sovereignty hubs exist
    When I request hubs
    Then I should receive hub data with online status and upgrades

  Scenario: Get orbital skyhooks with silo data
    Given orbital skyhooks are deployed
    When I request skyhooks
    Then I should receive silo capacity and levels

  Scenario: Get skyhooks that are currently raidable
    Given raidable skyhooks exist across New Eden
    When I request raidable skyhooks
    Then I should receive the raidable list

  Scenario: Service unavailable error for skyhooks
    Given the ESI service is down for skyhooks
    When I request skyhook data
    Then I should receive a 503 skyhooks error
