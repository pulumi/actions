import got from 'got';
import * as rt from 'runtypes';
import { maxSatisfying } from 'semver';
import invariant from 'ts-invariant';

const VersionRt = rt.Record({
  version: rt.String,
  date: rt.String,
  downloads: rt.Record({
    'linux-x64': rt.String,
    'linux-arm64': rt.String,
    'darwin-x64': rt.String,
    'darwin-arm64': rt.String,
    'windows-x64': rt.String,
  }),
  checksums: rt.String,
  latest: rt.Boolean.optional(),
});
export type Version = rt.Static<typeof VersionRt>;
const VersionsRt = rt.Array(VersionRt);

export async function getVersionObject(range: string): Promise<Version> {
  const result = await got(
    'https://raw.githubusercontent.com/pulumi/docs/master/data/versions.json',
    { responseType: 'json' },
  );

  const versions = VersionsRt.check(result.body);

  if (range == 'latest') {
    const latest = versions.find((v) => v.latest);
    invariant(latest, 'expect a latest version to exists');
    return latest;
  }

  const resp = maxSatisfying(
    versions.map((v) => v.version),
    range,
  );

  if (resp === null) {
    throw new Error(
      'Could not find a version that satisfied the version range',
    );
  }

  const ver = versions.find((v) => v.version === resp);

  if (!ver) {
    throw new Error(
      'Could not find a version that satisfied the version range',
    );
  }

  return ver;
}
