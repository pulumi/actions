import * as core from "@actions/core";
import { getOctokit } from '@actions/github';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import got from 'got';
import * as rt from 'runtypes';
import { maxSatisfying } from 'semver';
import invariant from 'ts-invariant';
import { getPlatform } from '../pulumi-cli';

const VersionRt = rt.Record({
  version: rt.String,
  date: rt.String,
  downloads: rt.Record({
    'linux-x64': rt.String,
    'linux-arm64': rt.String,
    'darwin-x64': rt.String,
    'darwin-arm64': rt.String,
    'windows-x64': rt.String,
    'windows-arm64': rt.String,
  }),
  checksums: rt.String,
  latest: rt.Boolean.optional(),
});
export type Version = rt.Static<typeof VersionRt>;
const VersionsRt = rt.Array(VersionRt);

async function getPrHeadSha(octokit: ReturnType<typeof getOctokit>, prNumber: string): Promise<string> {
  const { data: pr } = await octokit.rest.pulls.get({
    owner: 'pulumi',
    repo: 'pulumi',
    pull_number: parseInt(prNumber, 10),
  });

  if (!pr.head?.sha) {
    throw new Error(`Could not find HEAD SHA for PR ${prNumber}`);
  }
  return pr.head.sha;
}

type WorkflowRun = RestEndpointMethodTypes['actions']['listWorkflowRunsForRepo']['response']['data']['workflow_runs'][number];

function hasCiWorkflow(run: WorkflowRun): boolean {
  return run.referenced_workflows?.some((wf) => wf.path?.includes('ci.yml')) ?? false;
}

async function getWorkflowRunId(octokit: ReturnType<typeof getOctokit>, headSha: string): Promise<number> {
  const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
    owner: 'pulumi',
    repo: 'pulumi',
    head_sha: headSha,
  });

  const ciRuns = data.workflow_runs
    .filter(hasCiWorkflow)
    .sort((a, b) => {
      const aTime = a.run_started_at ? new Date(a.run_started_at).getTime() : 0;
      const bTime = b.run_started_at ? new Date(b.run_started_at).getTime() : 0;
      return bTime - aTime;
    });

  if (ciRuns.length === 0) {
    throw new Error(`Could not find CI workflow run for SHA ${headSha}`);
  }

  return ciRuns[0].id;
}

async function getArtifactUrl(
  octokit: ReturnType<typeof getOctokit>,
  workflowRunId: number,
  platform: string,
): Promise<string> {
  const [os, arch] = platform.split('-');
  const goArch = arch === 'x64' ? 'amd64' : arch;
  const artifactName = `artifacts-cli-${os}-${goArch}`;

  const { data } = await octokit.rest.actions.listWorkflowRunArtifacts({
    owner: 'pulumi',
    repo: 'pulumi',
    run_id: workflowRunId,
    name: artifactName,
  });

  if (data.artifacts.length === 0) {
    throw new Error(`Could not find artifact ${artifactName}`);
  }

  return data.artifacts[0].archive_download_url;
}

async function getPrArtifactUrl(prNumber: string, platform: string): Promise<string> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error(
      `GITHUB_TOKEN environment variable is required to install PR builds (pr#${prNumber}). ` +
      `Note: The default GitHub Actions token may not have permission to download artifacts from pulumi/pulumi. ` +
      `You may need to set a Personal Access Token with 'repo' scope via env: { GITHUB_TOKEN: ... }`
    );
  }

  const octokit = getOctokit(githubToken);
  const headSha = await getPrHeadSha(octokit, prNumber);
  const workflowRunId = await getWorkflowRunId(octokit, headSha);
  return getArtifactUrl(octokit, workflowRunId, platform);
}

function createPrVersion(range: string, artifactUrl: string): Version {
  return {
    version: range,
    date: new Date().toISOString(),
    downloads: {
      'linux-x64': artifactUrl,
      'linux-arm64': artifactUrl,
      'darwin-x64': artifactUrl,
      'darwin-arm64': artifactUrl,
      'windows-x64': artifactUrl,
      'windows-arm64': artifactUrl,
    },
    checksums: '',
  };
}

export async function getVersionObject(range: string): Promise<Version> {
  if (range == 'dev') {
    const result = await got('https://www.pulumi.com/latest-dev-version');
    const version = 'v' + result.body.trim();
    const date = new Date().toISOString();
    const downloads = {
      'linux-x64': `https://get.pulumi.com/releases/sdk/pulumi-${version}-linux-x64.tar.gz`,
      'linux-arm64': `https://get.pulumi.com/releases/sdk/pulumi-${version}-linux-arm64.tar.gz`,
      'darwin-x64': `https://get.pulumi.com/releases/sdk/pulumi-${version}-darwin-x64.tar.gz`,
      'darwin-arm64': `https://get.pulumi.com/releases/sdk/pulumi-${version}-darwin-arm64.tar.gz`,
      'windows-x64': `https://get.pulumi.com/releases/sdk/pulumi-${version}-windows-x64.zip`,
      'windows-arm64': `https://get.pulumi.com/releases/sdk/pulumi-${version}-windows-arm64.zip`,
    };
    const checksums = 'https://get.pulumi.com/releases/sdk/pulumi-${version}-checksums.txt';
    const latest = false;
    return { version, date, downloads, checksums, latest };
  }
  if (range.toLowerCase().startsWith('pr#')) {
    const prNumber = range.substring(3);
    const platform = getPlatform();
    if (!platform) {
      throw new Error(
        'Unsupported operating system - Pulumi CLI is only released for Darwin (x64, arm64), Linux (x64, arm64) and Windows (x64, arm64)',
      );
    }
    const artifactUrl = await getPrArtifactUrl(prNumber, platform);
    return createPrVersion(range, artifactUrl);
  }

  const result = await got(
    'https://raw.githubusercontent.com/pulumi/docs/master/data/versions.json',
    { responseType: 'json' },
  );

  const versions = VersionsRt.check(result.body);

  if (range == 'latest') {
    const latest = versions.find((v) => v.latest);
    invariant(latest, 'expect a latest version to exists');
    return latest;
  }

  const availableVersions = versions.map((v) => v.version);
  const resp = maxSatisfying(availableVersions, range);

  if (resp === null) {
    core.debug(`Expecting a version to satisfy the range ${range}, but one was not found. Available versions are: ${availableVersions}`);
    throw new Error(
      'Could not find a version that satisfied the version range',
    );
  }

  const ver = versions.find((v) => v.version === resp);

  if (!ver) {
    throw new Error(
      `Despite previously having identified ${resp} as satisfying the Semver range ${range}, we're unable to recover that version from the original list.`,
    );
  }

  return ver;
}
