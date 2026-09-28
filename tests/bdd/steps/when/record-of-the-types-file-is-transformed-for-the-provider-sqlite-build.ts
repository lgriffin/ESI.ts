import { When } from '../../support/steps';
import { transformRawType } from '../../support/sdeFiles';

// The two record transforms: the provider keeps native values, the SQLite
// build flattens them.
When(
  /^record (\d+) of the types file is transformed for the (provider|SQLite build)$/,
  function (id: string, target: string) {
    this.result = transformRawType(
      Number(id),
      target === 'provider' ? 'provider' : 'sqlite',
    );
  },
);
