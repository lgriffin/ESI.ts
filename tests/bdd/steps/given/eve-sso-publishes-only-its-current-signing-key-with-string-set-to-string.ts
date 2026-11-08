import {
  verificationState,
  currentJwk,
  jsonValue,
  keySetBody,
} from '../../support/token-verification';
import { Given } from '../../support/steps';

Given(
  'EVE SSO publishes only its current signing key with {string} set to {string}',
  function (field: string, value: string) {
    verificationState(this).answer = {
      status: 200,
      body: keySetBody([{ ...currentJwk(), [field]: jsonValue(value) }]),
    };
  },
);
