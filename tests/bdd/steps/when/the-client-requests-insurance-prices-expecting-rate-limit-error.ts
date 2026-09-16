import { When } from '../../support/steps';

When(
  'the client requests insurance prices expecting rate limit error',
  async function () {
    try {
      await this.client.insurance.getInsurancePrices();
    } catch (error) {
      this.error = error;
    }
  },
);
