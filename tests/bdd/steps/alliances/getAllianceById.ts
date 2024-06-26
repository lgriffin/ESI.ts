import { Given, When, Then } from '@cucumber/cucumber';
import fetchMock from 'jest-fetch-mock';

let response: any;

Given('an alliance with ID {string} exists', async function (allianceId: string) {
    fetchMock.mockResponseOnce(JSON.stringify({ alliance_id: allianceId, name: "Goonswarm Federation" }));
});

When('I request the alliance information for ID {string}', async function (allianceId: string) {
    const res = await fetch(`https://esi.evetech.net/latest/alliances/${allianceId}/`);
    response = await res.json();
});

Then('the response should contain the alliance name {string}', function (expectedName: string) {
    expect(response.name).toBe(expectedName);
});
