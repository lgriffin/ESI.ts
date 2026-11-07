import {
  addResponseInterceptor,
  settingField,
} from '../../support/interceptors';
import { Given } from '../../support/steps';

Given(
  'the client has a response interceptor {string} that sets the field {string} to {string}',
  function (name: string, field: string, value: string) {
    addResponseInterceptor(this, name, settingField(field, value));
  },
);
