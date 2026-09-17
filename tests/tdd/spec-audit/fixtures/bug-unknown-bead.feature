Feature: Bug linked to a bead that does not exist
  A tracker tag naming a bead the beads export does not contain is a dead
  link: it reads as tracked while pointing nowhere.

  @bug @esi-zzzz.999
  Rule: When a response carries an ETag header, the ETag cache shall store the response body against that ETag.
    Rationale prose.

    Scenario: A known defect linked to a bead nobody filed
      Given a response with an ETag header
      When the client issues the request
      Then the ETag cache holds an entry for that request
