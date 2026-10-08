import { When } from '../../support/steps';
import { SCHEMA_SDE_FILES, transformRawRecord } from '../../support/sdeFiles';

// A record of SCHEMA_SDE_FILES, by its key in the named file, through either
// record transform.
When(
  /^record (\w+) of the schema export's (\w+)\.yaml file is transformed for the (provider|SQLite build)$/,
  function (key: string, file: string, target: string) {
    this.result = transformRawRecord(
      SCHEMA_SDE_FILES,
      `${file}.yaml`,
      /^\d+$/.test(key) ? Number(key) : key,
      target === 'provider' ? 'provider' : 'sqlite',
    );
  },
);
