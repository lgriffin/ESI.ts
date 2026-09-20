/**
 * A bundler-style consumer (Vite, webpack, esbuild): type-checked only, under
 * `moduleResolution: bundler`, which reads `exports` with the `import` and
 * `types` conditions but does not demand Node's file-extension rules.
 */
import {
  EsiClient,
  isValidationError,
  type ServerStatus,
} from '@lgriffin/esi.ts';
import { EsiValidationError } from '@lgriffin/esi.ts/errors';
import { CharacterInfoSchema } from '@lgriffin/esi.ts/schemas';
import { TestDataFactory } from '@lgriffin/esi.ts/testing';
import { MemorySdeProvider } from '@lgriffin/esi.ts/sde';
import { MemorySdeProvider as MemoryOnlyProvider } from '@lgriffin/esi.ts/sde/memory';

export async function players(client: EsiClient): Promise<number> {
  const status: ServerStatus = await client.status.getStatus();
  return status.players;
}

export function checks(): boolean[] {
  return [
    isValidationError(
      new EsiValidationError('https://esi.evetech.net/status', {}),
    ),
    CharacterInfoSchema.safeParse(TestDataFactory.createCharacterInfo())
      .success,
    new MemorySdeProvider().getType(587) === null,
    new MemoryOnlyProvider().getType(587) === null,
  ];
}
