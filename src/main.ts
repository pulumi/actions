import * as core from '@actions/core';
import { InstallationConfig, makeConfig, makeInstallationConfig } from './config';
import * as pulumiCli from './libs/pulumi-cli';
import { runAction } from './run';

const main = async () => {
  const downloadConfig = makeInstallationConfig();
  if (downloadConfig.success) {
    await installOnly(downloadConfig.value);
    core.info("Pulumi has been successfully installed. Exiting.");
    return;
  }

  // If we get here, we're not in install-only mode.
  // Attempt to parse the full configuration and run the action.
  const config = await makeConfig();
  core.debug('Configuration is loaded');
  runAction(config);
};

// installOnly is the main entrypoint of the program when the user
// intends to install the Pulumi CLI without running additional commands.
const installOnly = async (config: InstallationConfig): Promise<void> => {
  await pulumiCli.downloadCli(config.pulumiVersion);
}

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
