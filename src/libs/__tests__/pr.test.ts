import * as gh from '@actions/github';
import { Config } from '../../config';
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
    createComment.mockClear();
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

    await handlePullRequestMessage({ options: {} } as Config, 'test');
    expect(createComment).toHaveBeenCalled();
  });

  it('should fail if no pull request data', async () => {
    process.env.GITHUB_REPOSITORY = 'pulumi/actions';
    // @ts-ignore
    gh.context = { payload: {} };
    await expect(
      handlePullRequestMessage({ options: {} } as Config, 'test'),
    ).rejects.toThrow('Missing pull request event data');
  });

  it('should trim the output when the output is larger than 64k characters', async () => {
    process.env.GITHUB_REPOSITORY = 'pulumi/actions';
    // @ts-ignore
    gh.context = {
      payload: {
        pull_request: {
          number: 123,
        },
      },
    };

    await handlePullRequestMessage(
      { options: {} } as Config,
      'a'.repeat(65_000),
    );

    const call = createComment.mock.calls[0][0];
    expect(call.body.length).toBeLessThan(65_536);
    expect(call.body).toContain('The output was too long and trimmed');
  });
});
