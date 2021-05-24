import * as os from 'os';
import * as path from 'path';
import * as core from '@actions/core';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as exec from './exec';
import { getVersionObject } from './libs/get-version';

export async function isAvailable(): Promise<boolean> {
  const res = await exec.exec(`pulumi`, [], true);
  return res.stderr != '' && !res.success ? false : res.success;
}

export async function run(...args: string[]): Promise<void> {
  await exec.exec(`pulumi`, args, true);
}

export async function downloadCli(range: string): Promise<void> {
  const platforms = {
    linux: 'linux-x64',
    darwin: 'darwin-x64',
    win32: 'windows-x64',
  };

  const runnerPlatform = os.platform();

  if (!(runnerPlatform in platforms)) {
    throw new Error(
      'Unsupported operating system - Pulumi CLI is only released for Darwin, Linux and Windows',
    );
  }

  const platform = platforms[runnerPlatform];

  core.info(`Configured range: ${range}`);

  const { version, downloads } = await getVersionObject(range);
  core.debug(`Matched version: ${version}`);

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
      const destinationPath = await io.mkdirP(destination);
      core.info(`Successfully created ${destinationPath}`)
      const extractedPath = await tc.extractTar(downloaded, destination);
      core.info(`Successfully extracted ${downloaded} to ${extractedPath}`)
      const oldPath = path.join(destination, 'pulumi')
      const newPath = path.join(destination, 'bin')
      await io.mv(oldPath, newPath);
      core.info(`Successfully renamed ${oldPath} to ${newPath}`)
      break;
    }
  }

  const cachedPath = await tc.cacheDir(path.join(destination, 'bin'), 'pulumi', version);
  core.addPath(cachedPath);
}
