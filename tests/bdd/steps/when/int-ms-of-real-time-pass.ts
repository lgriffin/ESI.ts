import { When } from '../../support/steps';

When('{int} ms of real time pass', async function (ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
});
