import { isCircuitOpen } from '../../../../src/core/util/error';
import { When } from '../../support/steps';

When(
  "the character's view requests the server status and the circuit opens",
  async function () {
    const status = this.views.character!.status;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await expect(status.get()).rejects.toMatchObject({ statusCode: 500 });
    }
    let opened: unknown;
    await status.get().catch((err: unknown) => {
      opened = err;
    });
    expect(isCircuitOpen(opened)).toBe(true);
  },
);
