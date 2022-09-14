import * as os from 'os';
import * as path from 'path';
import * as core from '@actions/core';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as semver from 'semver'
import * as exec from './exec';
import { getVersionObject } from './libs/get-version';

export async function isAvailable(): Promise<boolean> {
  const res = await exec.exec(`pulumi`, [], true);
  return res.stderr != '' && !res.success ? false : res.success;
}

export async function run(...args: string[]): Promise<void> {
  await exec.exec(`pulumi`, args, true);
}

export function getPlatform(): string | undefined {
  const platforms = {
    'linux-x64': 'linux-x64',
    'linux-arm64': 'linux-arm64',
    'darwin-x64': 'darwin-x64',
    'darwin-arm64': 'darwin-arm64',
    'win32-x64': 'windows-x64',
  };

  const runnerPlatform = os.platform();
  const runnerArch = os.arch();

  return platforms[`${runnerPlatform}-${runnerArch}`];
}

export async function downloadCli(range: string): Promise<void> {
  const platform = getPlatform();

  if (!platform) {
    throw new Error(
      'Unsupported operating system - Pulumi CLI is only released for Darwin (x64, arm64), Linux (x64, arm64) and Windows (x64)',
    );
  }

  core.info(`Configured range: ${range}`);

  const { version, downloads } = await getVersionObject(range);

  core.info(`Matched version: ${version}`);

  const isUnsupportedVersion = semver.lt(version, '3.0.0');

  if (isUnsupportedVersion) {
    core.warning(`Using Pulumi CLI version less than 3.0.0 may cause unexpected behavior. Please consider migrating to 3.0.0 or higher. You can find our migration guide at https://www.pulumi.com/docs/get-started/install/migrating-3.0/`);
  }

  const destination = path.join(os.homedir(), '.pulumi');
  core.info(`Install destination is ${destination}`)

  await io
    .rmRF(path.join(destination, 'bin'))
    .catch()
    .then(() => {
      core.info(`Successfully deleted pre-existing ${path.join(destination, "bin")}`);
    })

  const downloaded = await tc.downloadTool(downloads[platform]);
  core.debug(`successfully downloaded ${downloads[platform]}`);

  switch (platform) {
    case "windows": {
      await tc.extractZip(downloaded, os.homedir());
      await io.mv(path.join(os.homedir(), 'Pulumi'), path.join(os.homedir(), '.pulumi'));
      break;
    }
    default: {
      await io.mkdirP(destination);
      core.debug(`Successfully created ${destination}`)
      const extractedPath = await tc.extractTar(downloaded, destination);
      core.debug(`Successfully extracted ${downloaded} to ${extractedPath}`)
      const oldPath = path.join(destination, 'pulumi')
      const newPath = path.join(destination, 'bin')
      await io.mv(oldPath, newPath);
      core.debug(`Successfully renamed ${oldPath} to ${newPath}`)
      break;
    }
  }

  const cachedPath = await tc.cacheDir(path.join(destination, 'bin'), 'pulumi', version);
  core.addPath(cachedPath);
}
