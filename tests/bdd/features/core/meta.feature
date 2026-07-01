Feature: Meta API Management

  # EARS: Event-driven
  Scenario: WHEN getting OpenAPI JSON specification, the client shall return the data
    Given the ESI API is available
    When the client requests the OpenAPI JSON specification
    Then the client shall return a valid OpenAPI JSON document

  # EARS: Event-driven
  Scenario: WHEN getting OpenAPI YAML specification, the client shall return the data
    Given the ESI API is available for YAML
    When the client requests the OpenAPI YAML specification
    Then the client shall return a valid OpenAPI YAML document

  # EARS: Unwanted
  Scenario: IF the API service is unavailable, THEN the client shall handle the outage
    Given the ESI API is unavailable
    When the client requests the OpenAPI specification
    Then the client shall return a service unavailable error

  # EARS: Event-driven
  Scenario: WHEN comparing JSON and YAML specifications, the client shall return the analysis
    Given both JSON and YAML specifications are available
    When the client retrieves both formats
    Then they shall contain equivalent information
