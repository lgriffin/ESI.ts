import { useEnv } from '../../support/client-construction';
import { Given } from '../../support/steps';

Given(
  'the environment variable {string} is {string}',
  function (name: string, value: string) {
    useEnv(this, name, value);
  },
);
