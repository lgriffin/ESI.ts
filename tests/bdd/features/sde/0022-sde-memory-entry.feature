Feature: The Memory Entry Point
  The package exposes the SDE twice: ./sde carries everything, including the
  file-backed SdeDataProvider and, through it, the optional peers; ./sde/memory
  carries the in-memory provider and the same types, errors and test factory
  without reaching any file, YAML, ZIP or SQLite code, for consumers who bring
  their own data. The two must stay in step: everything ./sde exports at run
  time is available from ./sde/memory, except the file-backed provider.

  The scenarios compare the two modules' runtime exports.

  # ── Parity ───────────────────────────────────────────────────────────

  Rule: The ./sde/memory entry point shall export every runtime export of ./sde except SdeDataProvider.
    A consumer switching from ./sde to ./sde/memory should change one
    import path and nothing else: the errors, guards, in-memory provider
    and test factory are all there.

    Scenario: No export of ./sde other than SdeDataProvider is missing
      When the runtime exports of the two SDE entry points are compared
      Then no export of the full SDE entry point other than SdeDataProvider shall be missing from the memory entry point

  Rule: The ./sde/memory entry point shall not export SdeDataProvider.
    The file-backed provider is what pulls the peers in; exporting it from
    the memory entry point would defeat the split.

    Scenario: SdeDataProvider is absent from the memory entry point
      When the runtime exports of the two SDE entry points are compared
      Then the memory entry point shall not export SdeDataProvider
