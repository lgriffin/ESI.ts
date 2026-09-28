import { When } from '../../support/steps';
import { extractLocale } from '../../../../src/sde/ingestion/transforms';

When(
  'the English text is extracted from a field localised as en {string} and de {string}',
  function (en: string, de: string) {
    this.result = extractLocale({ en, de });
  },
);
