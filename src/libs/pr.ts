import { context, getOctokit } from '@actions/github';
import { invariant } from './utils';


export async function handlePullRequestMessage(
  body: string,
  githubToken: string,
): Promise<void> {
  invariant(context.payload.pull_request, 'Missing pull request event data.');

  if (body && githubToken) {
    if (context.payload.pull_request.number) {
      await createCommentOnPullRequest(body, githubToken);
    }
  }
}

async function createCommentOnPullRequest(body, githubToken) {
  const commentId = await findPreviousComments(`#### :tropical_drink: `, githubToken);
  const octokit = getOctokit(githubToken);

  if (commentId) {
    await octokit.issues.updateComment({
      ...context.repo,
      comment_id: commentId,
      body,
    });
  } else {
    await octokit.issues.createComment({
      ...context.repo,
      issue_number: context.payload.pull_request.number,
      body,
    });
  }
}

async function getComments(githubToken) {
  const octokit = getOctokit(githubToken);

  return octokit.issues.listComments({
    ...context.repo,
    issue_number: context.payload.pull_request.number
  });
}

async function findPreviousComments(text, githubToken) {
  const { data: comments } = await getComments(githubToken);
  const previousComment = comments.find(comment => comment.body.startsWith(text));
  return (previousComment ? previousComment.id : null);
}
