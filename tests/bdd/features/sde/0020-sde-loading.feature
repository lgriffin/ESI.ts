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

  # ── What loading passes over ─────────────────────────────────────────

  Rule: If a file the registry names is absent from the directory, then the SdeDataProvider shall not refuse to open the directory.
    The registry lists every table the provider knows. A partial extract, or
    a build from before CCP added a file, loads the tables it has; a lookup
    in a missing table answers null or an empty list like any other miss.

    Scenario: A directory holding only the types file opens and serves Tritanium
      Given an SDE directory holding only the types file
      When I open the SDE from the directory
      And the user looks up type ID 34
      Then the returned record shall be named "Tritanium"

  Rule: If the directory holds a YAML file the registry does not name, then the SdeDataProvider shall not read that file.
    Loading walks the registry, not the directory, so a file CCP ships
    before the registry learns of it is passed over rather than guessed at.
    The scenario's extra file is not even valid YAML: reading it would fail
    the load.

    Scenario: An unregistered file that is not YAML leaves the load unaffected
      Given an SDE directory holding the raw export files and an unregistered file that is not valid YAML
      When I open the SDE from the directory
      And the user looks up type ID 34
      Then the returned record shall be named "Tritanium"

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

  Rule: If an entry of a loaded file is empty or is not a mapping, then the SdeDataProvider shall serve no record for that entry's ID.
    An entry with no fields, or a bare value where a record belongs, carries
    nothing a typed record could be built from. Loading passes over it and
    keeps the entries around it.

    Scenario: An empty entry and a bare number in the types file are passed over
      Given an SDE directory whose types file also holds an empty entry and a number
      When I open the SDE from the directory
      And the user looks up type ID 37
      Then the provider shall return null
      When the user looks up type ID 36
      Then the provider shall return null
      When the user looks up type ID 34
      Then the returned record shall be named "Tritanium"

  Rule: When a table whose IDs are strings is loaded, the SdeDataProvider shall key its records by the ID string and serve the whole table in ascending order of ID.
    Translation languages, character titles and military campaigns are keyed
    by codes, not numbers. The codes stay strings, and a whole-table read
    sorts them, whatever order the file listed them in.

    Scenario: Languages listed ru, fr, zh, de, en are served in code order
      Given an SDE directory holding the raw export files, market groups and translation languages
      When I open the SDE from the directory
      And I look up every entity in table "eve_translation_languages"
      Then the returned records shall have "translationLanguageId" values "de, en, fr, ru, zh" in that order

  # ── Searching and filtering ──────────────────────────────────────────

  Rule: When the user searches a loaded table by name, the SdeDataProvider shall return, in ascending order of ID and no more than the limit, the records whose English name contains the search text in any letter case.
    The search compares lower case with lower case, so a caller need not
    know how CCP capitalised a name. The default limit is 25; the provider
    stops at the limit rather than reading the rest of the table.

    Scenario: An upper-case fragment finds Tritanium only
      Given an SDE directory holding the raw export files
      When I open the SDE from the directory
      And the user searches for types matching "TRIT"
      Then the returned records shall have "name" values "Tritanium" in that order

    Scenario: A fragment both minerals share returns both under the default limit
      Given an SDE directory holding the raw export files
      When I open the SDE from the directory
      And the user searches for types matching "rI"
      Then the returned records shall have "name" values "Tritanium, Pyerite" in that order

    Scenario: A limit of one returns the first match only
      Given an SDE directory holding the raw export files
      When I open the SDE from the directory
      And the user searches for types matching "ri" with a limit of 1
      Then the returned records shall have "name" values "Tritanium" in that order

  Rule: When the user asks a loaded provider for the root market groups, the SdeDataProvider shall return the market groups that have no parent group.
    The market browser starts from the groups with no parent; a group with
    a parentGroupID sits under one of them and is not a root.

    Scenario: Groups 2 and 4 are roots and group 9 under 4 is not
      Given an SDE directory holding the raw export files, market groups and translation languages
      When I open the SDE from the directory
      And I look up root market groups
      Then the returned records shall have "marketGroupId" values "2, 4" in that order

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
      And the error shall name the attempted path

    Scenario: A missing archive is refused
      Given a path where no SDE directory or archive exists
      When I open the SDE from the ZIP archive
      Then the call shall fail with an SDE error naming "SDE ZIP file not found"
      And the error shall name the attempted path

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

    Scenario: A closed file-backed provider forgets the foreign-key lookups it answered
      Given an SDE directory holding the raw export files
      When I open the SDE from the directory
      And I look up types in group 18
      Then the result should contain exactly 2 records
      When I close the provider
      And I look up types in group 18
      Then the provider shall return an empty list
