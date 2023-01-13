import * as core from '@actions/core';
import { makeConfig, makeInstallationConfig } from './config';
import { installOnly, runAction } from './run';

const main = async () => {
  try {
    const downloadConfig = await makeInstallationConfig();
    installOnly(downloadConfig);
    core.info("Pulumi has been successfully installed. Exiting.")
  } catch(error) {
    // This could be one of two error types:
    // 1. Validation failed, which is a recoverable error.
    // 2. Installation failed, which is unrecoverable.
    // We check the error type to see whether to procede or bail.
    if(error?.name === "ValidationError") {
      const config = await makeConfig();
      core.debug('Configuration is loaded');
      runAction(config);
    } else {
      throw(error);
    }
  }
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