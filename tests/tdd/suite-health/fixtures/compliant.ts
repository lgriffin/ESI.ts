// Must produce no findings under any suite-health rule.
import { defineFeature, loadFeature } from 'jest-cucumber';
import fc from 'fast-check';
import { Then } from '../../../bdd/support/steps';

async function call(): Promise<number> {
  return 1;
}

function expectOk(status: number): void {
  expect(status).toBe(200);
}

// A live-only suite: skipped by a condition, not committed as .skip.
const LIVE = process.env.ESI_LIVE_TESTS === 'true';
const describeIfLive = LIVE ? describe : describe.skip;

describeIfLive('a live suite', () => {
  it('asserts', () => {
    expect(LIVE).toBe(true);
  });
});

describe('a suite', () => {
  it('asserts with expect', async () => {
    await expect(call()).resolves.toBe(1);
  });

  it('asserts through an expect* helper', () => {
    expectOk(200);
  });

  it('asserts a property with fast-check', () => {
    fc.assert(fc.property(fc.integer(), (n) => n === n));
  });

  it('asserts in the catch block', async () => {
    expect.assertions(1);
    try {
      await call();
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('rethrows what it cannot handle', async () => {
    try {
      expect(await call()).toBe(1);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
    }
  });

  it('silences and restores the console', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    console.warn('hidden');
    expect(warnSpy).toHaveBeenCalledWith('hidden');
    warnSpy.mockRestore();
  });

  it.each([[1], [2]])('asserts %i in a table', (n) => {
    expect(n).toBeGreaterThan(0);
  });
});

const feature = loadFeature('tests/bdd/features/core/0034-status.feature');

defineFeature(feature, (test) => {
  test('Online server returns all four status fields', ({ when, then }) => {
    let result = 0;

    when('the client requests the server status', async () => {
      result = await call();
    });

    then('the client shall return current status information', () => {
      expect(result).toBe(1);
    });
  });
});

Then('the client shall return current status information', function () {
  expect(this.result).toBeDefined();
});
