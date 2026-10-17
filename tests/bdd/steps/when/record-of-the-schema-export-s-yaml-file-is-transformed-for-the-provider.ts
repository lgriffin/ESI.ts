import { When } from '../../support/steps';
import { SCHEMA_SDE_FILES, transformRawRecord } from '../../support/sdeFiles';

// A record of SCHEMA_SDE_FILES, by its key in the named file, through the
// provider's record transform.
When(
  /^record (\w+) of the schema export's (\w+)\.yaml file is transformed for the provider$/,
  function (key: string, file: string) {
    this.result = transformRawRecord(
      SCHEMA_SDE_FILES,
      `${file}.yaml`,
      /^\d+$/.test(key) ? Number(key) : key,
    );
  },
);
