import { runtimeOf } from '../../support/shared-runtime';
import { When } from '../../support/steps';

When(
  'the public view requests the server status twice in turn',
  async function () {
    const errors: unknown[] = [];
    for (let i = 0; i < 2; i++) {
      try {
        await runtimeOf(this).public.status.get();
      } catch (err: unknown) {
        errors.push(err);
      }
    }
    this.values.errors = errors;
  },
);
