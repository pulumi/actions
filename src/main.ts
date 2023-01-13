import * as core from '@actions/core';
import { makeConfig } from './config';
import { runAction } from './run';

const main = async () => {
  const config = await makeConfig();
  core.debug('Configuration is loaded');
  runAction(config);
};

(async () => {
  try {
    await main();
  } catch (err) {
    if (err.message.stderr) {
      core.setFailed(err.message.stderr);
    } else {
      core.setFailed(err.message);
    }
  }
})();