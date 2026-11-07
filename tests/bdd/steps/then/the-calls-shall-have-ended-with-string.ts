import { Then } from '../../support/steps';

type Outcome = { ok: true } | { ok: false; error: unknown };

Then('the calls shall have ended with {string}', function (expected: string) {
  // Each call reads as "ok" when it resolved, or as the status it was rejected with.
  const outcomes = this.values.outcomes as Outcome[];
  const seen = outcomes.map((outcome) =>
    outcome.ok
      ? 'ok'
      : String((outcome.error as { statusCode?: unknown }).statusCode),
  );
  expect(seen.join(', ')).toBe(expected);
});
