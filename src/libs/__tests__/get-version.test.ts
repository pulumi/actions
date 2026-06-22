import * as playback from 'jest-playback';
import { fetchVersions, resolveVersion } from '../libs/get-version';
playback.setup();

const ranges = [
  'latest',
  '^3',
  '3.*.*',
  '3.0.*',
  'v1.*.*',
  'v2.22.*',
  '2.17.1',
  'v2.17.2',
  '2.5.0',
] as const;

describe('get-version', () => {
  it('resolves version ranges', async () => {
    const versions = await fetchVersions();
    for (const range of ranges) {
      expect(resolveVersion(versions, range).version).toMatchSnapshot(range);
    }
  });
});
