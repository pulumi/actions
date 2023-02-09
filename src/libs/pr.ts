import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import * as dedent from 'dedent';
import invariant from 'ts-invariant';
import { Config } from '../config';

export async function handlePullRequestMessage(
  config: Config,
  projectName: string,
  output: string,
): Promise<void> {
  const {
    githubToken,
    command,
    stackName,
    editCommentOnPr,
  } = config;

  const heading = `#### :tropical_drink: \`${command}\` on ${projectName}/${stackName}`;

  const summary = '<summary>Pulumi report</summary>';

  const rawBody = output.substring(0, 64_000);

  // Make sure the output isn't empty. If it's not, get the last 100 lines.
  const last100Lines = output.length >= 0 ? output.slice(-100) : '';

  const diffChanges = last100Lines.match(/\~[0-9]+ to update/);
  const diffCreations = last100Lines.match(/\+[0-9]+ to create/);
  const diffDeletions = last100Lines.match(/\-[0-9]+ to delete/);
  const diffUnchanged = last100Lines.match(/[0-9]+ unchanged/);

  // Regex to match the diff summary
  const searchPattern =
    /(~|\+|-)?[0-9]+( to)? (update|create|delete|unchanged)/;

  // Generate a summary with the changes, if any. If there's none, return an empty string.
  // If certain diffs are absent, they're set to 0 to make output consistent
  const diffSummary = searchPattern.test(last100Lines)
    ? `:red_circle: ${diffDeletions ?? '-0 to delete'},
       :yellow_circle: ${diffChanges ?? '~0 to update'},
       :green_circle: ${diffCreations ?? '+0 to create'},
       :white_circle: ${diffUnchanged ?? '0 unchanged'}
      `
    : '';

  // a line break between heading and rawBody is needed
  // otherwise the backticks won't work as intended
  const body = dedent`
    ${heading}

    ${diffSummary}
    <details>
    ${summary}

    \`\`\`
    ${rawBody}
    \`\`\`
    ${
      rawBody.length === 64_000
        ? '**Warn**: The output was too long and trimmed.'
        : ''
    }
    </details>
  `;

  const { payload, repo } = context;
  // Assumes PR numbers are always positive.
  const nr = config.commentOnPrNumber || payload.pull_request?.number;
  invariant(nr, 'Missing pull request event data.');

  const octokit = getOctokit(githubToken);

  try {
    if (editCommentOnPr) {
      const { data: comments } = await octokit.rest.issues.listComments({
        ...repo,
        issue_number: nr,
      });
      const comment = comments.find((comment) =>
        comment.body.startsWith(heading) && comment.body.includes(summary),
      );

      // If comment exists, update it.
      if (comment) {
        await octokit.rest.issues.updateComment({
          ...repo,
          comment_id: comment.id,
          body,
        });
        return;
      }
    }
  } catch {
    core.warning(
      'Not able to edit comment, defaulting to creating a new comment.',
    );
  }

  await octokit.rest.issues.createComment({
    ...repo,
    issue_number: nr,
    body,
  });
}
