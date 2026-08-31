import { defineFeature, loadFeature } from 'jest-cucumber';
import {
  SdeError,
  SdeDatabaseError,
  SdeValidationError,
  SdeVersionMismatchError,
  isSdeError,
  isSdeDatabaseError,
  isSdeValidationError,
  isSdeVersionMismatch,
} from '../../../../src/sde/errors';
import { EveTypeSchema } from '../../../../src/sde/schemas';

const feature = loadFeature(
  'tests/bdd/features/sde/0007-sde-error-handling.feature',
);

defineFeature(feature, (test) => {
  test('IF data fails schema validation, THEN the error shall include entity details', ({
    given,
    when,
    then,
  }) => {
    let invalidData: Record<string, unknown>;
    let caughtError: SdeValidationError | null = null;

    given('invalid SDE data for an EveType', () => {
      invalidData = { typeId: 'not-a-number', name: 123 };
    });

    when('the data is validated against the EveType schema', () => {
      try {
        EveTypeSchema.parse(invalidData);
      } catch (err) {
        caughtError = new SdeValidationError('EveType', err, 34);
      }
    });

    then('an SdeValidationError shall be thrown with the entity type', () => {
      expect(caughtError).not.toBeNull();
      expect(caughtError!.entityType).toBe('EveType');
      expect(caughtError!.entityId).toBe(34);
      expect(caughtError!.message).toContain('EveType');
    });
  });

  test('IF an SDE version mismatch occurs, THEN the error shall report both versions', ({
    given,
    when,
    then,
  }) => {
    let error: SdeVersionMismatchError;

    given(
      'an expected SDE version of "2.0" and an actual version of "1.0"',
      () => {
        // setup in when
      },
    );

    when('an SDE version mismatch error is created', () => {
      error = new SdeVersionMismatchError('2.0', '1.0');
    });

    then(
      'the error shall contain both the expected and actual versions',
      () => {
        expect(error.expected).toBe('2.0');
        expect(error.actual).toBe('1.0');
        expect(error.message).toContain('2.0');
        expect(error.message).toContain('1.0');
      },
    );
  });

  test('WHEN an SDE error occurs, type guards shall correctly identify the error type', ({
    given,
    when,
    then,
  }) => {
    let sdeError: SdeError;
    let dbError: SdeDatabaseError;
    let valError: SdeValidationError;
    let verError: SdeVersionMismatchError;
    let plainError: Error;

    given('various SDE error instances', () => {
      sdeError = new SdeError('base');
      dbError = new SdeDatabaseError('db fail');
      valError = new SdeValidationError('Type', 'bad');
      verError = new SdeVersionMismatchError('2', '1');
      plainError = new Error('plain');
    });

    when('the type guards are applied', () => {
      // guards are applied in the then step
    });

    then('each guard shall correctly identify its matching error type', () => {
      expect(isSdeError(sdeError)).toBe(true);
      expect(isSdeError(dbError)).toBe(true);
      expect(isSdeError(plainError)).toBe(false);

      expect(isSdeDatabaseError(dbError)).toBe(true);
      expect(isSdeDatabaseError(sdeError)).toBe(false);

      expect(isSdeValidationError(valError)).toBe(true);
      expect(isSdeValidationError(dbError)).toBe(false);

      expect(isSdeVersionMismatch(verError)).toBe(true);
      expect(isSdeVersionMismatch(sdeError)).toBe(false);
    });
  });
});
