module.exports = {
  default: `--require-module ts-node/register --require tests/bdd/features/**/*.ts --require tests/bdd/steps/**/*.ts --format progress --format json:reports/cucumber_report.json`
};
