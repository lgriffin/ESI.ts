Feature: Runtime Response Validation
  TypeScript types vanish at runtime, so a response that does not match the ESI
  spec would otherwise reach application code as a silently wrong object. Each
  endpoint definition carries a Zod schema that parses the body before it is
  returned, turning a shape mismatch into a typed EsiValidationError at the
  point of the call.

  The schemas are deliberately permissive in one direction: they are built with
  z.looseObject so fields CCP adds after this library was published survive
  parsing, and enum-typed fields accept values outside the known set. Callers
  that would rather trust ESI can switch parsing off with validateResponse.

  # ── Parsing successful responses ────────────────────────────────────

  Rule: When a response satisfies the endpoint schema, the EsiClient shall return the parsed object with every field the schema declares.
    The parsed value, not the raw body, is what reaches the caller, so the
    declared fields are guaranteed to be present and of the declared type by
    the time application code touches them.

    Scenario: Valid alliance response returns the declared fields
      Given an ESI client with response validation enabled
      When I receive a valid alliance response from ESI
      Then the response shall be parsed successfully
      And the response data shall contain the expected fields

  Rule: When a response carries fields the endpoint schema does not declare, the EsiClient shall include those fields in the returned object.
    CCP adds fields to live routes without a version bump. Stripping unknown
    keys would make this library lose data a caller already depends on,
    and would force a release of ESI.ts before anyone could read that field.
    This is why every schema uses z.looseObject rather than z.object.

    Scenario: Unknown fields added by ESI survive parsing
      Given an ESI client with response validation enabled
      When I receive a response with additional unknown fields
      Then the response shall be parsed successfully
      And the extra fields shall be present in the result

  # ── Reporting validation failures ───────────────────────────────────

  Rule: If a response fails schema validation, then the EsiClient shall reject the call with an EsiValidationError carrying the underlying Zod issues.
    A mismatch between the spec and the live API is a fault the caller has to
    be able to diagnose, which takes more than a message: the issue list names
    the field and the expectation that was violated.

    Scenario: Response with a mistyped field rejects with the Zod issue list
      Given an ESI client with response validation enabled
      When I receive a response with an invalid field type
      Then an EsiValidationError shall be thrown
      And the error shall contain validation details

  Rule: The EsiValidationError shall be an instance of EsiError that satisfies the isValidationError type guard.
    Callers already wrap ESI calls in a catch for EsiError; a validation
    failure that sat outside that hierarchy would escape those handlers. The
    type guard is what lets a caller narrow to the validation case when it
    wants to treat a spec drift differently from a transport failure.

    Scenario: Validation error is catchable as EsiError and narrowed by the guard
      Given an ESI client with response validation enabled
      When I receive a response that fails validation
      Then the error shall be an instance of EsiError
      And the error shall be identifiable via isValidationError

  Rule: Where the validateResponse option is set to false, the EsiClient shall return the response body without schema parsing.
    Parsing costs time on large payloads, and an application already
    validating downstream has no use for it. With the option off a body that
    contradicts the schema is handed back untouched rather than rejected.

    Scenario: Client with validateResponse disabled returns a mistyped field untouched
      Given an ESI client with response validation disabled
      When I receive a response with an invalid field type
      Then the response shall be returned without validation error

  # ── Schema semantics ────────────────────────────────────────────────

  Rule: If a field the schema marks as required is absent, then the schema shall report an issue whose path names that field.
    Naming the field is the whole value of the failure. The scenario below
    removes corporation_id from an otherwise valid character record and
    expects that key in the issue path, not a generic parse failure.

    Scenario: Character info missing corporation_id names that field in the issue path
      Given a Zod schema for character information
      When I validate data with a missing required field
      Then schema validation shall fail
      And the error shall identify the missing field

  Rule: When only the fields the schema marks as required are present, the schema shall parse the object successfully.
    Optional fields on ESI routes are genuinely optional — alliance_id is
    absent for a character in an unaffiliated corporation, for instance — so a
    minimal record is a valid record and cannot be treated as a failure.

    Scenario: Character info with only the required fields parses
      Given a Zod schema for character information
      When I validate data with only required fields
      Then schema validation shall succeed

  Rule: When a field holds an array of nested objects, the schema shall parse each element into the returned structure.
    Fleet, market and industry payloads nest one or two levels deep. Validating
    only the outer object would leave the nested elements unchecked and
    untyped, which is where a spec drift is hardest to spot.

    Scenario: Fleet wing with two nested squads parses both squads
      Given a Zod schema for complex nested data
      When I validate data with valid nested objects
      Then schema validation shall succeed for the entire structure

  Rule: When an enum-typed field holds a value outside the declared set, the schema shall parse the object successfully and preserve the received value.
    CCP introduces new contact types, order states and job statuses without
    warning. Rejecting an unrecognised value would break every caller on the
    day of the change, so esiEnum widens to the raw string and passes it
    through for the caller to handle.

    Scenario: Alliance contact with an unrecognised contact_type keeps the raw value
      Given a Zod schema with enum constraints
      When I validate data with an unknown enum value
      Then schema validation shall succeed with the unknown value preserved
