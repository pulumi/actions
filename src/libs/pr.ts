import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import dedent from 'dedent';
import invariant from 'ts-invariant';
import { Config } from '../config';

function trimOutput(
  message: string,
  maxLength: number,
  alwaysIncludeSummary: boolean,
): [string, boolean] {
  /**
   *  Trim message to maxLength
   *  message: string to trim
   *  maxLength: Maximum number of characters of final message
   *  alwaysIncludeSummary: if true, trim message from front (if trimming is needed), otherwise from end
   *
   *  return message and information if message was trimmed
   */
  let trimmed = false;

  // Check if message exceeds max characters
  if (message.length > maxLength) {

    // Trim input message by number of exceeded characters from front or back as configured
    const dif: number = message.length - maxLength;

    if (alwaysIncludeSummary) {
      message = message.substring(dif, message.length);
    } else {
      message = message.substring(0, message.length - dif);
    }

    trimmed = true;
  }

  return [message, trimmed];
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
    editCommentOnPr,
    alwaysIncludeSummary,
  } = config;

  // Remove ANSI symbols from output because they are not supported in GitHub PR message
  const regex = RegExp(`\x1B(?:[@-Z\\-_]|[[0-?]*[ -/]*[@-~])`, 'g');
  output = output.replace(regex, '');

  // GitHub limits PR comment characters to 65_535, use lower max to keep buffer for variable values
  const MAX_CHARACTER_COMMENT = 64_000;

  const heading = `#### :tropical_drink: \`${command}\` on ${projectName}/${stackName}`;

  const summary = '<summary>Pulumi report</summary>';

  const [message, trimmed]: [string, boolean] = trimOutput(output, MAX_CHARACTER_COMMENT, alwaysIncludeSummary);

  const body = dedent`
    ${heading}

    <details>
    ${summary}

    ${trimmed && alwaysIncludeSummary
      ? ':warning: **Warn**: The output was too long and trimmed from the front.'
      : ''
    }
    <pre>
    ${message}
    </pre>
    ${trimmed && !alwaysIncludeSummary
      ? ':warning: **Warn**: The output was too long and trimmed.'
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
