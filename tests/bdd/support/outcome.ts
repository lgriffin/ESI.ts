/**
 * Runs a scenario's action and records what it returned or threw on the
 * World, so a Then step can assert on either without the When step deciding
 * which the scenario expects.
 */
import type { World } from './world';

export async function captureOutcome<T>(
  world: World,
  action: () => Promise<T>,
): Promise<void> {
  try {
    world.result = await action();
  } catch (err) {
    world.error = err;
  }
}
