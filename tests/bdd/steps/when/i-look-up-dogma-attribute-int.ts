import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up dogma attribute {int}', function (attributeId: number) {
  this.result = sdeProvider(this).getDogmaAttribute(attributeId);
});
