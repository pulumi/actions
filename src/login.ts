import * as core from '@actions/core';
import * as pulumiCli from './libs/pulumi-cli';
import * as exec from './libs/exec';

export const login = async (cloudUrl: string, accessToken: string): Promise<exec.ExecResult> => {
  if (cloudUrl) {
    core.info(`Logging into ${cloudUrl}`);
    return await pulumiCli.run('--non-interactive' ,'login', cloudUrl);
  } else if (accessToken !== '') {
    core.info("Logging into the Pulumi Cloud backend.");
    return await pulumiCli.run('--non-interactive', 'login');
  }
  return Promise.resolve({ success: true, stdout: '', stderr: '' });
};
