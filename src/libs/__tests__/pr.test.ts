import * as gh from '@actions/github';
import { handlePullRequestMessage } from '../pr';

const createComment = jest.fn();
jest.mock('@actions/github', () => ({
  context: {},
  getOctokit: jest.fn(() => ({
    issues: {
      createComment,
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

    await handlePullRequestMessage('test', 'test');
    expect(createComment).toHaveBeenCalled();
  });
  it('should fail if no pull request data', async () => {
    process.env.GITHUB_REPOSITORY = 'pulumi/actions';
    // @ts-ignore
    gh.context = { payload: {} };
    await expect(handlePullRequestMessage('test', 'test')).rejects.toThrowError(
      'Missing pull request event data',
    );
  });
});
