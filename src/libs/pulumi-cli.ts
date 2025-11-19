import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as core from '@actions/core';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as semver from 'semver';
import * as exec from './exec';
import { getVersionObject } from './libs/get-version';

/**
 * Returns true if the version is known to have issues and should not be used
 * if already installed on the runner. Instead, proceed to downloading the CLI.
 */
function isKnownBadVersion(version: string): boolean {
  const knownBadVersions = new Set([
    // The following versions have a regression with the `--target` and
    // `--target-replace` flags that may cause stack corruption when used.
    // See: https://github.com/pulumi/pulumi/issues/12964
    '3.66.0',
    '3.67.0',
    '3.67.1',
    '3.120.0',
  ]);
  return knownBadVersions.has(version);
}

export async function getVersion(): Promise<string | undefined> {
  const res = await exec.exec('pulumi', ['version']);

  // Only check for success and if the [stdout] starts with the version
  // prefix 'v'. If success is true and the runner version is not the
  // latest version then the "warning of newer version" will be in [stderr] field,
  // which will trigger an else condition if we also check for [stderr === '']
  if (res.success && res.stdout.startsWith('v'))
    // Return version without 'v' prefix
    return res.stdout.substring(1);
  else return undefined;
}

export async function run(...args: string[]): Promise<exec.ExecResult> {
  return exec.exec(`pulumi`, args, true);
}

export function getPlatform(): string | undefined {
  const platforms = {
    'linux-x64': 'linux-x64',
    'linux-arm64': 'linux-arm64',
    'darwin-x64': 'darwin-x64',
    'darwin-arm64': 'darwin-arm64',
    'win32-x64': 'windows-x64',
    'win32-arm64': 'windows-arm64',
  };

  const runnerPlatform = os.platform();
  const runnerArch = os.arch();

  return platforms[`${runnerPlatform}-${runnerArch}`];
}

function isDynamicVersion(range: string): boolean {
  return range === 'dev' || range.toLowerCase().startsWith('pr#');
}

export async function downloadCli(range: string): Promise<void> {
  const platform = getPlatform();
  core.debug(`Platform: ${platform}`);

  if (!platform) {
    throw new Error(
      'Unsupported operating system - Pulumi CLI is only released for Darwin (x64, arm64), Linux (x64, arm64) and Windows (x64, arm64)',
    );
  }

  core.info(`Configured range: ${range}`);

  const isPulumiInstalled = await io.which('pulumi');

  if (isPulumiInstalled && range != 'latest' && !isDynamicVersion(range)) {
    // Check for version of Pulumi CLI installed on the runner
    const runnerVersion = await getVersion();

    if (runnerVersion) {
      if (isKnownBadVersion(runnerVersion)) {
        // If the version on the runner is known bad, proceed to downloading the CLI to get
        // a more recent version.
        core.info(
          `Pulumi version ${runnerVersion} has a known issue. Proceeding to download`,
        );
      } else if (semver.satisfies(runnerVersion, range)) {
        // If runner version matches, skip downloading CLI by exiting the function
        core.info(
          `Pulumi version ${runnerVersion} is already installed on this machine. Skipping download`,
        );
        return;
      } else {
        core.info(
          `Pulumi ${runnerVersion} does not satisfy the desired version ${range}. Proceeding to download`,
        );
      }
    } else {
      core.info('Pulumi is not detected in the PATH. Proceeding to download');
    }
  }

  const { version, downloads } = await getVersionObject(range);
  if (isPulumiInstalled && range === 'latest') {
    const runnerVersion = await getVersion();
    if (runnerVersion && runnerVersion === version) {
      core.info(
        `Pulumi version ${runnerVersion} is already installed on this machine, and is the latest available. Skipping download`
      );
      return;
    }
  }


  core.info(`Matched version: ${version}`);

  let isUnsupportedVersion;
  if (isDynamicVersion(range)) {
    isUnsupportedVersion = false;
  } else {
    isUnsupportedVersion = semver.lt(version, '3.0.0');
  }

  if (isUnsupportedVersion) {
    core.warning(
      `Using Pulumi CLI version less than 3.0.0 may cause unexpected behavior. Please consider migrating to 3.0.0 or higher. You can find our migration guide at https://www.pulumi.com/docs/get-started/install/migrating-3.0/`,
    );
  }

  const destination = path.join(os.homedir(), '.pulumi');
  core.info(`Install destination is ${destination}`);

  await io
    .rmRF(path.join(destination, 'bin'))
    .catch()
    .then(() => {
      core.info(
        `Successfully deleted pre-existing ${path.join(destination, 'bin')}`,
      );
    });

  // For PR builds, we need to authenticate the download
  const isPrBuild = range.toLowerCase().startsWith('pr#');
  const auth = isPrBuild && process.env.GITHUB_TOKEN ? `Bearer ${process.env.GITHUB_TOKEN}` : undefined;

  const downloaded = await tc.downloadTool(downloads[platform], undefined, auth);
  core.debug(`successfully downloaded ${downloads[platform]} to ${downloaded}`);

  await io.mkdirP(destination);
  core.debug(`Successfully created ${destination}`);

  // PR builds are zip files containing tarballs, regular builds are tarballs/zips directly
  let fileToExtract = downloaded;
  if (isPrBuild) {
    // First extract the zip to get the tarball inside
    const zipExtractDir = path.join(destination, 'zip-extract');
    await io.mkdirP(zipExtractDir);
    const zipExtracted = await tc.extractZip(downloaded, zipExtractDir);
    core.debug(`Extracted PR artifact zip to ${zipExtracted}`);

    // Find the tarball inside the zip
    const files = fs.readdirSync(zipExtractDir).filter(f => f.startsWith('pulumi-') && f.endsWith('.tar.gz'));
    if (files.length === 0) {
      throw new Error(`Could not find tarball in PR artifact zip at ${zipExtractDir}`);
    }
    fileToExtract = path.join(zipExtractDir, files[0]);
    core.debug(`Found tarball in PR artifact: ${fileToExtract}`);
  }

  switch (platform) {
    case 'windows-x64':
    case 'windows-arm64': {
      // Windows uses zip format (unless it's a PR build which we already extracted above)
      const extractedPath = isPrBuild
        ? await tc.extractTar(fileToExtract, destination)
        : await tc.extractZip(fileToExtract, destination);
      core.debug(`Successfully extracted to ${extractedPath}`);
      const oldPath = path.join(destination, 'pulumi', 'bin');
      const newPath = path.join(destination, 'bin');
      await io.mv(oldPath, newPath);
      core.debug(`Successfully renamed ${oldPath} to ${newPath}`);
      await io
        .rmRF(path.join(destination, 'pulumi'))
        .catch()
        .then(() => {
          core.info(
            `Successfully deleted left-over ${path.join(
              destination,
              'pulumi',
            )}`,
          );
        });
      if (isPrBuild) {
        await io.rmRF(path.join(destination, 'zip-extract'));
      }
      break;
    }
    default: {
      const extractedPath = await tc.extractTar(fileToExtract, destination);
      core.debug(`Successfully extracted to ${extractedPath}`);
      const oldPath = path.join(destination, 'pulumi');
      const newPath = path.join(destination, 'bin');
      await io.mv(oldPath, newPath);
      core.debug(`Successfully renamed ${oldPath} to ${newPath}`);
      if (isPrBuild) {
        await io.rmRF(path.join(destination, 'zip-extract'));
      }
      break;
    }
  }

  // For dynamic versions (dev/PR), we need to get the version from the binary we just installed
  // For other builds, we know the version already
  let cacheVersion = version;
  if (isDynamicVersion(range)) {
    // Run the binary directly from the installation directory to get its version
    const pulumiPath = path.join(destination, 'bin', 'pulumi');
    const versionExec = await exec.exec(pulumiPath, ['version'], true);
    if (!versionExec.success) {
      throw new Error(`Failed to get version from installed pulumi binary:\n${versionExec.stderr}`);
    }
    cacheVersion = versionExec.stdout.trim();
  }

  const cachedPath = await tc.cacheDir(
    path.join(destination, 'bin'),
    'pulumi',
    cacheVersion,
  );
  core.addPath(cachedPath);

  // Verify the installed version
  const versionExec = await exec.exec(`pulumi`, ['version'], true);
  const installedVersion = versionExec.stdout.trim();
  core.debug(`Running pulumi version returned: ${installedVersion}`);

  if (!versionExec.success) {
    throw new Error(`Failed to verify pulumi version:\n${versionExec.stderr}`);
  }

  if (isDynamicVersion(range)) {
    core.info(`Installed ${range} build with version: ${installedVersion}`);
  } else if (!semver.satisfies(installedVersion, version)) {
    throw new Error(`Installed version "${installedVersion}" did not satisfy the resolved version "${version}"`);
  }
}
