import gh from '@actions/github';
import { Config } from '../../config';
import { handlePullRequestMessage } from '../pr';

const comments = [
  {
    id: 2,
    body: '#### :tropical_drink: `preview` on myFirstProject/staging. <summary>Pulumi report</summary>',
  },
];
const resp = { data: comments };
const projectName = 'myFirstProject';
const defaultOptions = {
  command: 'preview',
  stackName: 'staging',
  options: {},
} as Config;
const createComment = jest.fn();
const updateComment = jest.fn();
const listComments = jest.fn(() => resp);
jest.mock('@actions/github', () => ({
  context: {},
  getOctokit: jest.fn(() => ({
    rest: {
      issues: {
        createComment,
        listComments,
        updateComment,
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

    await handlePullRequestMessage(defaultOptions, projectName, 'test');
    expect(createComment).toHaveBeenCalledWith({
      body: '#### :tropical_drink: `preview` on myFirstProject/staging\n\n<details>\n<summary>Pulumi report</summary>\n\n<pre>\ntest\n</pre>\n\n</details>',
      issue_number: 123,
    });
  });

  it('should convert ansi control character to html and add to pull request message', async () => {
    // @ts-ignore
    gh.context = {
      payload: {
        pull_request: {
          number: 123,
        },
      },
    };

    process.env.GITHUB_REPOSITORY = 'pulumi/actions';

    await handlePullRequestMessage(defaultOptions, projectName, '\x1b[30mblack\x1b[37mwhite');
    expect(createComment).toHaveBeenCalledWith({
      body: '#### :tropical_drink: `preview` on myFirstProject/staging\n\n<details>\n<summary>Pulumi report</summary>\n\n<pre>\n<span style="color:#000">black<span style="color:#AAA">white</span></span>\n</pre>\n\n</details>',
      issue_number: 123,
    });
  });

  it('should add pull request message to the PR defined in config, overriding the github context', async () => {
    // @ts-ignore
    gh.context = {
      payload: {
        pull_request: {
          number: 123,
        },
      },
    };

    const options: Config = {
      ...defaultOptions,
      commentOnPrNumber: 87,
    };

    process.env.GITHUB_REPOSITORY = 'pulumi/actions';

    await handlePullRequestMessage(options, projectName, 'test');
    expect(createComment).toHaveBeenCalledWith({
      body: '#### :tropical_drink: `preview` on myFirstProject/staging\n\n<details>\n<summary>Pulumi report</summary>\n\n<pre>\ntest\n</pre>\n\n</details>',
      issue_number: 87,
    });
  });

  it('should fail if no pull request data, and no PR number in config', async () => {
    process.env.GITHUB_REPOSITORY = 'pulumi/actions';
    // @ts-ignore
    gh.context = { payload: {} };
    await expect(
      handlePullRequestMessage(defaultOptions, projectName, 'test'),
    ).rejects.toThrow('Missing pull request event data');
  });

  it('should add pull request message to the PR defined in config, if no pull request data', async () => {
    // @ts-ignore
    gh.context = { payload: {} };

    const options: Config = {
      ...defaultOptions,
      commentOnPrNumber: 87,
    };

    process.env.GITHUB_REPOSITORY = 'pulumi/actions';

    await handlePullRequestMessage(options, projectName, 'test');
    expect(createComment).toHaveBeenCalledWith({
      body: '#### :tropical_drink: `preview` on myFirstProject/staging\n\n<details>\n<summary>Pulumi report</summary>\n\n<pre>\ntest\n</pre>\n\n</details>',
      issue_number: 87,
    });
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
      defaultOptions,
      projectName,
      'a'.repeat(65_000),
    );

    const call = createComment.mock.calls[0][0];
    expect(call.body.length).toBeLessThan(65_536);
    expect(call.body).toContain('The output was too long and trimmed');
  });

  it('should trim the output from front when the output is larger than 64k characters and config is set', async () => {
    process.env.GITHUB_REPOSITORY = 'pulumi/actions';
    // @ts-ignore
    gh.context = {
      payload: {
        pull_request: {
          number: 123,
        },
      },
    };
    const trimFromFrontOptions = {
      command: 'preview',
      stackName: 'staging',
      trimCommentsFromFront: true,
      options: {},
    } as Config;

    await handlePullRequestMessage(
      trimFromFrontOptions,
      projectName,
      'a'.repeat(65_000) + '\n' + 'this is at the end and should be in the output',
    );

    const call = createComment.mock.calls[0][0];
    expect(call.body.length).toBeLessThan(65_536);
    expect(call.body).toContain('this is at the end and should be in the output');
    expect(call.body).toContain('The output was too long and trimmed from the front');
  });

  it('should edit the comment if it finds a previous created one', async () => {
    // @ts-ignore
    gh.context = { repo: {} };

    const options = {
      command: 'preview',
      stackName: 'staging',
      commentOnPrNumber: 123,
      editCommentOnPr: true,
    } as Config;

    await handlePullRequestMessage(options, projectName, 'test');
    expect(updateComment).toHaveBeenCalledWith({
      comment_id: 2,
      body: '#### :tropical_drink: `preview` on myFirstProject/staging\n\n<details>\n<summary>Pulumi report</summary>\n\n<pre>\ntest\n</pre>\n\n</details>',
    });
  });
});
