import { When } from '../../support/steps';
import { extractLocale } from '../../../../src/sde/ingestion/transforms';

When(
  'the English text is extracted from an empty field with fallback {string}',
  function (fallback: string) {
    this.result = extractLocale(undefined, 'en', fallback);
  },
);
