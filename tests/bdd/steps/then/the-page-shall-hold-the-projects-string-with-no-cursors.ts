import { project } from '../../support/custom-endpoints';
import { Then } from '../../support/steps';

Then(
  'the page shall hold the projects {string} with no cursors',
  function (ids: string) {
    expect(this.error).toBeUndefined();
    expect(this.result).toEqual({
      data: ids.split(', ').map(project),
      cursors: { before: null, after: null },
    });
  },
);
