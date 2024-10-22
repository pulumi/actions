import * as core from '@actions/core';
import * as exec from './libs/exec';
import * as pulumiCli from './libs/pulumi-cli';

export const login = async (workDir: string, cloudUrl: string): Promise<exec.ExecResult> => {
  if (cloudUrl) {
    core.info(`Logging into ${cloudUrl}`);
    return pulumiCli.run('--non-interactive', '--cwd', workDir, 'login', cloudUrl);
  }
  core.info("Logging into the Pulumi Cloud backend.");
  return pulumiCli.run('--non-interactive', '--cwd', workDir, 'login');
};
