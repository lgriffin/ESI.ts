import { statSync } from 'fs';
import { tokenFilePath } from '../../support/token-storage';
import { Then } from '../../support/steps';

Then(
  'the token file shall have the permission bits {word}',
  function (bits: string) {
    const mode = statSync(tokenFilePath(this)).mode & 0o777;
    expect(mode.toString(8).padStart(4, '0')).toBe(bits);
  },
);
