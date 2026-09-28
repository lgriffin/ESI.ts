import { When } from '../../support/steps';
import { fetchLatestBuild } from '../../support/sdeFiles';

When('I ask the downloader for the latest build', async function () {
  await fetchLatestBuild(this);
});
