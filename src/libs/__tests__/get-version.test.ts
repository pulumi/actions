import * as playback from 'jest-playback';
import { getVersionObject } from '../libs/get-version';
playback.setup(__dirname);

describe('get-version', () => {
  process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'my-token';
  describe('range versions', () => {
    it.each([
      'latest',
      '^3',
      '3.*.*',
      '3.0.*',
      'v1.*.*',
      'v2.22.*',
      '2.17.1',
      'v2.17.2',
      '2.5.0',
    ] as const)('should match %s versions', async (ver) => {
      const v = await getVersionObject(ver);
      expect(v.version).toMatchSnapshot();
    });
  });
});
