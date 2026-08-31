Feature: SDE Version Management

  # EARS: Event-driven
  Scenario: WHEN querying SDE version, the provider shall return complete metadata
    Given an SDE provider with version metadata
    When the user queries the SDE version
    Then the provider shall return version, build date, and import date

  # EARS: Event-driven
  Scenario: WHEN an SDE provider has no custom version, it shall return defaults
    Given an SDE provider with no version configuration
    When the user queries the SDE version
    Then the provider shall return default version information
