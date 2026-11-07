import {
  addResponseInterceptor,
  settingField,
} from '../../support/interceptors';
import { Given } from '../../support/steps';

Given(
  'the client has a response interceptor {string} that sets the field {string} to {int}',
  function (name: string, field: string, value: number) {
    addResponseInterceptor(this, name, settingField(field, value));
  },
);
