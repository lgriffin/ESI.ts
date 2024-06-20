import { expect } from 'chai';
import { factionWarfare } from '../../src/api/factions/getFactionWarfareSystems';
import sinon from 'sinon';
import * as requestModule from '../../src/core/util/request';

describe('Faction Warfare Systems API', () => {
  let requestStub: sinon.SinonStub;

  beforeEach(() => {
    requestStub = sinon.stub(requestModule, 'request');
  });

  afterEach(() => {
    requestStub.restore();
  });

  it('should fetch faction warfare systems', async () => {
    const mockData = { /* Mock response data */ };
    requestStub.resolves(mockData);

    const data = await factionWarfare.systems();
    expect(data).to.deep.equal(mockData);
  });
});
