export function isNotFound(err) {
  return typeof err === 'object' && err !== null && err.statusCode === 404;
}
