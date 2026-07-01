Feature: Location Management

  # EARS: Event-driven
  Scenario: WHEN retrieving character location while docked, the client shall return the data
    Given an authenticated character docked in a station
    When the client requests their location
    Then the client shall return the solar system and station information

  # EARS: Event-driven
  Scenario: WHEN retrieving character location while in space, the client shall return the data
    Given an authenticated character flying in space
    When the client requests their location while in space
    Then the client shall return only the solar system with no station

  # EARS: Event-driven
  Scenario: WHEN checking online status of an active character, the client shall validate the data
    Given an authenticated character who is currently online
    When the client checks their online status
    Then the client shall report they are online with login timestamps

  # EARS: Event-driven
  Scenario: WHEN checking online status of an offline character, the client shall validate the data
    Given an authenticated character who is currently offline
    When the client checks their offline status
    Then the client shall report they are offline

  # EARS: Event-driven
  Scenario: WHEN retrieving the ship a character is currently flying, the client shall return the data
    Given an authenticated character in a ship
    When the client requests their current ship
    Then the client shall return the ship details

  # EARS: Event-driven
  Scenario: WHEN fetching location, online status, and ship simultaneously, the client shall return the data
    Given an authenticated character for concurrent location fetch
    When the client fetches location, online status, and ship concurrently
    Then all three location requests shall resolve successfully

  # EARS: Unwanted
  Scenario: IF unauthorized access to character location, THEN the client shall return a forbidden error
    Given an unauthenticated location request
    When the client requests a character location without auth
    Then the client shall return a 403 forbidden error for location

  # EARS: Unwanted
  Scenario: IF unauthorized access to online status, THEN the client shall return a forbidden error
    Given an unauthenticated online status request
    When the client requests online status without auth
    Then the client shall return a 403 forbidden error for online status
