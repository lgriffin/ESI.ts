import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { factionWarfare } from '../../../../src/api/factions/getFactionWarfareWars';

let response: any;

Given('I have a valid API token', function () {
  process.env.AUTH_TOKEN = 'valid_token';
});

When('I request the faction warfare wars', async function () {
  response = await factionWarfare.wars();
});

Then('I should receive the faction warfare wars data', function () {
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});
