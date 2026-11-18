import { Then } from '../../support/steps';
import { entryContent, extractedText } from '../../support/sdeFiles';

Then(
  'each of {string} shall read back from the extraction directory with its archived content',
  function (names: string) {
    for (const name of names.split(',').map((n) => n.trim())) {
      expect(extractedText(this, name)).toBe(entryContent(name));
    }
  },
);
