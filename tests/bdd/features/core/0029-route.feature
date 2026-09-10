Feature: Route Navigation Management
  The Route client wraps ESI's single routing endpoint, which computes a path
  through the stargate network between two solar systems. The result is a flat
  ordered array of system IDs rather than an object graph, so the position of
  an entry is what encodes the jump order.

  Routing takes options: a security preference that trades jumps against risk,
  and a set of systems to route around. Both change the path returned for the
  same origin and destination pair.

  # ── Route calculation ───────────────────────────────────────────────

  Rule: The Route client shall return a route as an ordered array of system IDs beginning with the origin and ending with the destination.
    Every consumer of this endpoint walks the array in order to count jumps or
    set waypoints, so the ordering and the two endpoints are the whole
    contract. Nothing else in the payload identifies which end is which.

    Scenario: Five-system route between two known systems
      Given two solar system IDs
      When the client requests the shortest route
      Then the client shall return an ordered list of system IDs

    Scenario: Fifteen-hop route across the map returns numeric system IDs
      Given distant systems
      When the client requests a route between distant systems
      Then the client shall return a multi-hop path

  Rule: When a route is requested between an identical origin and destination, the Route client shall return an array containing that system alone.
    A zero-jump route is still a route. Returning the single system rather
    than an empty array keeps the "first entry is the origin, last is the
    destination" invariant true in the degenerate case.

    Scenario: Route from a system to itself contains that system alone
      Given the same origin and destination
      When the client requests a route to itself
      Then the client shall return an array containing only the origin

  # ── Routing options ─────────────────────────────────────────────────

  Rule: Where a routing preference is supplied, the Route client shall return the path ESI computes under that preference between the same origin and destination.
    The Safer preference keeps the path in high-security space at the cost of
    extra jumps; LessSecure accepts low and null security for a shorter path. The preference changes the interior of the array, never its two
    endpoints, which is what these two scenarios pin down.

    Scenario: Safer preference returns a longer high-security path
      Given two systems for secure routing
      When the client requests a secure route
      Then the client shall return a route through high-sec space

    Scenario: LessSecure preference returns a three-system path
      Given two systems for insecure routing
      When the client requests an insecure route
      Then the client shall return a shorter route through low/null-sec

  Rule: Where systems to avoid are supplied, the Route client shall return a path that contains none of those systems.
    Avoidance is how a caller routes around a known camp or a system they are
    not welcome in. An avoided system appearing anywhere in the returned array
    would defeat the option, so exclusion covers the whole path rather than
    the interior hops alone.

    Scenario: Route avoiding two systems omits both from the path
      Given systems to avoid
      When the client requests a route avoiding systems
      Then the client shall return a route that does not include avoided systems

  # ── Error propagation ───────────────────────────────────────────────

  Rule: If no path exists between the origin and the destination, then the Route client shall raise an EsiError.
    An unknown system ID or a destination cut off from the stargate network
    has no route to return. ESI answers 404 and the client raises rather than
    returning an empty array, which a caller could otherwise read as a
    zero-jump trip.

    Scenario: Unreachable destination is rejected with 404
      Given an unreachable destination
      When the client requests a route to unreachable destination
      Then the client shall return a 404 error
