import { Given, When, Then } from '@cucumber/cucumber';
import fetchMock from 'jest-fetch-mock';

let response: any;

Given('an alliance with ID {string} exists', async function (allianceId: string) {
    fetchMock.mockResponseOnce(JSON.stringify([98000001, 98000002, 98000003]));
});

When('I request the corporations for alliance ID {string}', async function (allianceId: string) {
    const res = await fetch(`https://esi.evetech.net/latest/alliances/${allianceId}/corporations/`);
    response = await res.json();
});

Then('the response should contain a list of corporation IDs', function () {
    expect(Array.isArray(response)).toBe(true);
    expect(response.length).toBeGreaterThan(0);
});
