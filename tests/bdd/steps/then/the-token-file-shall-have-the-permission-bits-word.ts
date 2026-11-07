import { statSync } from 'fs';
import { tokenFilePath } from '../../support/token-storage';
import { Then } from '../../support/steps';

Then(
  'the token file shall have the permission bits {word}',
  function (bits: string) {
    const stats = statSync(tokenFilePath(this));
    // Windows has no POSIX mode bits; there the file existing is all a stat shows.
    if (process.platform === 'win32') {
      expect(stats.isFile()).toBe(true);
      return;
    }
    expect((stats.mode & 0o777).toString(8).padStart(4, '0')).toBe(bits);
  },
);
