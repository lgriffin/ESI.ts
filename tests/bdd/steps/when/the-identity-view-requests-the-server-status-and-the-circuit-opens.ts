import { isCircuitOpen } from '../../../../src/core/util/error';
import { viewOf } from '../../support/identity-views';
import { When } from '../../support/steps';

When(
  'the identity view requests the server status and the circuit opens',
  async function () {
    const status = viewOf(this).status;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await expect(status.getStatus()).rejects.toMatchObject({
        statusCode: 500,
      });
    }
    let opened: unknown;
    await status.getStatus().catch((err: unknown) => {
      opened = err;
    });
    expect(isCircuitOpen(opened)).toBe(true);
  },
);
