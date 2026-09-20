import { EMPTY_ACCESS_LIST_ID } from '../../support/access-lists';
import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return the list with an empty entries array',
  function () {
    expect(this.result).toEqual({
      access_list_id: EMPTY_ACCESS_LIST_ID,
      name: 'Empty ACL',
      entries: [],
    });
    expect(sentRequests()).toHaveLength(1);
  },
);
