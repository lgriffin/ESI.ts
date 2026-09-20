export function jitter(delayMs: number): number {
  return delayMs * (0.75 + Math.random() * 0.5);
}
