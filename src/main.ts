import * as filesystem from 'fs';
import * as os from 'os';
import * as tc from '@actions/tool-cache';
import * as http from '@actions/http-client';
import * as core from '@actions/core';
import * as exec from '@actions/exec';

const fs = filesystem.promises;

function getPlatformArch(a, p) {
  const arch = {
    x32: 'x32',
    x64: 'x64',
  };
  const platform = {
    win32: 'windows',
  };
  return {
    platform: platform[p] ? platform[p] : p,
    arch: arch[a] ? arch[a] : a,
  };
}

async function getLatestVersion() {
  const client = new http.HttpClient();
  const v = await client.get('https://www.pulumi.com/latest-version');
  return v.readBody();
}

// Using a @actions/tool-cache, so we can potentially cache this download.
// Alternately, we'll use https://get.pulumi.com/.
async function installer(version?: string) {
  const v = version || (await getLatestVersion());
  core.info(`downloading pulumi@${v}`);

  const p = getPlatformArch(os.arch(), os.platform());

  let folder = tc.find('pulumi', v, p.arch);
  if (folder) {
    // Cache hit
    core.addPath(folder);
    return folder;
  }

  if (p.platform === 'windows') {
    const path = await tc.downloadTool(
      `https://get.pulumi.com/releases/sdk/pulumi-v${v}-${p.platform}-${p.arch}.zip`,
    );
    folder = await tc.extractTar(path);
    await fs.chmod(path, '0755');
  } else if (p.platform === 'darwin' || p.platform === 'linux') {
    const path = await tc.downloadTool(
      `https://get.pulumi.com/releases/sdk/pulumi-v${v}-${p.platform}-${p.arch}.tar.gz`,
    );
    folder = await tc.extractTar(path);
    await fs.chmod(path, '0755');
  }

  if (filesystem.existsSync(`${folder}/pulumi/bin`)) {
    folder = `${folder}/pulumi/bin`;
  } else {
    folder = `${folder}/pulumi`;
  }

  const cachedPath = await tc.cacheDir(folder, 'pulumi', v, p.arch);
  core.addPath(cachedPath);

  return `${folder}/pulumi`;
}

(async () => {
  try {
    const env = {
      PULUMI_SKIP_CONFIRMATIONS: 'true',
      PULUMI_ACCESS_TOKEN: core.getInput('token', { required: true }),
    };

    const cmd = core.getInput('cmd', { required: true });

    // First set arguments
    const args = ['--non-interactive', ...cmd.split(' ')];

    core.debug(`arguments: ${JSON.stringify(args, null, 2)}`);

    const pulumi = await installer();

    core.info('logging into Pulumi...');
    await exec.exec(pulumi, ['login', core.getInput('backendUrl')], {
      env,
      silent: true,
    });

    // Temporarly, select stack manually
    // TODO: Replace with functions from https://github.com/pulumi/pulumi/blob/master/dist/actions/entrypoint.sh#L52-L77
    await exec.exec(pulumi, ['stack', 'select', 'dev'], {
      env,
      silent: true,
    });

    await exec.exec(pulumi, args, {
      env,
    });
  } catch (e) {
    core.setFailed(e.message);
  }
})();
