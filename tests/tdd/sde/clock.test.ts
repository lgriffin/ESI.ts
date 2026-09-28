import { systemClock } from '../../../src/sde/clock';

describe('the SDE clock', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('reads the wall clock', () => {
    jest.useFakeTimers({ now: 1_700_000_000_000 });
    expect(systemClock.now()).toBe(1_700_000_000_000);
  });

  it('sleeps for exactly the milliseconds asked', async () => {
    jest.useFakeTimers();
    let settled = false;
    const sleeping = systemClock.sleep(250).then(() => {
      settled = true;
    });
    await jest.advanceTimersByTimeAsync(249);
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await sleeping;
    expect(settled).toBe(true);
  });
});
