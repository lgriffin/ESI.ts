Feature: Character Skills Management

  Scenario: Get trained skills for a character
    Given a valid character ID for skills
    When I request character skills
    Then I should receive the skills list with total SP

  Scenario: High-SP character with many skills
    Given a veteran character
    When I request their skills
    Then I should receive a large skill set with high total SP

  Scenario: Get the skill training queue
    Given a character with skills in training
    When I request the skill queue
    Then I should receive an ordered queue

  Scenario: Empty skill queue
    Given a character with no skills in training
    When I request the skill queue for idle character
    Then I should receive an empty queue array

  Scenario: Get character neural remap attributes
    Given a valid character ID for attributes
    When I request attributes
    Then I should receive all five attributes and remap info

  Scenario: Attributes with custom remap
    Given a character with a perception-focused remap
    When I request remapped attributes
    Then I should see elevated perception

  Scenario: Unauthorized access to skills
    Given an invalid or expired token
    When I request skills without authorization
    Then I should receive a 403 skills error

  Scenario: Concurrent fetch of skills, queue, and attributes
    Given a valid character for concurrent fetch
    When I fetch skills, queue, and attributes concurrently
    Then all three should return valid data
