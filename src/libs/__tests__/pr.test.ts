import * as gh from '@actions/github';
import { handlePullRequestMessage } from '../pr';

const comments = [{ id: 2, body: 'test' }];
const resp = { data: comments };
const createComment = jest.fn();
const listComments = jest.fn(() => resp);
jest.mock('@actions/github', () => ({
  context: {},
  getOctokit: jest.fn(() => ({
    rest: {
      issues: {
        createComment,
        listComments,
      },
    },
  })),
}));

describe('pr.ts', () => {
  beforeEach(() => {
    jest.resetModules();
  });
  it('should add pull request message', async () => {
    // @ts-ignore
    gh.context = {
      payload: {
        pull_request: {
          number: 123,
        },
      },
    };

    process.env.GITHUB_REPOSITORY = 'pulumi/actions';

    await handlePullRequestMessage('test', 'test', 'test', 'test');
    expect(createComment).toHaveBeenCalled();
  });

  it('should fail if no pull request data', async () => {
    process.env.GITHUB_REPOSITORY = 'pulumi/actions';
    // @ts-ignore
    gh.context = { payload: {} };
    await expect(handlePullRequestMessage('test', 'test', 'test', 'test')).rejects.toThrowError(
      'Missing pull request event data',
    );
  });
});
