import { When } from '../../support/steps';

function expectLater(fn: () => unknown): unknown {
  return fn;
}

When('the delta client is exercised as {string}', function (noun: string) {
  const d = this.delta;

  // Never run: a nested callback nobody invokes or passes.
  const unused = () => d.getUnusedArrow();
  void unused;
  // Never run: declared, not called.
  function declaredOnly(): number {
    return d.getDeclaredOnly();
  }
  void declaredOnly;
  // Never run: held in a variable nobody calls or passes.
  const holder = () => d.getHeldOnly();
  void holder;

  // Run: passed to a call, passed by name, a dispatch table, stored for a
  // later step.
  this.result = expectLater(() => d.getInArgument());
  const byName = (): number => d.getPassedByName();
  this.result = [1].map(byName);
  const table: Record<string, () => number> = {
    table: () => d.getInTable(),
  };
  this.result = table[noun]?.();
  this.action = () => d.getAssigned();
});
