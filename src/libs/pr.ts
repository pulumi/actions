import { context, getOctokit } from '@actions/github';
import { invariant } from './utils';


export async function handlePullRequestMessage(
  body: string,
  githubToken: string,
  command: string,
  stackName: string,
  editCommentOnPr?: boolean,
): Promise<void> {
  const { payload, repo } = context;
  invariant(payload.pull_request, 'Missing pull request event data.');
  const text = `#### :tropical_drink: \`${command}\` on ${stackName}`
  const octokit = getOctokit(githubToken);

  if (editCommentOnPr) {
    const { data: comments} = await octokit.rest.issues.listComments({
      ...repo,
      issue_number: payload.pull_request.number
    })
    const comment = comments.find(comment => comment.body.startsWith(text));

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

  await octokit.rest.issues.createComment({
    ...repo,
    issue_number: payload.pull_request.number,
    body,
  });
}
