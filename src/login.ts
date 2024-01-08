import * as core from '@actions/core';
import * as exec from './libs/exec';
import * as pulumiCli from './libs/pulumi-cli';

export const login = async (cloudUrl: string, accessToken: string): Promise<exec.ExecResult> => {
  if (cloudUrl) {
    core.info(`Logging into ${cloudUrl}`);
    return pulumiCli.run('--non-interactive' ,'login', cloudUrl);
  } else if (accessToken !== '') {
    core.info("Logging into the Pulumi Cloud backend.");
    return pulumiCli.run('--non-interactive', 'login');
  }
  return Promise.resolve({ success: true, stdout: '', stderr: '' });
};
