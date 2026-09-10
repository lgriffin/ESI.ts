Feature: SDE Error Handling
  The SDE layer raises a small family of errors that all descend from
  SdeError: SdeDatabaseError for storage faults, SdeValidationError for
  records that fail their Zod schema, and SdeVersionMismatchError for a data
  set that does not match the version a caller expected.

  Each class carries the context of the failure as structured fields as well
  as in its message, and each has a type guard so a caller can branch on the
  failure without reaching for instanceof against an imported class.

  # ── Error context ────────────────────────────────────────────────────

  Rule: When an SdeValidationError is constructed for an entity type and an entity ID, the SdeValidationError shall expose both values as fields and name the entity type in its message.
    A schema failure on a single record must say which record: the entity
    type alone narrows it to a table, and the entity ID pinpoints the row.
    The message repeats them so an unhandled error is still diagnosable from
    a log line.

    Scenario: Validation failure on an EveType records the type name and ID 34
      Given invalid SDE data for an EveType
      When the data is validated against the EveType schema
      Then the SdeValidationError shall carry the entity type and entity ID

  Rule: When an SdeVersionMismatchError is constructed from an expected version and an actual version, the SdeVersionMismatchError shall expose both versions as fields and include both in its message.
    A version mismatch is only actionable when the caller can see the gap it
    has to close, so reporting one side without the other is not enough.

    Scenario: Mismatch between expected 2.0 and actual 1.0 reports both versions
      Given an expected SDE version of "2.0" and an actual version of "1.0"
      When an SDE version mismatch error is created
      Then the error shall contain both the expected and actual versions

  # ── Type guards ──────────────────────────────────────────────────────

  Rule: The SDE error type guards shall return true for an error of their own class or of a subclass of it, and false for an error of any other class.
    The guards exist so consuming code can narrow an unknown caught value
    without importing the classes. Because the classes form an inheritance
    chain, isSdeError accepts every SDE error while the narrower guards
    accept only their own branch, and a plain Error is rejected by all of
    them.

    Scenario: Guards separate base, database, validation, and mismatch errors
      Given various SDE error instances
      When the type guards are applied
      Then each guard shall correctly identify its matching error type
