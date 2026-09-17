/**
 * Assertion helpers for the tiers that check many things at once.
 *
 * A tier like the recorded-payload replay or the fault catalogue collects
 * every problem it finds and reports them together, because one run covers
 * dozens of endpoints and a reader needs the whole list, the fixture that
 * carries it and the command that reproduces it. `expect` states one
 * comparison and prints a diff, which is the wrong shape for that.
 *
 * These helpers are the assertion in those tests. `jest/expect-expect` knows
 * their names (ASSERT_FUNCTION_NAMES in eslint.suite-health.rules.cjs), so a
 * test that calls one is not assertion-free; a test that calls neither, and
 * no `expect`, still fails the suite-health lint.
 */

/**
 * Fail with every problem found, one per line, or return when there are none.
 *
 * @param problems - what went wrong; empty means the check passed
 * @param heading - a line printed above the list, e.g. what was being checked
 */
export function assertNoProblems(problems: string[], heading?: string): void {
  if (problems.length === 0) return;
  const lines = heading
    ? [heading, ...problems.map((p) => `  ${p}`)]
    : problems;
  throw new Error(lines.join('\n'));
}

/**
 * Fail with `message` unless `condition` holds.
 *
 * Narrows like Node's `assert`, so the caller can keep using a value it has
 * just proved is present.
 */
export function assertThat(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}
