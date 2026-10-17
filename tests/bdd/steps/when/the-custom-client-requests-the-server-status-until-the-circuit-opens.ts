import { isCircuitOpen } from '../../../../src/core/util/error';
import { customClientOf } from '../../support/custom-client';
import { When } from '../../support/steps';

When(
  'the custom client requests the server status until the circuit opens',
  async function () {
    const status = customClientOf(this).status!;
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
