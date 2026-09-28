export type WithMeta<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => { data: R }
    : T[K];
};

export abstract class BaseEsiClient {
  inherited(): number {
    return 1;
  }

  overridden(): number {
    return 1;
  }

  withMeta(): WithMeta<Omit<this, 'withMeta'>> {
    return this as never;
  }

  protected guarded(): number {
    return 1;
  }
}
