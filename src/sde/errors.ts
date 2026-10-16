export class SdeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SdeError';
  }
}

export class SdeValidationError extends SdeError {
  public readonly validationError: unknown;
  public readonly entityType: string;
  public readonly entityId?: number | undefined;

  constructor(entityType: string, validationError: unknown, entityId?: number) {
    const idSuffix = entityId !== undefined ? ` (id: ${entityId})` : '';
    super(`SDE validation failed for ${entityType}${idSuffix}`);
    this.name = 'SdeValidationError';
    this.validationError = validationError;
    this.entityType = entityType;
    this.entityId = entityId;
  }
}

export class SdeVersionMismatchError extends SdeError {
  public readonly expected: string;
  public readonly actual: string;

  constructor(expected: string, actual: string) {
    super(`SDE version mismatch: expected ${expected}, got ${actual}`);
    this.name = 'SdeVersionMismatchError';
    this.expected = expected;
    this.actual = actual;
  }
}

export function isSdeError(error: unknown): error is SdeError {
  return error instanceof SdeError;
}

export function isSdeValidationError(
  error: unknown,
): error is SdeValidationError {
  return error instanceof SdeValidationError;
}

export function isSdeVersionMismatch(
  error: unknown,
): error is SdeVersionMismatchError {
  return error instanceof SdeVersionMismatchError;
}
