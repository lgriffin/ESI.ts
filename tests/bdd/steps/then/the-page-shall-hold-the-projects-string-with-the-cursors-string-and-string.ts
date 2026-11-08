import { project } from '../../support/custom-endpoints';
import { Then } from '../../support/steps';

Then(
  'the page shall hold the projects {string} with the cursors {string} and {string}',
  function (ids: string, before: string, after: string) {
    expect(this.error).toBeUndefined();
    expect(this.result).toEqual({
      data: ids.split(', ').map(project),
      cursors: { before, after },
    });
  },
);
