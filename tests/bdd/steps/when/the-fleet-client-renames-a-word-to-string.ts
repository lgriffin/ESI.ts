import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the fleet client renames a {word} to {string}',
  async function (unit: string, name: string) {
    const fleets = this.client.fleets;
    await captureOutcome(this, () =>
      unit === 'squad'
        ? fleets.renameFleetSquad(1234567890, 3000, name)
        : fleets.renameFleetWing(1234567890, 2000, name),
    );
  },
);
