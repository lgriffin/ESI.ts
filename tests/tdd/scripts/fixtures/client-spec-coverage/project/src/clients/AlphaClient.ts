import { BaseEsiClient } from './BaseEsiClient';

export class AlphaClient extends BaseEsiClient {
  private readonly secret = 1;

  constructor() {
    super();
  }

  get value(): number {
    return this.secret;
  }

  static create(): AlphaClient {
    return new AlphaClient();
  }

  getDirect(): number {
    return 1;
  }

  getChained(): number;
  getChained(id: number): number;
  getChained(id?: number): number {
    return id ?? 2;
  }

  getMetered(): number {
    return 3;
  }

  getShared(): number {
    return 4;
  }

  getNamedBare(): number {
    return 5;
  }

  getAmbiguous(): number {
    return 6;
  }

  overridden(): number {
    return 7;
  }

  private hidden(): number {
    return 8;
  }

  protected guardedToo(): number {
    return this.hidden();
  }
}
