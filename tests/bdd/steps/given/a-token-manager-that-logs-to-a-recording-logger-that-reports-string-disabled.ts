import { EsiTokenManager } from '../../../../src/auth/EsiTokenManager';
import { MemoryTokenStorage } from '../../../../src/auth/storage/MemoryTokenStorage';
import type { LoggerLevel } from '../../../../src/core/logger/ILogger';
import { makeStoredToken } from '../../step-definitions/shared/sso-helpers';
import { recordingLogger } from '../../support/logging';
import { Given } from '../../support/steps';

Given(
  'a token manager that logs to a recording logger that reports {string} disabled',
  async function (level: LoggerLevel) {
    const logger = recordingLogger([level]);
    const storage = new MemoryTokenStorage();
    const stored = makeStoredToken();
    await storage.set(stored.characterId, stored);
    this.values.logger = logger;
    this.values.characterId = stored.characterId;
    this.values.tokenManager = new EsiTokenManager({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      storage,
      logger,
    });
  },
);
