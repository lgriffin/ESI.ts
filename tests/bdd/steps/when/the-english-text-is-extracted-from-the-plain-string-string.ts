import { When } from '../../support/steps';
import { extractLocale } from '../../../../src/sde/ingestion/transforms';

When(
  'the English text is extracted from the plain string {string}',
  function (text: string) {
    this.result = extractLocale(text);
  },
);
