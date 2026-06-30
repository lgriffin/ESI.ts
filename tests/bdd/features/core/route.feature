Feature: Route Navigation Management

  Scenario: Calculate shortest route between two systems
    Given two solar system IDs
    When I request the shortest route
    Then I should receive an ordered list of system IDs

  Scenario: Calculate secure route
    Given two systems for secure routing
    When I request a secure route
    Then I should receive a route through high-sec space

  Scenario: Calculate insecure route
    Given two systems for insecure routing
    When I request an insecure route
    Then I should receive a shorter route through low/null-sec

  Scenario: Route from a system to itself
    Given the same origin and destination
    When I request a route to itself
    Then I should receive an array containing only the origin

  Scenario: Route through multiple systems
    Given distant systems
    When I request a route between distant systems
    Then I should receive a multi-hop path

  Scenario: Unreachable destination
    Given an unreachable destination
    When I request a route to unreachable destination
    Then I should receive a 404 error

  Scenario: Route with avoided systems
    Given systems to avoid
    When I request a route avoiding systems
    Then I should receive a route that does not include avoided systems
