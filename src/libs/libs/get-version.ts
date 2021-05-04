import got from 'got';
import { maxSatisfying } from 'semver';

export async function getVersion(range: string): Promise<string> {
  if (range == 'latest') {
    const resp = await got('https://www.pulumi.com/latest-version');
    return `v${await resp.body}`;
  }

  const resp = await getSatisfyingVersion(range);
  if (resp === null) {
    throw new Error(
      'Could not find a version that satisfied the version range',
    );
  }

  return resp;
}

export async function getSatisfyingVersion(
  range: string,
): Promise<string | null> {
  const {
    body: versions,
  } = await got(
    'https://raw.githubusercontent.com/cobraz/docs/add-versions/static/versions.json',
    { responseType: 'json' },
  );

  return maxSatisfying(versions, range);
}
