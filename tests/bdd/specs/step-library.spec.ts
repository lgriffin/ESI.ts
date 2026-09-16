/**
 * The step library's dry run: every bound feature resolved against every step
 * definition, with nothing executed. `npm run bdd:steps`.
 *
 * Binding a feature already refuses a step that matches no definition or more
 * than one. What only a whole-library pass can see is the reverse: a
 * definition no feature uses, which is dead code that still looks like
 * specified behaviour.
 */
import {
  formatDefinition,
  loadStepLibrary,
  planSpec,
  specFiles,
  unusedSteps,
} from '../support/binder';

const library = loadStepLibrary();
const plans = specFiles().map((spec) => planSpec(spec, library));

describe('Step library', () => {
  test('binds at least one feature', () => {
    expect(plans.length).toBeGreaterThan(0);
  });

  test('every step in a bound feature matches exactly one definition', () => {
    expect(plans.flatMap((plan) => plan.problems)).toEqual([]);
  });

  test('every step definition is used by a bound feature', () => {
    expect(unusedSteps(plans, library).map(formatDefinition)).toEqual([]);
  });
});
