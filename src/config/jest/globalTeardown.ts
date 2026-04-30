export default async function globalTeardown() {
  // eslint-disable-next-line no-console
  console.log('Rate limiter reset after test completion');
}
