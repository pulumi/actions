import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import * as dedent from 'dedent';
import { Config } from '../config';
import { invariant } from './utils';

export async function handlePullRequestMessage(
  config: Config,
  output: string,
): Promise<void> {
  const {
    githubToken,
    command,
    stackName,
    options: { editCommentOnPr },
  } = config;

  const heading = `#### :tropical_drink: \`${command}\` on ${stackName}`;
  const body = dedent`
    ${heading}
    \`\`\`
    ${output}
    \`\`\`
  `;

  const { payload, repo } = context;
  invariant(payload.pull_request, 'Missing pull request event data.');

  const octokit = getOctokit(githubToken);
  core.debug('Octokit constructed');

  try {
    if (editCommentOnPr) {
      const { data: comments } = await octokit.rest.issues.listComments({
        ...repo,
        issue_number: payload.pull_request.number,
      });
      core.debug(`Issues: ${comments}`);

      const comment = comments.find((comment) =>
        comment.body.startsWith(heading),
      );

      // If comment exists, update it.
      if (comment) {
        core.debug(`Found an issue: ${comment}`);
        await octokit.rest.issues.updateComment({
          ...repo,
          comment_id: comment.id,
          body,
        });
        return;
      }
    }
  } catch {
    core.warning('Not able to edit comment, defaulting to creating a new comment.');
  }

  core.debug('Creating an issue');
  await octokit.rest.issues.createComment({
    ...repo,
    issue_number: payload.pull_request.number,
    body,
  });
}
