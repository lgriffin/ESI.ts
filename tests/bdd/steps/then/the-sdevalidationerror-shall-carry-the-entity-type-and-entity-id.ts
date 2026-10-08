import { type SdeValidationError } from '../../../../src/sde/errors';
import { TRITANIUM } from '../../support/sde';
import { Then } from '../../support/steps';

Then(
  'the SdeValidationError shall carry the entity type and entity ID',
  function () {
    const error = this.error as SdeValidationError | null;
    expect(error).not.toBeNull();
    expect(error!.entityType).toBe('EveType');
    expect(error!.entityId).toBe(TRITANIUM.typeId);
    expect(error!.message).toContain('EveType');
    expect(error!.message).toContain(`(id: ${TRITANIUM.typeId})`);
  },
);
