import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { factionWarfare } from '../../../../src/api/factions/getFactionWarfareSystems';

let response: any;

Given('I have a valid API token', function () {
  process.env.AUTH_TOKEN = 'valid_token';
});

When('I request the faction warfare systems', async function () {
  response = await factionWarfare.systems();
});

Then('I should receive the faction warfare systems data', function () {
  expect(response).to.be.an('object');
  // Add more specific assertions as needed
});
