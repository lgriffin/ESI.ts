import { queueResponse } from '../../support/transport';
import { Given } from '../../support/steps';

const ASSETS_PATH = /\/characters\/\d+\/assets(\?|$)/;

Given("ESI reports the character's assets on two pages", function () {
  queueResponse({
    match: ASSETS_PATH,
    body: [{ item_id: 1 }],
    headers: { 'x-pages': '2' },
  });
  queueResponse({
    match: ASSETS_PATH,
    body: [{ item_id: 2 }],
    headers: { 'x-pages': '2' },
  });
});
