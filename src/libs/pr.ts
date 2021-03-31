import { context, getOctokit } from '@actions/github';
import { invariant } from './utils';


export async function handlePullRequestMessage(
  body: string,
  githubToken: string,
): Promise<void> {
  const { payload, repo } = context;
  invariant(payload.pull_request, 'Missing pull request event data.');
  const text = `#### :tropical_drink: `
  const octokit = getOctokit(githubToken);
  const { data: comments} = await octokit.issues.listComments({
    ...repo,
    issue_number: payload.pull_request.number
  })
  const comment_id = comments.find(comment => comment.body.startsWith(text));

  if (body && githubToken) {
    if (comment_id) {
      await octokit.issues.updateComment({
        ...repo,
        comment_id: comment_id.id,
        body,
      });
    } else {
      await octokit.issues.createComment({
        ...repo,
        issue_number: payload.pull_request.number,
        body,
      });
    }
  }
}
