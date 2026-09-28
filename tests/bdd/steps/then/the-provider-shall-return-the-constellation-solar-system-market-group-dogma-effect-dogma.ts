import { Then } from '../../support/steps';

// The noun names the record for the reader; the name is what is checked.
Then(
  /^the provider shall return the (constellation|solar system|market group|dogma effect|dogma attribute category|dogma unit) named "([^"]*)"$/,
  function (noun: string, name: string) {
    void noun;
    expect(this.result).not.toBeNull();
    expect(this.result.name).toBe(name);
  },
);
