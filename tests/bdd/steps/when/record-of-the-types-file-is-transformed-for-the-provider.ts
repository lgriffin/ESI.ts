import { When } from '../../support/steps';
import { transformRawType } from '../../support/sdeFiles';

// The provider's record transform, which keeps native values.
When(
  /^record (\d+) of the types file is transformed for the provider$/,
  function (id: string) {
    this.result = transformRawType(Number(id));
  },
);
