/**
 * A scenario's wall-clock budget in milliseconds.
 *
 * A few Rules promise that a large response is handled within a time limit.
 * Under BDD mutation testing (config/mutation/stryker.bdd.config.mjs) every
 * line of src/ is instrumented for per-test coverage and several Stryker
 * processes share one hosted runner, so the same scenario measures the
 * instrumentation and the neighbours, not the client: on 2026-10-21 the
 * 5000-order book took 1015 ms against its 1000 ms budget and failed the sde
 * shard's initial test run (#670). That config sets BDD_TIME_BUDGET_FACTOR so
 * a budget there still catches a mutant that hangs or loops, without failing
 * the unmutated code. Everywhere else the factor is 1 and the Rule's own
 * number applies.
 */
export function timeBudgetMs(ms: number): number {
  return ms * budgetFactor();
}

function budgetFactor(): number {
  const factor = Number(process.env.BDD_TIME_BUDGET_FACTOR ?? 1);
  return Number.isFinite(factor) && factor >= 1 ? factor : 1;
}
