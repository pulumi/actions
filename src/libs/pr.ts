import { context, getOctokit } from '@actions/github';
import { invariant } from './utils';

export async function handlePullRequestMessage(
  body: string,
  githubToken: string,
): Promise<void> {
  const { payload, repo } = context;
  invariant(payload.pull_request, 'Missing pull request event data.');

  // check if the action has previously commented
  hasPreviousComment(repo, githubToken, payload).then(function (results) {
    if (results) {
      updatePullRequestMessage(body, githubToken)
    } else {
      addPullRequestMessage(body, githubToken)
    }
  });
}

async function hasPreviousComment(repo, githubToken, payload) {
  const octokit = getOctokit(githubToken)
  for await (const { data: comments } of octokit.paginate.iterator(
    octokit.issues.listComments, {
    ...repo,
    issue_number: payload.pull_request.number,
  })) {
    const comment = comments.find(comment =>
      findComment("pulumi", comment)
    )
    if (comment) {
      return {
        id: comment.id,
        body: comment.body,
        login: comment.user?.login
      }
    }
  }
  return undefined
}

function findComment(commentAuthor: string, comment: any) {
  return (commentAuthor ? comment.user.login === commentAuthor : true)
}

async function addPullRequestMessage(
  body: string,
  githubToken: string,
): Promise<void> {
  const { payload, repo } = context;
  invariant(payload.pull_request, 'Missing pull request event data.');

  const octokit = getOctokit(githubToken);
  await octokit.issues.createComment({
    ...repo,
    issue_number: payload.pull_request.number,
    body,
  });
}

async function updatePullRequestMessage(
  body: string,
  githubToken: string,
): Promise<void> {
  const { payload, repo } = context;
  invariant(payload.pull_request, 'Unable to update message data.');

  const octokit = getOctokit(githubToken);
  await octokit.issues.updateComment({
    ...repo,
    comment_id: payload.comment.id,
    body,
  });
}
