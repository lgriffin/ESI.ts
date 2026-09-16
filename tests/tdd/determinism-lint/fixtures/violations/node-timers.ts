import { setTimeout as delay } from 'timers/promises';

export async function sleep(ms: number): Promise<void> {
  await delay(ms);
}
