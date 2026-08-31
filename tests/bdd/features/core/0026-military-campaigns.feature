Feature: Military Campaigns

  # EARS: Event-driven
  Scenario: WHEN listing military campaigns, the client shall return the data
    Given active and completed military campaigns exist
    When the client requests the campaigns listing
    Then the client shall return campaigns with state and progress

  # EARS: Event-driven
  Scenario: WHEN getting a specific campaign by UUID, the client shall return the data
    Given a valid campaign UUID
    When the client requests the campaign details
    Then the client shall return the full campaign information

  # EARS: Event-driven
  Scenario: WHEN getting objectives for a campaign, the client shall return the data
    Given a campaign with objectives
    When the client requests the campaign objectives
    Then the client shall return objectives with participant counts

  # EARS: Event-driven
  Scenario: WHEN getting character campaign participation, the client shall return the data
    Given an authenticated character with campaign participation
    When the client requests their campaign objectives
    Then the client shall return the character participation data

  # EARS: Unwanted
  Scenario: IF requesting a non-existent campaign, THEN the client shall return a not-found error
    Given an invalid campaign UUID
    When the client requests details for the invalid campaign
    Then the client shall return a 404 error for the campaign

  # EARS: State-driven
  Scenario: WHILE no military campaigns are active, the client shall return an empty result
    Given no military campaigns exist
    When the client requests the empty campaigns listing
    Then the client shall return an empty campaigns array
