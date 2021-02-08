import * as nock from 'nock';
import { addPullRequestMessage } from '../pr';

describe('pr.ts', () => {
  it('should add pull request message', async () => {
    nock.disableNetConnect();
    const scope = nock('https://api.github.com')
      .get('/repos/atom/atom/license')
      .reply(200, {
        license: {
          key: 'mit',
          name: 'MIT License',
          spdx_id: 'MIT',
          url: 'https://api.github.com/licenses/mit',
          node_id: 'MDc6TGljZW5zZTEz',
        },
      });

    process.env.GITHUB_REPOSITORY = 'pulumi/actions';

    await addPullRequestMessage('test', 'test');
    expect(scope.isDone()).toBeTruthy();
  });
});
