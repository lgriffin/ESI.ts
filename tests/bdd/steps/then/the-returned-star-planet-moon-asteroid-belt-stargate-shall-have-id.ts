import { Then } from '../../support/steps';

Then(
  /^the returned (star|planet|moon|asteroid belt|stargate) shall have ID (\d+)$/,
  function (noun: string, id: string) {
    const field = {
      star: 'starId',
      planet: 'planetId',
      moon: 'moonId',
      'asteroid belt': 'asteroidBeltId',
      stargate: 'stargateId',
    }[noun];
    expect(this.result).not.toBeNull();
    expect(this.result[field!]).toBe(Number(id));
  },
);
