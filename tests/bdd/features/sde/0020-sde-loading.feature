Feature: Loading the Static Data Export
  CCP publishes the Static Data Export as a ZIP archive of YAML files, one
  per table, with a _sde.yaml naming the build. SdeDataProvider reads that
  archive, or a directory it was extracted to, straight into memory: the
  build becomes the version record, each file becomes a table, and every
  record is reshaped from CCP's form — localised names as maps, foreign keys
  with an ID suffix — into the form every lookup in features 0001 to 0019
  serves. Closing a provider empties it.

  The scenarios write a minimal export to a temporary directory: two types
  with localised names, their group, and the build metadata.

  # ── The version record ───────────────────────────────────────────────

  Rule: When the SDE is opened from a directory whose _sde.yaml nests the build under an sde key, the SdeDataProvider shall report that build number as its version, that release date as its build date, and the clock's instant as its import date.
    CCP's _sde.yaml nests both values under sde. The import date comes from
    the clock the caller passes, so a test can fix it and a consumer can
    tell two imports of the same build apart.

    Scenario: The build nested under sde becomes the version record
      Given an SDE directory holding the raw export files
      When I open the SDE from the directory
      And the user queries the SDE version
      Then the version shall be "2026-09-15.1" built on "2026-09-15" and imported at "2026-09-28T12:00:00.000Z"

  Rule: If the directory holds no _sde.yaml, then the SdeDataProvider shall report the version and the build date as unknown.
    A hand-assembled directory may carry no metadata file. The provider
    still opens, with placeholder values a caller can recognise, rather
    than refusing the data.

    Scenario: A directory without metadata reports unknown
      Given an SDE directory holding the raw export files without _sde.yaml
      When I open the SDE from the directory
      And the user queries the SDE version
      Then the version shall be "unknown" built on "unknown" and imported at "2026-09-28T12:00:00.000Z"

  # ── Reshaping records ────────────────────────────────────────────────

  Rule: When a record whose name is a locale map is loaded, the SdeDataProvider shall serve the record with the English text as its name.
    CCP localises names as a map from language code to text. The provider
    keeps English only, so a name is a plain string wherever a lookup
    returns it.

    Scenario: The English name of type 34 is Tritanium
      Given an SDE directory holding the raw export files
      When I open the SDE from the directory
      And the user looks up type ID 34
      Then the returned record shall be named "Tritanium"

  Rule: When a record whose field names carry CCP's ID suffix is loaded, the SdeDataProvider shall serve the record with those fields renamed to the Id suffix.
    CCP writes groupID and categoryID; the typed records read groupId and
    categoryId. The rename happens at load, so no lookup sees both forms.

    Scenario: groupID becomes groupId on type 34
      Given an SDE directory holding the raw export files
      When I open the SDE from the directory
      And the user looks up type ID 34
      Then the returned record shall carry group 18
      And the returned record shall have no field "groupID"

  Rule: When records of a loaded table are looked up by a foreign key, the SdeDataProvider shall return every record whose key equals that value, on the first lookup and on every later one.
    The provider builds the index for a foreign key the first time that key
    is asked for, so the first answer and the later ones must agree.

    Scenario: The types of group 18 are the same on the first and second lookup
      Given an SDE directory holding the raw export files
      When I open the SDE from the directory
      And I look up types in group 18
      Then the result should contain exactly 2 records
      When I look up types in group 18
      Then the result should contain exactly 2 records

  # ── Opening an archive ───────────────────────────────────────────────

  Rule: When the SDE is opened from a ZIP archive, the SdeDataProvider shall serve the records and the version record that opening the directory the archive was made from serves.
    The archive is what CCP publishes and the directory is what a consumer
    extracts; both routes go through the same reshaping and metadata parse.

    Scenario: The archive gives the same version and records as the directory
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory
      When I open the SDE from the ZIP archive
      And the user queries the SDE version
      Then the version shall be "2026-09-15.1" built on "2026-09-15" and imported at "2026-09-28T12:00:00.000Z"
      When the user looks up type ID 34
      Then the returned record shall be named "Tritanium"
      And the returned record shall carry group 18

  Rule: If the directory or the archive path does not exist, then the SdeDataProvider shall throw an SdeError naming the path.
    A wrong path is the commonest set-up mistake and the error says which
    path was tried, so it can be corrected without a debugger.

    Scenario: A missing directory is refused
      Given a path where no SDE directory or archive exists
      When I open the SDE from the directory
      Then the call shall fail with an SDE error naming "SDE directory not found"

    Scenario: A missing archive is refused
      Given a path where no SDE directory or archive exists
      When I open the SDE from the ZIP archive
      Then the call shall fail with an SDE error naming "SDE ZIP file not found"

  # ── Closing ──────────────────────────────────────────────────────────

  Rule: When a provider is closed, the SDE provider shall answer every later lookup with null or an empty list.
    Closing releases the loaded tables. A lookup after close is a
    programming error the provider answers as an empty data set rather
    than by throwing, for both providers.

    Scenario: A closed in-memory provider answers null and empty
      Given a static data provider with the reference data set
      When I close the provider
      And the user looks up type ID 34
      Then the provider shall return null
      When I look up every faction
      Then the provider shall return an empty list

    Scenario: A closed file-backed provider answers null
      Given an SDE directory holding the raw export files
      When I open the SDE from the directory
      And I close the provider
      And the user looks up type ID 34
      Then the provider shall return null
