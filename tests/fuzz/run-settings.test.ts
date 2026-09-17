/**
 * The property runner's environment parsing fails closed: a nightly run that
 * asks for 10000 runs, or a replay that names a seed, must get exactly that
 * or stop, never quietly fall back to the defaults.
 */
import { readRunSettings } from './support/property';

describe('property run settings', () => {
  it('uses fast-check defaults when nothing is set', () => {
    expect(readRunSettings({})).toEqual({});
    expect(
      readRunSettings({ FC_NUM_RUNS: '', FC_SEED: '', FC_PATH: '' }),
    ).toEqual({});
  });

  it('reads the nightly run count and a replay seed and path', () => {
    expect(
      readRunSettings({
        FC_NUM_RUNS: '10000',
        FC_SEED: '-82969071',
        FC_PATH: '0:2:2:3',
      }),
    ).toEqual({ numRuns: 10000, seed: -82969071, path: '0:2:2:3' });
  });

  it.each([['0'], ['-5'], ['1e4'], ['10 000'], ['many'], ['99999999']])(
    'rejects FC_NUM_RUNS=%s',
    (value) => {
      expect(() => readRunSettings({ FC_NUM_RUNS: value })).toThrow(
        /FC_NUM_RUNS/,
      );
    },
  );

  it.each([['2147483648'], ['1.5'], ['abc']])('rejects FC_SEED=%s', (value) => {
    expect(() => readRunSettings({ FC_SEED: value })).toThrow(/FC_SEED/);
  });

  it('rejects a replay path without a seed, or a malformed one', () => {
    expect(() => readRunSettings({ FC_PATH: '1:2' })).toThrow(/needs FC_SEED/);
    expect(() => readRunSettings({ FC_SEED: '1', FC_PATH: '1;2' })).toThrow(
      /FC_PATH/,
    );
  });
});
