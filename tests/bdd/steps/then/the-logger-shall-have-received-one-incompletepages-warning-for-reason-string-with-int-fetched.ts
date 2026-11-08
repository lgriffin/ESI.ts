import { incompletePagesWarnings } from '../../support/paging';
import { Then } from '../../support/steps';

Then(
  'the logger shall have received one incompletePages warning for reason {string} with {int} fetched pages',
  function (reason: string, fetchedPages: number) {
    const warnings = incompletePagesWarnings(this);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.context).toMatchObject({ reason, fetchedPages });
  },
);
