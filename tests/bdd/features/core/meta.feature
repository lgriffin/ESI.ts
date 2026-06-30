Feature: Meta API Management

  Scenario: Get OpenAPI JSON specification
    Given the ESI API is available
    When I request the OpenAPI JSON specification
    Then I should receive a valid OpenAPI JSON document

  Scenario: Get OpenAPI YAML specification
    Given the ESI API is available for YAML
    When I request the OpenAPI YAML specification
    Then I should receive a valid OpenAPI YAML document

  Scenario: Handle API service unavailability
    Given the ESI API is unavailable
    When I request the OpenAPI specification
    Then I should receive a service unavailable error

  Scenario: Compare JSON and YAML specifications
    Given both JSON and YAML specifications are available
    When I retrieve both formats
    Then they should contain equivalent information
