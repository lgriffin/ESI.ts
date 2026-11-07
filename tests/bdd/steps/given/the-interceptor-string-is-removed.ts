import { removeInterceptor } from '../../support/interceptors';
import { Given } from '../../support/steps';

Given('the interceptor {string} is removed', function (name: string) {
  removeInterceptor(this, name);
});
