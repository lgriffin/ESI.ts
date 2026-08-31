Feature: SDE Error Handling

  # EARS: Unwanted
  Scenario: IF data fails schema validation, THEN the error shall include entity details
    Given invalid SDE data for an EveType
    When the data is validated against the EveType schema
    Then an SdeValidationError shall be thrown with the entity type

  # EARS: Unwanted
  Scenario: IF an SDE version mismatch occurs, THEN the error shall report both versions
    Given an expected SDE version of "2.0" and an actual version of "1.0"
    When an SDE version mismatch error is created
    Then the error shall contain both the expected and actual versions

  # EARS: Event-driven
  Scenario: WHEN an SDE error occurs, type guards shall correctly identify the error type
    Given various SDE error instances
    When the type guards are applied
    Then each guard shall correctly identify its matching error type
