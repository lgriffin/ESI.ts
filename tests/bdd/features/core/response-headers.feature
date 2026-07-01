Feature: ESI Response Header Best Practices

  # EARS: Event-driven
  Scenario: WHEN a deprecated endpoint returns a 299 warning, the client shall expose the warning
    Given a deprecated endpoint that returns a 299 warning header
    When the client calls it with metadata
    Then the meta shall contain the deprecation warning with code 299

  # EARS: Event-driven
  Scenario: WHEN an endpoint returns a 199 upgrade notice, the client shall expose the notice
    Given an endpoint that returns a 199 upgrade warning header
    When the client calls it with metadata
    Then the meta shall contain the upgrade warning with code 199

  # EARS: State-driven
  Scenario: WHILE endpoint returns no warning, the client shall return an empty result
    Given a normal endpoint with no warning header
    When the client calls it with metadata
    Then the meta shall not contain a warning

  # EARS: Event-driven
  Scenario: WHEN a response includes a request ID, the client shall expose it in metadata
    Given an API response with x-esi-request-id header
    When the client calls it with metadata
    Then the meta shall contain the request ID

  # EARS: Unwanted
  Scenario: IF requesting ID included in EsiError on failure, THEN the client shall handle it gracefully
    Given an EsiError created with a request ID
    Then the EsiError shall contain the request ID and status code and url

  # EARS: Event-driven
  Scenario: WHEN a response includes a date header, the client shall expose it in metadata
    Given an API response with a Date header
    When the client calls it with metadata
    Then the meta shall contain the date

  # EARS: Event-driven
  Scenario: WHEN a response includes a content-language header, the client shall expose it in metadata
    Given an API response with a Content-Language header
    When the client calls it with metadata
    Then the meta shall contain the language
