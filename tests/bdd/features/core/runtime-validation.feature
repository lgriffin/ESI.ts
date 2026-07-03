Feature: Runtime Response Validation

  Scenario: Valid ESI response shall pass schema validation
    Given an ESI client with response validation enabled
    When I receive a valid alliance response from ESI
    Then the response shall be parsed successfully
    And the response data shall contain the expected fields

  Scenario: Invalid ESI response shall trigger validation error
    Given an ESI client with response validation enabled
    When I receive a response with an invalid field type
    Then an EsiValidationError shall be thrown
    And the error shall contain validation details

  Scenario: Extra fields from ESI shall be preserved
    Given an ESI client with response validation enabled
    When I receive a response with additional unknown fields
    Then the response shall be parsed successfully
    And the extra fields shall be present in the result

  Scenario: Validation shall be disabled when configured
    Given an ESI client with response validation disabled
    When I receive a response with an invalid field type
    Then the response shall be returned without validation error

  Scenario: Validation error shall be catchable as EsiError
    Given an ESI client with response validation enabled
    When I receive a response that fails validation
    Then the error shall be an instance of EsiError
    And the error shall be identifiable via isValidationError

  Scenario: Schema shall reject missing required fields
    Given a Zod schema for character information
    When I validate data with a missing required field
    Then schema validation shall fail
    And the error shall identify the missing field

  Scenario: Schema shall accept missing optional fields
    Given a Zod schema for character information
    When I validate data with only required fields
    Then schema validation shall succeed

  Scenario: Schema shall validate nested object structures
    Given a Zod schema for complex nested data
    When I validate data with valid nested objects
    Then schema validation shall succeed for the entire structure

  Scenario: Schema shall reject invalid enum values
    Given a Zod schema with enum constraints
    When I validate data with an invalid enum value
    Then schema validation shall fail with an enum error
