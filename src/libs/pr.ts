import * as core from '@actions/core'
import { context, getOctokit } from '@actions/github'
import * as dedent from 'dedent'
import { Config } from '../config'
import { invariant } from './utils'

export async function handlePullRequestMessage(
  config: Config,
  output: string,
): Promise<void> {
  const {
    githubToken,
    command,
    stackName,
    options: { editCommentOnPr },
  } = config

  const heading = `#### :tropical_drink: \`${command}\` on ${stackName}`
  const summary = '<summary>Click to expand Pulumi report</summary>'

  const rawBody = output.substring(0, 64_000)
  // a line break between heading and rawBody is needed
  // otherwise the backticks won't work as intended
  const body = dedent`
    ${heading}

    <details>
    ${summary}

    \`\`\`
    ${rawBody}
    \`\`\`
    ${rawBody.length === 64_000 ? '**Warn**: The output was too long and trimmed.' : ''}
    </details>
  `

  const { payload, repo } = context
  invariant(payload.pull_request, 'Missing pull request event data.')

  const octokit = getOctokit(githubToken)

  try {
    if (editCommentOnPr) {
      const { data: comments } = await octokit.rest.issues.listComments({
        ...repo,
        issue_number: payload.pull_request.number,
      })
      const comment = comments.find(comment => comment.body.startsWith(heading) && comment.body.includes(summary))

      // If comment exists, update it.
      if (comment) {
        await octokit.rest.issues.updateComment({
          ...repo,
          comment_id: comment.id,
          body,
        })
        return
      }
    }
  } catch {
    core.warning(
      'Not able to edit comment, defaulting to creating a new comment.',
    )
  }

  await octokit.rest.issues.createComment({
    ...repo,
    issue_number: payload.pull_request.number,
    body,
  })
}
