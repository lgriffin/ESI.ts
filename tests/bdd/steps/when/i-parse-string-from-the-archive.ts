import { When } from '../../support/steps';
import { parseArchiveFiles } from '../../support/sdeFiles';

When('I parse {string} from the archive', function (names: string) {
  parseArchiveFiles(this, names.split(', '));
});
