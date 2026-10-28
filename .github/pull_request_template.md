## What and why

<!-- One logical change. Link the issue it closes (Closes #123). -->

## How it is proven

<!-- The EARS Rule and scenario, or the test, that failed before this change and passes after it. -->

## Checklist

- [ ] The title is a conventional commit classified by guides/SEMVER.md (`!` and a `BREAKING CHANGE:` footer only with the maintainer's agreement)
- [ ] `npm run check:local -- --fast` passes (a tier shown as `n/a` is fine)
- [ ] `npm run docs:metrics` run if Rules, scenarios, feature files or examples changed
- [ ] `npm run api-report` run if anything exported changed
- [ ] No baseline or threshold lowered, and no custom client deprecated
