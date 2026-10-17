export class SdeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SdeError';
  }
}

/**
 * A storage fault raised by the SQLite database builder.
 *
 * @deprecated Nothing in the package throws this any more: the SQLite
 * database builder that raised it was removed with the optional
 * `better-sqlite3` peer. The class and {@link isSdeDatabaseError} stay
 * exported with the same shape so existing `instanceof` checks keep
 * compiling, and will be removed in the next major release.
 */
export class SdeDatabaseError extends SdeError {
  public override readonly cause: unknown;

  /**
   * @deprecated Nothing in the package throws `SdeDatabaseError` any more;
   * it will be removed in the next major release.
   */
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'SdeDatabaseError';
    this.cause = cause;
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

/**
 * True for a {@link SdeDatabaseError}.
 *
 * @deprecated Nothing in the package throws `SdeDatabaseError` any more, so
 * this guard is always false for errors the package raises. It will be
 * removed in the next major release with the class.
 */
// eslint-disable-next-line sonarjs/deprecation -- the deprecated guard names its deprecated class until the next major release
export function isSdeDatabaseError(error: unknown): error is SdeDatabaseError {
  // eslint-disable-next-line sonarjs/deprecation -- see the signature above
  return error instanceof SdeDatabaseError;
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
