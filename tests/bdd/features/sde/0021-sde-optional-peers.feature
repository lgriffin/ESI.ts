Feature: Optional Peer Dependencies
  Reading CCP's export needs js-yaml for the YAML files and adm-zip for the
  archive. Both are optional peer dependencies of the package: an install
  that only ever uses MemorySdeProvider need not carry them, so the ./sde
  entry point loads them on first use, not at import time. When one is
  missing, the failure must say which package and how to install it.

  The scenarios make a peer unresolvable the way an install without it
  behaves and open the export anyway.

  # ── A missing peer ───────────────────────────────────────────────────

  Rule: If js-yaml is not installed when the SDE is opened from a directory, then the SdeDataProvider shall throw an SdeError naming the package, what it is needed for, and the command that installs it.
    The directory route parses YAML before it touches an archive, so
    js-yaml is the peer it fails on. The message carries the install
    command so the fix is one paste away.

    Scenario: Opening a directory without js-yaml names the install command
      Given an SDE directory holding the raw export files
      And the js-yaml package is not installed
      When I open the SDE from the directory
      Then the call shall fail with an SDE error naming "js-yaml is required to parse SDE YAML files"
      And the call shall fail with an SDE error naming "npm install js-yaml"

  Rule: If adm-zip is not installed when the SDE is opened from a ZIP archive, then the SdeDataProvider shall throw an SdeError naming the package, what it is needed for, and the command that installs it.
    The archive route opens the ZIP before it parses anything, so adm-zip is
    the peer it fails on.

    Scenario: Opening an archive without adm-zip names the install command
      Given an SDE directory holding the raw export files
      And a ZIP archive of that SDE directory
      And the adm-zip package is not installed
      When I open the SDE from the ZIP archive
      Then the call shall fail with an SDE error naming "adm-zip is required to read SDE ZIP archives"
      And the call shall fail with an SDE error naming "npm install adm-zip"
