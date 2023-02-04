import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import AnsiToHtml from 'ansi-to-html';
import dedent from 'dedent';
import invariant from 'ts-invariant';
import { Config } from '../config';

function ansiToHtml(
  message: string,
  { maxLength }: { maxLength?: number } = { maxLength: undefined },
) {
  const convert = new AnsiToHtml();
  let html = convert.toHtml(message);
  while (maxLength !== undefined && html.length > maxLength) {
    message = message.substring(0, message.length - 1);
    html = convert.toHtml(message);
  }
  return html;
}

export async function handlePullRequestMessage(
  config: Config,
  projectName: string,
  output: string,
): Promise<void> {
  const {
    githubToken,
    command,
    stackName,
    options: { editCommentOnPr },
  } = config;

  const heading = `#### :tropical_drink: \`${command}\` on ${projectName}/${stackName}`;

  const summary = '<summary>Pulumi report</summary>';

  const rawBody = ansiToHtml(output, { maxLength: 64_000 });
  // a line break between heading and rawBody is needed
  // otherwise the backticks won't work as intended
  const body = dedent`
    ${heading}

    <details>
    ${summary}

    <pre>
    ${rawBody}
    </pre>
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
      const comment = comments.find(
        (comment) =>
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
