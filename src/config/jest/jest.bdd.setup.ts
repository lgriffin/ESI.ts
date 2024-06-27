import { setWorldConstructor } from '@cucumber/cucumber';

export class CustomWorld {
  constructor() {
    // Initialization code
  }

  // Define any shared state or methods needed for tests
}

setWorldConstructor(CustomWorld);
