import * as os from 'os';
import * as path from 'path';
import * as core from '@actions/core';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as exec from './exec';
import { getVersion } from './libs/get-version';

export async function isAvailable(): Promise<boolean> {
  const res = await exec.exec(`pulumi`, [], true);
  return res.stderr != '' && !res.success ? false : res.success;
}

export async function run(...args: string[]): Promise<void> {
  await exec.exec(`pulumi`, args, true);
}

export async function downloadCli(range: string): Promise<void> {
  const platforms = {
    linux: 'linux',
    darwin: 'darwin',
    win32: 'windows',
  };

  const runnerPlatform = os.platform();

  if (!(runnerPlatform in platforms)) {
    throw new Error(
      'Unsupported operating system - Pulumi CLI is only released for Darwin, Linux and Windows',
    );
  }

  const platform = platforms[runnerPlatform];

  core.info(`Configured range: ${range}`);

  const version = await getVersion(range);
  core.debug(`Matched version: ${version}`);

  const downloadUrl = `https://get.pulumi.com/releases/sdk/pulumi-${version}-${platform}-x64.${
    platform == 'windows' ? 'zip' : 'tar.gz'
  }`;

  const destination = path.join(os.homedir(), '.pulumi');
  core.debug(`Install destination is ${destination}`);

  await io.rmRF(destination).catch().then(() => {
    core.info(`Successfully deleted pre-existing ${destination}`);
  });

  const downloaded = await tc.downloadTool(downloadUrl);
  core.debug(`successfully downloaded ${downloadUrl}`);

  const extractedPath = await tc.extractTar(downloaded, destination);
  core.debug(`Successfully extracted ${downloaded} to ${extractedPath}`);

  const cachedPath = await tc.cacheDir(extractedPath, 'pulumi', version);
  core.addPath(cachedPath);
}
