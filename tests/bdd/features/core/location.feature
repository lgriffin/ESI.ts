Feature: Location Management

  Scenario: Retrieve character location while docked
    Given an authenticated character docked in a station
    When I request their location
    Then I should receive the solar system and station information

  Scenario: Retrieve character location while in space
    Given an authenticated character flying in space
    When I request their location while in space
    Then I should receive only the solar system with no station

  Scenario: Check online status of an active character
    Given an authenticated character who is currently online
    When I check their online status
    Then I should see they are online with login timestamps

  Scenario: Check online status of an offline character
    Given an authenticated character who is currently offline
    When I check their offline status
    Then I should see they are offline

  Scenario: Retrieve the ship a character is currently flying
    Given an authenticated character in a ship
    When I request their current ship
    Then I should receive the ship details

  Scenario: Fetch location, online status, and ship simultaneously
    Given an authenticated character for concurrent location fetch
    When I fetch location, online status, and ship concurrently
    Then all three location requests should resolve successfully

  Scenario: Handle unauthorized access to character location
    Given an unauthenticated location request
    When I request a character location without auth
    Then I should receive a 403 forbidden error for location

  Scenario: Handle unauthorized access to online status
    Given an unauthenticated online status request
    When I request online status without auth
    Then I should receive a 403 forbidden error for online status
