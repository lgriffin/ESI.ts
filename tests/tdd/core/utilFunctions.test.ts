import { camelToSnake } from '../../../src/core/util/stringUtil';
import { sleep } from '../../../src/core/util/sleep';
import { retryDelay } from '../../../src/core/util/retry';
import {
  buildError,
  EsiValidationError,
  isValidationError,
} from '../../../src/core/util/error';

describe('camelToSnake', () => {
  it('converts standard camelCase', () => {
    expect(camelToSnake('camelCase')).toBe('camel_case');
  });

  it('converts multiple capitals', () => {
    expect(camelToSnake('getCharacterId')).toBe('get_character_id');
  });

  it('leaves lowercase unchanged', () => {
    expect(camelToSnake('alreadylower')).toBe('alreadylower');
  });

  it('handles empty string', () => {
    expect(camelToSnake('')).toBe('');
  });

  it('handles leading capital', () => {
    expect(camelToSnake('Alliance')).toBe('_alliance');
  });

  it('handles consecutive capitals', () => {
    expect(camelToSnake('HTMLParser')).toBe('_h_t_m_l_parser');
  });

  it('handles single character', () => {
    expect(camelToSnake('a')).toBe('a');
    expect(camelToSnake('A')).toBe('_a');
  });
});

describe('sleep', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves after the specified time', async () => {
    const promise = sleep(1000);
    jest.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
  });

  it('does not resolve before the specified time', async () => {
    let resolved = false;
    sleep(1000).then(() => {
      resolved = true;
    });
    jest.advanceTimersByTime(999);
    await Promise.resolve();
    expect(resolved).toBe(false);
  });

  it('resolves with undefined', async () => {
    const promise = sleep(0);
    jest.advanceTimersByTime(0);
    const result = await promise;
    expect(result).toBeUndefined();
  });
});

describe('retryDelay', () => {
  it('returns base delay at attempt 0 with no jitter', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const delay = retryDelay(0, 1000, 30000);
    expect(delay).toBe(1000);
    jest.spyOn(Math, 'random').mockRestore();
  });

  it('doubles per attempt (exponential)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const d0 = retryDelay(0, 1000, 100000);
    const d1 = retryDelay(1, 1000, 100000);
    const d2 = retryDelay(2, 1000, 100000);
    expect(d1).toBe(d0 * 2);
    expect(d2).toBe(d0 * 4);
    jest.spyOn(Math, 'random').mockRestore();
  });

  it('applies minimum jitter when Math.random returns 0', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const delay = retryDelay(0, 1000, 30000);
    expect(delay).toBe(750);
    jest.spyOn(Math, 'random').mockRestore();
  });

  it('applies maximum jitter when Math.random returns 1', () => {
    jest.spyOn(Math, 'random').mockReturnValue(1);
    const delay = retryDelay(0, 1000, 30000);
    expect(delay).toBe(1250);
    jest.spyOn(Math, 'random').mockRestore();
  });

  it('clamps to maxMs', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const delay = retryDelay(10, 1000, 5000);
    expect(delay).toBe(5000);
    jest.spyOn(Math, 'random').mockRestore();
  });

  it('jitter stays within [0.75, 1.25] band', () => {
    const randomSpy = jest.spyOn(Math, 'random');
    for (let i = 0; i < 100; i++) {
      randomSpy.mockReturnValue(i / 100);
      const delay = retryDelay(0, 1000, 30000);
      expect(delay).toBeGreaterThanOrEqual(750);
      expect(delay).toBeLessThanOrEqual(1250);
    }
    randomSpy.mockRestore();
  });
});

describe('buildError', () => {
  it('creates error with [TYPE] format', () => {
    const err = buildError('something failed', 'NETWORK');
    expect(err.message).toBe('[NETWORK] something failed');
  });

  it('defaults type to ERROR', () => {
    const err = buildError('oops');
    expect(err.message).toBe('[ERROR] oops');
  });

  it('attaches url when provided', () => {
    const err = buildError('fail', 'HTTP', 'https://esi.evetech.net/v1/status');
    expect((err as Error & { url: string }).url).toBe(
      'https://esi.evetech.net/v1/status',
    );
  });

  it('does not attach url when not provided', () => {
    const err = buildError('fail');
    expect((err as unknown as Record<string, unknown>).url).toBeUndefined();
  });

  it('returns an Error instance', () => {
    expect(buildError('test')).toBeInstanceOf(Error);
  });
});

describe('EsiValidationError', () => {
  it('stores the validation error', () => {
    const zodError = { issues: [{ message: 'invalid type' }] };
    const err = new EsiValidationError('https://esi.test/v1/foo', zodError);
    expect(err.validationError).toBe(zodError);
    expect(err.statusCode).toBe(0);
    expect(err.name).toBe('EsiValidationError');
    expect(err.message).toContain('Response validation failed');
  });

  it('is detected by isValidationError', () => {
    const err = new EsiValidationError('https://esi.test/v1/foo', {});
    expect(isValidationError(err)).toBe(true);
  });

  it('isValidationError returns false for plain EsiError', () => {
    const { EsiError } = require('../../../src/core/util/error');
    expect(isValidationError(new EsiError(500, 'test'))).toBe(false);
  });

  it('isValidationError returns false for non-errors', () => {
    expect(isValidationError(null)).toBe(false);
    expect(isValidationError('string')).toBe(false);
    expect(isValidationError(undefined)).toBe(false);
  });
});
