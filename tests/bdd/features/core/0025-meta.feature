Feature: Meta API Management
  The Meta client exposes ESI's own description of itself: the OpenAPI
  specification, served in a JSON form and a YAML form of the same document.
  Callers use it to discover endpoints, check the spec version pinned by a
  build, or drive code generation, which is how this library's own generated
  types and endpoint metadata are produced.

  The two formats are alternative encodings of one document, so the client
  parses the JSON and hands back the YAML untouched.

  # ── Specification retrieval ─────────────────────────────────────────

  Rule: When the OpenAPI specification is requested in JSON form, the Meta client shall return a parsed document carrying its openapi version, info block, paths, and components.
    JSON is the machine-readable path — a caller reads paths and components
    directly off the returned object. The openapi version and info block are
    what identify which revision of the spec is in hand.

    Scenario: JSON specification returns version 3.1.0 with paths and components
      Given the ESI API is available
      When the client requests the OpenAPI JSON specification
      Then the client shall return a valid OpenAPI JSON document

  Rule: When the OpenAPI specification is requested in YAML form, the Meta client shall return the document as an unparsed string.
    YAML is the human-readable path, usually written to a file or diffed
    against a checked-in copy. Parsing it would add a dependency and lose the
    formatting a diff depends on, so the text is handed back verbatim.

    Scenario: YAML specification returns the raw document text
      Given the ESI API is available for YAML
      When the client requests the OpenAPI YAML specification
      Then the client shall return a valid OpenAPI YAML document

  Rule: When both specification formats are fetched together, the Meta client shall report the same openapi version, title, and path entries in each format.
    The two encodings describe one document, so a caller can pick either
    without changing what they learn. This scenario pins that equivalence at
    the three points a consumer keys off: version, title, and the path set.

    Scenario: JSON and YAML fetched in parallel describe the same alliances path
      Given both JSON and YAML specifications are available
      When the client retrieves both formats
      Then they shall contain equivalent information

  # ── Error propagation ───────────────────────────────────────────────

  Rule: If the ESI API responds to a specification request with an error status, then the Meta client shall raise an error whose message carries the ESI status text.
    The spec endpoint sits behind the same infrastructure as the data
    endpoints and goes down with it. Carrying the status text through the
    message is what lets a build script log why generation failed.

    Scenario: Specification request during an outage reports Service Unavailable
      Given the ESI API is unavailable
      When the client requests the OpenAPI specification
      Then the client shall return a service unavailable error
