import * as core from '@actions/core';
import { Config } from '../config';
import type { EnvironmentVariables } from './envs';
import * as exec from './exec';

export async function isAvailable(): Promise<boolean> {
  const res = await exec.exec(`pulumi`, [], true);
  return res.stderr != '' && !res.success ? false : res.success;
}

export async function run(...args: string[]): Promise<void> {
  await exec.exec(`pulumi`, args, true);
}

export async function login(
  env: EnvironmentVariables,
  config: Config,
): Promise<void> {
  if (env.PULUMI_ACCESS_TOKEN !== '') {
    core.debug(`Logging into to Pulumi`);
    await run('login');
  } else if (config.cloudUrl) {
    core.debug(`Logging into to ${config.cloudUrl}`);
    await run('login', config.cloudUrl);
  }
}
