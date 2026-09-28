import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When(
  'I look up dogma attribute category {int}',
  function (attributeCategoryId: number) {
    this.result =
      sdeProvider(this).getDogmaAttributeCategory(attributeCategoryId);
  },
);
