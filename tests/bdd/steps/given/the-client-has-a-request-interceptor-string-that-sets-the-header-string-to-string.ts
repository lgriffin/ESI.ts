import {
  addRequestInterceptor,
  settingHeader,
} from '../../support/interceptors';
import { Given } from '../../support/steps';

Given(
  'the client has a request interceptor {string} that sets the header {string} to {string}',
  function (name: string, header: string, value: string) {
    addRequestInterceptor(this, name, settingHeader(header, value));
  },
);
