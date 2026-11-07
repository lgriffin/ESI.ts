import { verificationState } from '../../support/token-verification';
import { When } from '../../support/steps';

When('{int} ms pass', function (ms: number) {
  verificationState(this).clock += ms;
});
