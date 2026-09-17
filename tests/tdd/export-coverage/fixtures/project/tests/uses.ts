import {
  importedButUnused,
  referenced,
  viaStarReferenced,
  type ReferencedShape,
} from '../src';

// mentionedOnlyInText appears in this comment, which is not a reference.
const label = 'mentionedOnlyInText';

const shape: ReferencedShape = { id: 1 };

export const results = [referenced(), viaStarReferenced(), label, shape];
