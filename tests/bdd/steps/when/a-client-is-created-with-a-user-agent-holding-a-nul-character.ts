import { createSeamClient } from '../../support/transport';
import { When } from '../../support/steps';

When(
  'a client is created with a user agent holding a NUL character',
  function () {
    try {
      createSeamClient({ userAgent: 'fleet-tool\u0000' });
    } catch (err) {
      this.error = err;
    }
  },
);
