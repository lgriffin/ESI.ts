Feature: Route Navigation Management

  # EARS: Event-driven
  Scenario: WHEN calculating shortest route between two systems, the client shall return the result
    Given two solar system IDs
    When the client requests the shortest route
    Then the client shall return an ordered list of system IDs

  # EARS: Event-driven
  Scenario: WHEN calculating secure route, the client shall return the result
    Given two systems for secure routing
    When the client requests a secure route
    Then the client shall return a route through high-sec space

  # EARS: Event-driven
  Scenario: WHEN calculating insecure route, the client shall return the result
    Given two systems for insecure routing
    When the client requests an insecure route
    Then the client shall return a shorter route through low/null-sec

  # EARS: Event-driven
  Scenario: WHEN routing from a system to itself, the client shall return a single-system route
    Given the same origin and destination
    When the client requests a route to itself
    Then the client shall return an array containing only the origin

  # EARS: Event-driven
  Scenario: WHEN routing through multiple systems, the client shall return multi-hop waypoints
    Given distant systems
    When the client requests a route between distant systems
    Then the client shall return a multi-hop path

  # EARS: Unwanted
  Scenario: IF the destination is unreachable, THEN the client shall return an error
    Given an unreachable destination
    When the client requests a route to unreachable destination
    Then the client shall return a 404 error

  # EARS: Event-driven
  Scenario: WHEN routing with avoided systems, the client shall exclude them from the path
    Given systems to avoid
    When the client requests a route avoiding systems
    Then the client shall return a route that does not include avoided systems
