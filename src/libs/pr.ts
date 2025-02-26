import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import AnsiToHtml from 'ansi-to-html';
import dedent from 'dedent';
import invariant from 'ts-invariant';
import { Config } from '../config';

function ansiToHtml(
  message: string,
  maxLength: number,
  alwaysIncludeSummary: boolean,
): [string, boolean] {
  /**
   *  Converts an ansi string to html by for example removing color escape characters.
   *  message: ansi string to convert
   *  maxLength: Maximum number of characters of final message incl. HTML tags
   *  alwaysIncludeSummary: if true, trim message from front (if trimming is needed), otherwise from end
   *
   *  return message as html and information if message was trimmed because of length
   */
  const convert = new AnsiToHtml();
  let trimmed = false;

  let htmlBody: string = convert.toHtml(message);

  // Check if htmlBody exceeds max characters
  if (htmlBody.length > maxLength) {

    // trim input message by number of exceeded characters from front or back as configured
    const dif: number = htmlBody.length - maxLength;

    if (alwaysIncludeSummary) {
      message = message.substring(dif, htmlBody.length);
    } else {
      message = message.substring(0, message.length - dif);
    }

    trimmed = true;

    // convert trimmed message to html
    htmlBody = convert.toHtml(message);
  }

  return [htmlBody, trimmed];
}

function extractViewLiveLink(output: string) {
  /**
   *  Extracts the Pulumi preview link from the output
   *  output: pulumi preview output
   *
   *  return link to the Pulumi preview
   */
  const lines = output.split('\n');
  const linkLine = lines.find((line) => line.includes('View Live:'));
  if (!linkLine) {
    return '';
  }
  return linkLine.split('View Live: ')[1];
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

  // GitHub limits comment characters to 65535, use lower max to keep buffer for variable values
  const MAX_CHARACTER_COMMENT = 64_000;

  const heading = `#### :tropical_drink: \`${command}\` on ${projectName}/${stackName}`;

  const summary = '<summary>Pulumi report</summary>';

  const [htmlBody, trimmed]: [string, boolean] = ansiToHtml(output, MAX_CHARACTER_COMMENT, alwaysIncludeSummary);

  const viewLiveLink = extractViewLiveLink(output);

  const body = dedent`
    ${heading}

    <details>
    ${summary}
    ${viewLiveLink ? `[View in Pulumi Cloud](${viewLiveLink})\n` : ''}
    ${trimmed && alwaysIncludeSummary
      ? ':warning: **Warn**: The output was too long and trimmed from the front.'
      : ''
    }
    <pre>
    ${htmlBody}
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
