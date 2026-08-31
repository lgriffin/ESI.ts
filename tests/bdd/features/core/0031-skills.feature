Feature: Character Skills Management

  # EARS: Event-driven
  Scenario: WHEN getting trained skills for a character, the client shall return the data
    Given a valid character ID for skills
    When the client requests character skills
    Then the client shall return the skills list with total SP

  # EARS: Event-driven
  Scenario: WHEN a high-SP character has many skills, the client shall return all skill data
    Given a veteran character
    When the client requests their skills
    Then the client shall return a large skill set with high total SP

  # EARS: Event-driven
  Scenario: WHEN getting the skill training queue, the client shall return the data
    Given a character with skills in training
    When the client requests the skill queue
    Then the client shall return an ordered queue

  # EARS: State-driven
  Scenario: WHILE empty skill queue, the client shall return an empty result
    Given a character with no skills in training
    When the client requests the skill queue for idle character
    Then the client shall return an empty queue array

  # EARS: Event-driven
  Scenario: WHEN getting character neural remap attributes, the client shall return the data
    Given a valid character ID for attributes
    When the client requests attributes
    Then the client shall return all five attributes and remap info

  # EARS: Event-driven
  Scenario: WHEN attributes include a custom remap, the client shall return remap details
    Given a character with a perception-focused remap
    When the client requests remapped attributes
    Then the client shall report elevated perception

  # EARS: Unwanted
  Scenario: IF unauthorized access to skills, THEN the client shall return a forbidden error
    Given an invalid or expired token
    When the client requests skills without authorization
    Then the client shall return a 403 skills error

  # EARS: Ubiquitous
  Scenario: The client shall handle concurrent fetch of skills, queue, and attributes
    Given a valid character for concurrent fetch
    When the client fetches skills, queue, and attributes concurrently
    Then all three shall return valid data
