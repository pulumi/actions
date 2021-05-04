import * as fs from 'fs';
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
  core.info(`Matched version: ${version}`);

  const downloadUrl = `https://get.pulumi.com/releases/sdk/pulumi-${version}-${platform}-x64.${
    platform == 'windows' ? 'zip' : 'tar.gz'
  }`;

  const destination = path.join(os.homedir(), '.pulumi');
  core.info(`Install destination is ${destination}`);

  if (fs.existsSync(destination)) {
    await io.rmRF(destination);
    core.info(`Successfully deleted pre-existing ${destination}`);
  }

  const downloaded = await tc.downloadTool(downloadUrl);
  core.info(`successfully downloaded ${downloadUrl}`);

  if (platform === 'windows') {
    await tc.extractZip(downloaded, os.homedir());
    fs.renameSync(path.join(os.homedir(), 'Pulumi'), destination);
  } else {
    const destinationPath = await io.mkdirP(destination);
    core.info(`Successfully created ${destinationPath}`);

    const extractedPath = await tc.extractTar(downloaded, destination);
    core.info(`Successfully extracted ${downloaded} to ${extractedPath}`);

    const oldPath = path.join(destination, 'pulumi');
    const newPath = path.join(destination, 'bin');
    fs.renameSync(oldPath, newPath);

    core.info(`Successfully renamed ${oldPath} to ${newPath}`);
  }

  core.addPath(path.join(destination, 'bin'));
}
