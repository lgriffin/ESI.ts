import { When } from '../../support/steps';
import { normalizeSdeFieldName } from '../../../../src/sde/ingestion/transforms';

When('the field name {string} is normalised', function (name: string) {
  this.result = normalizeSdeFieldName(name);
});
