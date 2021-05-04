import * as core from '@actions/core';
import { getOctokit } from '@actions/github';
import got from 'got';
import { maxSatisfying } from 'semver';

export async function getVersion(range: string): Promise<string> {
  if (range == 'latest') {
    const resp = await got('https://www.pulumi.com/latest-version');
    return `v${await resp.body}`;
  }

  const resp = await getSatisfyingVersion(range);
  if (resp === null) {
    throw new Error(
      'Could not find a version that satisfied the version range',
    );
  }

  return resp;
}

export async function getSatisfyingVersion(
  range: string,
): Promise<string | null> {
  const octokit = getOctokit(
    core.getInput('github-token') || process.env.GITHUB_TOKEN || '',
  );

  const releases = await octokit.paginate(octokit.repos.listTags, {
    repo: 'pulumi',
    owner: 'pulumi',
    per_page: 100,
  });

  const versions: string[] = releases.map((r) => r.name);

  return maxSatisfying(versions, range);
}
