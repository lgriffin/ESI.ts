import { expect } from 'chai';
import { factionWarfare } from '../../src/api/factions/getFactionWarfareWars';
import sinon from 'sinon';
import * as requestModule from '../../src/core/util/request';

describe('Faction Warfare Wars API', () => {
  let requestStub: sinon.SinonStub;

  beforeEach(() => {
    requestStub = sinon.stub(requestModule, 'request');
  });

  afterEach(() => {
    requestStub.restore();
  });

  it('should fetch faction warfare wars', async () => {
    const mockData = { /* Mock response data */ };
    requestStub.resolves(mockData);

    const data = await factionWarfare.wars();
    expect(data).to.deep.equal(mockData);
  });
});
