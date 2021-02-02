import * as envalid from 'envalid';

export const environmentVariables = envalid.cleanEnv(
  process.env,
  {
    GITHUB_WORKSPACE: envalid.str(),
  }, { strict: true }
);

export type EnvironmentVariables = typeof environmentVariables;
