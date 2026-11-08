import { firstProject } from '../../support/paging';
import { Then } from '../../support/steps';

Then(
  'the cursor walk shall resolve with the first project and the project object',
  function () {
    expect(this.error).toBeUndefined();
    expect(this.result).toEqual([firstProject, { id: 'project-object' }]);
  },
);
