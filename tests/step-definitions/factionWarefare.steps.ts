import { Given, When, Then } from '@cucumber/cucumber';
import { factionWarfare } from '../../src/api/factionWarfare';

let expect: any;

(async () => {
  expect = (await import('chai')).expect;
})();

Given('I have a valid ESI API endpoint', function () {
  // Assuming the API endpoint is always valid for testing purposes
});

When('I request the character leaderboards', async function () {
  this.characterLeaderboard = await factionWarfare.leaderboards.characters();
});

Then('I should receive the character leaderboards data', function () {
  expect(this.characterLeaderboard).to.be.an('object');
});

When('I request the faction stats', async function () {
  this.factionStats = await factionWarfare.stats.stats();
});

Then('I should receive the faction stats data', function () {
  expect(this.factionStats).to.be.an('object');
});
