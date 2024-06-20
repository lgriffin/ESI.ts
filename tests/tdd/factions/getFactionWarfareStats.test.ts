import { expect } from 'chai';
import { factionWarfare } from '../../src/api/factions/getFactionWarfareStats';
import sinon from 'sinon';
import * as requestModule from '../../src/core/util/request';

describe('Faction Warfare Stats API', () => {
  let requestStub: sinon.SinonStub;

  beforeEach(() => {
    requestStub = sinon.stub(requestModule, 'request');
  });

  afterEach(() => {
    requestStub.restore();
  });

  it('should fetch faction warfare stats', async () => {
    const mockData = { /* Mock response data */ };
    requestStub.resolves(mockData);

    const data = await factionWarfare.stats.stats();
    expect(data).to.deep.equal(mockData);
  });

  it('should fetch character faction warfare stats', async () => {
    const mockData = { /* Mock response data */ };
    const characterID = 12345;
    requestStub.resolves(mockData);

    const data = await factionWarfare.stats.characterStats(characterID);
    expect(data).to.deep.equal(mockData);
  });

  it('should fetch corporation faction warfare stats', async () => {
    const mockData = { /* Mock response data */ };
    const corporationID = 67890;
    requestStub.resolves(mockData);

    const data = await factionWarfare.stats.corporationStats(corporationID);
    expect(data).to.deep.equal(mockData);
  });
});
