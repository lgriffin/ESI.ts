import { BaseEsiClient as Base } from './BaseEsiClient';

/** Extends BaseEsiClient under an import alias: still a domain client. */
export class DeltaClient extends Base {
  getUnusedArrow(): number {
    return 1;
  }

  getDeclaredOnly(): number {
    return 2;
  }

  getHeldOnly(): number {
    return 3;
  }

  getInArgument(): number {
    return 4;
  }

  getPassedByName(): number {
    return 5;
  }

  getInTable(): number {
    return 6;
  }

  getAssigned(): number {
    return 7;
  }

  getInLegacyStep(): number {
    return 8;
  }

  getUnusedInLegacy(): number {
    return 9;
  }
}
