import { When } from '../../support/steps';

When(
  "the status client's {word} view is asked for twice",
  function (view: string) {
    const status = this.client.status;
    this.values.views =
      view === 'withSafeMode'
        ? [status.withSafeMode(), status.withSafeMode()]
        : [status.withMetadata(), status.withMetadata()];
  },
);
