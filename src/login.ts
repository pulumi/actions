import * as core from '@actions/core';
import * as pulumiCli from './libs/pulumi-cli';

export const login = async (cloudUrl: string, accessToken: string) => {
  if (cloudUrl) {
    core.info(`Logging into ${cloudUrl}`);
    await pulumiCli.run('--non-interactive' ,'login', cloudUrl);
  } else if (accessToken !== '') {
    core.info("Logging into the Pulumi Service backend.");
    await pulumiCli.run('--non-interactive', 'login');
  }
};
