// import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { invariant } from './utils';

let octokit;

export async function handlePullRequestMessage(
  body: string,
  githubToken: string,
): Promise<void> {
  invariant(context.payload.pull_request, 'Missing pull request event data.');
  octokit = getOctokit(githubToken);

  if (body && githubToken) {
    if (context.payload.pull_request.number) {
      await createCommentOnPullRequest(body);
    }
  }
}

async function createCommentOnPullRequest(body) {
  const commentId = await findPreviousComments(`#### :tropical_drink: `);

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

async function getComments() {
  return octokit.issues.listComments({
    ...context.repo,
    issue_number: context.payload.pull_request.number
  });
}

async function findPreviousComments(text) {
  const { data: comments } = await getComments();
  const previousComment = comments.find(comment => comment.body.startsWith(text));
  return (previousComment ? previousComment.id : null);
}
