Feature: Paragon Hub SKINR Marketplace

  # EARS: Event-driven
  Scenario: WHEN browsing public SKINR listings, the client shall return paginated results
    Given public SKINR listings exist
    When the client requests public listings
    Then the client shall return listings with cursor data

  # EARS: Event-driven
  Scenario: WHEN getting a character's own Paragon Hub listings, the client shall return seller data
    Given the character has listed SKINR designs
    When the client requests character listings
    Then the client shall return listings with target visibility

  # EARS: Event-driven
  Scenario: WHEN browsing alliance-targeted listings, the client shall return filtered results
    Given alliance-targeted SKINR listings exist
    When the client requests alliance listings
    Then the client shall return listings targeted at the alliance

  # EARS: Event-driven
  Scenario: WHEN paginating through listings with cursor, the client shall support forward pagination
    Given multiple pages of listings exist
    When the client requests the next page using a cursor
    Then the client shall return the next page of results

  # EARS: Unwanted
  Scenario: IF service unavailable error, THEN the client shall handle the service outage
    Given the ESI service is down
    When the client requests Paragon Hub data
    Then the client shall return a 503 error
