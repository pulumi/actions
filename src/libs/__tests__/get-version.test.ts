import * as playback from 'jest-playback';
import { fetchVersions, getVersionObject, resolveVersion } from '../libs/get-version';
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

  it('resolves an explicit dev build directly from get.pulumi.com', async () => {
    const version = await getVersionObject('3.279.0-alpha.xabc1234');
    expect(version.version).toBe('v3.279.0-alpha.xabc1234');
    expect(version.downloads['linux-x64']).toBe(
      'https://get.pulumi.com/releases/sdk/pulumi-v3.279.0-alpha.xabc1234-linux-x64.tar.gz',
    );
    expect(version.downloads['windows-arm64']).toBe(
      'https://get.pulumi.com/releases/sdk/pulumi-v3.279.0-alpha.xabc1234-windows-arm64.zip',
    );
  });

  it('accepts a v-prefixed explicit dev build', async () => {
    const version = await getVersionObject('v3.279.0-alpha.xabc1234');
    expect(version.version).toBe('v3.279.0-alpha.xabc1234');
  });
});
