import { expect } from 'chai';
import { factionWarfare } from '../../src/api/factions/getFactionWarfareLeaderboards';
import sinon from 'sinon';
import * as requestModule from '../../src/core/util/request';

describe('Faction Warfare Leaderboards API', () => {
  let requestStub: sinon.SinonStub;

  beforeEach(() => {
    requestStub = sinon.stub(requestModule, 'request');
  });

  afterEach(() => {
    requestStub.restore();
  });

  it('should fetch character leaderboards', async () => {
    const mockData = { /* Mock response data */ };
    requestStub.resolves(mockData);

    const data = await factionWarfare.leaderboards.characters();
    expect(data).to.deep.equal(mockData);
  });

  it('should fetch corporation leaderboards', async () => {
    const mockData = { /* Mock response data */ };
    requestStub.resolves(mockData);

    const data = await factionWarfare.leaderboards.corps();
    expect(data).to.deep.equal(mockData);
  });

  it('should fetch overall leaderboards', async () => {
    const mockData = { /* Mock response data */ };
    requestStub.resolves(mockData);

    const data = await factionWarfare.leaderboard();
    expect(data).to.deep.equal(mockData);
  });
});
