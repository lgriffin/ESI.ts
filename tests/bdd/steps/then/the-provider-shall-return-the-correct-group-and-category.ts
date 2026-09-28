import {
  MATERIAL_CATEGORY_NAME,
  MINERAL_GROUP_NAME,
  type TypeChain,
} from '../../support/sde';
import { Then } from '../../support/steps';

Then('the provider shall return the correct group and category', function () {
  const chain: TypeChain = this.result;
  expect(chain.type).not.toBeNull();
  expect(chain.group?.name).toBe(MINERAL_GROUP_NAME);
  expect(chain.category?.name).toBe(MATERIAL_CATEGORY_NAME);
});
