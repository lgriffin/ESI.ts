/**
 * Preloaded into each nightly example run (`node -r`). An example that
 * catches a failure, prints it with console.error and exits 0 would otherwise
 * pass; this turns that run's exit code into STRICT_EXIT_CODE (86, kept in
 * step with scripts/docs/examples-core.ts) so the runner reports it.
 */
let logged = false;
const error = console.error.bind(console);
console.error = (...args) => {
  logged = true;
  error(...args);
};
process.on('exit', () => {
  if (logged && !process.exitCode) process.exitCode = 86;
});
