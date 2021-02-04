import { context, getOctokit } from '@actions/github';
import { invariant } from './utils';

export async function addPullRequestMessage(
  body: string,
  githubToken: string,
): Promise<void> {
  const { payload, repo } = context;
  invariant(payload.pull_request, 'Missing pull request event data.');

  const octokit = getOctokit(githubToken);
  await octokit.issues.createComment({
    ...repo,
    issue_number: payload.pull_request.number,
    body,
  });
}
