Feature: ESI Response Header Best Practices

  Scenario: Deprecated endpoint returns 299 warning
    Given a deprecated endpoint that returns a 299 warning header
    When I call it with metadata
    Then the meta should contain the deprecation warning with code 299

  Scenario: Endpoint returns 199 upgrade notice
    Given an endpoint that returns a 199 upgrade warning header
    When I call it with metadata
    Then the meta should contain the upgrade warning with code 199

  Scenario: Endpoint returns no warning
    Given a normal endpoint with no warning header
    When I call it with metadata
    Then the meta should not contain a warning

  Scenario: Request ID exposed in metadata
    Given an API response with x-esi-request-id header
    When I call it with metadata
    Then the meta should contain the request ID

  Scenario: Request ID included in EsiError on failure
    Given an EsiError created with a request ID
    Then the EsiError should contain the request ID and status code and url

  Scenario: Date header exposed in metadata
    Given an API response with a Date header
    When I call it with metadata
    Then the meta should contain the date

  Scenario: Content-Language exposed in metadata
    Given an API response with a Content-Language header
    When I call it with metadata
    Then the meta should contain the language
