import { unreferenced, usedOnlyByAFixture } from '../../src';

// Files under a fixtures directory are inputs, not tests: these uses do not count.
export const inputs = [unreferenced(), usedOnlyByAFixture];
