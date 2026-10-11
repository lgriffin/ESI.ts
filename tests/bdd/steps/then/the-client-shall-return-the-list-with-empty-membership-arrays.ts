import { EMPTY_ACCESS_LIST_ID } from '../../support/access-lists';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return the list with empty membership arrays',
  function () {
    expect(this.result).toEqual({
      id: EMPTY_ACCESS_LIST_ID,
      name: 'Empty ACL',
      description: '',
      membership: {
        allow_everyone: false,
        alliances: [],
        corporations: [],
        characters: [],
      },
    });
    expect(sentRequests()).toHaveLength(1);
  },
);
