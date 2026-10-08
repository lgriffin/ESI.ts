import { Given } from '../../support/steps';
import { typesWithLateField, writeSdeDirectory } from '../../support/sdeFiles';

Given(
  /^an SDE directory whose types file holds (\d+) types, only the last with a basePrice of (\d+)$/,
  function (count: string, basePrice: string) {
    writeSdeDirectory(
      this,
      typesWithLateField(Number(count), Number(basePrice)),
    );
  },
);
