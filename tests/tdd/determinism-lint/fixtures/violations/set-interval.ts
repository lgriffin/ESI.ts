export function startCleanup(sweep: () => void): void {
  setInterval(sweep, 60_000);
}
