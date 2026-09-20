Feature: Feature stating no requirement at all
  Before the Phase 0 fix a file like this passed the audit silently, because
  every check hung off a Rule block that was never there.
